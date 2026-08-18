import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { StudentService } from '../electron/services/students/StudentService';
import { MeetingService } from '../electron/services/meetings/MeetingService';
import { AnnualPlanService } from '../electron/services/annual/AnnualPlanService';
import { ReportService } from '../electron/services/reports/ReportService';

describe('Phase V2: Annual Guidance Plan & School Analytics & CSV Reports', () => {
  const tempDir = path.join(process.cwd(), 'temp_reports_test_db');
  const dbPath = path.join(tempDir, 'test_reports.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let studentService: StudentService;
  let meetingService: MeetingService;
  let annualPlanService: AnnualPlanService;
  let reportService: ReportService;

  beforeEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-15', 1, 1000, 1000, 1, 'DEVICE-TEST')
    `).run();

    syncEngine = new SyncEngine(conn.db, 'DEVICE-TEST');
    studentService = new StudentService(conn.db, 'DEVICE-TEST', syncEngine);
    meetingService = new MeetingService(conn.db, 'DEVICE-TEST', syncEngine);
    annualPlanService = new AnnualPlanService(conn.db, 'DEVICE-TEST', syncEngine);
    reportService = new ReportService(conn.db, studentService, meetingService);
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should manage MEB format Annual Guidance Plan with items and status transitions', () => {
    // 1. Create Annual Plan
    const plan = annualPlanService.createOrUpdatePlan({
      schoolYearId: 'year-2026',
      title: '2026-2027 Eğitim Öğretim Yılı Rehberlik ve Psikolojik Danışma Programı'
    });

    expect(plan.id).toBeDefined();

    // 2. Add Plan Items
    const item1 = annualPlanService.addItem({
      annualPlanId: plan.id,
      plannedDate: '2026-09-15',
      category: 'Gelişimsel',
      title: '9. Sınıf Uyum ve Oryantasyon Semineri',
      targetAudience: 'student'
    });

    const item2 = annualPlanService.addItem({
      annualPlanId: plan.id,
      plannedDate: '2026-10-10',
      category: 'Önleyici',
      title: 'Veli Bilgilendirme: Ergenlik Dönemi İletişimi',
      targetAudience: 'parent'
    });

    expect(item1.id).toBeDefined();
    expect(item2.id).toBeDefined();

    // 3. Mark completed
    const updatedItem1 = annualPlanService.updateItemStatus(item1.id, 'completed');
    expect(updatedItem1.status).toBe('completed');
    expect(updatedItem1.completedAt).toBeDefined();

    const currentPlan = annualPlanService.getAnnualPlan('year-2026');
    expect(currentPlan?.items).toHaveLength(2);
  });

  it('should calculate guidance school analytics and support CSV export/import', () => {
    // 1. Create a student and a meeting
    const st = studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '1001',
      firstName: 'Kerem',
      lastName: 'Arslan',
      gender: 'male'
    });

    meetingService.createMeeting({
      schoolYearId: 'year-2026',
      studentId: st.id,
      meetingType: 'student',
      date: '2026-09-20',
      startTime: '10:00',
      subject: 'Ders Başarısı',
      summary: 'Görüşme yapıldı'
    });

    // 2. School analytics
    const analytics = reportService.getSchoolAnalytics();
    expect(analytics.totalStudents).toBe(1);
    expect(analytics.genderDistribution.male).toBe(1);
    expect(analytics.totalMeetings).toBe(1);

    // 3. Export CSV
    const exp = reportService.exportStudentsCsv();
    expect(exp.success).toBe(true);
    expect(exp.dataBase64).toBeDefined();

    // 4. Import CSV with new students
    const csvData = 'Öğrenci No;Adı;Soyadı;Sınıf;Cinsiyet;Telefon;E-posta\n2002;Selin;Yıldız;10-A;Kız;05551234567;selin@okul.com\n2003;Deniz;Kaya;10-B;Erkek;05559876543;deniz@okul.com';
    const base64Input = Buffer.from(csvData, 'utf8').toString('base64');

    const imp = reportService.importStudentsCsv(base64Input, 'year-2026');
    expect(imp.success).toBe(true);
    expect(imp.importedCount).toBe(2);

    const allStudents = studentService.listStudents();
    expect(allStudents.length).toBe(3); // 1 existing + 2 imported
  });
});
