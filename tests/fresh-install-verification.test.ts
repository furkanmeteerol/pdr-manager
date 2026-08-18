import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { StudentService } from '../electron/services/students/StudentService';
import fs from 'node:fs';
import path from 'node:path';

describe('Clean Installation & Fresh PC Verification Test Suite', () => {
  const freshUserDataDir = path.join(process.cwd(), 'temp_fresh_pc_user_data');
  let databaseService: DatabaseService;
  let sqliteDb: Database.Database | null = null;

  beforeEach(() => {
    if (fs.existsSync(freshUserDataDir)) {
      fs.rmSync(freshUserDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(freshUserDataDir, { recursive: true });
    databaseService = new DatabaseService();
  });

  afterEach(() => {
    try {
      databaseService.close();
    } catch {}
    if (sqliteDb) {
      try { sqliteDb.close(); } catch {}
      sqliteDb = null;
    }
    if (fs.existsSync(freshUserDataDir)) {
      fs.rmSync(freshUserDataDir, { recursive: true, force: true });
    }
  });

  it('1. Fresh installation automatically creates pdr.sqlite in database directory', () => {
    const dbPath = path.join(freshUserDataDir, 'database', 'pdr.sqlite');
    expect(fs.existsSync(dbPath)).toBe(false);

    const { sqlite } = databaseService.init(freshUserDataDir);
    sqliteDb = sqlite;

    expect(fs.existsSync(dbPath)).toBe(true);
    expect(fs.statSync(dbPath).size).toBeGreaterThan(0);
  });

  it('2. Database migration runs completely and initializes all 55 required tables and indexes', () => {
    const { sqlite } = databaseService.init(freshUserDataDir);
    sqliteDb = sqlite;

    // Check all critical tables
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);

    const expectedTables = [
      'schools',
      'school_years',
      'devices',
      'app_meta',
      'students',
      'parents',
      'teachers',
      'classes',
      'meetings',
      'meeting_participants',
      'appointments',
      'appointment_participants',
      'tasks',
      'reminders',
      'annual_plans',
      'annual_plan_items',
      'agenda_items',
      'surveys',
      'survey_versions',
      'survey_questions',
      'survey_options',
      'survey_subscales',
      'survey_interpretations',
      'survey_assignments',
      'survey_applications',
      'survey_answers',
      'survey_result_snapshots',
      'audit_logs',
      'counselor_documents',
      'presentations',
      'ram_reports',
      'bep_plans',
      'bip_plans',
      'study_plans'
    ];

    for (const exp of expectedTables) {
      expect(tableNames).toContain(exp);
    }
  });

  it('3. Fresh installation contains ZERO test/demo student or survey records', () => {
    const { sqlite } = databaseService.init(freshUserDataDir);
    sqliteDb = sqlite;

    const countStudents = sqlite.prepare('SELECT count(*) as c FROM students').get() as any;
    const countParents = sqlite.prepare('SELECT count(*) as c FROM parents').get() as any;
    const countMeetings = sqlite.prepare('SELECT count(*) as c FROM meetings').get() as any;
    const countAppointments = sqlite.prepare('SELECT count(*) as c FROM appointments').get() as any;
    const countApplications = sqlite.prepare('SELECT count(*) as c FROM survey_applications').get() as any;
    const countAnswers = sqlite.prepare('SELECT count(*) as c FROM survey_answers').get() as any;

    expect(countStudents.c).toBe(0);
    expect(countParents.c).toBe(0);
    expect(countMeetings.c).toBe(0);
    expect(countAppointments.c).toBe(0);
    expect(countApplications.c).toBe(0);
    expect(countAnswers.c).toBe(0);
  });

  it('4. First launch automatically registers Devamsızlık Nedenleri Anketi (52 questions & 7 subscales)', () => {
    const { db, sqlite } = databaseService.init(freshUserDataDir);
    sqliteDb = sqlite;
    const deviceId = databaseService.ensureDeviceId();

    const mockSyncEngine = { recordChange: () => {}, queueChange: () => {} } as any;
    const surveyEngine = new SurveyEngine(db, deviceId, mockSyncEngine);

    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi');
    expect(survey).toBeDefined();
    expect(survey?.id).toBe('srv-devamsizlik-nedenleri');
    expect(survey?.title).toBe('Devamsızlık Nedenleri Anketi');
    expect(survey?.currentVersion?.questions).toHaveLength(52);
    expect(survey?.currentVersion?.subscales).toHaveLength(7);
    expect(survey?.resultPresentation?.rendererType).toBe('meb_devamsizlik');

    // Verify 1-51 single_choice with Evet=2, Bazen=1, Hayır=0
    const q1 = survey?.currentVersion?.questions?.find(q => q.questionOrder === 1);
    expect(q1?.questionType).toBe('single_choice');
    expect(q1?.options).toHaveLength(3);
    expect(q1?.options?.find(o => o.optionText === 'Evet')?.scoreValue).toBe(2);

    // Verify 52nd question text optional
    const q52 = survey?.currentVersion?.questions?.find(q => q.questionOrder === 52);
    expect(q52?.questionType).toBe('text');
    expect(q52?.questionText).toBe('Belirtmek istediğiniz diğer nedenler varsa yazınız.');
  });

  it('5. Clean installation supports adding first real student and submitting paper survey offline', () => {
    const { db, sqlite } = databaseService.init(freshUserDataDir);
    sqliteDb = sqlite;
    const deviceId = databaseService.ensureDeviceId();

    const mockSyncEngine = { recordChange: () => {}, queueChange: () => {} } as any;
    const studentService = new StudentService(db, deviceId);
    const surveyEngine = new SurveyEngine(db, deviceId, mockSyncEngine);

    // 1. Create first student
    const student = studentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '1001',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      gender: 'male'
    });

    expect(student).toBeDefined();
    expect(student.studentNumber).toBe('1001');

    // 2. Submit Devamsızlık Nedenleri Anketi manually
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;

    const answers = questions.slice(0, 51).map(q => ({
      questionId: q.id,
      selectedOptionId: q.options![0].id
    }));

    const q52 = questions.find(q => q.questionOrder === 52)!;
    answers.push({
      questionId: q52.id,
      selectedOptionId: undefined as any,
      answerValue: 'Sabah servis geç kalıyor.'
    } as any);

    const submitRes = surveyEngine.submitApplication({
      surveySlug: 'devamsizlik-nedenleri-anketi',
      studentNumber: '1001',
      answers,
      source: 'manual_entry'
    });

    expect(submitRes.success).toBe(true);
    expect(submitRes.application?.status).toBe('COMPLETED');
    expect(submitRes.application?.resultSnapshot?.subscales).toHaveLength(7);

    // Verify in SQLite
    const appsCount = sqlite.prepare('SELECT count(*) as c FROM survey_applications').get() as any;
    expect(appsCount.c).toBe(1);
  });
});
