import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { AppointmentService } from '../electron/services/appointments/AppointmentService';
import { AppointmentScheduler } from '../electron/services/notifications/AppointmentScheduler';
import { notificationService } from '../electron/services/notifications/NotificationService';
import { getQuoteOfTheDay, PSYCHOLOGY_QUOTES } from '../src/data/psychologyQuotes';

describe('Appointment Reminders, Water Tracker & Psychology Quotes Module Tests', () => {
  const testDir = path.join(__dirname, 'temp_notifications_water_quotes_env');
  let dbService: DatabaseService;
  let appointmentService: AppointmentService;
  let scheduler: AppointmentScheduler;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    dbService = new DatabaseService();
    dbService.init(testDir);
    const db = dbService.getDb();
    const deviceId = dbService.ensureDeviceId();

    scheduler = new AppointmentScheduler(db);
    appointmentService = new AppointmentService(db, deviceId, undefined, scheduler);
  });

  afterEach(() => {
    scheduler.clearAll();
    try {
      dbService.close();
    } catch {}
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. Water tracker gets and sets daily intake count in SQLite app_meta', () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `water_intake_${today}`;

    // Initially should be null / 0
    const initial = dbService.getMeta(key);
    expect(initial).toBeNull();

    // Set count to 4
    dbService.setMeta(key, '4');
    expect(dbService.getMeta(key)).toBe('4');

    // Increment count to 8
    dbService.setMeta(key, '8');
    expect(dbService.getMeta(key)).toBe('8');
  });

  it('2. Psychology Quotes catalog contains exactly 300 verified quotes, unique IDs, and rotates deterministically', () => {
    expect(PSYCHOLOGY_QUOTES.length).toBe(300);

    // Verify unique IDs from 1 to 300
    const ids = PSYCHOLOGY_QUOTES.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(300);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(300);

    // Verify unique quotes
    const quoteTexts = PSYCHOLOGY_QUOTES.map(q => q.quote);
    const uniqueQuotes = new Set(quoteTexts);
    expect(uniqueQuotes.size).toBe(300);

    // Verify all quotes have authentic authors and no fake institutional authors
    const forbiddenPhrases = ['MEB', 'Rehberlik Anlayışı', 'Okul Psikolojik Danışman'];
    for (const q of PSYCHOLOGY_QUOTES) {
      expect(q.quote).toBeTruthy();
      expect(q.author).toBeTruthy();
      expect(q.source).toBeTruthy();
      expect(q.sourceType).toBeTruthy();
      expect(q.field).toBeTruthy();
      expect(q.text).toBe(q.quote); // backward compatibility

      for (const phrase of forbiddenPhrases) {
        expect(q.author.toLowerCase()).not.toContain(phrase.toLowerCase());
        expect(q.quote.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }

    const q1 = getQuoteOfTheDay();
    const q2 = getQuoteOfTheDay();

    // Should return identical quote within the same call/day
    expect(q1.quote.text).toBe(q2.quote.text);
    expect(q1.quote.quote).toBe(q2.quote.quote);
    expect(q1.quote.author).toBe(q2.quote.author);
    expect(q1.totalCount).toBe(300);
    expect(q1.index).toBeGreaterThan(0);
    expect(q1.index).toBeLessThanOrEqual(300);
  });

  it('3. AppointmentScheduler initializes and schedules upcoming appointments without errors', () => {
    const showNotificationSpy = vi.spyOn(notificationService, 'showNotification').mockImplementation(() => {});

    // Create a future appointment (tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const appt = appointmentService.createAppointment({
      schoolYearId: 'default-year',
      title: 'Kariyer ve Tercih Danışmanlığı',
      date: tomorrow,
      startTime: '10:00',
      endTime: '10:45',
      location: 'Rehberlik Odası',
      reminderMinutes: 15
    });

    expect(appt.id).toBeDefined();
    expect(appt.reminderMinutes).toBe(15);
    expect(appt.notificationSent).toBe(false);

    // Initializing scheduler re-queries DB and schedules
    scheduler.init();

    // Updating status to completed should cancel the scheduled timer
    appointmentService.updateStatus(appt.id, 'completed', 'Görüşme tamamlandı');

    const checkAppt = appointmentService.getAppointmentById(appt.id);
    expect(checkAppt?.status).toBe('completed');

    // Soft delete appointment
    const deleted = appointmentService.softDeleteAppointment(appt.id);
    expect(deleted).toBe(true);

    showNotificationSpy.mockRestore();
  });

  it('4. MEBBİS unprocessed meetings detection and state integrity', () => {
    const rawSqlite = dbService.getSqlite();
    const now = Date.now();

    // Insert student
    rawSqlite.prepare(`
      INSERT INTO students (id, school_year_id, student_number, first_name, last_name, gender, created_at, updated_at, last_modified_device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('st-101', 'default-year', '555', 'Ahmet', 'Yılmaz', 'male', now, now, 'DEV-1');

    // Insert 2 meetings: 1 processed, 1 unprocessed
    rawSqlite.prepare(`
      INSERT INTO meetings (id, school_year_id, student_id, meeting_type, date, start_time, duration, subject, summary, notes, mebbis_processed, created_at, updated_at, last_modified_device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('m-1', 'default-year', 'st-101', 'student', '2026-09-06', '09:00', 30, 'Görüşme 1', 'Özet 1', 'Not 1', 1, now, now, 'DEV-1');

    rawSqlite.prepare(`
      INSERT INTO meetings (id, school_year_id, student_id, meeting_type, date, start_time, duration, subject, summary, notes, mebbis_processed, created_at, updated_at, last_modified_device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('m-2', 'default-year', 'st-101', 'student', '2026-09-06', '10:00', 30, 'Görüşme 2', 'Özet 2', 'Not 2', 0, now, now, 'DEV-1');

    const allMeetings = rawSqlite.prepare('SELECT id, mebbis_processed FROM meetings WHERE deleted_at IS NULL').all() as any[];
    expect(allMeetings.length).toBe(2);

    const unprocessed = allMeetings.filter(m => m.mebbis_processed === 0);
    expect(unprocessed.length).toBe(1);
    expect(unprocessed[0].id).toBe('m-2');

    // Process m-2 in MEBBIS
    rawSqlite.prepare('UPDATE meetings SET mebbis_processed = 1 WHERE id = ?').run('m-2');
    const updatedUnprocessed = rawSqlite.prepare('SELECT id FROM meetings WHERE mebbis_processed = 0 AND deleted_at IS NULL').all() as any[];
    expect(updatedUnprocessed.length).toBe(0);
  });
});
