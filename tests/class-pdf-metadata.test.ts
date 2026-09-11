import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

describe('Sınıf Listesi PDF Metadata ve Kalıcılık Test Paketi', () => {
  const testDir = path.join(process.cwd(), 'temp_class_pdf_test');
  let dbService: DatabaseService;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(testDir, { recursive: true });
    dbService = new DatabaseService();
    dbService.init(testDir);
  });

  afterEach(() => {
    if (dbService) {
      try { dbService.close(); } catch {}
    }
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. Migration 15 adds pdf_uploaded_at, pdf_upload_date, pdf_upload_time columns to classes', () => {
    const rawDb = dbService.getRawSqlite();
    const columns = rawDb.prepare("PRAGMA table_info('classes')").all() as Array<{ name: string; type: string }>;
    const colNames = columns.map(c => c.name);

    expect(colNames).toContain('pdf_path');
    expect(colNames).toContain('pdf_name');
    expect(colNames).toContain('pdf_uploaded_at');
    expect(colNames).toContain('pdf_upload_date');
    expect(colNames).toContain('pdf_upload_time');
  });

  it('2. Saving class PDF metadata persists upload date and time in SQLite', () => {
    const db = dbService.getDb();
    const rawDb = dbService.getRawSqlite();
    const deviceId = dbService.ensureDeviceId();
    const now = Date.now();

    // Create a test class
    db.insert(schema.classes).values({
      id: 'class-10-b',
      schoolYearId: 'default-year',
      name: '10-B',
      grade: 10,
      branch: 'B',
      teacherName: 'Fatma Öğretmen',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: deviceId
    }).run();

    // Simulate saving a class PDF with upload date and time
    const uploadTimestamp = 1788700000000;
    const dateObj = new Date(uploadTimestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const uploadDate = `${pad(dateObj.getDate())}.${pad(dateObj.getMonth() + 1)}.${dateObj.getFullYear()}`;
    const uploadTime = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

    db.update(schema.classes).set({
      pdfPath: 'documents/class_lists/class_10-b.pdf',
      pdfName: '10-B_Sinif_Listesi.pdf',
      pdfUploadedAt: uploadTimestamp,
      pdfUploadDate: uploadDate,
      pdfUploadTime: uploadTime,
      updatedAt: uploadTimestamp
    }).where(eq(schema.classes.id, 'class-10-b')).run();

    // Direct SQL query verification
    const row = rawDb.prepare("SELECT * FROM classes WHERE id = 'class-10-b'").get() as any;
    expect(row).toBeDefined();
    expect(row.pdf_path).toBe('documents/class_lists/class_10-b.pdf');
    expect(row.pdf_name).toBe('10-B_Sinif_Listesi.pdf');
    expect(row.pdf_uploaded_at).toBe(uploadTimestamp);
    expect(row.pdf_upload_date).toBe(uploadDate);
    expect(row.pdf_upload_time).toBe(uploadTime);
  });

  it('3. Upload date and time persist across database restarts', () => {
    const db = dbService.getDb();
    const deviceId = dbService.ensureDeviceId();
    const now = Date.now();

    db.insert(schema.classes).values({
      id: 'class-11-c',
      schoolYearId: 'default-year',
      name: '11-C',
      grade: 11,
      branch: 'C',
      pdfPath: 'documents/class_lists/class_11-c.pdf',
      pdfName: '11-C_Resmi_Liste.pdf',
      pdfUploadedAt: now,
      pdfUploadDate: '06.09.2026',
      pdfUploadTime: '14:30',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: deviceId
    }).run();

    // Close and re-open DatabaseService (simulating app restart)
    dbService.close();

    const newDbService = new DatabaseService();
    newDbService.init(testDir);
    const reloadedDb = newDbService.getRawSqlite();

    const row = reloadedDb.prepare("SELECT * FROM classes WHERE id = 'class-11-c'").get() as any;
    expect(row).toBeDefined();
    expect(row.pdf_path).toBe('documents/class_lists/class_11-c.pdf');
    expect(row.pdf_name).toBe('11-C_Resmi_Liste.pdf');
    expect(row.pdf_uploaded_at).toBe(now);
    expect(row.pdf_upload_date).toBe('06.09.2026');
    expect(row.pdf_upload_time).toBe('14:30');

    newDbService.close();
  });

  it('4. Deleting class PDF clears upload date and time metadata', () => {
    const db = dbService.getDb();
    const rawDb = dbService.getRawSqlite();
    const deviceId = dbService.ensureDeviceId();
    const now = Date.now();

    db.insert(schema.classes).values({
      id: 'class-12-a',
      schoolYearId: 'default-year',
      name: '12-A',
      grade: 12,
      branch: 'A',
      pdfPath: 'documents/class_lists/class_12-a.pdf',
      pdfName: '12-A_Liste.pdf',
      pdfUploadedAt: now,
      pdfUploadDate: '06.09.2026',
      pdfUploadTime: '15:45',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: deviceId
    }).run();

    // Delete class PDF
    db.update(schema.classes).set({
      pdfPath: null,
      pdfName: null,
      pdfUploadedAt: null,
      pdfUploadDate: null,
      pdfUploadTime: null,
      updatedAt: Date.now()
    }).where(eq(schema.classes.id, 'class-12-a')).run();

    const row = rawDb.prepare("SELECT * FROM classes WHERE id = 'class-12-a'").get() as any;
    expect(row).toBeDefined();
    expect(row.pdf_path).toBeNull();
    expect(row.pdf_name).toBeNull();
    expect(row.pdf_uploaded_at).toBeNull();
    expect(row.pdf_upload_date).toBeNull();
    expect(row.pdf_upload_time).toBeNull();
  });
});
