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

describe('Phase V1: Multi-PC Sync Queue Integration for All V1 Entities', () => {
  const tempDir = path.join(process.cwd(), 'temp_sync_v1_test_db');
  const dbPath = path.join(tempDir, 'test_sync_v1.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let studentService: StudentService;
  let meetingService: MeetingService;
  let appointmentService: AppointmentService;
  let taskService: TaskService;

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
    appointmentService = new AppointmentService(conn.db, 'DEVICE-TEST', syncEngine);
    taskService = new TaskService(conn.db, 'DEVICE-TEST', syncEngine);
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should record sync changes for Student, Meeting, Appointment, and Task operations', async () => {
    // 1. Create Student
    const student = await studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '3001',
      firstName: 'Can',
      lastName: 'Korkmaz',
      gender: 'male'
    });

    // 2. Create Meeting
    const meeting = await meetingService.createMeeting({
      schoolYearId: 'year-2026',
      studentId: student.id,
      meetingType: 'student',
      date: '2026-08-28',
      startTime: '13:00',
      subject: 'Uyum ve Oryantasyon',
      summary: 'Okula yeni başlayan öğrenci ile uyum görüşmesi.'
    });

    // 3. Create Appointment
    const appt = await appointmentService.createAppointment({
      schoolYearId: 'year-2026',
      studentId: student.id,
      title: 'Can Korkmaz Takip Randevusu',
      date: '2026-09-05',
      startTime: '11:00',
      endTime: '11:30'
    });

    // 4. Create Task
    const task = await taskService.createTask({
      title: 'Can Korkmaz ders öğretmenleriyle görüş',
      studentId: student.id
    });

    // Verify sync_changes table
    const changes = sqlite.prepare('SELECT * FROM sync_changes ORDER BY changed_at ASC').all() as any[];
    expect(changes.length).toBeGreaterThanOrEqual(4);

    const studentChange = changes.find(c => c.entity_type === 'students' && c.entity_id === student.id);
    expect(studentChange).toBeDefined();
    expect(studentChange.operation).toBe('create');
    expect(studentChange.base_version).toBe(0);
    expect(studentChange.new_version).toBe(1);

    const meetingChange = changes.find(c => c.entity_type === 'meetings' && c.entity_id === meeting.id);
    expect(meetingChange).toBeDefined();
    expect(meetingChange.operation).toBe('create');

    const apptChange = changes.find(c => c.entity_type === 'appointments' && c.entity_id === appt.id);
    expect(apptChange).toBeDefined();

    const taskChange = changes.find(c => c.entity_type === 'tasks' && c.entity_id === task.id);
    expect(taskChange).toBeDefined();

    // 5. Update Student and verify base snapshot & version bump in sync queue
    studentService.updateStudent(student.id, { phone: '05559998877' });
    const updateChanges = sqlite.prepare("SELECT * FROM sync_changes WHERE entity_type = 'students' AND operation = 'update'").all() as any[];
    expect(updateChanges.length).toBe(1);
    expect(updateChanges[0].base_version).toBe(1);
    expect(updateChanges[0].new_version).toBe(2);
    expect(updateChanges[0].base_snapshot).toBeDefined();
    const snapshot = JSON.parse(updateChanges[0].base_snapshot);
    expect(snapshot.id).toBe(student.id);
  });
});
