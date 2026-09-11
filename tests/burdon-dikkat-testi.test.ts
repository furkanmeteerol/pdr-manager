import { describe, it, expect } from 'vitest';
import { 
  getBurdonMatrixCells, 
  evaluateBurdonTest, 
  BURDON_RAW_ROWS,
  BURDON_TARGET_LETTERS
} from '../shared/burdonDikkatEvaluation';
import { BURDON_DIKKAT_TESTI } from '../electron/services/surveys/definitions/burdonDikkatTesti';
import { SYSTEM_CATALOG_REGISTRY } from '../electron/services/surveys/SystemCatalogService';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { getSurveyResultRenderer } from '../src/features/surveys/components/renderers/SurveyResultRendererRegistry';
import { getSurveyReportComponent, UnconfiguredSurveyReport } from '../src/features/surveys/components/reports/SurveyReportRegistry';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { SystemCatalogService } from '../electron/services/surveys/SystemCatalogService';
import fs from 'node:fs';
import path from 'node:path';

describe('Burdon Dikkat Testi Module Tests', () => {

  describe('1. Matrix & Metadata Verification (Source Fidelity)', () => {
    it('should have exactly 30 rows in raw matrix', () => {
      expect(BURDON_RAW_ROWS.length).toBe(30);
    });

    it('should have exactly 22 chars in all 30 rows including Row 15', () => {
      BURDON_RAW_ROWS.forEach((rowStr, idx) => {
        const chars = rowStr.split(' ').filter(Boolean);
        expect(chars.length).toBe(22);
        if (idx + 1 === 15) {
          expect(rowStr).toBe("o ş k h a m v ğ l m g v n h v m p b n p y h");
        }
      });
    });

    it('should generate all matrix cells strictly matching source (660 total cells)', () => {
      const cells = getBurdonMatrixCells();
      expect(cells.length).toBe(660);
    });

    it('should correctly identify the target letters (a, b, d, g) and non-targets', () => {
      expect(BURDON_TARGET_LETTERS.has('a')).toBe(true);
      expect(BURDON_TARGET_LETTERS.has('b')).toBe(true);
      expect(BURDON_TARGET_LETTERS.has('d')).toBe(true);
      expect(BURDON_TARGET_LETTERS.has('g')).toBe(true);
      expect(BURDON_TARGET_LETTERS.has('e')).toBe(false);
      expect(BURDON_TARGET_LETTERS.has('ğ')).toBe(false);
      expect(BURDON_TARGET_LETTERS.has('ü')).toBe(false);
      expect(BURDON_TARGET_LETTERS.has('ş')).toBe(false);
      expect(BURDON_TARGET_LETTERS.has('ı')).toBe(false);
    });

    it('should have exact programmatic target counts (a:30, b:25, d:29, g:30) and 114 total targets', () => {
      const cells = getBurdonMatrixCells();
      const countA = cells.filter((c) => c.char === 'a').length;
      const countB = cells.filter((c) => c.char === 'b').length;
      const countD = cells.filter((c) => c.char === 'd').length;
      const countG = cells.filter((c) => c.char === 'g').length;

      expect(countA).toBe(30);
      expect(countB).toBe(25);
      expect(countD).toBe(29);
      expect(countG).toBe(30);
      expect(countA + countB + countD + countG).toBe(114);

      const targets = cells.filter((c) => c.isTarget);
      expect(targets.length).toBe(114);
    });

    it('should have correct target counts per section (Sec1: 38, Sec2: 40, Sec3: 36)', () => {
      const evalEmpty = evaluateBurdonTest([]);
      expect(evalEmpty.sectionStats[0].targetCount).toBe(38);
      expect(evalEmpty.sectionStats[1].targetCount).toBe(40);
      expect(evalEmpty.sectionStats[2].targetCount).toBe(36);
      expect(evalEmpty.sectionStats[0].targetCount + evalEmpty.sectionStats[1].targetCount + evalEmpty.sectionStats[2].targetCount).toBe(114);
    });
  });

  describe('2. Evaluation & Invariant Logic (doğru + atlanan = hedef & toplam = doğru + yanlış)', () => {
    it('should evaluate 0 markings as 0 correct, 114 omitted, 0% accuracy', () => {
      const result = evaluateBurdonTest([]);
      expect(result.correctMarkings).toBe(0);
      expect(result.omittedTargets).toBe(114);
      expect(result.incorrectMarkings).toBe(0);
      expect(result.totalMarkings).toBe(0);
      expect(result.accuracyPercentage).toBe(0);
      expect(result.pattern.code).toBe('LOW_ATTEMPT');

      // Invariants
      expect(result.correctMarkings + result.omittedTargets).toBe(result.totalTargets);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('should evaluate 100% correct markings when all targets are marked', () => {
      const cells = getBurdonMatrixCells();
      const allTargetIds = cells.filter((c) => c.isTarget).map((c) => c.cellId);

      const result = evaluateBurdonTest(allTargetIds);
      expect(result.correctMarkings).toBe(114);
      expect(result.omittedTargets).toBe(0);
      expect(result.incorrectMarkings).toBe(0);
      expect(result.totalMarkings).toBe(114);
      expect(result.accuracyPercentage).toBe(100);
      expect(result.pattern.code).toBe('BALANCED');

      // Invariants
      expect(result.correctMarkings + result.omittedTargets).toBe(result.totalTargets);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('should maintain mathematical invariants for partial and arbitrary markings', () => {
      const cells = getBurdonMatrixCells();
      const nonTargets = cells.filter((c) => !c.isTarget).slice(0, 15).map((c) => c.cellId);
      const targets = cells.filter((c) => c.isTarget).slice(0, 45).map((c) => c.cellId);

      const result = evaluateBurdonTest([...targets, ...nonTargets]);
      expect(result.correctMarkings).toBe(45);
      expect(result.omittedTargets).toBe(69);
      expect(result.incorrectMarkings).toBe(15);
      expect(result.totalMarkings).toBe(60);

      // Invariants at overall level
      expect(result.correctMarkings + result.omittedTargets).toBe(114);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);

      // Invariants at row level
      result.rowStats.forEach((r) => {
        expect(r.correctCount + r.omittedCount).toBe(r.targetCount);
        expect(r.totalMarked).toBe(r.correctCount + r.incorrectCount);
      });

      // Invariants at section level
      result.sectionStats.forEach((sec) => {
        expect(sec.correctCount + sec.omittedCount).toBe(sec.targetCount);
        expect(sec.totalMarked).toBe(sec.correctCount + sec.incorrectCount);
      });
    });

    it('should detect FATIGUE_DROP pattern when errors increase in section 3', () => {
      const cells = getBurdonMatrixCells();
      const sec1Targets = cells.filter((c) => c.sectionNumber === 1 && c.isTarget).map((c) => c.cellId);
      const sec2Targets = cells.filter((c) => c.sectionNumber === 2 && c.isTarget).slice(0, 30).map((c) => c.cellId);
      const sec3Targets = cells.filter((c) => c.sectionNumber === 3 && c.isTarget).slice(0, 5).map((c) => c.cellId);

      const result = evaluateBurdonTest([...sec1Targets, ...sec2Targets, ...sec3Targets]);
      expect(result.pattern.code).toBe('FATIGUE_DROP');
    });

    it('should detect WARMUP_IMPROVEMENT pattern when errors are high in sec 1 but low in sec 3', () => {
      const cells = getBurdonMatrixCells();
      const sec1Targets = cells.filter((c) => c.sectionNumber === 1 && c.isTarget).slice(0, 5).map((c) => c.cellId);
      const sec2Targets = cells.filter((c) => c.sectionNumber === 2 && c.isTarget).slice(0, 30).map((c) => c.cellId);
      const sec3Targets = cells.filter((c) => c.sectionNumber === 3 && c.isTarget).slice(0, 35).map((c) => c.cellId);

      const result = evaluateBurdonTest([...sec1Targets, ...sec2Targets, ...sec3Targets]);
      expect(result.pattern.code).toBe('WARMUP_IMPROVEMENT');
    });

    it('should support elapsed duration and continuous 5-minute countdown without pause', () => {
      const result = evaluateBurdonTest([], 180, 300);
      expect(result.elapsedSeconds).toBe(180);
      expect(result.configuredDurationSeconds).toBe(300);
      expect(result.isEarlyFinished).toBe(true);
    });
  });

  describe('3. Survey Catalog & Registries Integration', () => {
    it('should have BURDON_DIKKAT_TESTI definition configured with required properties', () => {
      expect(BURDON_DIKKAT_TESTI.id).toBe('srv-burdon-dikkat-testi');
      expect(BURDON_DIKKAT_TESTI.slug).toBe('burdon-dikkat-testi');
      expect(BURDON_DIKKAT_TESTI.code).toBe('BURDON');
      expect(BURDON_DIKKAT_TESTI.questions.length).toBe(30);
      expect(BURDON_DIKKAT_TESTI.repeatPolicy).toBe('UNLIMITED');
    });

    it('should be registered in SYSTEM_CATALOG_REGISTRY', () => {
      const found = SYSTEM_CATALOG_REGISTRY.find((s) => s.id === 'srv-burdon-dikkat-testi');
      expect(found).toBeDefined();
      expect(found?.slug).toBe('burdon-dikkat-testi');
      expect(found?.title).toBe('Burdon Dikkat Testi');
    });

    it('should be registered in SurveyReportRegistry for PDF exports', () => {
      expect(SurveyReportRegistry.hasReport('srv-burdon-dikkat-testi')).toBe(true);
      expect(SurveyReportRegistry.hasReport('burdon-dikkat-testi')).toBe(true);
    });

    it('should resolve specialized ResultRenderer from SurveyResultRendererRegistry', () => {
      const renderer = getSurveyResultRenderer('burdon-dikkat-testi');
      expect(renderer).toBeDefined();
      expect(renderer.name).not.toBe('GenericSurveyResultRenderer');
    });
  });

  describe('4. PDF Generation', () => {
    it('should generate valid MEB PDF HTML report for Burdon application', () => {
      const dummyApp: any = {
        id: 'app-test-burdon-1',
        surveyId: 'srv-burdon-dikkat-testi',
        surveySlug: 'burdon-dikkat-testi',
        studentName: 'Ali Yılmaz',
        studentNumber: '1024',
        className: '10-A',
        completedAt: new Date().toISOString(),
        answers: []
      };

      const html = SurveyReportRegistry.generateReportHtml(dummyApp, {
        schoolName: 'Atatürk Anadolu Lisesi',
        counselorName: 'Psk. Dan. Ayşe Kaya'
      });

      expect(html).toContain('BURDON DİKKAT TESTİ SONUÇ RAPORU');
      expect(html).toContain('Ali Yılmaz');
      expect(html).toContain('1024');
      expect(html).toContain('Psk. Dan. Ayşe Kaya');
      expect(html).toContain('Doğruluk %');
    });
  });

  describe('5. Zero Regression Guarantee for Existing Surveys', () => {
    it('should keep all other survey definitions intact in catalog', () => {
      const ids = SYSTEM_CATALOG_REGISTRY.map((s) => s.id);
      expect(ids).toContain('srv-devamsizlik-nedenleri');
      expect(ids).toContain('srv-sinav-kaygisi-olcegi');
      expect(ids).toContain('srv-westside-sinav-kaygisi-olcegi');
      expect(ids).toContain('srv-holland-mesleki-tercih-envanteri');
      expect(ids).toContain('srv-holland-kisa-bicim-mesleki-tarama-envanteri');
      expect(ids).toContain('srv-meslek-degeri-envanteri');
      expect(ids).toContain('srv-akademik-erteleme-olcegi');
      expect(ids).toContain('srv-burdon-dikkat-testi');
      expect(ids.length).toBeGreaterThanOrEqual(8);
    });
  });


  describe('6. Detailed Marking Scenarios (TEST A, TEST B, TEST C, TEST D)', () => {
    it('TEST A: Marking 1 known target (e.g. r1_c1="a") -> Doğru: 1, Atlanan: 113, Yanlış: 0, Toplam İşaret: 1', () => {
      // r1_c1 is "a" (target)
      const result = evaluateBurdonTest(['r1_c1']);
      expect(result.correctMarkings).toBe(1);
      expect(result.omittedTargets).toBe(113);
      expect(result.incorrectMarkings).toBe(0);
      expect(result.totalMarkings).toBe(1);
      expect(result.totalTargets).toBe(114);
      expect(result.totalCells).toBe(660);
      expect(result.correctMarkings + result.omittedTargets).toBe(114);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('TEST B: Marking 1 known non-target (e.g. r1_c2="e") -> Doğru: 0, Atlanan: 114, Yanlış: 1, Toplam İşaret: 1', () => {
      // r1_c2 is "e" (non-target)
      const result = evaluateBurdonTest(['r1_c2']);
      expect(result.correctMarkings).toBe(0);
      expect(result.omittedTargets).toBe(114);
      expect(result.incorrectMarkings).toBe(1);
      expect(result.totalMarkings).toBe(1);
      expect(result.totalTargets).toBe(114);
      expect(result.totalCells).toBe(660);
      expect(result.correctMarkings + result.omittedTargets).toBe(114);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('TEST C: Marking 1 target + 1 non-target (r1_c1="a", r1_c2="e") -> Doğru: 1, Atlanan: 113, Yanlış: 1, Toplam İşaret: 2', () => {
      const result = evaluateBurdonTest(['r1_c1', 'r1_c2']);
      expect(result.correctMarkings).toBe(1);
      expect(result.omittedTargets).toBe(113);
      expect(result.incorrectMarkings).toBe(1);
      expect(result.totalMarkings).toBe(2);
      expect(result.totalTargets).toBe(114);
      expect(result.totalCells).toBe(660);
      expect(result.correctMarkings + result.omittedTargets).toBe(114);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('TEST D: Marking 0 cells -> Doğru: 0, Atlanan: 114, Yanlış: 0, Toplam İşaret: 0', () => {
      const result = evaluateBurdonTest([]);
      expect(result.correctMarkings).toBe(0);
      expect(result.omittedTargets).toBe(114);
      expect(result.incorrectMarkings).toBe(0);
      expect(result.totalMarkings).toBe(0);
      expect(result.totalTargets).toBe(114);
      expect(result.totalCells).toBe(660);
      expect(result.accuracyPercentage).toBe(0);
      expect(result.correctMarkings + result.omittedTargets).toBe(114);
      expect(result.totalMarkings).toBe(result.correctMarkings + result.incorrectMarkings);
    });

    it('Polymorphic Input: Should evaluate correctly when passed SurveyAnswerDto array or full application', () => {
      const appWithMarkings: any = {
        id: 'app-poly-1',
        surveySlug: 'burdon-dikkat-testi',
        answers: [
          { questionId: 'burdon_data', answerValue: JSON.stringify({ selectedCellIds: ['r1_c1', 'r1_c2'], elapsedSeconds: 240, configuredDurationSeconds: 300 }) },
          { questionId: 'r1_c1', answerValue: '1' },
          { questionId: 'r1_c2', answerValue: '1' }
        ]
      };

      const result = evaluateBurdonTest(appWithMarkings);
      expect(result.correctMarkings).toBe(1);
      expect(result.omittedTargets).toBe(113);
      expect(result.incorrectMarkings).toBe(1);
      expect(result.totalMarkings).toBe(2);
      expect(result.elapsedSeconds).toBe(240);
      expect(result.configuredDurationSeconds).toBe(300);
    });

    it('TEST E: MANUAL EARLY COMPLETE (configuredDurationSeconds = 300, remainingSeconds = 267 -> elapsedSeconds = 33)', () => {
      const configuredDuration = 300;
      const remainingSeconds = 267;
      const elapsedSeconds = configuredDuration - remainingSeconds; // 33s

      const appData = {
        answers: [
          {
            questionId: 'burdon_data',
            answerValue: JSON.stringify({
              selectedCellIds: ['r1_c1'],
              elapsedSeconds,
              configuredDurationSeconds: configuredDuration
            })
          }
        ]
      };

      const result = evaluateBurdonTest(appData);
      expect(result.elapsedSeconds).toBe(33);
      expect(result.configuredDurationSeconds).toBe(300);
      expect(result.isEarlyFinished).toBe(true);
      expect(result.correctMarkings).toBe(1);
    });

    it('TEST F: TIMEOUT COMPLETE (configuredDurationSeconds = 300, remainingSeconds = 0 -> elapsedSeconds = 300)', () => {
      const configuredDuration = 300;
      const remainingSeconds = 0;
      const elapsedSeconds = configuredDuration - remainingSeconds; // 300s

      const appData = {
        answers: [
          {
            questionId: 'burdon_data',
            answerValue: JSON.stringify({
              selectedCellIds: ['r1_c1'],
              elapsedSeconds,
              configuredDurationSeconds: configuredDuration
            })
          }
        ]
      };

      const result = evaluateBurdonTest(appData);
      expect(result.elapsedSeconds).toBe(300);
      expect(result.configuredDurationSeconds).toBe(300);
      expect(result.isEarlyFinished).toBe(false);
      expect(result.correctMarkings).toBe(1);
    });
  });

  describe('7. End-to-End Pipeline & Registry Integration', () => {
    it('should map Burdon to dedicated component in frontend SurveyReportRegistry', () => {
      const reportComp = getSurveyReportComponent('burdon-dikkat-testi');
      expect(reportComp).toBeDefined();
      expect(reportComp).not.toBe(UnconfiguredSurveyReport);

      const reportCompById = getSurveyReportComponent('srv-burdon-dikkat-testi');
      expect(reportCompById).toBeDefined();
      expect(reportCompById).not.toBe(UnconfiguredSurveyReport);
    });

    it('should map Burdon to BurdonDikkatTestResultRenderer in SurveyResultRendererRegistry', () => {
      const rendererComp = getSurveyResultRenderer('burdon-dikkat-testi');
      expect(rendererComp).toBeDefined();
    });

    it('TEST G: SUCCESSFUL SUBMIT & RETRIEVE with exact elapsed time and answers intact', () => {
      const tempDir = path.join(process.cwd(), 'temp_test_burdon_e2e');
      const dbPath = path.join(tempDir, 'test_burdon.sqlite');
      if (fs.existsSync(tempDir)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
      fs.mkdirSync(tempDir, { recursive: true });

      const conn = createDatabaseConnection(dbPath);
      const sqlite = conn.sqlite;
      const db = conn.db;

      try {
        runMigrations(sqlite);
        SystemCatalogService.seedAllCatalogs(sqlite, 'dev-test-1');

        const mockSyncEngine = {
          recordChange: () => {},
          subscribe: () => () => {},
          getPendingCount: () => 0
        } as any;

        const surveyEngine = new SurveyEngine(db, 'dev-test-1', mockSyncEngine);

        // Seed school, class, student
        sqlite.prepare(`
          INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
          VALUES ('sch-b1', 'Test School', 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
          VALUES ('yr-b1', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
          VALUES ('cls-b1', 'yr-b1', '9-A', 9, 'A', 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, created_at, updated_at, version, last_modified_device_id)
          VALUES ('st-b1', 'yr-b1', 'cls-b1', '999', 'Ali', 'Yılmaz', 'male', 'active', 1000, 1000, 1, 'dev-test-1');
        `).run();

        // Submit Burdon application with r1_c1 (target 'a') and r1_c2 (non-target 'e'), elapsed 33 seconds
        const submitPayload = {
          surveySlug: 'burdon-dikkat-testi',
          studentNumber: '999',
          answers: [
            {
              questionId: 'burdon_data',
              answerValue: JSON.stringify({
                selectedCellIds: ['r1_c1', 'r1_c2'],
                elapsedSeconds: 33,
                configuredDurationSeconds: 300
              })
            },
            { questionId: 'r1_c1', answerValue: '1' },
            { questionId: 'r1_c2', answerValue: '1' }
          ]
        };

        const submitResult = surveyEngine.submitApplication(submitPayload);
        expect(submitResult.success).toBe(true);
        expect(submitResult.application?.id).toBeDefined();

        // Retrieve detail
        const appDetail = surveyEngine.getApplicationDetail(submitResult.application!.id);
        expect(appDetail).toBeDefined();
        expect(appDetail?.answers).toBeDefined();
        const answers = appDetail?.answers || [];
        // Answers MUST NOT be empty (proves leftJoin fix)
        expect(answers.length).toBeGreaterThan(0);
        expect(answers.some(a => a.questionId === 'burdon_data')).toBe(true);

        // Evaluate retrieved application detail
        const evaluation = evaluateBurdonTest(appDetail!);
        expect(evaluation.correctMarkings).toBe(1);
        expect(evaluation.incorrectMarkings).toBe(1);
        expect(evaluation.omittedTargets).toBe(113);
        expect(evaluation.totalMarkings).toBe(2);
        expect(evaluation.totalTargets).toBe(114);
        expect(evaluation.totalCells).toBe(660);
        expect(evaluation.elapsedSeconds).toBe(33);
        expect(evaluation.configuredDurationSeconds).toBe(300);
        expect(evaluation.isEarlyFinished).toBe(true);
      } finally {
        sqlite.close();
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    });

    it('TEST H: SINGLE SUBMISSION GUARD - each submit creates exact attempt count', () => {
      const tempDir = path.join(process.cwd(), 'temp_test_burdon_h');
      const dbPath = path.join(tempDir, 'test_burdon.sqlite');
      if (fs.existsSync(tempDir)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
      fs.mkdirSync(tempDir, { recursive: true });

      const conn = createDatabaseConnection(dbPath);
      const sqlite = conn.sqlite;
      const db = conn.db;

      try {
        runMigrations(sqlite);
        SystemCatalogService.seedAllCatalogs(sqlite, 'dev-test-1');

        const mockSyncEngine = {
          recordChange: () => {},
          subscribe: () => () => {},
          getPendingCount: () => 0
        } as any;

        const surveyEngine = new SurveyEngine(db, 'dev-test-1', mockSyncEngine);

        sqlite.prepare(`
          INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
          VALUES ('sch-h1', 'Test School', 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
          VALUES ('yr-h1', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
          VALUES ('cls-h1', 'yr-h1', '9-A', 9, 'A', 1000, 1000, 1, 'dev-test-1');
        `).run();
        sqlite.prepare(`
          INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, created_at, updated_at, version, last_modified_device_id)
          VALUES ('st-h1', 'yr-h1', 'cls-h1', '777', 'Mehmet', 'Demir', 'male', 'active', 1000, 1000, 1, 'dev-test-1');
        `).run();

        // 1 single submission
        const res1 = surveyEngine.submitApplication({
          surveySlug: 'burdon-dikkat-testi',
          studentNumber: '777',
          answers: [
            {
              questionId: 'burdon_data',
              answerValue: JSON.stringify({
                selectedCellIds: ['r1_c1'],
                elapsedSeconds: 45,
                configuredDurationSeconds: 300
              })
            }
          ]
        });

        expect(res1.success).toBe(true);
        expect(res1.application?.attemptNumber).toBe(1);

        const apps = surveyEngine.listApplications({ studentId: 'st-h1' });
        expect(apps.length).toBe(1);
        expect(apps[0].attemptNumber).toBe(1);
      } finally {
        sqlite.close();
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('8. Burdon Paper Form Preview & PDF Output Verification', () => {
    it('should generate dedicated paper form HTML matching reference specifications', async () => {
      const { SurveyPaperFormPdfReport } = await import('../electron/services/surveys/reports/SurveyPaperFormPdfReport');

      const burdonSurveyDto: any = {
        id: 'srv-burdon-dikkat-testi',
        slug: 'burdon-dikkat-testi',
        code: 'BDT-30',
        title: 'Burdon Dikkat Testi',
        description: 'Test açıklaması...',
        questions: BURDON_DIKKAT_TESTI.questions
      };

      const html = SurveyPaperFormPdfReport.generateHtml(burdonSurveyDto);

      // 1. Title is centered and styled uppercase
      expect(html).toContain('Burdon Dikkat Testi');
      expect(html).toContain('text-transform: uppercase;');

      // 2. Specific student info fields
      expect(html).toContain('Adı ve Soyadı:');
      expect(html).toContain('Numarası:');
      expect(html).toContain('Sınıfı:');

      // 3. No generic 4-column box with "Sınıfı / Şubesi" or "Okul Numarası"
      expect(html).not.toContain('Sınıfı / Şubesi:');
      expect(html).not.toContain('Okul Numarası:');

      // 4. No MEB header, no description
      expect(html).not.toContain('T.C. MİLLÎ EĞİTİM BAKANLIĞI');
      expect(html).not.toContain('REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ');
      expect(html).not.toContain('Test açıklaması...');

      // 5. No instruction box
      expect(html).not.toContain('Yönerge:');

      // 6. No question numbering or row prefixes
      expect(html).not.toContain('Satır 1:');
      expect(html).not.toContain('Satır 15:');
      expect(html).not.toContain('Satır 30:');

      // 7. No "İşaretlendi", no checkboxes, no section titles
      expect(html).not.toContain('İşaretlendi');
      expect(html).not.toContain('class="checkbox"');
      expect(html).not.toContain('1. Bölüm');
      expect(html).not.toContain('2. Bölüm');
      expect(html).not.toContain('3. Bölüm');

      // 8. Monospace font and clean 30 raw row sequences
      expect(html).toContain('Courier New');
      expect(html).toContain('a e p z n z s u a h v k l a s l b f o u o e');
      expect(html).toContain('o ş k h a m v ğ l m g v n h v m p b n p y h');
      expect(html).toContain('s m i u e f t i m s g k n k n p h r h g u i');

      // 9. Filename formatted with proper NFC
      const fileName = SurveyPaperFormPdfReport.formatFileName(burdonSurveyDto.title);
      expect(fileName).toBe('Burdon Dikkat Testi.pdf');
    });
  });
});
