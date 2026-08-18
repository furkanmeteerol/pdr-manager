import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';

describe('Database & Migration Engine', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_db');
  const dbPath = path.join(tempDir, 'test_pdr.sqlite');
  let sqlite: Database.Database;

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
  });

  afterEach(() => {
    if (sqlite) {
      sqlite.close();
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should enable WAL mode and foreign keys pragma', () => {
    const journalMode = sqlite.pragma('journal_mode', { simple: true });
    const foreignKeys = sqlite.pragma('foreign_keys', { simple: true });

    expect(journalMode).toBe('wal');
    expect(foreignKeys).toBe(1);
  });

  it('should run migrations and create all core tables', () => {
    runMigrations(sqlite);

    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('app_meta');
    expect(tableNames).toContain('devices');
    expect(tableNames).toContain('schools');
    expect(tableNames).toContain('students');
    expect(tableNames).toContain('meetings');
    expect(tableNames).toContain('sync_changes');
    expect(tableNames).toContain('audit_logs');
  });

  it('should insert and query a student in transaction', () => {
    runMigrations(sqlite);

    // Insert dummy school year
    const yearId = 'year-2026';
    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES (?, '2026-2027', '2026-09-01', '2027-06-15', 1, 1000, 1000, 1, 'DEVICE-TEST')
    `).run(yearId);

    // Insert student
    const studentId = 'student-1001';
    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, student_number, first_name, last_name, gender, status, created_at, updated_at, version, last_modified_device_id)
      VALUES (?, ?, '1042', 'Zeynep', 'Kaya', 'female', 'active', 1000, 1000, 1, 'DEVICE-TEST')
    `).run(studentId, yearId);

    const student = sqlite.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
    expect(student).toBeDefined();
    expect(student.first_name).toBe('Zeynep');
    expect(student.student_number).toBe('1042');
  });
});
