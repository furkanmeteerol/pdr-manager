import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/sinavKaygisiOlcegi';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { ExamAnxietyPdfReport } from '../electron/services/surveys/reports/ExamAnxietyPdfReport';

describe('Sınav Kaygısı Ölçeği (Exam Anxiety Scale) Specification & Scoring', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_exam_anxiety_scale');
  const dbPath = path.join(tempDir, 'test_pdr.sqlite');
  let sqlite: Database.Database;
  let db: any;
  let surveyEngine: SurveyEngine;

  beforeAll(async () => {
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
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

    surveyEngine = new SurveyEngine(db, 'dev-test-1', mockSyncEngine);

    sqlite.prepare(`
      INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
      VALUES ('sch-1', 'Cumhuriyet AL', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
      VALUES ('class-12a', 'year-2026', '12-A', 12, 'A', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, notes, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-zeynep', 'year-2026', 'class-12a', '15615', 'Zeynep', 'Akaya', 'female', 'active', 'YKS Adayı', 1000, 1000, 1, 'dev-test-1'),
        ('st-ahmet', 'year-2026', 'class-12a', '10204', 'Ahmet', 'Yılmaz', 'male', 'active', '', 1000, 1000, 1, 'dev-test-1'),
        ('st-mehmet', 'year-2026', 'class-12a', '10205', 'Mehmet', 'Öztürk', 'male', 'active', '', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();
  });

  afterAll(() => {
    try {
      if (sqlite) sqlite.close();
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('1. should have correct scale definition metadata and catalog registration', () => {
    expect(SINAV_KAYGISI_OLCEGI.id).toBe('srv-sinav-kaygisi-olcegi');
    expect(SINAV_KAYGISI_OLCEGI.slug).toBe('sinav-kaygisi-olcegi');
    expect(SINAV_KAYGISI_OLCEGI.title).toBe('Sınav Kaygısı Ölçeği');
    expect(SINAV_KAYGISI_OLCEGI.type).toBe('SCALE');
    expect(SINAV_KAYGISI_OLCEGI.scoringType).toBe('SUBSCALES');

    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi');
    expect(survey).toBeDefined();
    expect(survey?.title).toBe('Sınav Kaygısı Ölçeği');
    expect(survey?.currentVersion).toBeDefined();
    expect(survey?.currentVersion?.questions).toHaveLength(50);
    expect(survey?.currentVersion?.subscales).toHaveLength(7);
  });

  it('2. should contain exactly 50 continuous questions in correct order (1..50)', () => {
    const questions = SINAV_KAYGISI_OLCEGI.questions;
    expect(questions).toHaveLength(50);

    questions.forEach((q, idx) => {
      expect(q.orderIndex).toBe(idx + 1);
      expect(q.text).toBeDefined();
      expect(q.text.length).toBeGreaterThan(5);
      expect(q.options).toHaveLength(2);

      const optD = q.options.find(o => o.label === 'D');
      const optY = q.options.find(o => o.label === 'Y');
      expect(optD).toBeDefined();
      expect(optY).toBeDefined();
      expect(optD?.score).toBe(1);
      expect(optY?.score).toBe(0);
    });
  });

  it('3. should have exact 7 subscales matching verified question distribution (50 items total)', () => {
    const questions = SINAV_KAYGISI_OLCEGI.questions;
    const subscaleGroups: Record<string, number[]> = {
      BASKALARININ_GORUSU: [3, 14, 17, 25, 32, 41, 46, 47], // 8 items
      KENDI_GORUSUNUZ: [2, 9, 16, 24, 31, 38, 40],           // 7 items
      GELECEK_ENDISELERI: [1, 8, 15, 23, 30, 49],          // 6 items
      HAZIRLANMAKLA_ILGILI: [6, 11, 18, 26, 33, 42],        // 6 items
      BEDENSEL_TEPKILER: [5, 12, 19, 27, 34, 39, 43],       // 7 items
      ZIHINSEL_TEPKILER: [4, 13, 20, 21, 28, 35, 36, 37, 48, 50], // 10 items
      GENEL_KAYGI: [7, 10, 22, 29, 44, 45]         // 6 items
    };

    let totalMapped = 0;
    Object.entries(subscaleGroups).forEach(([code, expectedOrders]) => {
      const qs = questions.filter(q => q.subscaleCode === code);
      expect(qs.map(q => q.orderIndex)).toEqual(expectedOrders);
      totalMapped += qs.length;
    });

    expect(totalMapped).toBe(50);
  });

  it('4. should score 50 (Maximum) and have all 7 subscales as High Anxiety when all answers are D', () => {
    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi')!;
    const questions = survey.currentVersion!.questions!;

    const answersAllD = questions.map(q => {
      const optD = q.options.find(o => o.optionLabel === 'D' || o.optionValue === 'D')!;
      return {
        questionId: q.id,
        selectedOptionId: optD.id
      };
    });

    const res = surveyEngine.submitApplication({
      surveySlug: 'sinav-kaygisi-olcegi',
      studentNumber: '15615',
      answers: answersAllD
    });

    expect(res.success).toBe(true);
    expect(res.application).toBeDefined();
    expect(res.application?.totalScore).toBe(50);
    expect(res.application?.resultSnapshot?.totalScore).toBe(50);
    // Overall interpretation is removed (only subscales have interpretations)
    expect(res.application?.resultSnapshot?.interpretation).toBeUndefined();

    // Verify all 7 subscales are at their max scores and high anxiety
    const subResults = res.application?.resultSnapshot?.subscales || [];
    expect(subResults).toHaveLength(7);

    const subScoreMap = new Map(subResults.map(s => [s.code, s.score]));
    expect(subScoreMap.get('BASKALARININ_GORUSU')).toBe(8);
    expect(subScoreMap.get('KENDI_GORUSUNUZ')).toBe(7);
    expect(subScoreMap.get('GELECEK_ENDISELERI')).toBe(6);
    expect(subScoreMap.get('HAZIRLANMAKLA_ILGILI')).toBe(6);
    expect(subScoreMap.get('BEDENSEL_TEPKILER')).toBe(7);
    expect(subScoreMap.get('ZIHINSEL_TEPKILER')).toBe(10);
    expect(subScoreMap.get('GENEL_KAYGI')).toBe(6);

    subResults.forEach(s => {
      expect(s.interpretation).toBe('Yüksek Kaygı');
    });
  });

  it('5. should score 0 (Minimum) and have all 7 subscales as Low Anxiety when all answers are Y', () => {
    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi')!;
    const questions = survey.currentVersion!.questions!;

    const answersAllY = questions.map(q => {
      const optY = q.options.find(o => o.optionLabel === 'Y' || o.optionValue === 'Y')!;
      return {
        questionId: q.id,
        selectedOptionId: optY.id
      };
    });

    const res = surveyEngine.submitApplication({
      surveySlug: 'sinav-kaygisi-olcegi',
      studentNumber: '10204',
      answers: answersAllY
    });

    expect(res.success).toBe(true);
    expect(res.application?.totalScore).toBe(0);
    expect(res.application?.resultSnapshot?.totalScore).toBe(0);
    expect(res.application?.resultSnapshot?.interpretation).toBeUndefined();

    const subResults = res.application?.resultSnapshot?.subscales || [];
    subResults.forEach(s => {
      expect(s.score).toBe(0);
      expect(s.interpretation).toBe('Düşük Kaygı');
    });
  });

  it('6. should strictly verify boundary thresholds for all 7 subscales (High vs Low only)', () => {
    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi')!;
    const subscales = survey.currentVersion!.subscales!;
    const interpretations = survey.currentVersion!.interpretations!;

    // Test each subscale boundary
    const boundarySpecs: Array<{ code: string; maxScore: number; lowThreshold: number; highThreshold: number }> = [
      { code: 'BASKALARININ_GORUSU', maxScore: 8, lowThreshold: 3, highThreshold: 4 },
      { code: 'KENDI_GORUSUNUZ', maxScore: 7, lowThreshold: 3, highThreshold: 4 },
      { code: 'GELECEK_ENDISELERI', maxScore: 6, lowThreshold: 2, highThreshold: 3 },
      { code: 'HAZIRLANMAKLA_ILGILI', maxScore: 6, lowThreshold: 2, highThreshold: 3 },
      { code: 'BEDENSEL_TEPKILER', maxScore: 7, lowThreshold: 3, highThreshold: 4 },
      { code: 'ZIHINSEL_TEPKILER', maxScore: 10, lowThreshold: 3, highThreshold: 4 },
      { code: 'GENEL_KAYGI', maxScore: 6, lowThreshold: 2, highThreshold: 3 }
    ];

    boundarySpecs.forEach(spec => {
      const sub = subscales.find(s => s.code === spec.code)!;
      expect(sub).toBeDefined();

      const lowInterp = interpretations.find(i => i.subscaleId === sub.id && i.minScore <= spec.lowThreshold && i.maxScore >= spec.lowThreshold);
      const highInterp = interpretations.find(i => i.subscaleId === sub.id && i.minScore <= spec.highThreshold && i.maxScore >= spec.highThreshold);

      expect(lowInterp).toBeDefined();
      expect(lowInterp?.label).toBe('Düşük Kaygı');
      expect(lowInterp?.maxScore).toBe(spec.lowThreshold);

      expect(highInterp).toBeDefined();
      expect(highInterp?.label).toBe('Yüksek Kaygı');
      expect(highInterp?.minScore).toBe(spec.highThreshold);
    });
  });

  it('7. should score 30 without assigning an overall category (no Orta/Yüksek/Düşük overall label)', () => {
    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi')!;
    const questions = survey.currentVersion!.questions!;

    // Select D for first 30 questions, Y for remaining 20
    const answers = questions.map((q, idx) => {
      const opt = idx < 30 
        ? q.options.find(o => o.optionLabel === 'D' || o.optionValue === 'D')!
        : q.options.find(o => o.optionLabel === 'Y' || o.optionValue === 'Y')!;
      return {
        questionId: q.id,
        selectedOptionId: opt.id
      };
    });

    const res = surveyEngine.submitApplication({
      surveySlug: 'sinav-kaygisi-olcegi',
      studentNumber: '10205',
      answers
    });

    expect(res.success).toBe(true);
    expect(res.application?.totalScore).toBe(30);
    // There must NOT be any overall score interpretation label
    expect(res.application?.resultSnapshot?.interpretation).toBeUndefined();
  });

  it('8. should keep Devamsızlık Nedenleri Anketi completely isolated and untouched', () => {
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.id).toBe('srv-devamsizlik-nedenleri');
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.slug).toBe('devamsizlik-nedenleri-anketi');
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.type).toBe('SURVEY');
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.questions).toHaveLength(52);
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.subscales).toHaveLength(7);

    const devSurvey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi');
    expect(devSurvey).toBeDefined();
    expect(devSurvey?.id).toBe('srv-devamsizlik-nedenleri');
    expect(devSurvey?.currentVersion?.questions).toHaveLength(52);
  });

  it('9. should generate valid printable HTML report with Sonuç ve Değerlendirme Özeti section', () => {
    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi')!;
    const questions = survey.currentVersion!.questions!;

    const answers = questions.map((q, idx) => {
      const opt = idx % 2 === 0
        ? q.options.find(o => o.optionLabel === 'D' || o.optionValue === 'D')!
        : q.options.find(o => o.optionLabel === 'Y' || o.optionValue === 'Y')!;
      return {
        questionId: q.id,
        selectedOptionId: opt.id
      };
    });

    const res = surveyEngine.submitApplication({
      surveySlug: 'sinav-kaygisi-olcegi',
      studentNumber: '15615',
      answers
    });

    expect(res.success).toBe(true);
    const app = res.application!;

    const html = ExamAnxietyPdfReport.generateHtml(app, {
      schoolName: 'Cumhuriyet Anadolu Lisesi',
      counselorName: 'Psikolojik Danışman'
    });

    expect(html).toContain('SINAV KAYGISI ÖLÇEĞİ SONUÇ RAPORU');
    expect(html).toContain('Zeynep Akaya');
    expect(html).toContain('15615');
    expect(html).toContain('12-A');
    expect(html).toContain('Psikolojik Danışman');
    expect(html).toContain('SONUÇ VE DEĞERLENDİRME ÖZETİ');
    expect(html).toContain('Bu uygulamada 7 alt boyutun');
    expect(html).toContain('yüksek');
    expect(html).toContain('düşük');
    expect(html).toContain('Başkalarının Sizi Nasıl Gördüğü');
    expect(html).toContain('Kendinizi Nasıl Gördüğünüzle');
    expect(html).toContain('Gelecekle İlgili Endişeler');
    expect(html).toContain('Zihinsel Tepkiler');
  });

  it('10. should have resultPresentation configured for sinav-kaygisi-olcegi renderer', () => {
    expect(SINAV_KAYGISI_OLCEGI.resultPresentation).toBeDefined();
    expect(SINAV_KAYGISI_OLCEGI.resultPresentation?.rendererType).toBe('sinav-kaygisi-olcegi');

    const survey = surveyEngine.getSurveyBySlug('sinav-kaygisi-olcegi');
    expect(survey?.resultPresentation?.rendererType).toBe('sinav-kaygisi-olcegi');
  });

  it('11. should generate correct sanitized ASCII filenames for PDF export', () => {
    const toSafeAscii = (str: string): string => {
      const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I', 'İ': 'I', 'i': 'i',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return str
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    };

    const studentName = 'Tekin Çetin';
    const studentNumber = '333';

    const safeName = toSafeAscii(studentName);
    const safeNum = toSafeAscii(studentNumber);

    const examAnxietyFileName = `${safeName}_${safeNum}_Sinav_Kaygisi_Olcegi_Raporu.pdf`;
    expect(examAnxietyFileName).toBe('Tekin_Cetin_333_Sinav_Kaygisi_Olcegi_Raporu.pdf');

    const devamsizlikFileName = `${safeName}_${safeNum}_Devamsizlik_Nedenleri_Raporu.pdf`;
    expect(devamsizlikFileName).toBe('Tekin_Cetin_333_Devamsizlik_Nedenleri_Raporu.pdf');
  });
});
