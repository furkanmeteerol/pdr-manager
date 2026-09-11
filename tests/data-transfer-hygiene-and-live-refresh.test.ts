import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { AuthService } from '../electron/services/auth/AuthService';
import { DataTransferService } from '../electron/services/backup/DataTransferService';
import { StudentService } from '../electron/services/students/StudentService';
import { encryptionService } from '../electron/services/security/EncryptionService';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import * as schema from '../database/schema';

describe('PDR Manager — .pdrbak Document Hygiene, Dynamic DB Proxy & Live Refresh Test Suite', () => {
  const rootTestDir = path.join(process.cwd(), 'temp_hygiene_refresh_test');
  const pc1Dir = path.join(rootTestDir, 'pc1_env');
  const pc2Dir = path.join(rootTestDir, 'pc2_env');
  const activeDbs: DatabaseService[] = [];

  beforeEach(() => {
    if (fs.existsSync(rootTestDir)) {
      try { fs.rmSync(rootTestDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(pc1Dir, { recursive: true });
    fs.mkdirSync(pc2Dir, { recursive: true });
  });

  afterEach(() => {
    while (activeDbs.length > 0) {
      const db = activeDbs.pop();
      if (db) {
        try { db.close(); } catch {}
      }
    }
    if (fs.existsSync(rootTestDir)) {
      try { fs.rmSync(rootTestDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. Documents & Presentations DB records and physical files are NOT exported or transferred via .pdrbak', async () => {
    // --- PC1 SETUP ---
    const pc1DbService = new DatabaseService();
    activeDbs.push(pc1DbService);
    pc1DbService.init(pc1Dir);
    const pc1DeviceId = pc1DbService.ensureDeviceId();
    const pc1Auth = new AuthService(pc1DbService, pc1Dir);
    await pc1Auth.completeWizard({
      schoolName: 'PC1 Lisesi',
      counselorName: 'PC1 Danışman',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
      localPassword: 'PC1_Password_123'
    });

    // Create PC1 students, classes, documents & presentations
    const pc1Db = pc1DbService.getDb();
    const pc1RawDb = pc1DbService.getRawSqlite();
    const now = Date.now();

    pc1Db.insert(schema.classes).values({
      id: 'class-pc1-9a',
      schoolYearId: 'default-year',
      name: '9-A',
      grade: 9,
      branch: 'A',
      teacherName: 'Ahmet Hoca',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: pc1DeviceId
    }).run();

    pc1Db.insert(schema.students).values({
      id: 'st-pc1-1',
      schoolYearId: 'default-year',
      classId: 'class-pc1-9a',
      studentNumber: '101',
      firstName: 'Ali',
      lastName: 'Yılmaz',
      gender: 'male',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: pc1DeviceId
    }).run();

    // Physical files on PC1
    const pc1DocDir = path.join(pc1Dir, 'documents_storage');
    const pc1PresDir = path.join(pc1Dir, 'presentations_storage');
    fs.mkdirSync(pc1DocDir, { recursive: true });
    fs.mkdirSync(pc1PresDir, { recursive: true });
    fs.writeFileSync(path.join(pc1DocDir, 'pc1_doc.docx'), Buffer.from('PC1_DOC_FILE_CONTENT'));
    fs.writeFileSync(path.join(pc1PresDir, 'pc1_pres.pptx'), Buffer.from('PC1_PRES_FILE_CONTENT'));

    // DB records on PC1
    pc1RawDb.prepare(`
      INSERT INTO counselor_documents (id, title, description, file_path, file_name, file_size, mime_type, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('doc-pc1-record', 'PC1 Gizli Evrak', 'kurum', 'documents_storage/pc1_doc.docx', 'pc1_doc.docx', 1234, 'docx', '2026-08-18', ${now}, ${now}, 1, '${pc1DeviceId}')
    `).run();

    pc1RawDb.prepare(`
      INSERT INTO presentations (id, title, description, file_path, file_name, file_size, mime_type, slide_count, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('pres-pc1-record', 'PC1 Seminer Sunumu', 'egitim', 'presentations_storage/pc1_pres.pptx', 'pc1_pres.pptx', 5678, 'pptx', 12, '2026-08-18', ${now}, ${now}, 1, '${pc1DeviceId}')
    `).run();

    const pc1Transfer = new DataTransferService(pc1DbService, encryptionService, pc1DeviceId, pc1Dir);
    const exportPkgPath = path.join(rootTestDir, 'pc1_export.pdrbak');
    const exportRes = await pc1Transfer.exportDataPackage(exportPkgPath, 'BackupPass123!');
    expect(exportRes.success).toBe(true);

    // Manifest should count students and classes, but not documents
    expect(exportRes.manifest?.counts.students).toBe(1);
    expect(exportRes.manifest?.counts.classes).toBe(1);
    expect((exportRes.manifest?.counts as any).counselorDocuments).toBeUndefined();
    expect((exportRes.manifest?.counts as any).presentations).toBeUndefined();

    // --- PC2 SETUP ---
    const pc2DbService = new DatabaseService();
    activeDbs.push(pc2DbService);
    pc2DbService.init(pc2Dir);
    const pc2DeviceId = pc2DbService.ensureDeviceId();
    const pc2Auth = new AuthService(pc2DbService, pc2Dir);
    await pc2Auth.completeWizard({
      schoolName: 'PC2 Lisesi',
      counselorName: 'PC2 Danışman',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
      localPassword: 'PC2_Password_456'
    });

    // PC2 has its own pre-existing document and presentation
    const pc2DocDir = path.join(pc2Dir, 'documents_storage');
    const pc2PresDir = path.join(pc2Dir, 'presentations_storage');
    fs.mkdirSync(pc2DocDir, { recursive: true });
    fs.mkdirSync(pc2PresDir, { recursive: true });
    fs.writeFileSync(path.join(pc2DocDir, 'pc2_local_doc.docx'), Buffer.from('PC2_LOCAL_DOC_CONTENT'));
    fs.writeFileSync(path.join(pc2PresDir, 'pc2_local_pres.pptx'), Buffer.from('PC2_LOCAL_PRES_CONTENT'));

    const pc2RawDb = pc2DbService.getRawSqlite();
    pc2RawDb.prepare(`
      INSERT INTO counselor_documents (id, title, description, file_path, file_name, file_size, mime_type, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('doc-pc2-local', 'PC2 Özel Evrakı', 'ozel', 'documents_storage/pc2_local_doc.docx', 'pc2_local_doc.docx', 999, 'docx', '2026-08-18', ${now}, ${now}, 1, '${pc2DeviceId}')
    `).run();

    pc2RawDb.prepare(`
      INSERT INTO presentations (id, title, description, file_path, file_name, file_size, mime_type, slide_count, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('pres-pc2-local', 'PC2 Özel Sunumu', 'rehberlik', 'presentations_storage/pc2_local_pres.pptx', 'pc2_local_pres.pptx', 888, 'pptx', 8, '2026-08-18', ${now}, ${now}, 1, '${pc2DeviceId}')
    `).run();

    const pc2Transfer = new DataTransferService(pc2DbService, encryptionService, pc2DeviceId, pc2Dir);

    // Inspect on PC2
    const inspectRes = await pc2Transfer.inspectBackupFile(exportPkgPath, 'BackupPass123!');
    expect(inspectRes.isValid).toBe(true);
    expect(inspectRes.manifest?.counts.students).toBe(1);
    expect((inspectRes.comparison?.diff as any).counselorDocuments).toBeUndefined();
    expect((inspectRes.comparison?.diff as any).presentations).toBeUndefined();

    // Import into PC2
    const importRes = await pc2Transfer.importAndReplaceDatabase(exportPkgPath, 'BackupPass123!');
    expect(importRes.success).toBe(true);

    // Check PC2 database after import:
    const postImportDb = pc2DbService.getRawSqlite();

    // 1. PC1 student and class ARE imported
    const importedStudent = postImportDb.prepare("SELECT * FROM students WHERE id = 'st-pc1-1'").get() as any;
    expect(importedStudent).toBeDefined();
    expect(importedStudent.first_name).toBe('Ali');

    const importedClass = postImportDb.prepare("SELECT * FROM classes WHERE id = 'class-pc1-9a'").get() as any;
    expect(importedClass).toBeDefined();
    expect(importedClass.name).toBe('9-A');

    // 2. PC1 documents & presentations are NOT on PC2
    const pc1DocOnPC2 = postImportDb.prepare("SELECT * FROM counselor_documents WHERE id = 'doc-pc1-record'").get();
    expect(pc1DocOnPC2).toBeUndefined();

    const pc1PresOnPC2 = postImportDb.prepare("SELECT * FROM presentations WHERE id = 'pres-pc1-record'").get();
    expect(pc1PresOnPC2).toBeUndefined();

    expect(fs.existsSync(path.join(pc2DocDir, 'pc1_doc.docx'))).toBe(false);
    expect(fs.existsSync(path.join(pc2PresDir, 'pc1_pres.pptx'))).toBe(false);

    // 3. PC2 pre-existing documents & presentations ARE PRESERVED in DB and on disk
    const pc2DocOnPC2 = postImportDb.prepare("SELECT * FROM counselor_documents WHERE id = 'doc-pc2-local'").get() as any;
    expect(pc2DocOnPC2).toBeDefined();
    expect(pc2DocOnPC2.title).toBe('PC2 Özel Evrakı');

    const pc2PresOnPC2 = postImportDb.prepare("SELECT * FROM presentations WHERE id = 'pres-pc2-local'").get() as any;
    expect(pc2PresOnPC2).toBeDefined();
    expect(pc2PresOnPC2.title).toBe('PC2 Özel Sunumu');

    expect(fs.existsSync(path.join(pc2DocDir, 'pc2_local_doc.docx'))).toBe(true);
    expect(fs.existsSync(path.join(pc2PresDir, 'pc2_local_pres.pptx'))).toBe(true);
  }, 25000);

  it('2. Dynamic DB Proxy & Services automatically query the new database after import without restarting', async () => {
    const dbService = new DatabaseService();
    activeDbs.push(dbService);
    dbService.init(pc1Dir);
    const deviceId = dbService.ensureDeviceId();

    const dynamicDb = dbService.getDynamicDb();
    const dynamicSqlite = dbService.getDynamicSqlite();

    const syncEngine = new SyncEngine(dynamicDb, deviceId);
    const studentService = new StudentService(dynamicDb, deviceId, syncEngine);

    // Initial student on PC1
    studentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '501',
      firstName: 'İlk',
      lastName: 'Öğrenci',
      gender: 'male',
      status: 'active'
    });

    const initialList = studentService.listStudents();
    expect(initialList.length).toBe(1);
    expect(initialList[0].firstName).toBe('İlk');

    // Export this initial state
    const transferService = new DataTransferService(dbService, encryptionService, deviceId, pc1Dir);
    const backupFile = path.join(rootTestDir, 'state1.pdrbak');
    await transferService.exportDataPackage(backupFile, 'Pass123!');

    // Add a second and third student
    studentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '502',
      firstName: 'İkinci',
      lastName: 'Öğrenci',
      gender: 'female',
      status: 'active'
    });
    studentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '503',
      firstName: 'Üçüncü',
      lastName: 'Öğrenci',
      gender: 'male',
      status: 'active'
    });

    const modifiedList = studentService.listStudents();
    expect(modifiedList.length).toBe(3);

    // Now import state1.pdrbak back
    const restoreRes = await transferService.importAndReplaceDatabase(backupFile, 'Pass123!');
    expect(restoreRes.success).toBe(true);

    // WITHOUT creating new service instances or restarting, calling studentService.listStudents() MUST immediately reflect state1!
    const restoredList = studentService.listStudents();
    expect(restoredList.length).toBe(1);
    expect(restoredList[0].firstName).toBe('İlk');

    // Also raw dynamicSqlite queries must immediately work
    const countRow = dynamicSqlite.prepare('SELECT count(*) as count FROM students WHERE deleted_at IS NULL').get() as any;
    expect(countRow.count).toBe(1);
  }, 25000);

  it('3. DB Reset clears user tables but preserves system survey catalog AND preserves local documents/presentations', async () => {
    const dbService = new DatabaseService();
    activeDbs.push(dbService);
    dbService.init(pc2Dir);
    const deviceId = dbService.ensureDeviceId();

    const auth = new AuthService(dbService, pc2Dir);
    await auth.completeWizard({
      schoolName: 'Reset Test Okulu',
      counselorName: 'Test Danışmanı',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
      localPassword: 'Reset_Test_Pass_789'
    });

    const dynamicDb = dbService.getDynamicDb();
    const dynamicSqlite = dbService.getDynamicSqlite();
    const syncEngine = new SyncEngine(dynamicDb, deviceId);
    const studentService = new StudentService(dynamicDb, deviceId, syncEngine);

    // Create user student and meeting
    studentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '999',
      firstName: 'Sıfırlanacak',
      lastName: 'Öğrenci',
      gender: 'female',
      status: 'active'
    });

    // Create local document and presentation
    const docDir = path.join(pc2Dir, 'documents_storage');
    const presDir = path.join(pc2Dir, 'presentations_storage');
    fs.mkdirSync(docDir, { recursive: true });
    fs.mkdirSync(presDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'degerli_evrak.docx'), Buffer.from('COK_DEGERLI_EVRAK'));
    fs.writeFileSync(path.join(presDir, 'degerli_sunum.pptx'), Buffer.from('COK_DEGERLI_SUNUM'));

    const now = Date.now();
    dynamicSqlite.prepare(`
      INSERT INTO counselor_documents (id, title, description, file_path, file_name, file_size, mime_type, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('doc-preserve-1', 'Korunan Evrak', 'kurum', 'documents_storage/degerli_evrak.docx', 'degerli_evrak.docx', 500, 'docx', '2026-08-18', ${now}, ${now}, 1, '${deviceId}')
    `).run();

    dynamicSqlite.prepare(`
      INSERT INTO presentations (id, title, description, file_path, file_name, file_size, mime_type, slide_count, upload_date, created_at, updated_at, version, last_modified_device_id)
      VALUES ('pres-preserve-1', 'Korunan Sunum', 'seminer', 'presentations_storage/degerli_sunum.pptx', 'degerli_sunum.pptx', 600, 'pptx', 10, '2026-08-18', ${now}, ${now}, 1, '${deviceId}')
    `).run();

    // Verify system survey exists
    const surveyRowBefore = dynamicSqlite.prepare("SELECT * FROM surveys WHERE slug = 'devamsizlik-nedenleri-anketi'").get();
    expect(surveyRowBefore).toBeDefined();

    // Execute Reset
    const transferService = new DataTransferService(dbService, encryptionService, deviceId, pc2Dir);
    const resetRes = await transferService.resetDatabase('Reset_Test_Pass_789');
    expect(resetRes.success).toBe(true);

    // 1. User students MUST be cleared
    const studentsAfter = studentService.listStudents();
    expect(studentsAfter.length).toBe(0);

    // 2. System survey catalog MUST be preserved
    const surveyRowAfter = dynamicSqlite.prepare("SELECT * FROM surveys WHERE slug = 'devamsizlik-nedenleri-anketi'").get();
    expect(surveyRowAfter).toBeDefined();

    // 3. Local documents and presentations MUST be preserved (both in DB and on disk)
    const docRowAfter = dynamicSqlite.prepare("SELECT * FROM counselor_documents WHERE id = 'doc-preserve-1'").get() as any;
    expect(docRowAfter).toBeDefined();
    expect(docRowAfter.title).toBe('Korunan Evrak');

    const presRowAfter = dynamicSqlite.prepare("SELECT * FROM presentations WHERE id = 'pres-preserve-1'").get() as any;
    expect(presRowAfter).toBeDefined();
    expect(presRowAfter.title).toBe('Korunan Sunum');

    expect(fs.existsSync(path.join(docDir, 'degerli_evrak.docx'))).toBe(true);
    expect(fs.existsSync(path.join(presDir, 'degerli_sunum.pptx'))).toBe(true);

    // 4. Local password MUST remain intact
    const unlockRes = await auth.unlock({ password: 'Reset_Test_Pass_789' });
    expect(unlockRes.success).toBe(true);
  }, 25000);
});
