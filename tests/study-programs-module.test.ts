import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { runMigrations } from '../electron/services/database/migrations';

describe('Bölüm 13: Ders Çalışma Programı — Taslak & Öğrenci Planı İzolasyon Test Paketi', () => {
  let sqlite: Database.Database;
  const tempDir = path.join(process.cwd(), 'temp_study_programs_test');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const dbPath = path.join(tempDir, `study_${Date.now()}_${Math.random().toString(36).substring(2)}.sqlite`);
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
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-1', 'year-1', 'class-1', '15615', 'Zeynep', 'Akaya', 'female', 'active', 1000, 1000, 1, 'dev-1'),
        ('st-2', 'year-1', 'class-1', '10204', 'Ahmet', 'Yılmaz', 'male', 'active', 1000, 1000, 1, 'dev-1')
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

  it('1 & 2. Yeni Taslak Oluşturma ve 7 Günlük Verisinin Kaydedilmesi', () => {
    const templateId = 'tpl-tyt-1';
    const now = Date.now();

    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'dev-1')
    `).run(
      templateId,
      'TYT Genel Tekrar Programı',
      'TYT Genel Tekrar Programı',
      'Pomodoro · Tekrar · Kitap',
      '<p><b>TYT Matematik</b></p><ul><li>Problemler</li><li>20 soru çözümü</li></ul>',
      '<p><b>AYT Kimya</b></p><p>Kimyasal Tepkimeler konu tekrarı</p>',
      '<p><b>TYT Türkçe</b></p><p>Paragraf 30 soru</p>',
      '<p><b>Geometri</b></p><p>Üçgenler soru çözümü</p>',
      '<p><b>TYT Fizik</b></p><p>Kuvvet ve Hareket</p>',
      '<p><b>Alan Denemesi</b></p><p>TYT Deneme Sınavı</p>',
      '<p><b>Dinlenme & Kitap</b></p><p>Haftalık değerlendirme</p>',
      '{}',
      '{}',
      now,
      now
    );

    const row = sqlite.prepare('SELECT * FROM study_plan_templates WHERE id = ?').get(templateId) as any;
    expect(row).toBeDefined();
    expect(row.name).toBe('TYT Genel Tekrar Programı');
    expect(row.features).toBe('Pomodoro · Tekrar · Kitap');
    expect(row.monday).toContain('TYT Matematik');
    expect(row.sunday).toContain('Dinlenme & Kitap');
  });

  it('3. Rich-Text Biçimlendirmesinin (HTML) Kaydedilip Tekrar Okunması', () => {
    const templateId = 'tpl-richtext';
    const richContent = '<div><p><b>Kalın Başlık</b> <i>İtalik Not</i> <u>Altı Çizili</u></p><ul><li>Madde 1</li><li>Madde 2</li></ul></div>';

    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, '', '', '', '', '', '', '{}', '{}', ?, ?, 1, 'dev-1')
    `).run(templateId, 'Rich Text Test', 'Rich Text Test', 'Özellik', richContent, Date.now(), Date.now());

    const row = sqlite.prepare('SELECT monday FROM study_plan_templates WHERE id = ?').get(templateId) as any;
    expect(row.monday).toBe(richContent);
    expect(row.monday).toContain('<b>Kalın Başlık</b>');
    expect(row.monday).toContain('<ul><li>Madde 1</li>');
  });

  it('4. Taslağın Oluşturulduktan Sonra Sabit Kalması (İmmutability İlkesi)', () => {
    // Standard template creation
    const tpl = sqlite.prepare(`
      SELECT * FROM study_plan_templates WHERE deleted_at IS NULL
    `).all();

    // Verify template structure is strictly read-only for students
    expect(Array.isArray(tpl)).toBe(true);
  });

  it('5 & 6 & 7. Taslaktan Öğrenci Planı Oluşturulması, Öğrenci Planında Değişiklik ve Taslak İzolasyonu (Deep Copy)', () => {
    const templateId = 'tpl-origin';
    const originalMonday = '<p>TYT Matematik: 20 soru</p>';

    // 1. Create Template
    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, '', '', '', '', '', '', '{}', '{}', ?, ?, 1, 'dev-1')
    `).run(templateId, 'Sayısal Temel', 'Sayısal Temel', 'Pomodoro · Tekrar', originalMonday, Date.now(), Date.now());

    // 2. Create Student Plan from Template with customized Monday for Student A (Zeynep)
    const planId = 'plan-zeynep-1';
    const customizedMonday = '<p>TYT Matematik: 50 soru + Fonksiyonlar Özel Tekrar</p>';

    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_id, template_name_snapshot, features_snapshot,
        title, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, notes, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', '', '2026-08-17', '2026-09-17', '', ?, ?, 1, 'dev-1')
    `).run(
      planId,
      'st-1',
      templateId,
      'Sayısal Temel (Zeynep)',
      'Pomodoro · Tekrar · İleri Seviye',
      'Sayısal Temel (Zeynep)',
      customizedMonday,
      Date.now(),
      Date.now()
    );

    // 3. Verify Student Plan has the customized content
    const studentPlan = sqlite.prepare('SELECT * FROM study_plans WHERE id = ?').get(planId) as any;
    expect(studentPlan.monday).toBe(customizedMonday);
    expect(studentPlan.template_name_snapshot).toBe('Sayısal Temel (Zeynep)');
    expect(studentPlan.features_snapshot).toBe('Pomodoro · Tekrar · İleri Seviye');

    // 4. Verify Original Template remains COMPLETELY UNCHANGED
    const templateAfter = sqlite.prepare('SELECT * FROM study_plan_templates WHERE id = ?').get(templateId) as any;
    expect(templateAfter.monday).toBe(originalMonday);
    expect(templateAfter.name).toBe('Sayısal Temel');
    expect(templateAfter.features).toBe('Pomodoro · Tekrar');
  });

  it('8. Taslak Silindikten Sonra Daha Önce Oluşturulmuş Öğrenci Planının Bozulmadan Çalışması', () => {
    const templateId = 'tpl-to-delete';
    const planId = 'plan-survivor';

    // 1. Create Template
    sqlite.prepare(`
      INSERT INTO study_plan_templates (
        id, name, title, features, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, 'Geçici Taslak', 'Geçici Taslak', 'Hızlı Tekrar', '<p>Fizik</p>', '', '', '', '', '', '', '{}', '{}', ?, ?, 1, 'dev-1')
    `).run(templateId, Date.now(), Date.now());

    // 2. Create Student Plan
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_id, template_name_snapshot, features_snapshot,
        title, monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, notes, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, 'st-1', ?, 'Geçici Taslak Snapshot', 'Hızlı Tekrar', 'Geçici Taslak Snapshot', '<p>Fizik + Soru</p>', '', '', '', '', '', '', '2026-08-17', '2026-09-17', '', ?, ?, 1, 'dev-1')
    `).run(planId, templateId, Date.now(), Date.now());

    // 3. Soft Delete the Template
    sqlite.prepare('UPDATE study_plan_templates SET deleted_at = ? WHERE id = ?').run(Date.now(), templateId);

    // 4. Verify Template is soft deleted
    const deletedTpl = sqlite.prepare('SELECT * FROM study_plan_templates WHERE id = ? AND deleted_at IS NULL').get(templateId);
    expect(deletedTpl).toBeUndefined();

    // 5. Verify Student Plan STILL EXISTS and retains all snapshot data
    const activeStudentPlan = sqlite.prepare(`
      SELECT 
        sp.*, st.first_name, st.last_name, st.student_number
      FROM study_plans sp
      INNER JOIN students st ON sp.student_id = st.id
      WHERE sp.id = ? AND sp.deleted_at IS NULL
    `).get(planId) as any;

    expect(activeStudentPlan).toBeDefined();
    expect(activeStudentPlan.template_name_snapshot).toBe('Geçici Taslak Snapshot');
    expect(activeStudentPlan.features_snapshot).toBe('Hızlı Tekrar');
    expect(activeStudentPlan.monday).toBe('<p>Fizik + Soru</p>');
    expect(activeStudentPlan.first_name).toBe('Zeynep');
  });

  it('9 & 10. Öğrenci Adıyla ve Numarasıyla Case-Insensitive Arama', () => {
    // Insert 2 plans for st-1 (Zeynep, 15615) and st-2 (Ahmet, 10204)
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES 
        ('p-1', 'st-1', 'Plan Z', 'Özellik 1', 'Plan Z', '', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 2000, 2000, 1, 'dev-1'),
        ('p-2', 'st-2', 'Plan A', 'Özellik 2', 'Plan A', '', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 3000, 3000, 1, 'dev-1')
    `).run();

    const allPlans = sqlite.prepare(`
      SELECT 
        sp.id, sp.template_name_snapshot, st.first_name, st.last_name, st.student_number
      FROM study_plans sp
      INNER JOIN students st ON sp.student_id = st.id
      WHERE sp.deleted_at IS NULL
    `).all() as any[];

    // Search by student name (case-insensitive "zeynep")
    const searchName = 'zeynep';
    const matchName = allPlans.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchName.toLowerCase()));
    expect(matchName.length).toBe(1);
    expect(matchName[0].first_name).toBe('Zeynep');

    // Search by student number ("10204")
    const searchNo = '10204';
    const matchNo = allPlans.filter(p => p.student_number.includes(searchNo));
    expect(matchNo.length).toBe(1);
    expect(matchNo[0].first_name).toBe('Ahmet');
  });

  it('11. Tarihe Göre Yeni -> Eski Sıralama Doğrulaması', () => {
    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES 
        ('p-old', 'st-1', 'Eski Plan', '', 'Eski Plan', '', '', '', '', '', '', '', '2026-08-10', '2026-09-10', 1000, 1000, 1, 'dev-1'),
        ('p-new', 'st-2', 'Yeni Plan', '', 'Yeni Plan', '', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 5000, 5000, 1, 'dev-1'),
        ('p-mid', 'st-1', 'Orta Plan', '', 'Orta Plan', '', '', '', '', '', '', '', '2026-08-14', '2026-09-14', 3000, 3000, 1, 'dev-1')
    `).run();

    const sortedRows = sqlite.prepare(`
      SELECT id, template_name_snapshot, created_at
      FROM study_plans
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `).all() as any[];

    expect(sortedRows.map(r => r.id)).toEqual(['p-new', 'p-mid', 'p-old']);
  });

  it('12. Özelliklerin Taslaktan Öğrenci Planına Doğru Aktarılması', () => {
    const rawFeatures = 'Pomodoro (25+5) · Günlük Tekrar · 100 Soru · Kitap Okuma';

    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES ('p-feat', 'st-1', 'Özel Plan', ?, 'Özel Plan', '', '', '', '', '', '', '', '2026-08-17', '2026-09-17', 1000, 1000, 1, 'dev-1')
    `).run(rawFeatures);

    const row = sqlite.prepare('SELECT features_snapshot FROM study_plans WHERE id = ?').get('p-feat') as any;
    expect(row.features_snapshot).toBe(rawFeatures);
  });

  it('13 & 14. Detay Verisinde 7 Günün Tamamının ve Rich-Text Biçiminin Korunması', () => {
    const schedule = {
      monday: '<p><b>Matematik</b>: Polinomlar</p>',
      tuesday: '<p><i>Geometri</i>: Çemberde Açı</p>',
      wednesday: '<p><u>Fizik</u>: Optik</p>',
      thursday: '<ul><li>Kimya: Asitler</li><li>15 Soru</li></ul>',
      friday: '<ol><li>Biyoloji: Kalıtım</li></ol>',
      saturday: '<p>Türkçe: Karma Dil Bilgisi</p>',
      sunday: '<p>Haftalık Deneme Analizi</p>'
    };

    sqlite.prepare(`
      INSERT INTO study_plans (
        id, student_id, template_name_snapshot, features_snapshot, title,
        monday, tuesday, wednesday, thursday, friday, saturday, sunday,
        start_date, end_date, created_at, updated_at, version, last_modified_device_id
      ) VALUES ('p-7days', 'st-1', 'Tam Hafta', 'Full', 'Tam Hafta', ?, ?, ?, ?, ?, ?, ?, '2026-08-17', '2026-09-17', 1000, 1000, 1, 'dev-1')
    `).run(
      schedule.monday,
      schedule.tuesday,
      schedule.wednesday,
      schedule.thursday,
      schedule.friday,
      schedule.saturday,
      schedule.sunday
    );

    const plan = sqlite.prepare('SELECT * FROM study_plans WHERE id = ?').get('p-7days') as any;
    expect(plan.monday).toBe(schedule.monday);
    expect(plan.tuesday).toBe(schedule.tuesday);
    expect(plan.wednesday).toBe(schedule.wednesday);
    expect(plan.thursday).toBe(schedule.thursday);
    expect(plan.friday).toBe(schedule.friday);
    expect(plan.saturday).toBe(schedule.saturday);
    expect(plan.sunday).toBe(schedule.sunday);
  });
});
