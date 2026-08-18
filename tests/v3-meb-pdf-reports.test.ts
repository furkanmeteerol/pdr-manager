import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../electron/services/database/migrations';
import { MebPdfReportService } from '../electron/services/reports/MebPdfReportService';
import { SpecialEducationService } from '../electron/services/special_education/SpecialEducationService';

describe('Phase V3: MEB PDF & Official Printable Reports Service', () => {
  let db: Database.Database;
  let reportService: MebPdfReportService;
  let spedService: SpecialEducationService;
  let studentId = 'student-report-test-1';

  beforeEach(async () => {
    db = new Database(':memory:');
    runMigrations(db);
    reportService = new MebPdfReportService(db);
    const mockSyncEngine = { recordChange: vi.fn(), queueChange: vi.fn() } as any;
    spedService = new SpecialEducationService(db, 'dev-test-1', mockSyncEngine);

    db.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, version, last_modified_device_id, created_at, updated_at)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1, 'dev-1', 1000, 1000)
    `).run();

    db.prepare(`
      INSERT INTO students (id, school_year_id, first_name, last_name, student_number, gender, birth_date, version, last_modified_device_id, created_at, updated_at)
      VALUES (?, 'year-2026', 'Zeynep', 'Şahin', '1042', 'female', '2010-04-12', 1, 'dev-1', 1000, 1000)
    `).run(studentId);

    // Add sample meeting
    db.prepare(`
      INSERT INTO meetings (id, school_year_id, student_id, meeting_type, date, start_time, duration, subject, summary, notes, version, last_modified_device_id, created_at, updated_at)
      VALUES ('meet-1', 'year-2026', ?, 'student', '2026-10-05', '10:00', 30, 'Akademik motivasyon', 'Sınav stratejileri görüşmesi', 'Detay notlar', 1, 'dev-1', 1000, 1000)
    `).run(studentId);

    // Add sample RAM report
    await spedService.createRamReport({
      studentId,
      reportNumber: 'RAM-2026-9921',
      issueDate: '2026-09-10',
      validUntil: '2027-09-10',
      diagnosisCategory: 'Özel Öğrenme Güçlüğü (Disleksi)',
      placementDecision: 'Tam Zamanlı Kaynaştırma',
      supportEducationType: 'Destek Eğitim Odası',
      recommendedWeeklyHours: 4
    });
  });

  afterEach(() => {
    db.close();
  });

  it('should generate valid HTML for Student Guidance Dossier with Turkish characters', async () => {
    const html = reportService.generateStudentGuidanceReportHtml(studentId);

    expect(html).toContain('MİLLÎ EĞİTİM BAKANLIĞI');
    expect(html).toContain('ÖĞRENCİ BİREYSEL GELİŞİM VE REHBERLİK DOSYASI');
    expect(html).toContain('Zeynep');
    expect(html).toContain('Şahin');
    expect(html).toContain('1042');
    expect(html).toContain('RAM-2026-9921');
    expect(html).toContain('Özel Öğrenme Güçlüğü (Disleksi)');
    expect(html).toContain('Akademik motivasyon');
  });

  it('should generate valid BEP Plan Report with all goals and criteria', async () => {
    const plan = await spedService.createBepPlan({
      studentId,
      schoolYearId: 'year-2026',
      title: '2026-2027 Türkçe BEP Planı',
      startDate: '2026-09-15',
      endDate: '2027-06-15',
      generalPerformanceSummary: 'Öğrencinin işitsel hafızası güçlüdür.',
      accommodations: 'Büyük puntolu sınav kağıtları'
    });

    await spedService.addBepGoal({
      bepPlanId: plan.id,
      studentId,
      lessonName: 'Türkçe',
      longTermGoal: 'Metindeki ana fikri tespit eder.',
      shortTermGoal: 'Verilen hikayedeki 3 ana kahramanı ve mekanı listeler.',
      targetDate: '2026-11-30',
      successCriteria: '3/3 Doğru',
      achievementStatus: 'achieved'
    });

    const html = reportService.generateBepPlanReportHtml(plan.id);

    expect(html).toContain('BİREYSELLEŞTİRİLMİŞ EĞİTİM PROGRAMI (BEP) FORMU');
    expect(html).toContain('Türkçe');
    expect(html).toContain('Metindeki ana fikri tespit eder.');
    expect(html).toContain('Kazanıldı');
    expect(html).toContain('Büyük puntolu sınav kağıtları');
  });

  it('should generate valid BIP Behavior Plan Report', async () => {
    const bip = await spedService.createBipPlan({
      studentId,
      schoolYearId: 'year-2026',
      targetBehavior: 'Öfke anında sıraya vurma',
      behaviorFrequencyIntensity: 'Haftada 2-3 kez',
      antecedents: 'Sınavda başarısızlık hissi',
      consequences: 'Ders ortamının bozulması',
      replacementBehavior: 'Nefes egzersizi yapma ve mola isteme',
      interventionStrategies: 'Sakinleşme kartı verilmesi',
      crisisPlan: 'Rehberlik servisinde 10 dk dinlenme'
    });

    const html = reportService.generateBipPlanReportHtml(bip.id);

    expect(html).toContain('BİREYSELLEŞTİRİLMİŞ DAVRANIŞ PLANI (BİP)');
    expect(html).toContain('Öfke anında sıraya vurma');
    expect(html).toContain('Nefes egzersizi yapma');
    expect(html).toContain('Rehberlik servisinde 10 dk dinlenme');
  });

  it('should generate valid RAM Referral Request Form', async () => {
    const ref = await spedService.createReferral({
      studentId,
      schoolYearId: 'year-2026',
      referralReason: 'Yeniden eğitsel inceleme ve tedbir yenileme',
      referralType: 'yeniden_inceleme',
      referralDate: '2026-10-10',
      schoolReportSummary: 'Öğrenci okuma güçlüğü konusunda destek odasıyla ilerleme kaydetmiştir.'
    });

    const html = reportService.generateRamReferralReportHtml(ref.id);

    expect(html).toContain('EĞİTSEL DEĞERLENDİRME İSTEK FORMU (RAM SEVK)');
    expect(html).toContain('Yeniden eğitsel inceleme');
    expect(html).toContain('Rehberlik ve Psikolojik Danışma Servisi');
  });
});
