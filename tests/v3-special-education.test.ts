import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../electron/services/database/migrations';
import { SpecialEducationService } from '../electron/services/special_education/SpecialEducationService';

describe('Phase V3: Special Education, BEP/BIP & RAM Service', () => {
  let db: Database.Database;
  let service: SpecialEducationService;
  let mockSyncEngine: any;
  let testStudentId = 'student-test-101';

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrations(db);
    mockSyncEngine = {
      recordChange: vi.fn(),
      queueChange: vi.fn()
    };
    service = new SpecialEducationService(db, 'dev-test-1', mockSyncEngine);

    // Insert mock school year and test student
    db.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, version, last_modified_device_id, created_at, updated_at)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1, 'dev-1', 1000, 1000)
    `).run();

    db.prepare(`
      INSERT INTO students (id, school_year_id, first_name, last_name, student_number, gender, version, last_modified_device_id, created_at, updated_at)
      VALUES (?, 'year-2026', 'Kerem', 'Demir', '1055', 'male', 1, 'dev-1', 1000, 1000)
    `).run(testStudentId);
  });

  afterEach(() => {
    db.close();
  });

  it('should create, read, update and list RAM reports with sync_changes tracking', async () => {
    const created = await service.createRamReport({
      studentId: testStudentId,
      reportNumber: 'RAM-2026-7890',
      issueDate: '2026-09-15',
      validUntil: '2027-09-15',
      diagnosisCategory: 'Özel Öğrenme Güçlüğü (Disleksi)',
      placementDecision: 'Tam Zamanlı Kaynaştırma/Bütünleştirme',
      supportEducationType: 'Destek Eğitim Odası',
      recommendedWeeklyHours: 6,
      educationalEvaluation: 'Okuma ve yazılı ifade alanlarında bireysel destek ihtiyacı bulunmaktadır.'
    });

    expect(created.id).toBeDefined();
    expect(created.report_number).toBe('RAM-2026-7890');
    expect(created.recommended_weekly_hours).toBe(6);

    // Check list by student
    const list = await service.listRamReportsByStudent(testStudentId);
    expect(list.length).toBe(1);
    expect(list[0].diagnosis_category).toBe('Özel Öğrenme Güçlüğü (Disleksi)');

    // Check mockSyncEngine was called
    expect(mockSyncEngine.recordChange).toHaveBeenCalledWith(
      'ram_reports',
      created.id,
      'create',
      0,
      1,
      null,
      expect.any(String)
    );

    // Update RAM report
    const updated = await service.updateRamReport(created.id, {
      recommendedWeeklyHours: 8,
      notes: 'Haftalık ders saati 8 saate yükseltildi.'
    });
    expect(updated?.recommended_weekly_hours).toBe(8);
    expect(updated?.notes).toContain('8 saat');
  });

  it('should create BEP plan and manage BEP goals lifecycle', async () => {
    const bepPlan = await service.createBepPlan({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      title: '2026-2027 Türkçe ve Matematik BEP Planı',
      startDate: '2026-09-20',
      endDate: '2027-06-15',
      generalPerformanceSummary: 'Okuma hızı sınıf seviyesinin altındadır. Dört işlem matematik becerisi destek gerektirmektedir.',
      accommodations: 'Sınavlarda 15 dk ek süre, okuyucu-kodlayıcı desteği'
    });

    expect(bepPlan.id).toBeDefined();

    // Add Goal 1
    const goal1 = await service.addBepGoal({
      bepPlanId: bepPlan.id,
      studentId: testStudentId,
      lessonName: 'Türkçe',
      longTermGoal: 'Dönem sonunda 4. sınıf düzeyindeki metinleri akıcı okur.',
      shortTermGoal: 'Verilen 100 kelimelik metni 2 dakikada en fazla 3 hata ile okur.',
      targetDate: '2026-12-15',
      successCriteria: '%80 Doğruluk',
      responsiblePerson: 'Ders Öğretmeni',
      achievementStatus: 'not_started'
    });

    // Add Goal 2
    await service.addBepGoal({
      bepPlanId: bepPlan.id,
      studentId: testStudentId,
      lessonName: 'Matematik',
      longTermGoal: 'İki basamaklı sayılarla eldeli toplama ve onluk bozarak çıkarma işlemlerini yapar.',
      shortTermGoal: 'Verilen 10 eldeli toplama işleminden en az 8 tanesini doğru çözer.',
      targetDate: '2027-01-20',
      successCriteria: '8/10 Doğru',
      responsiblePerson: 'Matematik Öğretmeni',
      achievementStatus: 'in_progress'
    });

    // Retrieve plan with goals
    const fullPlan = await service.getBepPlanById(bepPlan.id);
    expect(fullPlan?.goals?.length).toBe(2);

    // Update goal 1 status to achieved
    const updatedGoal = await service.updateGoalStatus(goal1.id, 'achieved', 'Öğrenci hedeflenen sürede metni başarıyla okudu.');
    expect(updatedGoal?.achievement_status).toBe('achieved');
    expect(updatedGoal?.notes).toContain('başarıyla okudu');
  });

  it('should create and update BİP (Behavior Intervention Plan)', async () => {
    const bip = await service.createBipPlan({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      targetBehavior: 'Ders sırasında izinsiz yerinden kalkma ve dolaşma',
      behaviorFrequencyIntensity: 'Ders başına ortalama 4-5 kez',
      antecedents: 'Uzun süreli dinleme etkinlikleri ve sessiz çalışma anları',
      consequences: 'Dikkatin dağılması ve diğer öğrencilerin dikkatini çekme',
      replacementBehavior: 'Konuşmak veya kalkmak istediğinde izin kartını masasına koyma',
      interventionStrategies: 'Her 10 dakikalık yerinde oturma davranışı için pekiştireç ve mola hakkı',
      crisisPlan: 'Sınıftan dışarı çıkmak istediğinde rehberlik servisine yönlendirilmesi'
    });

    expect(bip.id).toBeDefined();
    expect(bip.replacement_behavior).toContain('izin kartı');

    const retrieved = await service.getBipPlanById(bip.id);
    expect(retrieved?.target_behavior).toBe('Ders sırasında izinsiz yerinden kalkma ve dolaşma');
  });

  it('should create and track RAM referrals', async () => {
    const referral = await service.createReferral({
      studentId: testStudentId,
      schoolYearId: 'year-2026',
      referralReason: 'Yıllık RAM rapor yenileme ve eğitsel değerlendirme',
      referralType: 'yeniden_inceleme',
      referralDate: '2026-10-01',
      schoolReportSummary: 'Öğrenci destek eğitim odasından yararlanmış olup belirgin gelişim göstermiştir. Tedbirin devamı uygundur.',
      appointmentDate: '2026-10-25',
      resultStatus: 'pending'
    });

    expect(referral.id).toBeDefined();
    expect(referral.result_status).toBe('pending');

    // Update referral status to evaluated with new report
    const updated = await service.updateReferralStatus(referral.id, 'report_issued', 'Yeni RAM raporu 1 yıl süreli olarak onaylandı.');
    expect(updated?.result_status).toBe('report_issued');
    expect(updated?.result_notes).toContain('1 yıl süreli');
  });
});
