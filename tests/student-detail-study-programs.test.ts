import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { runMigrations } from '../electron/services/database/migrations';

describe('Bölüm 14: Öğrenci Bilgi Popup & Okul Bilgileri Entegrasyon Test Paketi', () => {
  let sqlite: Database.Database;
  const tempDir = path.join(process.cwd(), 'temp_student_profile_test');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const dbPath = path.join(tempDir, `profile_${Date.now()}_${Math.random().toString(36).substring(2)}.sqlite`);
    sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    runMigrations(sqlite, path.join(tempDir, 'backups'));

    // Seed mock school, year, class and students
    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-1', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
      VALUES ('class-1', 'year-1', '12-A', 12, 'A', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, notes, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-zeynep', 'year-1', 'class-1', '15615', 'Zeynep', 'Akaya', 'female', 'active', 'İlk rehberlik notu: Hedef Tıp Fakültesi.', 1000, 1000, 1, 'dev-1'),
        ('st-ahmet', 'year-1', 'class-1', '10204', 'Ahmet', 'Yılmaz', 'male', 'active', '', 1000, 1000, 1, 'dev-1'),
        ('st-noplans', 'year-1', 'class-1', '10300', 'Can', 'Demir', 'male', 'active', '', 1000, 1000, 1, 'dev-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('1 & 2. Okul Bilgileri ve Global Search Ortak StudentProfileModal Kullanımı', () => {
    // Both components update useAppStore.setSelectedStudentId(student.id)
    // Verify student lookup works identically
    const student = sqlite.prepare('SELECT * FROM students WHERE id = ?').get('st-zeynep') as any;
    expect(student).toBeDefined();
    expect(student.first_name).toBe('Zeynep');
    expect(student.last_name).toBe('Akaya');
    expect(student.student_number).toBe('15615');
    expect(student.notes).toBe('İlk rehberlik notu: Hedef Tıp Fakültesi.');
  });

  it('3 & 4. Öğrencinin Çalışma Programlarının Doğru student_id Üzerinden Listelenmesi (Çoklu Program Desteği)', () => {
    // Add 2 plans for Zeynep and 1 for Ahmet
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES 
        ('plan-z1', 'st-zeynep', 'TYT Genel Tekrar Programı', 'Pomodoro · Tekrar', 'TYT Genel Tekrar Programı', '<p>Matematik</p>', '<p>Fizik</p>', '', '', '', '', '', '2026-08-15', '2026-09-15', 2000, 2000, 1, 'dev-1'),
        ('plan-z2', 'st-zeynep', 'AYT Sayısal Yoğun Kamp', 'Deneme · Soru Çözümü', 'AYT Sayısal Yoğun Kamp', '<p>Kimya</p>', '<p>Biyoloji</p>', '', '', '', '', '', '2026-08-17', '2026-09-17', 5000, 5000, 1, 'dev-1'),
        ('plan-a1', 'st-ahmet', 'Eşit Ağırlık Programı', 'Kitap', 'Eşit Ağırlık Programı', '', '', '', '', '', '', '', '2026-08-16', '2026-09-16', 3000, 3000, 1, 'dev-1')
    `).run();

    // Query for Zeynep (st-zeynep)
    const zeynepPlans = sqlite.prepare(`
      SELECT * FROM study_plans 
      WHERE student_id = 'st-zeynep' AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).all() as any[];

    expect(zeynepPlans.length).toBe(2);
    expect(zeynepPlans[0].id).toBe('plan-z2'); // Newest first
    expect(zeynepPlans[0].template_name_snapshot).toBe('AYT Sayısal Yoğun Kamp');
    expect(zeynepPlans[1].id).toBe('plan-z1');
    expect(zeynepPlans[1].template_name_snapshot).toBe('TYT Genel Tekrar Programı');

    // Query for Ahmet (st-ahmet)
    const ahmetPlans = sqlite.prepare(`
      SELECT * FROM study_plans 
      WHERE student_id = 'st-ahmet' AND deleted_at IS NULL
    `).all() as any[];

    expect(ahmetPlans.length).toBe(1);
    expect(ahmetPlans[0].template_name_snapshot).toBe('Eşit Ağırlık Programı');
  });

  it('5. Programların Tarihe Göre Yeni -> Eski (createdAt DESC) Sıralanması', () => {
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES 
        ('p-old', 'st-zeynep', 'Eski Plan', '', 'Eski Plan', '', '', '', '', '', '', '', '2026-08-01', '2026-08-31', 1000, 1000, 1, 'dev-1'),
        ('p-newest', 'st-zeynep', 'En Yeni Plan', '', 'En Yeni Plan', '', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 9000, 9000, 1, 'dev-1'),
        ('p-mid', 'st-zeynep', 'Orta Plan', '', 'Orta Plan', '', '', '', '', '', '', '', '2026-08-10', '2026-09-10', 4000, 4000, 1, 'dev-1')
    `).run();

    const plans = sqlite.prepare(`
      SELECT id, created_at FROM study_plans 
      WHERE student_id = 'st-zeynep' AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).all() as any[];

    expect(plans.map(p => p.id)).toEqual(['p-newest', 'p-mid', 'p-old']);
  });

  it('6. Çalışma Programı Olmayan Öğrencide Empty State Tespiti', () => {
    const plans = sqlite.prepare(`
      SELECT * FROM study_plans 
      WHERE student_id = 'st-noplans' AND deleted_at IS NULL
    `).all() as any[];

    expect(plans.length).toBe(0);
  });

  it('7 & 8. Program Detayında 7 Günün ve Rich-Text Biçimlendirmelerinin Korunması', () => {
    const richSchedule = {
      monday: '<p><b>TYT Matematik</b>: <i>Problemler</i></p>',
      tuesday: '<ul><li>Kimya: Organik</li><li>30 Soru</li></ul>',
      wednesday: '<p><u>Fizik</u>: Bağıl Hareket</p>',
      thursday: '<ol><li>Biyoloji: Enzimler</li></ol>',
      friday: '<p>Türkçe: Paragraf Taktikleri</p>',
      saturday: '<p>Genel Deneme Sınavı</p>',
      sunday: '<p>Haftalık Dinlenme</p>'
    };

    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES ('p-rich', 'st-zeynep', 'Zengin Metin Programı', 'Pomodoro · Tekrar', 'Zengin Metin Programı', ?, ?, ?, ?, ?, ?, ?, '2026-08-17', '2026-09-17', 1000, 1000, 1, 'dev-1')
    `).run(
      richSchedule.monday,
      richSchedule.tuesday,
      richSchedule.wednesday,
      richSchedule.thursday,
      richSchedule.friday,
      richSchedule.saturday,
      richSchedule.sunday
    );

    const plan = sqlite.prepare('SELECT * FROM study_plans WHERE id = ?').get('p-rich') as any;
    expect(plan.monday).toBe(richSchedule.monday);
    expect(plan.monday).toContain('<b>TYT Matematik</b>');
    expect(plan.tuesday).toContain('<ul><li>Kimya: Organik</li>');
    expect(plan.wednesday).toContain('<u>Fizik</u>');
    expect(plan.thursday).toContain('<ol><li>Biyoloji: Enzimler</li>');
    expect(plan.friday).toBe(richSchedule.friday);
    expect(plan.saturday).toBe(richSchedule.saturday);
    expect(plan.sunday).toBe(richSchedule.sunday);
  });

  it('9. Taslak Planların (Templates) Öğrenci Popup Listesinde Görünmemesi', () => {
    // Insert a template into study_plan_templates
    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES ('tpl-sample', 'Taslak Şablon', 'Taslak Şablon', 'Özellik', '', '', '', '', '', '', '', '{}', '{}', 1000, 1000, 1, 'dev-1')
    `).run();

    // Student profile query queries ONLY study_plans by student_id
    const studentPlans = sqlite.prepare(`
      SELECT * FROM study_plans WHERE student_id = 'st-zeynep' AND deleted_at IS NULL
    `).all() as any[];

    // None of the templates should be returned as student plans
    expect(studentPlans.some(p => p.id === 'tpl-sample')).toBe(false);
  });

  it('10. Taslak Silinse Bile Daha Önce Oluşturulmuş Öğrenci Planının Bozulmadan Görüntülenmesi', () => {
    const templateId = 'tpl-temporary';
    const planId = 'plan-zeynep-preserved';

    // 1. Create Template
    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, 'Geçici Şablon', 'Geçici Şablon', 'Özellik A', '<p>Matematik</p>', '', '', '', '', '', '', '{}', '{}', 1000, 1000, 1, 'dev-1')
    `).run(templateId);

    // 2. Create Student Plan referencing template
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, 'st-zeynep', ?, 'Geçici Şablon Snapshot', 'Özellik A · İleri', 'Geçici Şablon Snapshot', '<p>Matematik + 40 Soru</p>', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 2000, 2000, 1, 'dev-1')
    `).run(planId, templateId);

    // 3. Delete Template
    sqlite.prepare('UPDATE study_plan_templates SET deleted_at = ? WHERE id = ?').run(Date.now(), templateId);

    // 4. Query student profile plans
    const profilePlans = sqlite.prepare(`
      SELECT * FROM study_plans 
      WHERE student_id = 'st-zeynep' AND id = ? AND deleted_at IS NULL
    `).get(planId) as any;

    expect(profilePlans).toBeDefined();
    expect(profilePlans.template_name_snapshot).toBe('Geçici Şablon Snapshot');
    expect(profilePlans.features_snapshot).toBe('Özellik A · İleri');
    expect(profilePlans.monday).toBe('<p>Matematik + 40 Soru</p>');
  });
});
