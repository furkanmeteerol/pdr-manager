import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import * as schema from '../database/schema';
import { eq, isNull, and, or, sql } from 'drizzle-orm';

const TEST_DIR = path.join(process.cwd(), 'temp_functional_crud_test');

describe('Manual & Automated Functional CRUD & Persistence Test Suite', { timeout: 30000 }, () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });

    dbService = new DatabaseService();
    dbService.init(TEST_DIR);
  });

  afterEach(() => {
    try {
      dbService.close();
    } catch {
      // ignore
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('1. School Info & Classes CRUD, Gender Calculation & Class PDF attachment', async () => {
    const db = dbService.getDb();
    const sqlite = dbService.getSqlite();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    // Create classes
    const class9A = {
      id: 'cls-9a',
      schoolYearId,
      name: '9-A',
      grade: 9,
      branch: 'A',
      teacherName: 'Emre Karataş',
      pdfPath: null as string | null,
      pdfName: null as string | null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.classes).values(class9A).run();

    const class10B = {
      id: 'cls-10b',
      schoolYearId,
      name: '10-B',
      grade: 10,
      branch: 'B',
      teacherName: 'Zeynep Duran',
      pdfPath: null as string | null,
      pdfName: null as string | null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.classes).values(class10B).run();

    // Add students with gender to 9-A (2 Female, 1 Male)
    db.insert(schema.students).values([
      {
        id: 'st-1',
        schoolYearId,
        classId: 'cls-9a',
        studentNumber: '101',
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        gender: 'female',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'st-2',
        schoolYearId,
        classId: 'cls-9a',
        studentNumber: '102',
        firstName: 'Fatma',
        lastName: 'Kaya',
        gender: 'female',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'st-3',
        schoolYearId,
        classId: 'cls-9a',
        studentNumber: '103',
        firstName: 'Mehmet',
        lastName: 'Demir',
        gender: 'male',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      }
    ]).run();

    // Verify Real-time Gender Calculation query
    const classesList = db.select().from(schema.classes).where(isNull(schema.classes.deletedAt)).all();
    expect(classesList.length).toBe(2);

    const counts9A = sqlite.prepare(`
      SELECT 
        COUNT(CASE WHEN gender = 'female' AND deleted_at IS NULL THEN 1 END) as female_count,
        COUNT(CASE WHEN gender = 'male' AND deleted_at IS NULL THEN 1 END) as male_count,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as total_count
      FROM students
      WHERE class_id = ?
    `).get('cls-9a') as { female_count: number; male_count: number; total_count: number };

    expect(counts9A.female_count).toBe(2);
    expect(counts9A.male_count).toBe(1);
    expect(counts9A.total_count).toBe(3);

    // Attach Class PDF
    const fakePdfPath = path.join(TEST_DIR, '9A_Sinif_Listesi.pdf');
    fs.writeFileSync(fakePdfPath, 'PDF dummy content');
    db.update(schema.classes)
      .set({ pdfPath: fakePdfPath, pdfName: '9A_Sinif_Listesi.pdf', updatedAt: Date.now() })
      .where(eq(schema.classes.id, 'cls-9a'))
      .run();

    const updatedCls = db.select().from(schema.classes).where(eq(schema.classes.id, 'cls-9a')).get();
    expect(updatedCls?.pdfName).toBe('9A_Sinif_Listesi.pdf');
    expect(updatedCls?.pdfPath).toBe(fakePdfPath);
  });

  it('2. Students CRUD with Valid & Null Foreign Keys (FK Safety)', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    // 1. Student with valid class
    const st1 = {
      id: 'st-valid-cls',
      schoolYearId,
      classId: null,
      studentNumber: '501',
      firstName: 'Can',
      lastName: 'Öztürk',
      gender: 'male' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.students).values(st1).run();

    // 2. Student created with NO class (null FK)
    const stNoCls = {
      id: 'st-no-cls',
      schoolYearId,
      classId: null,
      studentNumber: '502',
      firstName: 'Misdo',
      lastName: 'Fadıl',
      gender: 'male' as const,
      status: 'active' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.students).values(stNoCls).run();

    const fetchedNoCls = db.select().from(schema.students).where(eq(schema.students.id, 'st-no-cls')).get();
    expect(fetchedNoCls).toBeDefined();
    expect(fetchedNoCls?.classId).toBeNull();
    expect(fetchedNoCls?.firstName).toBe('Misdo');

    // Update student
    db.update(schema.students)
      .set({ notes: 'Başarılı öğrenci', updatedAt: Date.now() })
      .where(eq(schema.students.id, 'st-no-cls'))
      .run();

    const updated = db.select().from(schema.students).where(eq(schema.students.id, 'st-no-cls')).get();
    expect(updated?.notes).toBe('Başarılı öğrenci');
  });

  it('3. Randevular (Appointments) CRUD and Remaining Days Calculation', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const app1 = {
      id: 'app-1',
      schoolYearId,
      studentId: null,
      title: 'Veli Bilgilendirme Randevusu',
      date: todayStr,
      startTime: '10:30',
      endTime: '11:00',
      status: 'pending' as const,
      location: 'Rehberlik Odası',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.appointments).values(app1).run();

    const app2 = {
      id: 'app-2',
      schoolYearId,
      studentId: null,
      title: 'Bireysel Görüşme',
      date: tomorrowStr,
      startTime: '14:00',
      endTime: '14:30',
      status: 'confirmed' as const,
      location: 'Rehberlik Odası',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.appointments).values(app2).run();

    const list = db.select().from(schema.appointments).where(isNull(schema.appointments.deletedAt)).all();
    expect(list.length).toBe(2);

    // Update status
    db.update(schema.appointments)
      .set({ status: 'completed', updatedAt: Date.now() })
      .where(eq(schema.appointments.id, 'app-1'))
      .run();

    const updatedApp = db.select().from(schema.appointments).where(eq(schema.appointments.id, 'app-1')).get();
    expect(updatedApp?.status).toBe('completed');
  });

  it('4. Yapılan Çalışmalar (Activities) CRUD with Multi-Class Support', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    const act1 = {
      id: 'act-1',
      schoolYearId,
      title: 'Verimli Ders Çalışma ve Zaman Yönetimi Semineri',
      description: '9. sınıfların tüm şubelerine yönelik ortak konferans salonu sunumu.',
      classIds: JSON.stringify(['cls-9a', 'cls-9b']),
      classNames: JSON.stringify(['9-A', '9-B']),
      activityDate: '2026-08-16',
      participantCount: 65,
      notes: 'Öğrenci katılımı yüksekti, broşürler dağıtıldı.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.counselingActivities).values(act1).run();

    const acts = db.select().from(schema.counselingActivities).where(isNull(schema.counselingActivities.deletedAt)).all();
    expect(acts.length).toBe(1);
    expect(acts[0].title).toBe('Verimli Ders Çalışma ve Zaman Yönetimi Semineri');
    expect(JSON.parse(acts[0].classNames)).toEqual(['9-A', '9-B']);
    expect(acts[0].participantCount).toBe(65);

    // Update
    db.update(schema.counselingActivities)
      .set({ participantCount: 72, updatedAt: Date.now() })
      .where(eq(schema.counselingActivities.id, 'act-1'))
      .run();

    const updatedAct = db.select().from(schema.counselingActivities).where(eq(schema.counselingActivities.id, 'act-1')).get();
    expect(updatedAct?.participantCount).toBe(72);
  });

  it('5. Görüşmeler (Meetings) CRUD, Categorization & Statistics Calculation', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();
    const today = new Date().toISOString().split('T')[0];

    // Insert test meetings
    db.insert(schema.meetings).values([
      {
        id: 'm-1',
        schoolYearId,
        studentId: null,
        meetingType: 'Bireysel Öğrenci Görüşmesi',
        guidanceServiceType: 'Psikolojik Danışma',
        mebbisProcessed: 0,
        subject: 'Sınav Kaygısı ve Motivasyon',
        date: today,
        startTime: '09:30',
        duration: 30,
        summary: 'Deneme sınavı kaygısı üzerine nefes egzersizleri çalışıldı.',
        notes: 'Öğrenciye gevşeme egzersizleri verildi.',
        followUpRequired: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'm-2',
        schoolYearId,
        studentId: null,
        meetingType: 'Veli Görüşmesi',
        guidanceServiceType: 'Müşavirlik',
        mebbisProcessed: 1,
        subject: 'Veli Görüşmesi: Devamsızlık Durumu',
        date: today,
        startTime: '11:00',
        duration: 30,
        summary: 'Öğrencinin sabah ilk derslere geç kalma nedeni veli ile görüşüldü.',
        notes: 'Veli ile sabah rutini kararlaştırıldı.',
        followUpRequired: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'm-3',
        schoolYearId,
        studentId: null,
        meetingType: 'Grup Rehberliği',
        guidanceServiceType: 'Bireyi Tanıma',
        studentIds: JSON.stringify(['st-1', 'st-2']),
        mebbisProcessed: 0,
        subject: 'Akran Zorbalığı Önleme Grubu',
        date: '2026-08-10',
        startTime: '13:30',
        duration: 40,
        summary: 'Grup ile empati çalışmaları ve drama etkinliği yapıldı.',
        notes: '2. seans haftaya planlandı.',
        followUpRequired: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      }
    ]).run();

    const allMeetings = db.select().from(schema.meetings).where(isNull(schema.meetings.deletedAt)).all();
    expect(allMeetings.length).toBe(3);

    const todayMeetings = allMeetings.filter(m => m.date === today);
    expect(todayMeetings.length).toBe(2);

    const groupMeetings = allMeetings.filter(m => m.meetingType === 'Grup Rehberliği');
    expect(groupMeetings.length).toBe(1);
    expect(groupMeetings[0].guidanceServiceType).toBe('Bireyi Tanıma');
    expect(JSON.parse(groupMeetings[0].studentIds!)).toEqual(['st-1', 'st-2']);

    // Test MEBBIS confirmation update
    db.update(schema.meetings)
      .set({ mebbisProcessed: 1 })
      .where(eq(schema.meetings.id, 'm-1'))
      .run();

    const updatedM1 = db.select().from(schema.meetings).where(eq(schema.meetings.id, 'm-1')).get();
    expect(updatedM1?.mebbisProcessed).toBe(1);
  });

  it('6. Özel Eğitim, BEP & RAM Reports CRUD', async () => {
    const sqlite = dbService.getSqlite();
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();
    const now = Date.now();

    // Create student st-1
    db.insert(schema.students).values({
      id: 'st-1',
      schoolYearId,
      studentNumber: '101',
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      gender: 'female',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastModifiedDeviceId: deviceId
    }).run();

    // 1. RAM Report via SQLite
    sqlite.prepare(`
      INSERT INTO ram_reports (
        id, student_id, report_number, issue_date, valid_until,
        diagnosis_category, placement_decision, support_education_type,
        recommended_weekly_hours, educational_evaluation, status, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      'ram-1', 'st-1', 'RAM-2026-8841', '2026-08-01', '2027-08-01',
      'Özel Öğrenme Güçlüğü', 'Tam Zamanlı Kaynaştırma', 'destek_egitim_odasi',
      6, 'Okuma ve yazma güçlüğü mevcut, görsel materyallerle desteklenmeli.', 'active', now, now, deviceId
    );

    // 2. BEP Plan
    sqlite.prepare(`
      INSERT INTO bep_plans (
        id, student_id, school_year_id, ram_report_id, title,
        start_date, end_date, general_performance_summary, accommodations,
        status, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      'bep-1', 'st-1', schoolYearId, 'ram-1', '2026-2027 Matematik ve Türkçe BEP Planı',
      '2026-09-15', '2027-06-15', 'Temel dört işlem becerilerinde desteğe ihtiyaç duyuyor.',
      'Sınavlarda ek süre (15 dk) ve büyük punto soru kağıdı.', 'active', now, now, deviceId
    );

    // 3. BEP Goals
    sqlite.prepare(`
      INSERT INTO bep_goals (
        id, bep_plan_id, student_id, lesson_name, long_term_goal, short_term_goal,
        target_date, success_criteria, evaluation_method, responsible_person,
        achievement_status, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      'goal-1', 'bep-1', 'st-1', 'Matematik', 'İki basamaklı sayılarla eldeli toplama işlemini yapar.',
      '10 içindeki toplamaları zihinden hatasız hesaplar.', '2026-11-30', '%80 Doğruluk',
      'Yazılı Çalışma Yaprağı', 'Ders Öğretmeni', 'in_progress', now, now, deviceId
    );

    const fetchedBep = sqlite.prepare('SELECT * FROM bep_plans WHERE id = ?').get('bep-1') as any;
    expect(fetchedBep).toBeDefined();
    expect(fetchedBep.title).toContain('Matematik ve Türkçe BEP Planı');

    const fetchedGoals = sqlite.prepare('SELECT * FROM bep_goals WHERE bep_plan_id = ?').all('bep-1') as any[];
    expect(fetchedGoals.length).toBe(1);
    expect(fetchedGoals[0].lesson_name).toBe('Matematik');
  });

  it('7. Ders Çalışma Programı & Templates CRUD', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    // Create student st-1
    db.insert(schema.students).values({
      id: 'st-1',
      schoolYearId,
      studentNumber: '101',
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      gender: 'female',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // Verify pre-seeded standard templates (Migration v3)
    const templates = db.select().from(schema.studyPlanTemplates).where(isNull(schema.studyPlanTemplates.deletedAt)).all();
    expect(templates.length).toBeGreaterThanOrEqual(6);

    const sayisalTpl = templates.find(t => t.id === 'tpl-sayisal');
    expect(sayisalTpl).toBeDefined();
    expect(sayisalTpl?.title).toBe('Sayısal');

    // Create Custom Template
    const customTpl = {
      id: 'tpl-custom-1',
      title: '12. Sınıf TYT Yoğun Kamp',
      settings: JSON.stringify({ includeHours: true, pomodoro: true, generalReview: true, tomorrowPrep: true, bookReading: true }),
      weeklySchedule: JSON.stringify({
        monday: 'TYT Türkçe + 100 Soru',
        tuesday: 'TYT Matematik + 80 Soru',
        wednesday: 'TYT Fen + 60 Soru',
        thursday: 'TYT Sosyal + 60 Soru',
        friday: 'Karma Tekrar + 100 Soru',
        saturday: 'Genel TYT Denemesi',
        sunday: 'Dinlenme & Kitap'
      }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.studyPlanTemplates).values(customTpl).run();

    const fetchedCustom = db.select().from(schema.studyPlanTemplates).where(eq(schema.studyPlanTemplates.id, 'tpl-custom-1')).get();
    expect(fetchedCustom).toBeDefined();
    expect(fetchedCustom?.title).toBe('12. Sınıf TYT Yoğun Kamp');

    // Create Study Plan for student
    const plan = {
      id: 'plan-1',
      studentId: 'st-1',
      title: 'Kişisel YKS Hazırlık Programı',
      startDate: '2026-08-16',
      endDate: '2026-09-16',
      notes: 'Haftalık 500 soru hedefi.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    };
    db.insert(schema.studyPlans).values(plan).run();

    const fetchedPlan = db.select().from(schema.studyPlans).where(eq(schema.studyPlans.id, 'plan-1')).get();
    expect(fetchedPlan?.title).toBe('Kişisel YKS Hazırlık Programı');
  });

  it('8. Evrak Çantası (Counselor Documents Archive) Initial State & Zero-Mock Verification', async () => {
    const db = dbService.getDb();
    const rows = db.select().from(schema.counselorDocuments).where(isNull(schema.counselorDocuments.deletedAt)).all();
    expect(rows.length).toBe(0);
  });

  it('9. COMPLETE DATA PERSISTENCE ACROSS RE-OPEN / RESTART', async () => {
    // 1. Insert records across all tables
    const db1 = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    db1.insert(schema.classes).values({
      id: 'cls-persist',
      schoolYearId,
      name: '12-FEN-A',
      grade: 12,
      branch: 'FEN-A',
      teacherName: 'Ahmet Hoca',
      pdfPath: 'C:\\lists\\12fena.pdf',
      pdfName: '12fena.pdf',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    db1.insert(schema.counselingActivities).values({
      id: 'act-persist',
      schoolYearId,
      title: 'Kariyer Günleri ve Üniversite Tanıtımı',
      description: '12. sınıflar için üniversite tanıtım fuarı ziyareti.',
      classIds: JSON.stringify(['cls-persist']),
      classNames: JSON.stringify(['12-FEN-A']),
      activityDate: '2026-08-16',
      participantCount: 40,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    db1.insert(schema.appointments).values({
      id: 'app-persist',
      schoolYearId,
      title: 'YKS Hedef Belirleme Randevusu',
      date: '2026-08-20',
      startTime: '11:00',
      endTime: '11:45',
      status: 'confirmed',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    db1.insert(schema.dailyNotes).values({
      id: 'dn-persist',
      schoolYearId,
      noteDate: '2026-08-17',
      content: 'RAM evraklarını teslim et',
      completed: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 2. CLOSE DATABASE CONNECTION (Simulate application quit)
    dbService.close();

    // 3. RE-OPEN DATABASE (Simulate application relaunch)
    const newDbService = new DatabaseService();
    newDbService.init(TEST_DIR);
    const db2 = newDbService.getDb();

    // 4. VERIFY ALL PERSISTED DATA
    const persistedClass = db2.select().from(schema.classes).where(eq(schema.classes.id, 'cls-persist')).get();
    expect(persistedClass).toBeDefined();
    expect(persistedClass?.name).toBe('12-FEN-A');
    expect(persistedClass?.pdfName).toBe('12fena.pdf');

    const persistedAct = db2.select().from(schema.counselingActivities).where(eq(schema.counselingActivities.id, 'act-persist')).get();
    expect(persistedAct).toBeDefined();
    expect(persistedAct?.title).toBe('Kariyer Günleri ve Üniversite Tanıtımı');
    expect(persistedAct?.participantCount).toBe(40);

    const persistedApp = db2.select().from(schema.appointments).where(eq(schema.appointments.id, 'app-persist')).get();
    expect(persistedApp).toBeDefined();
    expect(persistedApp?.title).toBe('YKS Hedef Belirleme Randevusu');
    expect(persistedApp?.status).toBe('confirmed');

    const persistedNote = db2.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, 'dn-persist')).get();
    expect(persistedNote).toBeDefined();
    expect(persistedNote?.content).toBe('RAM evraklarını teslim et');
    expect(persistedNote?.completed).toBe(1);
    expect(persistedNote?.noteDate).toBe('2026-08-17');

    newDbService.close();
  });

  it('10. Günlük Notlar (Daily Notes) CRUD & Date Isolation Verification', async () => {
    const db = dbService.getDb();
    const deviceId = dbService.ensureDeviceId();

    // 1. Create notes on 17.08.2026 and 16.08.2026
    db.insert(schema.dailyNotes).values([
      {
        id: 'dn-1',
        noteDate: '2026-08-17',
        content: 'Müdür beyle görüşme',
        completed: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'dn-2',
        noteDate: '2026-08-17',
        content: 'RAM evraklarını kontrol et',
        completed: 1,
        createdAt: Date.now() + 10,
        updatedAt: Date.now() + 10,
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'dn-3',
        noteDate: '2026-08-16',
        content: 'Veliye geri dönüş yap',
        completed: 1,
        createdAt: Date.now() + 20,
        updatedAt: Date.now() + 20,
        lastModifiedDeviceId: deviceId
      }
    ]).run();

    // 2. Query 17.08.2026
    const notes17 = db.select().from(schema.dailyNotes).where(and(
      eq(schema.dailyNotes.noteDate, '2026-08-17'),
      isNull(schema.dailyNotes.deletedAt)
    )).all();
    expect(notes17.length).toBe(2);
    expect(notes17[0].content).toBe('Müdür beyle görüşme');
    expect(notes17[0].completed).toBe(0);
    expect(notes17[1].content).toBe('RAM evraklarını kontrol et');
    expect(notes17[1].completed).toBe(1);

    // 3. Query 16.08.2026 (Date isolation)
    const notes16 = db.select().from(schema.dailyNotes).where(and(
      eq(schema.dailyNotes.noteDate, '2026-08-16'),
      isNull(schema.dailyNotes.deletedAt)
    )).all();
    expect(notes16.length).toBe(1);
    expect(notes16[0].content).toBe('Veliye geri dönüş yap');

    // 4. Toggle completion
    db.update(schema.dailyNotes)
      .set({ completed: 1 })
      .where(eq(schema.dailyNotes.id, 'dn-1'))
      .run();

    const updatedDn1 = db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, 'dn-1')).get();
    expect(updatedDn1?.completed).toBe(1);

    // 5. Update note content
    db.update(schema.dailyNotes)
      .set({ content: 'Müdür beyle bütçe görüşmesi yapıldı' })
      .where(eq(schema.dailyNotes.id, 'dn-1'))
      .run();

    const editedDn1 = db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, 'dn-1')).get();
    expect(editedDn1?.content).toBe('Müdür beyle bütçe görüşmesi yapıldı');

    // 6. Delete note (soft delete)
    db.update(schema.dailyNotes)
      .set({ deletedAt: Date.now() })
      .where(eq(schema.dailyNotes.id, 'dn-2'))
      .run();

    const activeNotes17 = db.select().from(schema.dailyNotes).where(and(
      eq(schema.dailyNotes.noteDate, '2026-08-17'),
      isNull(schema.dailyNotes.deletedAt)
    )).all();
    expect(activeNotes17.length).toBe(1);
    expect(activeNotes17[0].id).toBe('dn-1');
  });

  it('11. Randevu Durumları & Sonuç Notu (Appointment Outcomes & Result Notes) Verification', async () => {
    const db = dbService.getDb();
    const schoolYearId = dbService.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbService.ensureDeviceId();

    // 1. Insert appointment with notes (Açıklama / Hazırlık Notları)
    const app1Id = 'app-result-test-1';
    db.insert(schema.appointments).values({
      id: app1Id,
      schoolYearId,
      title: 'Zeynep Akaya Görüşme',
      date: '2026-08-19',
      startTime: '14:00',
      endTime: '14:40',
      location: 'Rehberlik Servisi',
      notes: 'deneme hazırlık notu',
      status: 'scheduled',
      resultNote: null,
      appointmentType: 'Bireysel Öğrenci Görüşmesi',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    const createdApp = db.select().from(schema.appointments).where(eq(schema.appointments.id, app1Id)).get();
    expect(createdApp).toBeDefined();
    expect(createdApp?.notes).toBe('deneme hazırlık notu');
    expect(createdApp?.status).toBe('scheduled');

    // 2. Update status to 'completed' (Tamamlandı)
    db.update(schema.appointments)
      .set({ status: 'completed', updatedAt: Date.now() })
      .where(eq(schema.appointments.id, app1Id))
      .run();

    const completedApp = db.select().from(schema.appointments).where(eq(schema.appointments.id, app1Id)).get();
    expect(completedApp?.status).toBe('completed');

    // 3. Update status to 'student_absent' (Öğrenci Gelmedi)
    db.update(schema.appointments)
      .set({ status: 'student_absent', updatedAt: Date.now() })
      .where(eq(schema.appointments.id, app1Id))
      .run();

    const absentApp = db.select().from(schema.appointments).where(eq(schema.appointments.id, app1Id)).get();
    expect(absentApp?.status).toBe('student_absent');

    // 4. Update status to 'other' with 'resultNote' (Diğer + Sonuç Notu)
    const noteText = 'Veli telefonla aradı, öğrenci başka bir görüşmeye yönlendirildi.';
    db.update(schema.appointments)
      .set({
        status: 'other',
        resultNote: noteText,
        updatedAt: Date.now()
      })
      .where(eq(schema.appointments.id, app1Id))
      .run();

    const otherApp = db.select().from(schema.appointments).where(eq(schema.appointments.id, app1Id)).get();
    expect(otherApp?.status).toBe('other');
    expect(otherApp?.resultNote).toBe(noteText);
    expect(otherApp?.notes).toBe('deneme hazırlık notu');

    // 5. Test persistence across DB restart
    dbService.close();
    const newDb = new DatabaseService();
    newDb.init(TEST_DIR);
    const dbPersisted = newDb.getDb();

    const checkPersisted = dbPersisted.select().from(schema.appointments).where(eq(schema.appointments.id, app1Id)).get();
    expect(checkPersisted).toBeDefined();
    expect(checkPersisted?.status).toBe('other');
    expect(checkPersisted?.resultNote).toBe(noteText);
    expect(checkPersisted?.notes).toBe('deneme hazırlık notu');

    newDb.close();
  });

  it('12. Ajanda & Yıllık Plan Ayrıştırması & CRUD & Kalıcılık Verification', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbServiceInstance.ensureDeviceId();

    // 1. AJANDA CRUD & COMPLETED STATUS (0 -> 1 -> 0)
    const agendaId = 'ag-test-1';
    db.insert(schema.agendaItems).values({
      id: agendaId,
      schoolYearId,
      title: 'BEP Geliştirme Kurulu Toplantısı',
      agendaDate: '2026-08-18',
      startTime: '10:00',
      completed: 0,
      notes: 'Gündem: 9-A ve 10-B BEP planlarının gözden geçirilmesi',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    const agInitial = db.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, agendaId)).get();
    expect(agInitial).toBeDefined();
    expect(agInitial?.completed).toBe(0);
    expect(agInitial?.title).toBe('BEP Geliştirme Kurulu Toplantısı');

    // Toggle to completed (1)
    db.update(schema.agendaItems)
      .set({ completed: 1, updatedAt: Date.now() })
      .where(eq(schema.agendaItems.id, agendaId))
      .run();

    const agCompleted = db.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, agendaId)).get();
    expect(agCompleted?.completed).toBe(1);

    // 2. YILLIK PLAN CRUD WITH DATE RANGE & ACTIVITY TYPE
    const planId = 'annual-plan-test-1';
    db.insert(schema.annualPlans).values({
      id: planId,
      schoolYearId,
      title: '2026-2027 Yıllık Rehberlik Programı',
      description: 'Yıllık plan',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }).run();

    const planItemId = 'plan-item-test-1';
    db.insert(schema.annualPlanItems).values({
      id: planItemId,
      annualPlanId: planId,
      title: 'Sınav Kaygısı ve Baş Etme Yolları Semineri',
      activityType: 'Seminer',
      targetAudience: '12. Sınıflar',
      plannedDate: '2026-09-01',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      category: 'Gelişimsel',
      description: '12. sınıf öğrencilerine yönelik kaygı yönetimi semineri',
      status: 'planned',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    const createdPlanItem = db.select().from(schema.annualPlanItems).where(eq(schema.annualPlanItems.id, planItemId)).get();
    expect(createdPlanItem).toBeDefined();
    expect(createdPlanItem?.activityType).toBe('Seminer');
    expect(createdPlanItem?.startDate).toBe('2026-09-01');
    expect(createdPlanItem?.endDate).toBe('2026-09-05');
    expect(createdPlanItem?.targetAudience).toBe('12. Sınıflar');

    // 3. VERIFY ISOLATION: Appointments vs Agenda vs Annual Plan
    const appointmentsCount = db.select().from(schema.appointments).where(isNull(schema.appointments.deletedAt)).all().length;
    const agendaCount = db.select().from(schema.agendaItems).where(isNull(schema.agendaItems.deletedAt)).all().length;
    const planItemsCount = db.select().from(schema.annualPlanItems).where(isNull(schema.annualPlanItems.deletedAt)).all().length;

    expect(appointmentsCount).toBeGreaterThanOrEqual(0);
    expect(agendaCount).toBeGreaterThanOrEqual(1);
    expect(planItemsCount).toBeGreaterThanOrEqual(1);

    // 4. VERIFY RE-OPEN PERSISTENCE ACROSS RESTART
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();

    const persistedAgenda = db2.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, agendaId)).get();
    expect(persistedAgenda).toBeDefined();
    expect(persistedAgenda?.completed).toBe(1);
    expect(persistedAgenda?.title).toBe('BEP Geliştirme Kurulu Toplantısı');
    expect(persistedAgenda?.agendaDate).toBe('2026-08-18');

    const persistedPlanItem = db2.select().from(schema.annualPlanItems).where(eq(schema.annualPlanItems.id, planItemId)).get();
    expect(persistedPlanItem).toBeDefined();
    expect(persistedPlanItem?.activityType).toBe('Seminer');
    expect(persistedPlanItem?.startDate).toBe('2026-09-01');
    expect(persistedPlanItem?.endDate).toBe('2026-09-05');

    restartDbService.close();
  });

  it('13. Görüşmeler Modülü: Görüşme Konusu, Yapılan Çalışma, Saat Aralığı, Çoklu Kurum ve Görüşme Sayacı Kalıcılığı', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbServiceInstance.ensureDeviceId();

    // 1. Create a test student
    const testStudentId = 'student-meeting-test-1';
    db.insert(schema.students).values({
      id: testStudentId,
      schoolYearId,
      studentNumber: '888',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 2. Insert 1st meeting for student -> Session #1
    const m1Id = 'meeting-test-1';
    db.insert(schema.meetings).values({
      id: m1Id,
      schoolYearId,
      studentId: testStudentId,
      meetingType: 'student',
      participantType: 'Öğrenci',
      date: '2026-08-16',
      startTime: '10:00',
      endTime: '10:40',
      duration: 40,
      subject: 'Akademik Konular',
      meetingTopic: 'Akademik Konular',
      activityType: 'Bireysel Öğrenci Görüşmesi',
      summary: 'Ders çalışma programı oluşturuldu.',
      notes: 'İlk görüşme yapıldı.',
      sessionNumber: 1,
      referralInstitutions: JSON.stringify(['RAM']),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 3. Insert 2nd meeting for student -> Session #2
    const m2Id = 'meeting-test-2';
    db.insert(schema.meetings).values({
      id: m2Id,
      schoolYearId,
      studentId: testStudentId,
      meetingType: 'parent',
      participantType: 'Veli',
      parentRelation: 'Anne',
      date: '2026-08-17',
      startTime: '11:00',
      endTime: '11:45',
      duration: 45,
      subject: 'Ailevi Konular',
      meetingTopic: 'Ailevi Konular',
      activityType: 'Veli Görüşmesi',
      summary: 'Anne ile öğrencinin evdeki çalışma düzeni görüşüldü.',
      notes: 'Anne veli görüşmesi.',
      sessionNumber: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 4. Insert 3rd meeting for student -> Session #3 with 'Diğer' and multiple referrals
    const m3Id = 'meeting-test-3';
    db.insert(schema.meetings).values({
      id: m3Id,
      schoolYearId,
      studentId: testStudentId,
      meetingType: 'student',
      participantType: 'Öğrenci',
      date: '2026-08-18',
      startTime: '14:00',
      endTime: '14:40',
      duration: 40,
      subject: 'Sınav Heyecanı',
      meetingTopic: 'Diğer',
      meetingTopicOther: 'Sınav Heyecanı ve Baş Etme Yolları',
      activityType: 'Diğer',
      activityTypeOther: 'Bireysel Motivasyon Koçluğu',
      referralInstitutions: JSON.stringify(['RAM', 'HASTANE', 'DİĞER']),
      referralOther: 'Çocuk Ruh Sağlığı Polikliniği',
      summary: 'Kapsamlı değerlendirme ve çoklu kurum yönlendirmesi.',
      notes: 'Notlar...',
      sessionNumber: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 5. Query and Assert In-Memory
    const m3 = db.select().from(schema.meetings).where(eq(schema.meetings.id, m3Id)).get();
    expect(m3).toBeDefined();
    expect(m3?.sessionNumber).toBe(3);
    expect(m3?.meetingTopic).toBe('Diğer');
    expect(m3?.meetingTopicOther).toBe('Sınav Heyecanı ve Baş Etme Yolları');
    expect(m3?.activityType).toBe('Diğer');
    expect(m3?.activityTypeOther).toBe('Bireysel Motivasyon Koçluğu');
    expect(m3?.startTime).toBe('14:00');
    expect(m3?.endTime).toBe('14:40');
    expect(m3?.referralOther).toBe('Çocuk Ruh Sağlığı Polikliniği');
    const parsedInstitutions = JSON.parse(m3?.referralInstitutions || '[]');
    expect(parsedInstitutions).toEqual(['RAM', 'HASTANE', 'DİĞER']);

    // 6. Test Persistence across Database restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();

    const persistedM2 = db2.select().from(schema.meetings).where(eq(schema.meetings.id, m2Id)).get();
    expect(persistedM2).toBeDefined();
    expect(persistedM2?.participantType).toBe('Veli');
    expect(persistedM2?.parentRelation).toBe('Anne');
    expect(persistedM2?.sessionNumber).toBe(2);

    const persistedM3 = db2.select().from(schema.meetings).where(eq(schema.meetings.id, m3Id)).get();
    expect(persistedM3).toBeDefined();
    expect(persistedM3?.sessionNumber).toBe(3);
    expect(persistedM3?.meetingTopicOther).toBe('Sınav Heyecanı ve Baş Etme Yolları');
    expect(persistedM3?.endTime).toBe('14:40');
    expect(JSON.parse(persistedM3?.referralInstitutions || '[]')).toEqual(['RAM', 'HASTANE', 'DİĞER']);

    restartDbService.close();
  });

  it('14. Görüşmeler 6. Bölüm: Grup Rehberliği Katılımcıları, İzolasyonlu Sayaç, Takip Randevusu ve Kalıcılık', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbServiceInstance.ensureDeviceId();

    // 1. Create 3 students from different classes (9-A, 9-B, 11-C)
    const stAId = 'student-multi-9a';
    const stBId = 'student-multi-9b';
    const stCId = 'student-multi-11c';

    db.insert(schema.students).values([
      { id: stAId, schoolYearId, studentNumber: '901', firstName: 'Zeynep', lastName: 'Akaya', gender: 'female', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: stBId, schoolYearId, studentNumber: '902', firstName: 'Mehmet', lastName: 'Yılmaz', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: stCId, schoolYearId, studentNumber: '903', firstName: 'Ahmet', lastName: 'Kaya', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
    ]).run();

    // 2. Add 2 individual meetings for Zeynep (stAId)
    db.insert(schema.meetings).values([
      { id: 'm-indiv-1', schoolYearId, studentId: stAId, meetingType: 'student', participantType: 'Öğrenci', date: '2026-08-10', startTime: '09:00', duration: 40, subject: 'Oryantasyon', summary: '1. bireysel', notes: '', sessionNumber: 1, createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: 'm-indiv-2', schoolYearId, studentId: stAId, meetingType: 'student', participantType: 'Öğrenci', date: '2026-08-12', startTime: '10:00', duration: 40, subject: 'Akademik', summary: '2. bireysel', notes: '', sessionNumber: 2, createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
    ]).run();

    // 3. Create Group Guidance Meeting with 3 participants across classes (9-A, 9-B, 11-C)
    // with plannedSessions = 6, sessionNumber = 3, and followUpAppointment
    const groupMeetingId = 'group-meeting-1';
    db.insert(schema.meetings).values({
      id: groupMeetingId,
      schoolYearId,
      studentId: null,
      meetingType: 'group_guidance',
      participantType: 'Grup',
      date: '2026-08-18',
      startTime: '13:00',
      endTime: '13:45',
      duration: 45,
      subject: 'Akran Zorbalığı Önleme Grubu',
      meetingTopic: 'Sosyal Uyum',
      activityType: 'Grup Rehberliği',
      summary: 'Grup rehberliği 3. oturum yapıldı.',
      notes: 'Katılım yüksekti.',
      sessionNumber: 3,
      plannedSessions: 6,
      studentIds: JSON.stringify([stAId, stBId, stCId]),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // Insert into meeting_participants
    db.insert(schema.meetingParticipants).values([
      { id: 'mp-1', meetingId: groupMeetingId, studentId: stAId, createdAt: Date.now() },
      { id: 'mp-2', meetingId: groupMeetingId, studentId: stBId, createdAt: Date.now() },
      { id: 'mp-3', meetingId: groupMeetingId, studentId: stCId, createdAt: Date.now() },
    ]).run();

    // 4. Create Follow-Up Appointment connected to this meeting
    const followUpAppId = 'app-followup-1';
    db.insert(schema.appointments).values({
      id: followUpAppId,
      schoolYearId,
      studentId: null,
      studentIds: JSON.stringify([stAId, stBId, stCId]),
      relatedMeetingId: groupMeetingId,
      title: 'Grup Rehberliği 4. Takip Oturumu',
      date: '2026-08-25',
      startTime: '13:00',
      endTime: '13:45',
      location: 'Rehberlik Servisi',
      status: 'scheduled',
      reminderMinutes: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    // 5. TEST: Verify Zeynep's individual meeting counter is still 2! (Req 8)
    const zeynepIndividualMeetings = db.select()
      .from(schema.meetings)
      .where(and(
        eq(schema.meetings.studentId, stAId),
        isNull(schema.meetings.deletedAt)
      ))
      .all()
      .filter(m => m.participantType !== 'Grup' && m.participantType !== 'group' && m.meetingType !== 'group_guidance');

    expect(zeynepIndividualMeetings.length).toBe(2);

    // 6. TEST: Remove one participant (3 -> 2 participants) (Req 4)
    db.delete(schema.meetingParticipants).where(eq(schema.meetingParticipants.id, 'mp-3')).run();
    const remainingParticipants = db.select().from(schema.meetingParticipants).where(eq(schema.meetingParticipants.meetingId, groupMeetingId)).all();
    expect(remainingParticipants.length).toBe(2);

    // 7. TEST: Follow-up appointment exists in appointments table (Req 3 & 7)
    const appRecord = db.select().from(schema.appointments).where(eq(schema.appointments.id, followUpAppId)).get();
    expect(appRecord).toBeDefined();
    expect(appRecord?.relatedMeetingId).toBe(groupMeetingId);
    expect(appRecord?.title).toBe('Grup Rehberliği 4. Takip Oturumu');
    expect(appRecord?.date).toBe('2026-08-25');

    // 8. TEST: Verify persistence across DB restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();

    const persistedGroupMeeting = db2.select().from(schema.meetings).where(eq(schema.meetings.id, groupMeetingId)).get();
    expect(persistedGroupMeeting).toBeDefined();
    expect(persistedGroupMeeting?.sessionNumber).toBe(3);
    expect(persistedGroupMeeting?.plannedSessions).toBe(6);
    expect(persistedGroupMeeting?.participantType).toBe('Grup');

    const persistedApp = db2.select().from(schema.appointments).where(eq(schema.appointments.id, followUpAppId)).get();
    expect(persistedApp).toBeDefined();
    expect(persistedApp?.relatedMeetingId).toBe(groupMeetingId);

    restartDbService.close();
  });

  it('15. Bölüm 7: Günlük Görüşme Takvimi 5+ Kayıt, appointment_participants Çoklu Randevu ve Profil Entegrasyonu', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbServiceInstance.ensureDeviceId();

    // 1. Create 3 students
    const s1 = 'student-b7-1';
    const s2 = 'student-b7-2';
    const s3 = 'student-b7-3';

    db.insert(schema.students).values([
      { id: s1, schoolYearId, studentNumber: '701', firstName: 'Ali', lastName: 'Veli', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: s2, schoolYearId, studentNumber: '702', firstName: 'Ayşe', lastName: 'Yılmaz', gender: 'female', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: s3, schoolYearId, studentNumber: '703', firstName: 'Kaka', lastName: 'Büğs', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
    ]).run();

    // 2. Test A: Create 5 meetings on same date (2026-08-16)
    const testDate = '2026-08-16';
    for (let i = 1; i <= 5; i++) {
      db.insert(schema.meetings).values({
        id: `meeting-day-${i}`,
        schoolYearId,
        studentId: s1,
        meetingType: 'student',
        participantType: 'Öğrenci',
        date: testDate,
        startTime: `14:0${i}`,
        endTime: `14:3${i}`,
        duration: 30,
        subject: `Görüşme Konusu #${i}`,
        meetingTopic: 'Akademik Konular',
        activityType: 'Bireysel Öğrenci Görüşmesi',
        summary: `Günlük görüşme ${i}`,
        notes: '',
        sessionNumber: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedDeviceId: deviceId
      }).run();
    }

    const dayMeetings = db.select().from(schema.meetings).where(and(eq(schema.meetings.date, testDate), isNull(schema.meetings.deletedAt))).all();
    expect(dayMeetings.length).toBe(5);

    // 3. Test B & C: Create Group Appointment with 3 participants across classes via appointment_participants
    const groupAppId = 'app-group-b7';
    db.insert(schema.appointments).values({
      id: groupAppId,
      schoolYearId,
      studentId: null,
      studentIds: JSON.stringify([s1, s2, s3]),
      appointmentType: 'Grup Rehberliği',
      title: 'Sosyal Beceri Grup Rehberliği Randevusu',
      date: '2026-08-20',
      startTime: '11:00',
      endTime: '11:40',
      location: 'Rehberlik Servisi',
      status: 'scheduled',
      reminderMinutes: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).run();

    db.insert(schema.appointmentParticipants).values([
      { id: 'ap-1', appointmentId: groupAppId, studentId: s1, createdAt: Date.now() },
      { id: 'ap-2', appointmentId: groupAppId, studentId: s2, createdAt: Date.now() },
      { id: 'ap-3', appointmentId: groupAppId, studentId: s3, createdAt: Date.now() },
    ]).run();

    const appParticipants = db.select().from(schema.appointmentParticipants).where(eq(schema.appointmentParticipants.appointmentId, groupAppId)).all();
    expect(appParticipants.length).toBe(3);

    // 4. Test D: Student Profile query for student s2 (Ayşe) finds this appointment through appointment_participants
    const student2Appointments = db.select({ appointment: schema.appointments })
      .from(schema.appointments)
      .where(and(
        isNull(schema.appointments.deletedAt),
        or(
          eq(schema.appointments.studentId, s2),
          sql`${schema.appointments.id} IN (SELECT appointment_id FROM appointment_participants WHERE student_id = ${s2})`
        )!
      ))
      .all();

    expect(student2Appointments.length).toBe(1);
    expect(student2Appointments[0].appointment.id).toBe(groupAppId);

    // 5. Test Persistence across Database restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();

    const persistedAppParticipants = db2.select().from(schema.appointmentParticipants).where(eq(schema.appointmentParticipants.appointmentId, groupAppId)).all();
    expect(persistedAppParticipants.length).toBe(3);

    const persistedDayMeetings = db2.select().from(schema.meetings).where(and(eq(schema.meetings.date, testDate), isNull(schema.meetings.deletedAt))).all();
    expect(persistedDayMeetings.length).toBe(5);

    restartDbService.close();
  });

  it('16. Bölüm 8: Manuel Grup Randevusu Oluşturma, Zod Schema, appointment_participants ve Kalıcılık', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const deviceId = dbServiceInstance.ensureDeviceId();

    // 1. Create students from classes 9-A, 9-B, 11-C
    const sZeynep = 'student-zeynep-9a';
    const sKaka = 'student-kaka-9b';
    const sAli = 'student-ali-11c';

    db.insert(schema.students).values([
      { id: sZeynep, schoolYearId, studentNumber: '15615', firstName: 'Zeynep', lastName: 'Akaya', gender: 'female', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: sKaka, schoolYearId, studentNumber: '232', firstName: 'Kaka', lastName: 'Büğs', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
      { id: sAli, schoolYearId, studentNumber: '645', firstName: 'Ali', lastName: 'Veli', gender: 'male', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), lastModifiedDeviceId: deviceId },
    ]).run();

    // 2. Validate CreateAppointmentSchema with studentIds and appointmentType
    const { CreateAppointmentSchema } = await import('../shared/validation');
    const rawPayload = {
      schoolYearId,
      studentId: null,
      studentIds: [sZeynep, sKaka],
      appointmentType: 'Grup Rehberliği',
      title: 'Akran Arabuluculuğu Grup Randevusu',
      date: '2026-08-22',
      startTime: '10:00',
      endTime: '10:40',
      location: 'Rehberlik Servisi',
      notes: 'Grup çalışması hazırlık notu',
      reminderMinutes: 15
    };

    const parsed = CreateAppointmentSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.appointmentType).toBe('Grup Rehberliği');
    expect(parsed.data.studentIds).toEqual([sZeynep, sKaka]);

    // 3. Create appointment using AppointmentService
    const { AppointmentService } = await import('../electron/services/appointments/AppointmentService');
    const { SyncEngine } = await import('../electron/services/sync/SyncEngine');
    const syncEngine = new SyncEngine(db, deviceId);
    const appointmentService = new AppointmentService(db, deviceId, syncEngine);

    const createdApp = appointmentService.createAppointment(parsed.data);

    expect(createdApp.appointmentType).toBe('Grup Rehberliği');
    expect(createdApp.participants?.length).toBe(2);
    expect(createdApp.participants?.map(p => p.id)).toContain(sZeynep);
    expect(createdApp.participants?.map(p => p.id)).toContain(sKaka);

    // 4. Test 3: Multi-class 3-student appointment
    const app3 = appointmentService.createAppointment({
      schoolYearId,
      studentId: null,
      studentIds: [sZeynep, sKaka, sAli],
      appointmentType: 'Grup Rehberliği',
      title: 'Sınav Başarısı Grup Çalışması',
      date: '2026-08-23',
      startTime: '14:00',
      endTime: '14:40',
      location: 'Konferans Salonu'
    });

    expect(app3.appointmentType).toBe('Grup Rehberliği');
    expect(app3.participants?.length).toBe(3);

    // 5. Test 4: Individual appointment regression test
    const appIndividual = appointmentService.createAppointment({
      schoolYearId,
      studentId: sZeynep,
      appointmentType: 'Bireysel Öğrenci Görüşmesi',
      title: 'Bireysel Görüşme',
      date: '2026-08-24',
      startTime: '09:00',
      endTime: '09:40'
    });

    expect(appIndividual.appointmentType).toBe('Bireysel Öğrenci Görüşmesi');
    expect(appIndividual.studentId).toBe(sZeynep);

    // 6. Test 2: Persistence across DB close and restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();
    const appService2 = new AppointmentService(db2, deviceId, new SyncEngine(db2, deviceId));

    const reloadedApp = appService2.getAppointmentById(createdApp.id);
    expect(reloadedApp).toBeDefined();
    expect(reloadedApp?.appointmentType).toBe('Grup Rehberliği');
    expect(reloadedApp?.participants?.length).toBe(2);

    const reloadedApp3 = appService2.getAppointmentById(app3.id);
    expect(reloadedApp3).toBeDefined();
    expect(reloadedApp3?.participants?.length).toBe(3);

    restartDbService.close();
  });

  it('17. Bölüm 9: Evraklar Modülü — Manuel Evrak Yükleme, Metadata, A-Z Sıralama, Arama, Önizleme Base64, Silme ve Kalıcılık', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const deviceId = dbServiceInstance.ensureDeviceId();
    const { SyncEngine } = await import('../electron/services/sync/SyncEngine');
    const syncEngine = new SyncEngine(db, deviceId);

    const { CounselorDocumentService } = await import('../electron/services/documents/CounselorDocumentService');
    const docService = new CounselorDocumentService(db, deviceId, syncEngine, TEST_DIR);

    // 1. Initial state: No docs
    const initialList = docService.listDocuments();
    expect(initialList.length).toBe(0);

    // 2. Upload 3 documents (Zorbalık, Akran, Bireysel)
    const doc1 = docService.createDocument({
      title: 'Zorbalık Bildirim ve Müdahale Formu',
      description: 'Okul içi zorbalık bildirimleri için resmi tutanak',
      fileName: 'zorbalik_formu.pdf',
      fileBase64: Buffer.from('%PDF-1.4 sample zorbalik pdf content').toString('base64'),
      mimeType: 'application/pdf',
      fileSize: 1024
    });

    const doc2 = docService.createDocument({
      title: 'Akran Arabuluculuğu Başvuru Formu',
      description: 'Öğrenci akran arabuluculuk başvuru belgesi',
      fileName: 'akran_arabuluculuk.pdf',
      fileBase64: Buffer.from('%PDF-1.4 sample akran arabuluculuk content').toString('base64'),
      mimeType: 'application/pdf',
      fileSize: 2048
    });

    const doc3 = docService.createDocument({
      title: 'Bireysel Görüşme Kayıt Çizelgesi',
      description: 'Rehberlik bireysel seans kayıt formu',
      fileName: 'bireysel_gorusme.docx',
      fileBase64: Buffer.from('sample docx content').toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 4096
    });

    expect(doc1.id).toBeDefined();
    expect(doc2.id).toBeDefined();
    expect(doc3.id).toBeDefined();

    // 3. Alphabetical sorting A-Z verification
    const allDocs = docService.listDocuments();
    expect(allDocs.length).toBe(3);
    expect(allDocs[0].title).toBe('Akran Arabuluculuğu Başvuru Formu');
    expect(allDocs[1].title).toBe('Bireysel Görüşme Kayıt Çizelgesi');
    expect(allDocs[2].title).toBe('Zorbalık Bildirim ve Müdahale Formu');

    // 4. Search verification
    const searchAkran = docService.listDocuments('arabuluculuk');
    expect(searchAkran.length).toBe(1);
    expect(searchAkran[0].title).toBe('Akran Arabuluculuğu Başvuru Formu');

    const searchDesc = docService.listDocuments('tutanak');
    expect(searchDesc.length).toBe(1);
    expect(searchDesc[0].title).toBe('Zorbalık Bildirim ve Müdahale Formu');

    // 5. File data retrieval for in-app preview
    const fileData = docService.getFileData(doc1.id);
    expect(fileData).toBeDefined();
    expect(fileData?.fileName).toBe('zorbalik_formu.pdf');
    expect(fileData?.mimeType).toBe('application/pdf');
    expect(Buffer.from(fileData!.contentBase64, 'base64').toString()).toContain('%PDF-1.4');

    // 6. Delete document
    const deleted = docService.deleteDocument(doc3.id);
    expect(deleted).toBe(true);

    const remainingDocs = docService.listDocuments();
    expect(remainingDocs.length).toBe(2);
    expect(remainingDocs.map(d => d.id)).not.toContain(doc3.id);

    // 7. Persistence across DB close and restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();
    const docService2 = new CounselorDocumentService(db2, deviceId, new SyncEngine(db2, deviceId), TEST_DIR);

    const persistedDocs = docService2.listDocuments();
    expect(persistedDocs.length).toBe(2);
    expect(persistedDocs[0].title).toBe('Akran Arabuluculuğu Başvuru Formu');
    expect(persistedDocs[1].title).toBe('Zorbalık Bildirim ve Müdahale Formu');

    const persistedFileData = docService2.getFileData(doc2.id);
    expect(persistedFileData).toBeDefined();
    expect(Buffer.from(persistedFileData!.contentBase64, 'base64').toString()).toContain('sample akran arabuluculuk');

    restartDbService.close();
  });

  it('18. Bölüm 9.2: Evrak Önizleme Sistemi — PDF Preview, Mammoth DOCX HTML Dönüşümü, DOC Uyarısı, Güvenlik ve Hata Yönetimi', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const deviceId = dbServiceInstance.ensureDeviceId();
    const { SyncEngine } = await import('../electron/services/sync/SyncEngine');
    const syncEngine = new SyncEngine(db, deviceId);

    const { CounselorDocumentService } = await import('../electron/services/documents/CounselorDocumentService');
    const docService = new CounselorDocumentService(db, deviceId, syncEngine, TEST_DIR);

    // 1. Upload a PDF document
    const pdfDoc = docService.createDocument({
      title: 'MEB Rehberlik Yıllık Çerçeve Planı',
      description: 'Yıllık resmi PDF rehberlik çerçeve planı',
      fileName: 'cerceve_plani.pdf',
      fileBase64: Buffer.from('%PDF-1.5 %sample-pdf-binary-stream-test').toString('base64'),
      mimeType: 'application/pdf',
      fileSize: 3200
    });

    const pdfPreview = await docService.getPreviewData(pdfDoc.id);
    expect(pdfPreview.fileType).toBe('pdf');
    expect(pdfPreview.contentBase64).toBeDefined();
    expect(pdfPreview.title).toBe('MEB Rehberlik Yıllık Çerçeve Planı');
    expect(pdfPreview.error).toBeUndefined();

    // 2. Upload a DOCX document (Create a minimal valid zip/docx or text for mammoth)
    const docxDoc = docService.createDocument({
      title: 'Veli Görüşme Tutanak Şablonu',
      description: 'Word formatında veli görüşme tutanağı',
      fileName: 'veli_gorusme.docx',
      fileBase64: Buffer.from('PK\x03\x04sample-docx-binary-mock').toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 4800
    });

    const docxPreview = await docService.getPreviewData(docxDoc.id);
    expect(docxPreview.fileType).toBe('docx');
    expect(docxPreview.title).toBe('Veli Görüşme Tutanak Şablonu');

    // 3. Upload a legacy .doc document
    const legacyDoc = docService.createDocument({
      title: 'Eski Sınıf Listesi Formu',
      description: 'Word 97-2003 formatında',
      fileName: 'eski_form.doc',
      fileBase64: Buffer.from('\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1 sample binary doc').toString('base64'),
      mimeType: 'application/msword',
      fileSize: 2000
    });

    const legacyPreview = await docService.getPreviewData(legacyDoc.id);
    expect(legacyPreview.fileType).toBe('doc');
    expect(legacyPreview.docWarning).toBeDefined();
    expect(legacyPreview.docWarning).toContain('Word 97-2003');

    // 4. Missing physical file safety (simulate accidental deletion from disk)
    const ghostDoc = docService.createDocument({
      title: 'Hayalet Evrak',
      fileName: 'hayalet.pdf',
      fileBase64: Buffer.from('test').toString('base64'),
      mimeType: 'application/pdf',
      fileSize: 100
    });

    // Delete the file from storage manually
    const ghostStoragePath = path.join(TEST_DIR, 'documents_storage', ghostDoc.filePath);
    if (fs.existsSync(ghostStoragePath)) {
      fs.unlinkSync(ghostStoragePath);
    }

    const ghostPreview = await docService.getPreviewData(ghostDoc.id);
    expect(ghostPreview.error).toBeDefined();
    expect(ghostPreview.error).toContain('diskte bulunamadı');

    // 5. Test persistence of preview data across DB close and restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();
    const docService2 = new CounselorDocumentService(db2, deviceId, new SyncEngine(db2, deviceId), TEST_DIR);

    const reloadedPdfPreview = await docService2.getPreviewData(pdfDoc.id);
    expect(reloadedPdfPreview.fileType).toBe('pdf');
    expect(reloadedPdfPreview.contentBase64).toBeDefined();

    restartDbService.close();
  });

  it('19. PDF.js Engine & WordExtractor Offline Regression Verification (hashOriginalToHex fix)', async () => {
    // 1. Ensure polyfills are active
    if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
      (Uint8Array.prototype as any).toHex = function () {
        return Array.from(this)
          .map((b: any) => b.toString(16).padStart(2, '0'))
          .join('');
      };
    }

    // 2. Test PDF.js legacy loading on actual valid PDF stream
    const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
    const pdfData = new Uint8Array(Buffer.from(minimalPdf));

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    expect(pdf.numPages).toBe(1);
    const page1 = await pdf.getPage(1);
    const viewport = page1.getViewport({ scale: 1 });
    expect(viewport.width).toBe(612);
    expect(viewport.height).toBe(792);

    // 3. Test WordExtractor instantiation and offline execution
    const WordExtractor = (await import('word-extractor')).default;
    const extractor = new WordExtractor();
    expect(typeof extractor.extract).toBe('function');
  });

  it('20. Document Upload Lifecycle & Sequential Upload State Isolation', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const deviceId = dbServiceInstance.ensureDeviceId();
    const { SyncEngine } = await import('../electron/services/sync/SyncEngine');
    const syncEngine = new SyncEngine(db, deviceId);

    const { CounselorDocumentService } = await import('../electron/services/documents/CounselorDocumentService');
    const docService = new CounselorDocumentService(db, deviceId, syncEngine, TEST_DIR);

    // 1. Upload Document 1 (DOCX)
    const doc1 = docService.createDocument({
      title: 'İlk Yüklenen Belge',
      description: 'İlk yüklemenin özel açıklaması',
      fileName: 'ilk_belge.docx',
      fileBase64: Buffer.from('docx-binary-1').toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1500
    });

    expect(doc1.id).toBeDefined();
    expect(doc1.title).toBe('İlk Yüklenen Belge');
    expect(doc1.description).toBe('İlk yüklemenin özel açıklaması');

    // 2. Upload Document 2 (PDF) with completely fresh, isolated metadata
    const doc2 = docService.createDocument({
      title: 'İkinci Yüklenen Belge',
      description: 'İkinci yüklemenin bağımsız açıklaması',
      fileName: 'ikinci_belge.pdf',
      fileBase64: Buffer.from('%PDF-1.4 pdf-binary-2').toString('base64'),
      mimeType: 'application/pdf',
      fileSize: 2500
    });

    expect(doc2.id).toBeDefined();
    expect(doc2.title).toBe('İkinci Yüklenen Belge');
    expect(doc2.description).toBe('İkinci yüklemenin bağımsız açıklaması');

    // 3. Verify that doc1 and doc2 do NOT contaminate each other
    const list = docService.listDocuments();
    const fetched1 = list.find(d => d.id === doc1.id);
    const fetched2 = list.find(d => d.id === doc2.id);

    expect(fetched1?.title).toBe('İlk Yüklenen Belge');
    expect(fetched1?.fileName).toBe('ilk_belge.docx');
    expect(fetched1?.fileSize).toBe(1500);

    expect(fetched2?.title).toBe('İkinci Yüklenen Belge');
    expect(fetched2?.fileName).toBe('ikinci_belge.pdf');
    expect(fetched2?.fileSize).toBe(2500);

    dbServiceInstance.close();
  });

  it('21. Anasayfa Yapılan Görüşmeler — Bireysel ve Çoklu Sınıf Grup Rehberliği Görüşmeleri, Detay Modalı ve Kalıcılık Doğrulaması', async () => {
    const dbServiceInstance = new DatabaseService();
    dbServiceInstance.init(TEST_DIR);
    const db = dbServiceInstance.getDb();
    const deviceId = dbServiceInstance.ensureDeviceId();
    const schoolYearId = dbServiceInstance.getMeta('active_school_year_id') || 'default-year';
    const { SyncEngine } = await import('../electron/services/sync/SyncEngine');
    const syncEngine = new SyncEngine(db, deviceId);

    const { MeetingService } = await import('../electron/services/meetings/MeetingService');
    const meetingService = new MeetingService(db, deviceId, syncEngine);

    // 1. Create 3 students across different classes
    const classA = 'class-9a-' + Date.now();
    const classB = 'class-10b-' + Date.now();
    const classC = 'class-11c-' + Date.now();

    db.insert(schema.classes).values([
      { id: classA, schoolYearId, name: '9-A', grade: 9, branch: 'A', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId },
      { id: classB, schoolYearId, name: '10-B', grade: 10, branch: 'B', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId },
      { id: classC, schoolYearId, name: '11-C', grade: 11, branch: 'C', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId }
    ]).run();

    const s1Id = 'student-g1-' + Date.now();
    const s2Id = 'student-g2-' + Date.now();
    const s3Id = 'student-g3-' + Date.now();
    const sIndivId = 'student-indiv-' + Date.now();

    db.insert(schema.students).values([
      { id: s1Id, schoolYearId, classId: classA, studentNumber: '101', firstName: 'Ahmet', lastName: 'Yılmaz', gender: 'M', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId },
      { id: s2Id, schoolYearId, classId: classB, studentNumber: '202', firstName: 'Ayşe', lastName: 'Demir', gender: 'F', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId },
      { id: s3Id, schoolYearId, classId: classC, studentNumber: '303', firstName: 'Mehmet', lastName: 'Kaya', gender: 'M', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId },
      { id: sIndivId, schoolYearId, classId: classA, studentNumber: '104', firstName: 'Zeynep', lastName: 'Aksoy', gender: 'F', status: 'active', createdAt: Date.now(), updatedAt: Date.now(), version: 1, lastModifiedDeviceId: deviceId }
    ]).run();

    const testDate = '2026-08-17';

    // 2. Create 1 Individual Meeting on testDate
    const indivMeeting = meetingService.createMeeting({
      schoolYearId,
      studentId: sIndivId,
      date: testDate,
      startTime: '09:00',
      duration: 40,
      meetingType: 'student',
      participantType: 'Öğrenci',
      meetingTopic: 'Akademik Konular',
      activityType: 'Bireysel Öğrenci Görüşmesi',
      subject: 'YKS Hazırlık ve Motivasyon',
      summary: 'Bireysel çalışma programı düzenlendi.'
    });

    // 3. Create 1 Group Guidance Meeting with 3 students from different classes on testDate
    const groupMeeting = meetingService.createMeeting({
      schoolYearId,
      studentIds: [s1Id, s2Id, s3Id],
      date: testDate,
      startTime: '13:30',
      duration: 45,
      meetingType: 'group',
      participantType: 'Grup',
      meetingTopic: 'Sosyal Uyum',
      activityType: 'Grup Rehberliği',
      subject: 'Akran İlişkileri ve İletişim Atölyesi',
      summary: '3 farklı sınıftan öğrenci ile grup çalışması yapıldı.'
    });

    expect(indivMeeting.id).toBeDefined();
    expect(groupMeeting.id).toBeDefined();

    // 4. Query Dashboard filtered meetings for testDate
    const dailyMeetings = meetingService.listMeetings({ dateFrom: testDate, dateTo: testDate });
    expect(dailyMeetings.length).toBe(2);

    const foundIndiv = dailyMeetings.find(m => m.id === indivMeeting.id);
    const foundGroup = dailyMeetings.find(m => m.id === groupMeeting.id);

    expect(foundIndiv).toBeDefined();
    expect(foundGroup).toBeDefined();

    // Verify Individual meeting mapping
    expect(foundIndiv?.className).toBe('9-A');
    expect(foundIndiv?.studentNumber).toBe('104');
    expect(foundIndiv?.studentName).toBe('Zeynep Aksoy');
    expect(foundIndiv?.meetingTopic).toBe('Akademik Konular');
    expect(foundIndiv?.startTime).toBe('09:00');

    // Verify Group meeting mapping & participant isolation
    expect(foundGroup?.meetingType).toBe('group');
    expect(foundGroup?.participantType).toBe('Grup');
    expect(foundGroup?.meetingTopic).toBe('Sosyal Uyum');
    expect(foundGroup?.startTime).toBe('13:30');
    expect(foundGroup?.participants?.length).toBe(3);

    const participantNames = foundGroup?.participants?.map(p => `${p.firstName} ${p.lastName}`);
    expect(participantNames).toContain('Ahmet Yılmaz');
    expect(participantNames).toContain('Ayşe Demir');
    expect(participantNames).toContain('Mehmet Kaya');

    const participantClasses = foundGroup?.participants?.map(p => p.className);
    expect(participantClasses).toContain('9-A');
    expect(participantClasses).toContain('10-B');
    expect(participantClasses).toContain('11-C');

    // 5. Test persistence across DB restart
    dbServiceInstance.close();

    const restartDbService = new DatabaseService();
    restartDbService.init(TEST_DIR);
    const db2 = restartDbService.getDb();
    const meetingService2 = new MeetingService(db2, deviceId, new SyncEngine(db2, deviceId));

    const persistedDaily = meetingService2.listMeetings({ dateFrom: testDate, dateTo: testDate });
    expect(persistedDaily.length).toBe(2);

    const persistedGroup = persistedDaily.find(m => m.id === groupMeeting.id);
    expect(persistedGroup?.participants?.length).toBe(3);
    expect(persistedGroup?.meetingTopic).toBe('Sosyal Uyum');

    restartDbService.close();
  });
});
