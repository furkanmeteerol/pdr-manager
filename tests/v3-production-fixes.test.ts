import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../database/schema';
import { runMigrations } from '../electron/services/database/migrations';
import { StudentService } from '../electron/services/students/StudentService';
import { CreateStudentSchema } from '../shared/validation';
import fs from 'node:fs';
import path from 'node:path';

describe('Production Bug Fixes: Student FK Integrity & Class Selection', () => {
  let sqlite: Database.Database;
  let db: any;
  let studentService: StudentService;
  let testTempDir: string;
  let mockSyncEngine: any;

  beforeEach(() => {
    testTempDir = path.join(process.cwd(), `temp_prod_fixes_${Date.now()}`);
    fs.mkdirSync(testTempDir, { recursive: true });

    sqlite = new Database(':memory:');
    runMigrations(sqlite);
    db = drizzle(sqlite, { schema });

    // Seed default institutional records as done by DatabaseService
    const now = Date.now();
    sqlite.prepare(`
      INSERT INTO schools (id, name, counselor_name, created_at, updated_at, version, last_modified_device_id)
      VALUES ('default-school', 'Cumhuriyet Anadolu Lisesi', 'Psikolojik Danışman', ?, ?, 1, 'DEVICE-TEST')
    `).run(now, now);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, is_archived, created_at, updated_at, version, last_modified_device_id)
      VALUES ('default-year', '2026-2027', '2026-09-01', '2027-06-30', 1, 0, ?, ?, 1, 'DEVICE-TEST')
    `).run(now, now);

    mockSyncEngine = {
      queueChange: () => {}
    };

    studentService = new StudentService(db, 'DEVICE-TEST', mockSyncEngine);
  });

  afterEach(() => {
    sqlite.close();
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  describe('Student Creation with and without Class Selection', () => {
    it('should successfully create student when class is NOT selected (empty string / Sınıf Seçiniz)', () => {
      // 1. Validate Schema transformation
      const rawPayload = {
        schoolYearId: 'default-year',
        classId: '', // User left dropdown on "Sınıf Seçiniz"
        studentNumber: '1232',
        firstName: 'Misdo',
        lastName: 'Fadıl',
        gender: 'male',
        status: 'active'
      };

      const parsed = CreateStudentSchema.safeParse(rawPayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.classId).toBeNull();

      // 2. Insert via StudentService with classId: null
      const student = studentService.createStudent(parsed.data as any);
      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.firstName).toBe('Misdo');
      expect(student.lastName).toBe('Fadıl');
      expect(student.studentNumber).toBe('1232');
      expect(student.classId).toBeNull();
      expect(student.schoolYearId).toBe('default-year');
    });

    it('should successfully create student when class IS selected', () => {
      // Insert a test class
      const classId = crypto.randomUUID();
      const now = Date.now();
      sqlite.prepare(`
        INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
        VALUES (?, 'default-year', '10-A', 10, 'A', ?, ?, 1, 'DEVICE-TEST')
      `).run(classId, now, now);

      const rawPayload = {
        schoolYearId: 'default-year',
        classId,
        studentNumber: '1042',
        firstName: 'Zeynep',
        lastName: 'Kaya',
        gender: 'female',
        status: 'active'
      };

      const parsed = CreateStudentSchema.safeParse(rawPayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data?.classId).toBe(classId);

      const student = studentService.createStudent(parsed.data as any);
      expect(student).toBeDefined();
      expect(student.classId).toBe(classId);
      expect(student.className).toBe('10-A');
    });

    it('should fallback to default active school year if schoolYearId is unspecified or not found', () => {
      const student = studentService.createStudent({
        schoolYearId: 'non-existent-year',
        studentNumber: '9999',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        gender: 'male'
      });

      expect(student).toBeDefined();
      expect(student.schoolYearId).toBe('default-year');
    });
  });
});
