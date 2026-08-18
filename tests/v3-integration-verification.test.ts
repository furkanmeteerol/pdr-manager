import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SpecialEducationService } from '../electron/services/special_education/SpecialEducationService';
import { MebPdfReportService } from '../electron/services/reports/MebPdfReportService';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { OfflineSurveyPackageService } from '../electron/services/surveys/OfflineSurveyPackageService';
import { SyncEngine } from '../electron/services/sync/SyncEngine';

describe('Phase V3: Comprehensive End-to-End Integration Verification', () => {
  const tempDir = path.join(process.cwd(), 'temp_v3_e2e_test_db');
  const dbPath = path.join(tempDir, 'test_v3_e2e.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let spedService: SpecialEducationService;
  let mebService: MebPdfReportService;
  let surveyEngine: SurveyEngine;
  let offlineSurveyService: OfflineSurveyPackageService;
  let testStudentId = 'std-v3-e2e-1';

  beforeEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);

    syncEngine = new SyncEngine(conn.db, 'dev-test-1');
    const mockSyncEngine = { recordChange: vi.fn(), queueChange: vi.fn() } as any;
    spedService = new SpecialEducationService(sqlite, 'dev-test-1', mockSyncEngine);
    mebService = new MebPdfReportService(sqlite);
    surveyEngine = new SurveyEngine(conn.db, 'dev-test-1', syncEngine);
    offlineSurveyService = new OfflineSurveyPackageService(sqlite, surveyEngine);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, version, last_modified_device_id, created_at, updated_at)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1, 'dev-1', 1000, 1000)
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, first_name, last_name, student_number, gender, birth_date, version, last_modified_device_id, created_at, updated_at)
      VALUES (?, 'year-2026', 'Emir', 'Kaya', '1099', 'male', '2011-05-18', 1, 'dev-1', 1000, 1000)
    `).run(testStudentId);
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Scenario 1: RAM Raporu ekleme & sorgulama
  it('Scenario 1: Student RAM Report management', async () => {
    const ram = await spedService.createRamReport({
      studentId: testStudentId,
      reportNumber: 'RAM-2026-1144',
      issueDate: '2026-09-01',
      validUntil: '2027-09-01',
      diagnosisCategory: 'Dikkat Eksikliği ve Hiperaktivite (DEHB)',
      placementDecision: 'Tam Zamanlı Kaynaştırma/Bütünleştirme',
      supportEducationType: 'Destek Eğitim Odası',
      recommendedWeeklyHours: 4,
      educationalEvaluation: 'Öğrencinin dikkat süresi kısadır, görsel destekli materyal gereklidir.'
    });

    expect(ram.id).toBeDefined();
    const reports = await spedService.listRamReportsByStudent(testStudentId);
    expect(reports.length).toBe(1);
    expect(reports[0].report_number).toBe('RAM-2026-1144');
  });

  // Scenario 2: BEP Planı ve Kazanım Oluşturma & Güncelleme
  it('Scenario 2: BEP Plan and Goal Tracking lifecycle', async () => {
    const plan = await spedService.createBepPlan({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      title: '2026-2027 Bireyselleştirilmiş Eğitim Planı',
      startDate: '2026-09-15',
      endDate: '2027-06-15',
      generalPerformanceSummary: 'Matematik temel dört işlemde destek gereksinimi var.',
      accommodations: 'Sınavda ek süre ve basitleştirilmiş yönergeler'
    });

    const goal = await spedService.addBepGoal({
      bepPlanId: plan.id,
      studentId: testStudentId,
      lessonName: 'Matematik',
      longTermGoal: 'Dönem sonunda 2 basamaklı sayılarla çarpma işlemi yapar.',
      shortTermGoal: 'Verilen 5 çarpma işleminden 4 tanesini hatasız çözer.',
      targetDate: '2026-12-01',
      successCriteria: '4/5 Doğru',
      achievementStatus: 'not_started'
    });

    expect(goal.achievement_status).toBe('not_started');

    // Update goal status
    const updated = await spedService.updateGoalStatus(goal.id, 'achieved', 'Hedef başarıyla tamamlandı.');
    expect(updated?.achievement_status).toBe('achieved');
  });

  // Scenario 3: BİP Planı Oluşturma
  it('Scenario 3: BİP (Behavior Intervention Plan) creation', async () => {
    const bip = await spedService.createBipPlan({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      targetBehavior: 'Ders esnasında arkadaşlarını rahatsız etme',
      behaviorFrequencyIntensity: 'Günde 3-4 kez',
      antecedents: 'Grup çalışmaları ve serbest etkinlik anları',
      consequences: 'Dikkatin dağılması',
      replacementBehavior: 'Yardım isteme kartını kaldırma',
      interventionStrategies: 'Her olumlu davranışta yıldız kazanma',
      crisisPlan: 'Sınıf içi dinlenme köşesinde 5 dakika sakinleşme'
    });

    expect(bip.id).toBeDefined();
    expect(bip.replacement_behavior).toBe('Yardım isteme kartını kaldırma');
  });

  // Scenario 4: Dönemsel Gelişim Değerlendirmesi Ekleme
  it('Scenario 4: Periodic Development Evaluation recording', async () => {
    const evalRecord = await spedService.createEvaluation({
      studentId: testStudentId,
      periodName: '1_donem_sonu',
      evaluationDate: '2027-01-15',
      academicDevelopment: 'Destek eğitim odası sayesinde Türkçe okuma hızı ve matematikte belirgin ilerleme kaydedildi.',
      socialEmotionalDevelopment: 'Akran ilişkilerinde uyum arttı, öfke kontrolünde gelişme gözlendi.',
      behavioralDevelopment: 'Ders içi kurallara uyum sağlama düzeyi yükseldi.',
      recommendations: 'İkinci dönemde haftalık 4 saatlik destek odası eğitimine devam edilmesi önerilir.',
      evaluatorName: 'Psikolojik Danışman'
    });

    expect(evalRecord.id).toBeDefined();
    const list = await spedService.listEvaluationsByStudent(testStudentId);
    expect(list.length).toBe(1);
    expect(list[0].period_name).toBe('1_donem_sonu');
  });

  // Scenario 5: RAM Yönlendirmesi Oluşturma
  it('Scenario 5: RAM Referral Creation & Tracking', async () => {
    const ref = await spedService.createReferral({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      referralReason: 'Rapor süresi bitimi nedeniyle yeniden eğitsel değerlendirme',
      referralType: 'yeniden_inceleme',
      referralDate: '2026-10-15',
      schoolReportSummary: 'Öğrencinin kaynaştırma tedbiri faydalı olmaktadır, devamı rica olunur.',
      appointmentDate: '2026-11-05',
      resultStatus: 'pending'
    });

    expect(ref.id).toBeDefined();
    expect(ref.result_status).toBe('pending');
  });

  // Scenario 6: 3-Way Merge Conflict Resolution
  it('Scenario 6: 3-Way Merge conflict detection & resolution', () => {
    const base = { id: 'bep-e2e', accommodations: '10 dk ek süre', status: 'active' };
    const local = { id: 'bep-e2e', accommodations: '15 dk ek süre + büyük punto', status: 'active' };
    const remote = { id: 'bep-e2e', accommodations: '20 dk ek süre', status: 'active' };

    const mergeResult = SyncEngine.threeWayMerge(base, local, remote);
    expect(mergeResult.hasConflicts).toBe(true);
    expect(mergeResult.conflicts[0].field).toBe('accommodations');

    // Counselors manual resolution choice
    const resolved = { ...mergeResult.merged, accommodations: local.accommodations };
    expect(resolved.accommodations).toBe('15 dk ek süre + büyük punto');
  });

  // Scenario 7 & 8: Offline Survey Generation, Encryption & Dual-Mode Import
  it('Scenario 7 & 8: Offline Survey generation, AES-256-GCM encryption & Dual-Mode validation', async () => {
    // Setup Survey
    const surv = surveyEngine.createSurvey({
      title: 'Sınav Kaygısı Envanteri',
      targetMode: 'student_linked',
      estimatedMinutes: 10,
      scoringMethod: 'sum',
      questions: [
        {
          questionText: 'Sınavda zamanı yetiştiremeyeceğimden endişelenirim.',
          questionType: 'likert_5',
          required: true,
          options: [{ optionText: '5 - Her Zaman', score: 5 }]
        }
      ]
    });
    const q1 = surv.questions![0];

    // 1. Generate HTML package
    const html = offlineSurveyService.generateOfflineHtmlPackage(surv.id);
    expect(html).toContain('Sınav Kaygısı Envanteri');

    // 2. Simulate offline completion & AES-256-GCM encryption
    const payload = {
      surveyId: surv.id,
      targetMode: 'student_linked',
      respondentName: 'Emir Kaya',
      respondentStudentNumber: '1099',
      answers: [
        { questionId: q1.id, textValue: '5 - Her Zaman', numberValue: 5 }
      ],
      submittedAt: Date.now()
    };
    const encryptedResult = OfflineSurveyPackageService.encryptPayload(payload);

    // 3. Import and verify STUDENT_LINKED matching
    const importRes = offlineSurveyService.importOfflineSurveyResult(encryptedResult);
    expect(importRes.success).toBe(true);
    expect(importRes.studentMatched).toBe(true);
    expect(importRes.studentName).toBe('Emir Kaya');

    // 4. Verify Anonymous Aggregated mode
    const anonSurv = surveyEngine.createSurvey({
      title: 'Veli Memnuniyet Anketi',
      targetMode: 'anonymous_aggregated',
      estimatedMinutes: 5,
      scoringMethod: 'none',
      questions: [
        {
          questionText: 'Okul ortamından memnunum.',
          questionType: 'likert_5',
          options: [{ optionText: '5 - Evet', score: 5 }]
        }
      ]
    });
    const anonQ = anonSurv.questions![0];

    const anonPayload = {
      surveyId: anonSurv.id,
      targetMode: 'anonymous_aggregated',
      answers: [
        { questionId: anonQ.id, textValue: '5 - Evet', numberValue: 5 }
      ],
      submittedAt: Date.now()
    };
    const anonEncrypted = OfflineSurveyPackageService.encryptPayload(anonPayload);
    const anonImportRes = offlineSurveyService.importOfflineSurveyResult(anonEncrypted);
    expect(anonImportRes.success).toBe(true);
    expect(anonImportRes.studentMatched).toBe(false);
  });

  // Scenario 9: MEB Printable HTML/PDF Reports
  it('Scenario 9: MEB Guidance Dossier & BEP Report generation', () => {
    const studentHtml = mebService.generateStudentGuidanceReportHtml(testStudentId);
    expect(studentHtml).toContain('Emir');
    expect(studentHtml).toContain('Kaya');
    expect(studentHtml).toContain('1099');
    expect(studentHtml).toContain('MİLLÎ EĞİTİM BAKANLIĞI');
  });
});
