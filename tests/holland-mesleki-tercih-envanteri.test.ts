import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import { HOLLAND_MESLEKI_TERCIH_ENVANTERI } from '../electron/services/surveys/definitions/hollandMeslekiTercihEnvanteri';
import { WESTSIDE_SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/westsideSinavKaygisiOlcegi';
import { SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/sinavKaygisiOlcegi';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { HollandMeslekiTercihPdfReport } from '../electron/services/surveys/reports/HollandMeslekiTercihPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import {
  calculateHollandEvaluation,
  evaluateHollandResponses,
  HOLLAND_TYPES_METADATA,
  HOLLAND_TYPE_ORDER,
  HOLLAND_FARKETMEZ_GUIDANCE,
} from '../shared/hollandEvaluation';
import { filterApplicationsByScope } from '../src/features/surveys/components/reports/HollandMeslekiTercihCollectiveReportModal';
import { SurveyApplicationDto } from '../shared/ipc-types';

describe('Holland Mesleki Tercih Envanteri (HOLLAND-90) Comprehensive Test Suite', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_holland_suite');
  const dbPath = path.join(tempDir, 'test_pdr_holland.sqlite');
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
    it('should have correct ID, slug, title, and exactly 90 questions', () => {
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.id).toBe('srv-holland-mesleki-tercih-envanteri');
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.slug).toBe('holland-mesleki-tercih-envanteri');
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.title).toBe('Holland Mesleki Tercih Envanteri');
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.questions.length).toBe(90);
    });

    it('should have continuous question numbers 1 through 90 with 3 options', () => {
      for (let i = 1; i <= 90; i++) {
        const q = HOLLAND_MESLEKI_TERCIH_ENVANTERI.questions.find((item) => item.orderIndex === i);
        expect(q).toBeDefined();
        expect(q?.orderIndex).toBe(i);
        expect(q?.options?.length).toBe(3);
        expect(q?.options?.map((o) => o.value)).toEqual(['hoslanirim', 'farketmez', 'hoslanmam']);
      }
    });

    it('should have all 6 subscales defined', () => {
      expect(HOLLAND_MESLEKI_TERCIH_ENVANTERI.subscales?.length).toBe(6);
      const subscaleCodes = HOLLAND_MESLEKI_TERCIH_ENVANTERI.subscales?.map((s) => s.code);
      expect(subscaleCodes).toEqual([
        'REALISTIC',
        'INVESTIGATIVE',
        'ARTISTIC',
        'SOCIAL',
        'ENTERPRISING',
        'CONVENTIONAL',
      ]);
    });
  });

  // 2. Question Mappings (15+15 for each type)
  describe('2. Question Mappings (15+15)', () => {
    it('should have exact 15 Hoslanirim and 15 Hoslanmam questions per type', () => {
      for (const key of HOLLAND_TYPE_ORDER) {
        const meta = HOLLAND_TYPES_METADATA[key];
        expect(meta.hoslanirimQuestions.length).toBe(15);
        expect(meta.hoslanmamQuestions.length).toBe(15);

        // Disjoint sets of 15 each
        const overlap = meta.hoslanirimQuestions.filter((q) =>
          meta.hoslanmamQuestions.includes(q)
        );
        expect(overlap.length).toBe(0);
      }
    });

    it('should match the exact PDF scoring cetveli question mappings', () => {
      // Araştırıcı (INVESTIGATIVE)
      expect(HOLLAND_TYPES_METADATA.INVESTIGATIVE.hoslanirimQuestions).toEqual([
        1, 3, 4, 8, 11, 17, 22, 34, 39, 41, 47, 48, 68, 71, 80,
      ]);
      expect(HOLLAND_TYPES_METADATA.INVESTIGATIVE.hoslanmamQuestions).toEqual([
        6, 10, 14, 31, 32, 42, 44, 45, 50, 62, 72, 74, 77, 78, 81,
      ]);

      // Artistik (ARTISTIC)
      expect(HOLLAND_TYPES_METADATA.ARTISTIC.hoslanirimQuestions).toEqual([
        6, 10, 14, 31, 32, 42, 44, 45, 50, 62, 72, 74, 77, 78, 81,
      ]);
      expect(HOLLAND_TYPES_METADATA.ARTISTIC.hoslanmamQuestions).toEqual([
        1, 3, 4, 8, 11, 17, 22, 34, 39, 41, 47, 48, 68, 71, 80,
      ]);

      // Sosyal (SOCIAL)
      expect(HOLLAND_TYPES_METADATA.SOCIAL.hoslanirimQuestions).toEqual([
        2, 21, 29, 37, 49, 55, 58, 60, 64, 65, 66, 73, 87, 88, 90,
      ]);
      expect(HOLLAND_TYPES_METADATA.SOCIAL.hoslanmamQuestions).toEqual([
        7, 15, 16, 18, 20, 28, 33, 35, 51, 56, 63, 67, 75, 83, 85,
      ]);

      // Girişimci (ENTERPRISING)
      expect(HOLLAND_TYPES_METADATA.ENTERPRISING.hoslanirimQuestions).toEqual([
        7, 15, 16, 18, 20, 28, 33, 35, 51, 56, 63, 67, 75, 83, 85,
      ]);
      expect(HOLLAND_TYPES_METADATA.ENTERPRISING.hoslanmamQuestions).toEqual([
        2, 21, 29, 37, 49, 55, 58, 60, 64, 65, 66, 73, 87, 88, 90,
      ]);

      // Geleneksel (CONVENTIONAL)
      expect(HOLLAND_TYPES_METADATA.CONVENTIONAL.hoslanirimQuestions).toEqual([
        5, 12, 23, 24, 27, 30, 36, 43, 46, 57, 69, 76, 79, 86, 89,
      ]);
      expect(HOLLAND_TYPES_METADATA.CONVENTIONAL.hoslanmamQuestions).toEqual([
        9, 13, 19, 25, 26, 38, 40, 52, 53, 54, 59, 61, 70, 82, 84,
      ]);

      // Gerçekçi (REALISTIC)
      expect(HOLLAND_TYPES_METADATA.REALISTIC.hoslanirimQuestions).toEqual([
        9, 13, 19, 25, 26, 38, 40, 52, 53, 54, 59, 61, 70, 82, 84,
      ]);
      expect(HOLLAND_TYPES_METADATA.REALISTIC.hoslanmamQuestions).toEqual([
        5, 12, 23, 24, 27, 30, 36, 43, 46, 57, 69, 76, 79, 86, 89,
      ]);
    });
  });

  // 3. Mathematical Evaluation & Invariant
  describe('3. Evaluation Logic & Invariant H + F + M = 30', () => {
    it('should evaluate responses correctly and ensure H + F + M = 30 for all 6 types', () => {
      const answers: { questionOrder: number; selectedOptionValue: string }[] = [];
      for (let i = 1; i <= 90; i++) {
        answers.push({
          questionOrder: i,
          selectedOptionValue: i % 3 === 0 ? 'hoslanirim' : i % 3 === 1 ? 'farketmez' : 'hoslanmam',
        });
      }

      const result = calculateHollandEvaluation(answers);
      expect(result.typeResults.length).toBe(6);
      for (const t of result.typeResults) {
        expect(t.totalItemsEvaluated).toBe(30);
        expect(t.hoslanirimCount + t.farketmezCount + t.hoslanmamCount).toBe(30);
      }
    });
  });

  // 4. Methodological Purity: No Artificial Farketmez Cutoffs (29, 30, 31 produce neutral guidance)
  describe('4. Methodological Purity: No Artificial Farketmez Cutoffs', () => {
    it('should return neutral guidance without automated diagnosis across 29, 30, 31 Farketmez counts', () => {
      const generateAnswersWithF = (fCount: number) => {
        const ans: Record<string, string> = {};
        for (let i = 1; i <= 90; i++) {
          ans[`q${i}`] = i <= fCount ? 'farketmez' : (i % 2 === 0 ? 'hoslanirim' : 'hoslanmam');
        }
        return ans;
      };

      const result29 = evaluateHollandResponses(generateAnswersWithF(29));
      const result30 = evaluateHollandResponses(generateAnswersWithF(30));
      const result31 = evaluateHollandResponses(generateAnswersWithF(31));

      expect(result29.totalFarketmezAcrossAll).toBe(29);
      expect(result30.totalFarketmezAcrossAll).toBe(30);
      expect(result31.totalFarketmezAcrossAll).toBe(31);

      // Same neutral methodological explanation for all cases
      expect(result29.farketmezInterpretation).toBe(HOLLAND_FARKETMEZ_GUIDANCE);
      expect(result30.farketmezInterpretation).toBe(HOLLAND_FARKETMEZ_GUIDANCE);
      expect(result31.farketmezInterpretation).toBe(HOLLAND_FARKETMEZ_GUIDANCE);

      // Does not contain automated categorical claims
      expect(result30.farketmezInterpretation).not.toContain('Kişilik tipi belirlenmiştir');
      expect(result30.farketmezInterpretation).not.toContain('Kişilik tipi belirlenmemiştir');
      expect(result30.farketmezInterpretation).toContain('sabit bir sayısal kesme değeri belirtilmemiştir');

      // Invariant H + F + M = 30 maintained
      for (const t of result30.typeResults) {
        expect(t.hoslanirimCount + t.farketmezCount + t.hoslanmamCount).toBe(30);
      }
    });

    it('Case: All 90 Farketmez => H=0, F=30, M=0 for each type and H+F+M=30', () => {
      const allF: Record<string, string> = {};
      for (let i = 1; i <= 90; i++) allF[`q${i}`] = 'farketmez';

      const result = evaluateHollandResponses(allF);
      expect(result.totalFarketmezAcrossAll).toBe(90);
      expect(result.farketmezInterpretation).toBe(HOLLAND_FARKETMEZ_GUIDANCE);

      for (const type of result.typeResults) {
        expect(type.hoslanirimCount).toBe(0);
        expect(type.hoslanmamCount).toBe(0);
        expect(type.farketmezCount).toBe(30);
        expect(type.hoslanirimCount + type.farketmezCount + type.hoslanmamCount).toBe(30);
      }
    });
  });

  // 5. Dominant, Distant, and Tie Handling
  describe('5. Dominant, Distant, and Tie Handling', () => {
    it('should correctly identify a single dominant and distant type', () => {
      const answers: Record<string, string> = {};
      for (let i = 1; i <= 90; i++) answers[`q${i}`] = 'farketmez';

      // Set Sosyal H questions to 'hoslanirim'
      const sosyalH = HOLLAND_TYPES_METADATA.SOCIAL.hoslanirimQuestions;
      sosyalH.forEach((q) => { answers[`q${q}`] = 'hoslanirim'; });

      // Set Gerçekçi M questions to 'hoslanmam'
      const gercekciM = HOLLAND_TYPES_METADATA.REALISTIC.hoslanmamQuestions;
      gercekciM.forEach((q) => { answers[`q${q}`] = 'hoslanmam'; });

      const result = evaluateHollandResponses(answers);
      expect(result.dominantTypes.length).toBe(1);
      expect(result.dominantTypes[0].title).toBe('Sosyal');
      expect(result.dominantTypes[0].hoslanirimCount).toBe(15);

      expect(result.distantTypes.length).toBe(1);
      expect(result.distantTypes[0].title).toBe('Gerçekçi');
      expect(result.distantTypes[0].hoslanmamCount).toBe(15);
    });

    it('should list all tied types without arbitrary bias when there is a tie', () => {
      const answers: Record<string, string> = {};
      for (let i = 1; i <= 90; i++) answers[`q${i}`] = 'farketmez';

      // Make Araştırıcı and Artistik tie with 10 Hoslanirim each
      HOLLAND_TYPES_METADATA.INVESTIGATIVE.hoslanirimQuestions.slice(0, 10).forEach((q) => {
        answers[`q${q}`] = 'hoslanirim';
      });
      HOLLAND_TYPES_METADATA.ARTISTIC.hoslanirimQuestions.slice(0, 10).forEach((q) => {
        answers[`q${q}`] = 'hoslanirim';
      });

      const result = evaluateHollandResponses(answers);
      expect(result.dominantTypes.length).toBe(2);
      expect(result.isDominantTie).toBe(true);
      const titles = result.dominantTypes.map((d) => d.title);
      expect(titles).toContain('Araştırıcı');
      expect(titles).toContain('Artistik');
    });
  });

  // 6. Survey Engine Integration & Database Persistence
  describe('6. Survey Engine & Database Persistence', () => {
    it('should list Holland Mesleki Tercih Envanteri alongside all system surveys', () => {
      const list = surveyEngine.listSurveys();
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(list.some((s) => s.slug === 'holland-mesleki-tercih-envanteri' && s.id === 'srv-holland-mesleki-tercih-envanteri')).toBe(true);
    });

    it('should submit a Holland survey response and retrieve saved application', () => {
      const slug = 'holland-mesleki-tercih-envanteri';
      const survey = surveyEngine.getSurveyBySlug(slug);
      expect(survey).toBeDefined();

      const questions = survey!.currentVersion!.questions!;
      expect(questions.length).toBe(90);

      const answers = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionId: q.options && q.options.length > 0 ? q.options[idx % 3].id : undefined,
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
      const slug = 'holland-mesleki-tercih-envanteri';
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

  // 7. PDF Report Generation & Standard Filename
  describe('7. PDF Report Generation', () => {
    it('should generate valid HTML report with dominant types, distant types, and neutral guidance', () => {
      const mockApplication: SurveyApplicationDto = {
        id: 'app-holland-1',
        surveyId: 'srv-holland-mesleki-tercih-envanteri',
        surveySlug: 'holland-mesleki-tercih-envanteri',
        surveyTitle: 'Holland Mesleki Tercih Envanteri',
        studentName: 'Tekin Çetin',
        studentNumber: '333',
        className: '11-A',
        attemptNumber: 1,
        completedAt: '2026-09-07T12:00:00.000Z',
        answers: [
          { questionOrder: 2, selectedOptionLabel: 'HOŞLANIRIM', answerValue: 'hoslanirim' },
          { questionOrder: 21, selectedOptionLabel: 'HOŞLANIRIM', answerValue: 'hoslanirim' },
          { questionOrder: 29, selectedOptionLabel: 'HOŞLANIRIM', answerValue: 'hoslanirim' },
        ] as any,
      } as unknown as SurveyApplicationDto;

      const html = HollandMeslekiTercihPdfReport.generateHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
        counselorName: 'Psk. Danışman',
      });

      expect(html).toContain('HOLLAND MESLEKİ TERCİH ENVANTERİ');
      expect(html).toContain('Tekin Çetin');
      expect(html).toContain('Psk. Danışman');
      expect(html).toContain('BASKIN KİŞİLİK TİPİ');
      expect(html).toContain('Araştırıcı');
      expect(html).toContain('Sosyal');
      expect(html).toContain('Gerçekçi');
      expect(html).toContain('sabit bir sayısal kesme değeri belirtilmemiştir');

      const registryHtml = SurveyReportRegistry.generateReportHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
      });
      expect(registryHtml).toContain('HOLLAND MESLEKİ TERCİH ENVANTERİ');
      expect(registryHtml).toContain('Tekin Çetin');
    });

    it('should check hasReport in SurveyReportRegistry', () => {
      expect(SurveyReportRegistry.hasReport('srv-holland-mesleki-tercih-envanteri')).toBe(true);
      expect(SurveyReportRegistry.hasReport('holland-mesleki-tercih-envanteri')).toBe(true);
    });
  });

  // 8. Collective Filtering
  describe('8. Collective Modal Filtering', () => {
    it('should filter applications correctly by latest_per_student and all', () => {
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

  // 9. Strict Isolation Check
  describe('9. Strict Isolation of Scales', () => {
    it('should keep Devamsızlık Nedenleri, Sınav Kaygısı, and Westside intact', () => {
      expect(DEVAMSIZLIK_NEDENLERI_ANKETI.questions.length).toBe(52);
      expect(SINAV_KAYGISI_OLCEGI.questions.length).toBe(50);
      expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.questions.length).toBe(11);

      expect(SurveyReportRegistry.hasReport('srv-devamsizlik-nedenleri')).toBe(true);
      expect(SurveyReportRegistry.hasReport('srv-sinav-kaygisi-olcegi')).toBe(true);
      expect(SurveyReportRegistry.hasReport('srv-westside-sinav-kaygisi-olcegi')).toBe(true);
      expect(SurveyReportRegistry.hasReport('srv-holland-mesleki-tercih-envanteri')).toBe(true);
    });
  });
});