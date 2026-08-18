import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { StudentService } from '../electron/services/students/StudentService';
import { MeetingService } from '../electron/services/meetings/MeetingService';
import { AppointmentService } from '../electron/services/appointments/AppointmentService';
import { TaskService } from '../electron/services/tasks/TaskService';
import { SearchService } from '../electron/services/search/SearchService';

describe('Phase V1: Global Search Indexing (Ctrl+K)', () => {
  const tempDir = path.join(process.cwd(), 'temp_search_test_db');
  const dbPath = path.join(tempDir, 'test_search.sqlite');
  let sqlite: Database.Database;
  let searchService: SearchService;

  beforeEach(async () => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-15', 1, 1000, 1000, 1, 'DEVICE-TEST')
    `).run();

    const syncEngine = new SyncEngine(conn.db, 'DEVICE-TEST');
    const studentService = new StudentService(conn.db, 'DEVICE-TEST', syncEngine);
    const meetingService = new MeetingService(conn.db, 'DEVICE-TEST', syncEngine);
    const appointmentService = new AppointmentService(conn.db, 'DEVICE-TEST', syncEngine);
    const taskService = new TaskService(conn.db, 'DEVICE-TEST', syncEngine);
    searchService = new SearchService(conn.db);

    // Seed test data
    await studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '1042',
      firstName: 'Berk',
      lastName: 'Aydın',
      gender: 'male'
    });

    await meetingService.createMeeting({
      schoolYearId: 'year-2026',
      meetingType: 'student',
      date: '2026-08-20',
      startTime: '10:00',
      subject: 'YKS Kariyer ve Üniversite Seçimi',
      summary: 'Öğrencinin mühendislik bölümlerine ilgisi değerlendirildi.'
    });

    await appointmentService.createAppointment({
      schoolYearId: 'year-2026',
      title: 'Berk Aydın Veli Randevusu',
      date: '2026-08-22',
      startTime: '15:00',
      endTime: '15:30'
    });

    await taskService.createTask({
      title: 'Berk için hedef net tablosu hazırla'
    });
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should find student by name and student number', async () => {
    const resName = await searchService.query('Berk');
    expect(resName.some(r => r.type === 'student' && r.title === 'Berk Aydın')).toBe(true);

    const resNumber = await searchService.query('1042');
    expect(resNumber.some(r => r.type === 'student' && r.title === 'Berk Aydın')).toBe(true);
  });

  it('should find meeting by subject keyword', async () => {
    const res = await searchService.query('Kariyer');
    expect(res.some(r => r.type === 'meeting' && r.title.includes('Kariyer'))).toBe(true);
  });

  it('should find appointment and task across unified query', async () => {
    const res = await searchService.query('Berk');
    expect(res.some(r => r.type === 'student')).toBe(true);
    expect(res.some(r => r.type === 'appointment')).toBe(true);
    expect(res.some(r => r.type === 'task')).toBe(true);
  });
});
