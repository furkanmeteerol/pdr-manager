import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { ScoringEngine } from '../electron/services/survey/ScoringEngine';

describe('Survey Engine Architecture & Real Survey Verification', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_survey_engine_redesign');
  const dbPath = path.join(tempDir, 'test_pdr.sqlite');
  let sqlite: Database.Database;
  let db: any;
  let surveyEngine: SurveyEngine;

  beforeEach(async () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    db = conn.db;

    runMigrations(sqlite);

    const mockSyncEngine = {
      recordChange: () => {},
      subscribe: () => () => {},
      getPendingCount: () => 0
    } as any;

    surveyEngine = new SurveyEngine(db, 'dev-1', mockSyncEngine);

    sqlite.prepare(`
      INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
      VALUES ('sch-1', 'Cumhuriyet AL', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
      VALUES ('class-12a', 'year-2026', '12-A', 12, 'A', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, notes, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-zeynep', 'year-2026', 'class-12a', '15615', 'Zeynep', 'Akaya', 'female', 'active', 'Hedef Tıp Fakültesi.', 1000, 1000, 1, 'dev-1'),
        ('st-ahmet', 'year-2026', 'class-12a', '10204', 'Ahmet', 'Yılmaz', 'male', 'active', '', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('1. Only real MEB Devamsızlık Nedenleri Anketi exists upon initialization', () => {
    const list = surveyEngine.listSurveys();
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe('devamsizlik-nedenleri-anketi');
    expect(list[0].id).toBe('srv-devamsizlik-nedenleri');
    expect(list[0].title).toBe('Devamsızlık Nedenleri Anketi');
  });

  it('2. Anket ≠ Uygulama: Aynı öğrencinin aynı anketi birden çok kez doldurabilmesi (Attempt #1, #2, #3)', () => {
    const slug = 'devamsizlik-nedenleri-anketi';
    const survey = surveyEngine.getSurveyBySlug(slug);
    expect(survey).toBeDefined();

    const questions = survey!.currentVersion!.questions!;
    const answers1 = questions.map(q => ({
      questionId: q.id,
      selectedOptionId: q.options && q.options.length > 0 ? q.options[0].id : undefined,
      answerValue: q.questionType === 'text' ? 'Özel durum' : undefined
    }));

    // 1. Attempt
    const res1 = surveyEngine.submitApplication({
      surveySlug: slug,
      studentNumber: '15615',
      answers: answers1
    });
    expect(res1.success).toBe(true);
    expect(res1.application?.attemptNumber).toBe(1);

    // 2. Attempt
    const res2 = surveyEngine.submitApplication({
      surveySlug: slug,
      studentNumber: '15615',
      answers: answers1
    });
    expect(res2.success).toBe(true);
    expect(res2.application?.attemptNumber).toBe(2);

    // 3. Attempt
    const res3 = surveyEngine.submitApplication({
      surveySlug: slug,
      studentNumber: '15615',
      answers: answers1
    });
    expect(res3.success).toBe(true);
    expect(res3.application?.attemptNumber).toBe(3);

    // Check application history for Zeynep
    const zeynepApps = surveyEngine.listApplications({ studentId: 'st-zeynep', surveyId: survey!.id });
    expect(zeynepApps.length).toBe(3);
    expect(zeynepApps.map(a => a.attemptNumber)).toEqual([3, 2, 1]); // Newest first
  });

  it('3. Repeat Policy: UNLIMITED allows repeated applications while ONCE limits to 1', () => {
    // 1. Devamsızlık Nedenleri Anketi is UNLIMITED
    const valUnlimited = surveyEngine.validateStudentForSurvey('devamsizlik-nedenleri-anketi', '15615');
    expect(valUnlimited.valid).toBe(true);
    expect(valUnlimited.canAttempt).toBe(true);

    // 2. Test ONCE policy on a custom survey
    surveyEngine.registerRealSurvey({
      id: 'srv-once-test',
      slug: 'once-test-survey',
      title: 'Tek Seferlik Anket',
      type: 'SURVEY',
      repeatPolicy: 'ONCE',
      scoringType: 'SUM',
      questions: [
        {
          orderIndex: 1,
          text: 'Soru 1',
          type: 'single_choice',
          options: [{ label: 'Evet', value: '1', score: 1 }, { label: 'Hayır', value: '0', score: 0 }]
        }
      ],
      subscales: [],
      interpretations: []
    });

    const onceSurvey = surveyEngine.getSurveyBySlug('once-test-survey')!;
    const q1 = onceSurvey.currentVersion!.questions![0];

    const firstRes = surveyEngine.submitApplication({
      surveySlug: 'once-test-survey',
      studentNumber: '15615',
      answers: [{ questionId: q1.id, selectedOptionId: q1.options[0].id }]
    });
    expect(firstRes.success).toBe(true);

    // Second attempt fails
    const secondVal = surveyEngine.validateStudentForSurvey('once-test-survey', '15615');
    expect(secondVal.valid).toBe(true);
    expect(secondVal.canAttempt).toBe(false);
    expect(secondVal.error).toContain('tek seferliktir');
  });

  it('4. Scoring Engine: Subscale Average and Arithmetic Calculation', () => {
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;
    const subscales = survey.currentVersion!.subscales!;

    // Okul ve Yönetim: 10 soru. All scored as Evet (2)
    const okulQuestions = questions.filter(q => q.subscaleId && subscales.find(s => s.id === q.subscaleId)?.code === 'OKUL_YONETIM');
    expect(okulQuestions.length).toBe(10);

    const answers = okulQuestions.map(q => ({
      questionId: q.id,
      selectedOptionId: q.options.find(o => o.scoreValue === 2)!.id
    }));

    const calculated = ScoringEngine.calculate(
      okulQuestions,
      subscales.filter(s => s.code === 'OKUL_YONETIM'),
      [],
      answers,
      1
    );

    const okulSub = calculated.resultSnapshot.subscales?.find(s => s.code === 'OKUL_YONETIM');
    expect(okulSub).toBeDefined();
    expect(okulSub?.score).toBe(2); // 10 * 2 / 10 = 2.00
  });
});
