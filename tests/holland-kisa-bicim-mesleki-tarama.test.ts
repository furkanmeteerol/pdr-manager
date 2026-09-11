import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import { HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI, HOLLAND_KISA_SUBSCALES } from '../electron/services/surveys/definitions/hollandKisaMeslekiTarama';
import { HOLLAND_MESLEKI_TERCIH_ENVANTERI } from '../electron/services/surveys/definitions/hollandMeslekiTercihEnvanteri';
import { WESTSIDE_SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/westsideSinavKaygisiOlcegi';
import { SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/sinavKaygisiOlcegi';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { HollandKisaMeslekiTaramaPdfReport } from '../electron/services/surveys/reports/HollandKisaMeslekiTaramaPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import {
  calculateHollandKisaEvaluation,
  HOLLAND_KISA_QUESTION_MAP,
  HOLLAND_KISA_TYPES_METADATA,
  HOLLAND_KISA_TYPE_ORDER,
} from '../shared/hollandKisaEvaluation';
import { filterApplicationsByScope } from '../src/features/surveys/components/reports/HollandKisaMeslekiTaramaCollectiveReportModal';
import { SurveyApplicationDto } from '../shared/ipc-types';

describe('Holland Kısa Biçim Mesleki Tarama Envanteri (HOLLAND-KISA-30) Comprehensive Test Suite', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_holland_kisa_suite');
  const dbPath = path.join(tempDir, 'test_pdr_holland_kisa.sqlite');
  let sqlite: Database.Database;
  let db: any;
  let surveyEngine: SurveyEngine;

  beforeEach(async () => {
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    db = conn.db;

    runMigrations(sqlite);
    SystemCatalogService.seedAllCatalogs(sqlite, 'dev-1');

    const mockSyncEngine = {
      recordChange: () => {},
      subscribe: () => () => {},
      getPendingCount: () => 0,
    } as any;

    surveyEngine = new SurveyEngine(db, 'dev-1', mockSyncEngine);

    sqlite.prepare(`
      INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
      VALUES ('sch-1', 'Cumhuriyet Anadolu Lisesi', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('class-11a', 'year-2026', '11-A', 11, 'A', 1000, 1000, 1, 'dev-1'),
        ('class-11b', 'year-2026', '11-B', 11, 'B', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, notes, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-tekin', 'year-2026', 'class-11a', '333', 'Tekin', 'Çetin', 'male', 'active', '', 1000, 1000, 1, 'dev-1'),
        ('st-zeynep', 'year-2026', 'class-11a', '334', 'Zeynep', 'Kaya', 'female', 'active', '', 1000, 1000, 1, 'dev-1'),
        ('st-burak', 'year-2026', 'class-11b', '335', 'Burak', 'Demir', 'male', 'active', '', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();
  });

  afterEach(() => {
    try {
      if (sqlite) sqlite.close();
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // 1. Survey Definition Integrity
  describe('1. Survey Definition Integrity', () => {
    it('should have correct ID, slug, title, and exactly 30 questions', () => {
      expect(HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.id).toBe('srv-holland-kisa-bicim-mesleki-tarama-envanteri');
      expect(HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.slug).toBe('holland-kisa-bicim-mesleki-tarama-envanteri');
      expect(HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.title).toBe('Holland Kısa Biçim Mesleki Tarama Envanteri');
      expect(HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.questions.length).toBe(30);
    });

    it('should have continuous question numbers 1 through 30', () => {
      HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.questions.forEach((q, idx) => {
        expect(q.orderIndex).toBe(idx + 1);
        expect(q.text).toBeDefined();
        expect(q.text.length).toBeGreaterThan(5);
      });
    });

    it('should have 9 Likert options (1 to 9) for every question', () => {
      HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI.questions.forEach((q) => {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBe(9);
        expect(q.options![0].value).toBe('1');
        expect(q.options![0].score).toBe(1);
        expect(q.options![0].label).toContain('Hiç Katılmıyorum');
        expect(q.options![8].value).toBe('9');
        expect(q.options![8].score).toBe(9);
        expect(q.options![8].label).toContain('Tamamen Katılıyorum');
      });
    });

    it('should define exactly 6 subscales with 5 items each according to the source PDF', () => {
      expect(HOLLAND_KISA_SUBSCALES.length).toBe(6);

      // Araştırıcı (I): 2, 10, 14, 20, 26
      expect(HOLLAND_KISA_TYPES_METADATA.INVESTIGATIVE.questions).toEqual([2, 10, 14, 20, 26]);

      // Sosyal (S): 1, 6, 21, 24, 27
      expect(HOLLAND_KISA_TYPES_METADATA.SOCIAL.questions).toEqual([1, 6, 21, 24, 27]);

      // Sanatçı (A): 4, 12, 15, 17, 30
      expect(HOLLAND_KISA_TYPES_METADATA.ARTISTIC.questions).toEqual([4, 12, 15, 17, 30]);

      // Geleneksel (C): 3, 5, 7, 23, 29
      expect(HOLLAND_KISA_TYPES_METADATA.CONVENTIONAL.questions).toEqual([3, 5, 7, 23, 29]);

      // Gerçekçi (R): 8, 13, 16, 18, 28
      expect(HOLLAND_KISA_TYPES_METADATA.REALISTIC.questions).toEqual([8, 13, 16, 18, 28]);

      // Girişimci (E): 9, 11, 19, 22, 25
      expect(HOLLAND_KISA_TYPES_METADATA.ENTERPRISING.questions).toEqual([9, 11, 19, 22, 25]);
    });

    it('should assign every question 1..30 to exactly one subscale without omission or duplicate', () => {
      const allAssigned = [
        ...HOLLAND_KISA_TYPES_METADATA.REALISTIC.questions,
        ...HOLLAND_KISA_TYPES_METADATA.INVESTIGATIVE.questions,
        ...HOLLAND_KISA_TYPES_METADATA.ARTISTIC.questions,
        ...HOLLAND_KISA_TYPES_METADATA.SOCIAL.questions,
        ...HOLLAND_KISA_TYPES_METADATA.ENTERPRISING.questions,
        ...HOLLAND_KISA_TYPES_METADATA.CONVENTIONAL.questions,
      ];
      expect(allAssigned.length).toBe(30);
      const uniqueSorted = Array.from(new Set(allAssigned)).sort((a, b) => a - b);
      expect(uniqueSorted.length).toBe(30);
      expect(uniqueSorted[0]).toBe(1);
      expect(uniqueSorted[29]).toBe(30);
    });
  });

  // 2. Scoring & Evaluation Engine
  describe('2. Scoring & Evaluation Engine', () => {
    it('should compute minimum score of 5 for all subscales when all answers are 1', () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        questionId: `q${i + 1}`,
        answerValue: '1',
      }));

      const evalResult = calculateHollandKisaEvaluation(answers);
      expect(evalResult.typeResults.length).toBe(6);

      HOLLAND_KISA_TYPE_ORDER.forEach((typeKey) => {
        const found = evalResult.typeResults.find((r) => r.typeKey === typeKey);
        expect(found).toBeDefined();
        expect(found!.score).toBe(5);
      });
      expect(evalResult.hollandCode.length).toBe(3);
    });

    it('should compute maximum score of 45 for all subscales when all answers are 9', () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        questionId: `q${i + 1}`,
        answerValue: '9',
      }));

      const evalResult = calculateHollandKisaEvaluation(answers);
      HOLLAND_KISA_TYPE_ORDER.forEach((typeKey) => {
        const found = evalResult.typeResults.find((r) => r.typeKey === typeKey);
        expect(found).toBeDefined();
        expect(found!.score).toBe(45);
      });
    });

    it('should calculate specific subscale scores and top 3 hierarchy correctly', () => {
      const answers: { questionId: string; answerValue: string }[] = [];

      HOLLAND_KISA_QUESTION_MAP.social.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '9' }));
      HOLLAND_KISA_QUESTION_MAP.investigative.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '8' }));
      HOLLAND_KISA_QUESTION_MAP.artistic.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '7' }));
      HOLLAND_KISA_QUESTION_MAP.enterprising.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '5' }));
      HOLLAND_KISA_QUESTION_MAP.conventional.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '3' }));
      HOLLAND_KISA_QUESTION_MAP.realistic.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '1' }));

      const evalResult = calculateHollandKisaEvaluation(answers);

      const scoreMap = new Map(evalResult.typeResults.map((t) => [t.typeKey, t.score]));
      expect(scoreMap.get('SOCIAL')).toBe(45);
      expect(scoreMap.get('INVESTIGATIVE')).toBe(40);
      expect(scoreMap.get('ARTISTIC')).toBe(35);
      expect(scoreMap.get('ENTERPRISING')).toBe(25);
      expect(scoreMap.get('CONVENTIONAL')).toBe(15);
      expect(scoreMap.get('REALISTIC')).toBe(5);

      // Ranked scores
      expect(evalResult.sortedTypes[0].typeKey).toBe('SOCIAL');
      expect(evalResult.sortedTypes[1].typeKey).toBe('INVESTIGATIVE');
      expect(evalResult.sortedTypes[2].typeKey).toBe('ARTISTIC');
      expect(evalResult.sortedTypes[3].typeKey).toBe('ENTERPRISING');
      expect(evalResult.sortedTypes[4].typeKey).toBe('CONVENTIONAL');
      expect(evalResult.sortedTypes[5].typeKey).toBe('REALISTIC');

      // Top 3 types and Holland Code
      expect(evalResult.top3Types.map((t) => t.typeKey)).toEqual(['SOCIAL', 'INVESTIGATIVE', 'ARTISTIC']);
      expect(evalResult.hollandCode).toBe('SIA');
      expect(evalResult.hasTop3Tie).toBe(false);
      expect(evalResult.tieDescription).toBeUndefined();
    });

    it('should detect top 3 ties neutrally without arbitrary bias', () => {
      const answers: { questionId: string; answerValue: string }[] = [];

      // Social: 5 * 8 = 40
      HOLLAND_KISA_QUESTION_MAP.social.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '8' }));
      // Investigative: 5 * 8 = 40
      HOLLAND_KISA_QUESTION_MAP.investigative.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '8' }));
      // Artistic: 5 * 6 = 30
      HOLLAND_KISA_QUESTION_MAP.artistic.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '6' }));
      // Enterprising: 5 * 6 = 30 (tied with Artistic at 3rd boundary!)
      HOLLAND_KISA_QUESTION_MAP.enterprising.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '6' }));
      // Conventional: 5 * 2 = 10
      HOLLAND_KISA_QUESTION_MAP.conventional.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '2' }));
      // Realistic: 5 * 1 = 5
      HOLLAND_KISA_QUESTION_MAP.realistic.forEach((q) => answers.push({ questionId: `q${q}`, answerValue: '1' }));

      const evalResult = calculateHollandKisaEvaluation(answers);

      expect(evalResult.hasTop3Tie).toBe(true);
      expect(evalResult.tieDescription).toBeDefined();
      expect(evalResult.tieDescription).toContain('eşitlik');
    });

    it('should NOT produce any total score, mean 1..5 score, or risk levels', () => {
      const answers = Array.from({ length: 30 }, (_, i) => ({
        questionId: `q${i + 1}`,
        answerValue: '5',
      }));

      const evalResult = calculateHollandKisaEvaluation(answers);

      expect((evalResult as any).totalScore).toBeUndefined();
      expect((evalResult as any).averageScore).toBeUndefined();
      expect((evalResult as any).riskLevel).toBeUndefined();
      expect((evalResult as any).standardDeviation).toBeUndefined();
    });
  });

  // 3. Survey Engine Integration & Database Persistence
  describe('3. Survey Engine & Database Persistence', () => {
    it('should list Holland Kısa Biçim Mesleki Tarama Envanteri alongside all system surveys', () => {
      const list = surveyEngine.listSurveys();
      expect(list.length).toBeGreaterThanOrEqual(5);
      expect(list.some((s) => s.slug === 'holland-kisa-bicim-mesleki-tarama-envanteri' && s.id === 'srv-holland-kisa-bicim-mesleki-tarama-envanteri')).toBe(true);
    });

    it('should submit a Holland Kısa survey response and retrieve saved application', () => {
      const slug = 'holland-kisa-bicim-mesleki-tarama-envanteri';
      const survey = surveyEngine.getSurveyBySlug(slug);
      expect(survey).toBeDefined();

      const questions = survey!.currentVersion!.questions!;
      expect(questions.length).toBe(30);

      const answers = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionId: q.options && q.options.length > 0 ? q.options[idx % 9].id : undefined,
      }));

      const res = surveyEngine.submitApplication({
        surveySlug: slug,
        studentNumber: '333',
        answers: answers,
      });

      expect(res.success).toBe(true);
      expect(res.application).toBeDefined();
      expect(res.application?.studentName).toBe('Tekin Çetin');
      expect(res.application?.attemptNumber).toBe(1);
    });

    it('should allow multiple applications for the same student (multi-attempt preservation)', () => {
      const slug = 'holland-kisa-bicim-mesleki-tarama-envanteri';
      const survey = surveyEngine.getSurveyBySlug(slug);
      const questions = survey!.currentVersion!.questions!;

      const answers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: q.options && q.options.length > 0 ? q.options[0].id : undefined,
      }));

      const res1 = surveyEngine.submitApplication({
        surveySlug: slug,
        studentNumber: '333',
        answers: answers,
      });
      expect(res1.success).toBe(true);
      expect(res1.application?.attemptNumber).toBe(1);

      const res2 = surveyEngine.submitApplication({
        surveySlug: slug,
        studentNumber: '333',
        answers: answers,
      });
      expect(res2.success).toBe(true);
      expect(res2.application?.attemptNumber).toBe(2);
    });
  });

  // 4. PDF Generation & Reporting
  describe('4. PDF Report Generation & Filtering', () => {
    it('should generate valid HTML report with top 3 types, Holland code, and neutral guidance', () => {
      const mockApplication: SurveyApplicationDto = {
        id: 'app-holland-kisa-1',
        surveyId: 'srv-holland-kisa-bicim-mesleki-tarama-envanteri',
        surveySlug: 'holland-kisa-bicim-mesleki-tarama-envanteri',
        surveyTitle: 'Holland Kısa Biçim Mesleki Tarama Envanteri',
        studentName: 'Tekin Çetin',
        studentNumber: '333',
        className: '11-A',
        attemptNumber: 1,
        completedAt: '2026-09-07T12:00:00.000Z',
        answers: Array.from({ length: 30 }, (_, i) => ({
          questionOrder: i + 1,
          questionText: `Madde ${i + 1}`,
          selectedOptionLabel: '7',
          answerValue: '7',
        })) as any,
      } as unknown as SurveyApplicationDto;

      const html = HollandKisaMeslekiTaramaPdfReport.generateHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
        counselorName: 'Psk. Danışman',
      });

      expect(html).toContain('HOLLAND KISA BİÇİM MESLEKİ TARAMA ENVANTERİ');
      expect(html).toContain('Tekin Çetin');
      expect(html).toContain('Psk. Danışman');
      expect(html).toContain('MESLEKİ KİŞİLİK PROFİLİ (İLK 3 TİP)');
      expect(html).toContain('Holland Kodu');

      const registryHtml = SurveyReportRegistry.generateReportHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
      });
      expect(registryHtml).toContain('HOLLAND KISA BİÇİM MESLEKİ TARAMA ENVANTERİ');
      expect(registryHtml).toContain('Tekin Çetin');
    });

    it('should check hasReport in SurveyReportRegistry', () => {
      expect(SurveyReportRegistry.hasReport('srv-holland-kisa-bicim-mesleki-tarama-envanteri')).toBe(true);
      expect(SurveyReportRegistry.hasReport('holland-kisa-bicim-mesleki-tarama-envanteri')).toBe(true);
    });

    it('should filter applications correctly by scope', () => {
      const mockList: SurveyApplicationDto[] = [
        {
          id: 'app-1',
          studentId: 'st-tekin',
          studentNumber: '333',
          studentName: 'Tekin Çetin',
          className: '11-A',
          attemptNumber: 1,
          completedAt: '2026-09-01T10:00:00.000Z',
        } as any,
        {
          id: 'app-2',
          studentId: 'st-tekin',
          studentNumber: '333',
          studentName: 'Tekin Çetin',
          className: '11-A',
          attemptNumber: 2,
          completedAt: '2026-09-07T12:00:00.000Z',
        } as any,
        {
          id: 'app-3',
          studentId: 'st-zeynep',
          studentNumber: '334',
          studentName: 'Zeynep Kaya',
          className: '11-A',
          attemptNumber: 1,
          completedAt: '2026-09-07T14:00:00.000Z',
        } as any,
      ];

      const latest = filterApplicationsByScope(mockList, 'latest_per_student');
      expect(latest).toHaveLength(2);
      expect(latest.find((a) => a.studentId === 'st-tekin')?.id).toBe('app-2');

      const all = filterApplicationsByScope(mockList, 'all');
      expect(all).toHaveLength(3);
    });
  });

  // 5. System Isolation & Regression Check
  describe('5. System Isolation & Regression Check', () => {
    it('should keep Devamsızlık Nedenleri Anketi (52 items) completely intact', () => {
      expect(DEVAMSIZLIK_NEDENLERI_ANKETI.questions.length).toBe(52);
      expect(DEVAMSIZLIK_NEDENLERI_ANKETI.id).toBe('srv-devamsizlik-nedenleri');
    });

    it('should keep Sınav Kaygısı Ölçeği (50 items) completely intact', () => {
      expect(SINAV_KAYGISI_OLCEGI.questions.length).toBe(50);
      expect(SINAV_KAYGISI_OLCEGI.id).toBe('srv-sinav-kaygisi-olcegi');
    });

    it('should keep The Westside Sınav Kaygısı Ölçeği (11 items) completely intact', () => {
      expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.questions.length).toBe(11);
      expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.id).toBe('srv-westside-sinav-kaygisi-olcegi');
    });

    it('should keep Holland Mesleki Tercih Envanteri (90 items) completely intact', () => {
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.questions.length).toBe(90);
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.id).toBe('srv-holland-mesleki-tercih-envanteri');
    });
  });
});