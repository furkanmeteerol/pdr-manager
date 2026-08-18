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

describe('Phase V1: Comprehensive Domain CRUD & Relations', () => {
  const tempDir = path.join(process.cwd(), 'temp_v1_test_db');
  const dbPath = path.join(tempDir, 'test_v1.sqlite');
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

    // Setup active school year
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

  it('should create, update, and soft-delete a student with parent links', async () => {
    // 1. Create Student with parents
    const created = await studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '1042',
      firstName: 'Ahmet',
      lastName: 'Yıldız',
      gender: 'male',
      phone: '05551112233',
      parents: [
        { firstName: 'Fatma', lastName: 'Yıldız', phone: '05559998877', relationship: 'Anne', isPrimary: true }
      ]
    });

    expect(created.id).toBeDefined();
    expect(created.firstName).toBe('Ahmet');
    expect(created.parents?.length).toBe(1);
    expect(created.parents?.[0].firstName).toBe('Fatma');
    expect(created.version).toBe(1);

    // 2. Update Student
    const updated = await studentService.updateStudent(created.id, {
      phone: '05554445566',
      notes: 'Görüşme talep etti'
    });
    expect(updated.phone).toBe('05554445566');
    expect(updated.notes).toBe('Görüşme talep etti');
    expect(updated.version).toBe(2);

    // 3. Soft Delete
    const deleted = await studentService.softDeleteStudent(created.id);
    expect(deleted).toBe(true);

    const listAfterDelete = await studentService.listStudents();
    expect(listAfterDelete.find(s => s.id === created.id)).toBeUndefined();
  });

  it('should create meeting with dynamic tags and calculate follow-up badge', async () => {
    const student = await studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '2050',
      firstName: 'Elif',
      lastName: 'Demir',
      gender: 'female'
    });

    const meeting = await meetingService.createMeeting({
      schoolYearId: 'year-2026',
      studentId: student.id,
      meetingType: 'student',
      date: '2026-08-25',
      startTime: '10:00',
      duration: 45,
      subject: 'Sınav Kaygısı ve Motivasyon',
      summary: 'Öğrencinin deneme sınavları öncesi yaşadığı kaygı üzerine konuşuldu.',
      notes: 'Bilişsel yeniden çerçeveleme teknikleri anlatıldı.',
      decisions: 'Haftalık çalışma çizelgesi tutulacak.',
      followUpRequired: true,
      followUpDate: '2026-09-01',
      tagNames: ['Sınav Kaygısı', 'Motivasyon']
    });

    expect(meeting.id).toBeDefined();
    expect(meeting.followUpRequired).toBe(true);
    expect(meeting.followUpDate).toBe('2026-09-01');
    expect(meeting.tags?.length).toBe(2);
    expect(meeting.tags?.map(t => t.name)).toContain('Sınav Kaygısı');

    // Check student profile reflects meeting stats
    const studentProfile = await studentService.getStudentById(student.id);
    expect(studentProfile?.meetingCount).toBe(1);
    expect(studentProfile?.hasFollowUp).toBe(true);
  });

  it('should manage appointments and status transitions', async () => {
    const appt = await appointmentService.createAppointment({
      schoolYearId: 'year-2026',
      title: 'Veli Bilgilendirme Toplantısı',
      date: '2026-08-20',
      startTime: '14:00',
      endTime: '14:40',
      location: 'PDR Odası'
    });

    expect(appt.id).toBeDefined();
    expect(appt.status).toBe('scheduled');
    expect(appt.version).toBe(1);

    const updated = await appointmentService.updateStatus(appt.id, 'completed');
    expect(updated.status).toBe('completed');
    expect(updated.version).toBe(2);
  });

  it('should manage tasks, completion toggles, and overdue flags', async () => {
    const task = await taskService.createTask({
      title: 'RAM Değerlendirme Raporu Hazırla',
      dueDate: '2026-01-01', // Past date -> overdue
      priority: 'urgent',
      category: 'special_education'
    });

    expect(task.id).toBeDefined();
    expect(task.completed).toBe(false);
    expect(task.isOverdue).toBe(true);

    const completedTask = await taskService.toggleComplete(task.id, true);
    expect(completedTask.completed).toBe(true);
    expect(completedTask.completedAt).toBeDefined();
  });
});
