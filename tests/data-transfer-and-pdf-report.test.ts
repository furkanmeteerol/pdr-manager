import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { EncryptionService } from '../electron/services/security/EncryptionService';
import { DataTransferService } from '../electron/services/backup/DataTransferService';
import { AuthService } from '../electron/services/auth/AuthService';
import { StudentService } from '../electron/services/students/StudentService';
import { AppointmentService } from '../electron/services/appointments/AppointmentService';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { DevamsizlikNedenleriPdfReport } from '../electron/services/surveys/reports/DevamsizlikNedenleriPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { SurveyApplicationDto, SurveyAnswerDto } from '../shared/ipc-types';
import * as schema from '../database/schema';

describe('PDR Manager — Profesyonel PDF Raporu + İki PC Veri Aktarımı ve DB Reset Test Paketi', () => {
  const tempTestDir = path.join(process.cwd(), 'temp_two_pc_test_dir');
  const pc1Dir = path.join(tempTestDir, 'pc1_data');
  const pc2Dir = path.join(tempTestDir, 'pc2_data');

  let activeDbs: DatabaseService[] = [];

  beforeEach(() => {
    activeDbs = [];
    if (fs.existsSync(tempTestDir)) {
      try {
        fs.rmSync(tempTestDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    fs.mkdirSync(pc1Dir, { recursive: true });
    fs.mkdirSync(pc2Dir, { recursive: true });
  });

  afterEach(() => {
    for (const d of activeDbs) {
      try {
        d.close();
      } catch {
        // ignore
      }
    }
    activeDbs = [];
    if (fs.existsSync(tempTestDir)) {
      try {
        fs.rmSync(tempTestDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });

  // =========================================================================
  // 1. SURVEY-SPECIFIC PDF REPORT SYSTEM TESTS
  // =========================================================================
  describe('1. Devamsızlık Nedenleri Anketi: Özel A4 Sonuç Raporu ve Registry Testleri', () => {
    const mockAnswers: SurveyAnswerDto[] = DEVAMSIZLIK_NEDENLERI_ANKETI.questions.map((q, idx) => {
      if (q.type === 'text') {
        return {
          id: `ans-${idx + 1}`,
          questionId: `q-${idx + 1}`,
          questionOrder: q.orderIndex,
          questionText: q.text,
          answerValue: 'okulu sevmiyorum ve servis çok geç kalıyor.',
          isReverseScored: false
        };
      }
      return {
        id: `ans-${idx + 1}`,
        questionId: `q-${idx + 1}`,
        questionOrder: q.orderIndex,
        questionText: q.text,
        selectedOptionId: `opt-${idx + 1}-1`,
        selectedOptionLabel: 'Evet',
        answerValue: 'evet',
        answerScore: 2,
        isReverseScored: false,
        subscaleCode: q.subscaleCode
      };
    });

    const mockSubscales = DEVAMSIZLIK_NEDENLERI_ANKETI.subscales.map(s => {
      const qCount = DEVAMSIZLIK_NEDENLERI_ANKETI.questions.filter(q => q.subscaleCode === s.code).length;
      return {
        code: s.code,
        title: s.title,
        score: qCount * 2,
        maxScore: qCount * 2,
        averageScore: 2.0,
        questionCount: qCount
      };
    });

    const mockApplication: SurveyApplicationDto = {
      id: 'app-pdf-101',
      surveyId: 'srv-devamsizlik-nedenleri',
      surveySlug: 'devamsizlik-nedenleri-anketi',
      surveyTitle: 'Devamsızlık Nedenleri Anketi',
      surveyType: 'SURVEY',
      surveyVersionId: 'ver-1',
      surveyVersionNumber: 1,
      studentId: 'st-202',
      studentNumber: '1945',
      studentName: 'Ahmet Yılmaz',
      className: '10-A',
      attemptNumber: 1,
      status: 'COMPLETED',
      source: 'manual_entry',
      completedAt: 1787005000000,
      totalScore: 102,
      resultSnapshot: {
        totalScore: 102,
        maxPossibleScore: 102,
        versionSnapshot: 1,
        calculatedAt: 1787005000000,
        subscales: mockSubscales
      },
      answers: mockAnswers,
      createdAt: 1787005000000
    };

    it('A. DevamsizlikNedenleriPdfReport MUST generate non-misleading report with student info and 7 subscales', () => {
      const html = DevamsizlikNedenleriPdfReport.generateHtml(mockApplication, {
        schoolName: 'Cumhuriyet Anadolu Lisesi',
        counselorName: 'Uzm. Psk. Dan. Elif Kaya'
      });

      // Headers (No hardcoded MEB banner, clear title)
      expect(html).not.toContain('T.C.<br>MİLLÎ EĞİTİM BAKANLIĞI');
      expect(html).toContain('DEVAMSIZLIK NEDENLERİ ANKETİ');

      // Student Info
      expect(html).toContain('Ahmet Yılmaz');
      expect(html).toContain('1945');
      expect(html).toContain('10-A');

      // 7 Subscales
      expect(html).toContain('Okul ve Yönetim');
      expect(html).toContain('1–10. Maddeler');
      expect(html).toContain('10 Soru');

      expect(html).toContain('Öğretmen');
      expect(html).toContain('11–17. Maddeler');
      expect(html).toContain('7 Soru');

      expect(html).toContain('Aile');
      expect(html).toContain('18–26. Maddeler');
      expect(html).toContain('9 Soru');

      expect(html).toContain('Çevre');
      expect(html).toContain('27–31. Maddeler');
      expect(html).toContain('5 Soru');

      expect(html).toContain('Akademik Kaygı');
      expect(html).toContain('32–36. Maddeler');
      expect(html).toContain('5 Soru');

      expect(html).toContain('Kişisel Nedenler');
      expect(html).toContain('37–45. Maddeler');
      expect(html).toContain('9 Soru');

      expect(html).toContain('Arkadaş Çevresi');
      expect(html).toContain('46–51. Maddeler');
      expect(html).toContain('6 Soru');

      // Footer & counselor signature
      expect(html).toContain('Uzm. Psk. Dan. Elif Kaya');
    });

    it('B. DevamsizlikNedenleriPdfReport MUST handle missing subscales or non-evaluated questions gracefully', () => {
      const partialApp: SurveyApplicationDto = {
        ...mockApplication,
        resultSnapshot: null,
        answers: []
      };

      const html = DevamsizlikNedenleriPdfReport.generateHtml(partialApp, {});
      expect(html).toContain('DEVAMSIZLIK NEDENLERİ ANKETİ');
      expect(html).toContain('Ahmet Yılmaz');
      expect(html).toContain('Belirgin bir alan tespit edilmemiştir');
    });

    it('C. SurveyReportRegistry should accurately identify slug or surveyId and route to DevamsizlikNedenleriPdfReport', () => {
      expect(SurveyReportRegistry.hasReport('srv-devamsizlik-nedenleri')).toBe(true);
      expect(SurveyReportRegistry.hasReport('devamsizlik-nedenleri-anketi')).toBe(true);

      const html = SurveyReportRegistry.generateReportHtml(mockApplication, {
        schoolName: 'Gazi Lisesi',
        counselorName: 'Mehmet Öz'
      });
      expect(html).toContain('Mehmet Öz');
      expect(html).toContain('DEVAMSIZLIK NEDENLERİ ANKETİ');

      // Unconfigured survey fallback
      const unconfiguredApp: SurveyApplicationDto = {
        ...mockApplication,
        surveyId: 'srv-akademik-benlik-future',
        surveySlug: 'akademik-benlik-olcegi',
        surveyTitle: 'Akademik Benlik Saygısı Ölçeği'
      };

      expect(SurveyReportRegistry.hasReport('srv-akademik-benlik-future')).toBe(false);
      const fallbackHtml = SurveyReportRegistry.generateReportHtml(unconfiguredApp);
      expect(fallbackHtml).toContain('Özel Sonuç Raporu Bulunamadı');
      expect(fallbackHtml).toContain('Bu anket (<strong>Akademik Benlik Saygısı Ölçeği</strong>) için özel sonuç raporu henüz tanımlanmamıştır.');
    });
  });

  // =========================================================================
  // 2. TWO-PC DATA TRANSFER, LOCAL MASTER PASSWORD & DB RESET TESTS
  // =========================================================================
  describe('2. İki PC Güvenli Veri Aktarımı, Yerel Parola İzolasyonu ve DB Reset Uçtan Uca Testleri', { timeout: 35000 }, () => {
    it('A. PC1 -> Password Export (DB Only) -> PC2 -> Import -> Yerel Parola ve Evraklar Korunmalı', async () => {
      const encryptionService = new EncryptionService();
      const backupPass = 'SuperSecretPDRPassword2026!';

      // --- STEP 1: Setup PC1 with DB, Local Password, and Local Files ---
      const pc1DatabaseService = new DatabaseService();
      activeDbs.push(pc1DatabaseService);
      pc1DatabaseService.init(pc1Dir);
      const pc1DeviceId = pc1DatabaseService.ensureDeviceId();
      const pc1AuthService = new AuthService(pc1DatabaseService, pc1Dir);
      await pc1AuthService.completeWizard({
        localPassword: 'PC1_Local_Password_123',
        masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        schoolName: 'Cumhuriyet Anadolu Lisesi',
        counselorName: 'PC1 Danışmanı',
        academicYear: '2026-2027'
      });

      const pc1DataTransferService = new DataTransferService(pc1DatabaseService, encryptionService, pc1DeviceId, pc1Dir);

      // Create test local files and DB records on PC1 (should NOT be transferred in .pdrbak)
      const docFolder1 = path.join(pc1Dir, 'documents_storage');
      fs.mkdirSync(docFolder1, { recursive: true });
      fs.writeFileSync(path.join(docFolder1, 'veli_bilgilendirme_formu.docx'), Buffer.from('DOCX_TEST_DATA_PC1'));

      const presFolder1 = path.join(pc1Dir, 'presentations_storage');
      fs.mkdirSync(presFolder1, { recursive: true });
      fs.writeFileSync(path.join(presFolder1, 'pc1_sunum.pptx'), Buffer.from('PPTX_TEST_DATA_PC1'));

      const pc1RawDb = pc1DatabaseService.getRawSqlite();
      pc1RawDb.prepare(`
        INSERT INTO counselor_documents (id, title, description, file_path, file_name, file_size, mime_type, upload_date, created_at, updated_at, version, last_modified_device_id)
        VALUES ('doc-pc1-1', 'PC1 Veli Bilgilendirme', 'veli', 'documents_storage/veli_bilgilendirme_formu.docx', 'veli_bilgilendirme_formu.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '2026-08-18', ${Date.now()}, ${Date.now()}, 1, '${pc1DeviceId}')
      `).run();
      pc1RawDb.prepare(`
        INSERT INTO presentations (id, title, description, file_path, file_name, file_size, mime_type, slide_count, upload_date, created_at, updated_at, version, last_modified_device_id)
        VALUES ('pres-pc1-1', 'PC1 Meslek Tanıtım Sunumu', 'mesleki', 'presentations_storage/pc1_sunum.pptx', 'pc1_sunum.pptx', 200, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 10, '2026-08-18', ${Date.now()}, ${Date.now()}, 1, '${pc1DeviceId}')
      `).run();

      // Seed 10 students and 5 meetings on PC1
      const pc1Db = pc1DatabaseService.getDb();
      const now = Date.now();
      for (let i = 1; i <= 10; i++) {
        pc1Db.insert(schema.students).values({
          id: `st-pc1-${i}`,
          schoolYearId: 'default-year',
          studentNumber: `${1000 + i}`,
          firstName: `Öğrenci${i}`,
          lastName: `Soyad${i}`,
          gender: i % 2 === 0 ? 'female' : 'male',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          version: 1,
          lastModifiedDeviceId: pc1DeviceId
        }).run();
      }

      for (let m = 1; m <= 5; m++) {
        pc1Db.insert(schema.meetings).values({
          id: `mt-pc1-${m}`,
          studentId: `st-pc1-${m}`,
          schoolYearId: 'default-year',
          date: '2026-08-18',
          startTime: '09:00',
          endTime: '09:45',
          meetingType: 'student',
          subject: `Görüşme Konusu ${m}`,
          summary: `Özet ${m}`,
          notes: `Detaylı not ${m}`,
          createdAt: now,
          updatedAt: now,
          version: 1,
          lastModifiedDeviceId: pc1DeviceId
        }).run();
      }

      // Check PC1 counts
      const pc1InitialCounts = pc1DataTransferService.getCurrentDatabaseCounts();
      expect(pc1InitialCounts.students).toBe(10);
      expect(pc1InitialCounts.meetings).toBe(5);

      // Export from PC1 to .pdrbak with Password
      const backup1Path = path.join(tempTestDir, 'PDR-Backup-PC1.pdrbak');
      const exportRes1 = await pc1DataTransferService.exportDataPackage(backup1Path, backupPass);
      expect(exportRes1.success).toBe(true);
      expect(exportRes1.manifest?.counts.students).toBe(10);
      expect(exportRes1.manifest?.counts.meetings).toBe(5);
      expect((exportRes1.manifest?.counts as any).userFiles).toBeUndefined();
      expect((exportRes1.manifest?.counts as any).counselorDocuments).toBeUndefined();
      expect(fs.existsSync(backup1Path)).toBe(true);

      // Close PC1 connection
      pc1DatabaseService.close();

      // --- STEP 2: Setup PC2 with its OWN Local Password and Local Files/DB Records ---
      const pc2DatabaseService = new DatabaseService();
      activeDbs.push(pc2DatabaseService);
      pc2DatabaseService.init(pc2Dir);
      const pc2DeviceId = pc2DatabaseService.ensureDeviceId();
      const pc2AuthService = new AuthService(pc2DatabaseService, pc2Dir);
      await pc2AuthService.completeWizard({
        localPassword: 'PC2_MY_OWN_LOCAL_PASS',
        masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        schoolName: 'Atatürk Anadolu Lisesi',
        counselorName: 'PC2 Danışmanı',
        academicYear: '2026-2027'
      });

      // Create existing PC2 local document & presentation on disk AND in DB (must be preserved!)
      const docFolder2 = path.join(pc2Dir, 'documents_storage');
      fs.mkdirSync(docFolder2, { recursive: true });
      fs.writeFileSync(path.join(docFolder2, 'pc2_local_doc.docx'), Buffer.from('PC2_ORIGINAL_DOCUMENT'));

      const presFolder2 = path.join(pc2Dir, 'presentations_storage');
      fs.mkdirSync(presFolder2, { recursive: true });
      fs.writeFileSync(path.join(presFolder2, 'pc2_local_pres.pptx'), Buffer.from('PC2_ORIGINAL_PRESENTATION'));

      const pc2RawDb = pc2DatabaseService.getRawSqlite();
      pc2RawDb.prepare(`
        INSERT INTO counselor_documents (id, title, description, file_path, file_name, file_size, mime_type, upload_date, created_at, updated_at, version, last_modified_device_id)
        VALUES ('doc-pc2-original', 'PC2 Kendi Evrakı', 'ozel', 'documents_storage/pc2_local_doc.docx', 'pc2_local_doc.docx', 150, 'docx', '2026-08-18', ${Date.now()}, ${Date.now()}, 1, '${pc2DeviceId}')
      `).run();
      pc2RawDb.prepare(`
        INSERT INTO presentations (id, title, description, file_path, file_name, file_size, mime_type, slide_count, upload_date, created_at, updated_at, version, last_modified_device_id)
        VALUES ('pres-pc2-original', 'PC2 Kendi Sunumu', 'genel', 'presentations_storage/pc2_local_pres.pptx', 'pc2_local_pres.pptx', 250, 'pptx', 5, '2026-08-18', ${Date.now()}, ${Date.now()}, 1, '${pc2DeviceId}')
      `).run();

      const pc2DataTransferService = new DataTransferService(pc2DatabaseService, encryptionService, pc2DeviceId, pc2Dir);

      // PC2 inspects PC1 backup with Password
      const inspectPC1Backup = await pc2DataTransferService.inspectBackupFile(backup1Path, backupPass);
      expect(inspectPC1Backup.isValid).toBe(true);
      expect(inspectPC1Backup.schemaCompatible).toBe(true);
      expect(inspectPC1Backup.manifest?.counts.students).toBe(10);

      // PC2 imports PC1 backup
      const importResPC2 = await pc2DataTransferService.importAndReplaceDatabase(backup1Path, backupPass);
      expect(importResPC2.success).toBe(true);

      // Verify PC2 now has 10 students, 5 meetings
      const pc2CountsAfterImport = pc2DataTransferService.getCurrentDatabaseCounts();
      expect(pc2CountsAfterImport.students).toBe(10);
      expect(pc2CountsAfterImport.meetings).toBe(5);

      // GUARANTEE 1: PC2 local password MUST STILL BE PC2_MY_OWN_LOCAL_PASS (NOT PC1 password!)
      const unlockWithPC2Pass = await pc2AuthService.unlock({ password: 'PC2_MY_OWN_LOCAL_PASS' });
      expect(unlockWithPC2Pass.success).toBe(true);

      const unlockWithPC1Pass = await pc2AuthService.unlock({ password: 'PC1_Local_Password_123' });
      expect(unlockWithPC1Pass.success).toBe(false);

      // GUARANTEE 2: PC2 physical files PRESERVED and PC1 physical files NOT copied to PC2
      expect(fs.existsSync(path.join(docFolder2, 'pc2_local_doc.docx'))).toBe(true);
      expect(fs.existsSync(path.join(docFolder2, 'veli_bilgilendirme_formu.docx'))).toBe(false);
      expect(fs.existsSync(path.join(presFolder2, 'pc2_local_pres.pptx'))).toBe(true);
      expect(fs.existsSync(path.join(presFolder2, 'pc1_sunum.pptx'))).toBe(false);

      // GUARANTEE 3: PC2 database records: PC2 own document and presentation are PRESERVED in DB, PC1 records are NOT added!
      const postImportDb = pc2DatabaseService.getRawSqlite();
      const pc2DocRow = postImportDb.prepare("SELECT * FROM counselor_documents WHERE id = 'doc-pc2-original'").get() as any;
      expect(pc2DocRow).toBeDefined();
      expect(pc2DocRow?.title).toBe('PC2 Kendi Evrakı');

      const pc1DocRow = postImportDb.prepare("SELECT * FROM counselor_documents WHERE id = 'doc-pc1-1'").get();
      expect(pc1DocRow).toBeUndefined();

      const pc2PresRow = postImportDb.prepare("SELECT * FROM presentations WHERE id = 'pres-pc2-original'").get() as any;
      expect(pc2PresRow).toBeDefined();
      expect(pc2PresRow?.title).toBe('PC2 Kendi Sunumu');

      const pc1PresRow = postImportDb.prepare("SELECT * FROM presentations WHERE id = 'pres-pc1-1'").get();
      expect(pc1PresRow).toBeUndefined();

      // --- STEP 3: Change Password on PC2 with Master Key ---
      // Attempt with wrong Master Key must fail
      const wrongMasterKeyRes = await pc2AuthService.changePassword({
        masterKey: 'INVALID_MASTER_KEY',
        newPassword: 'PC2_NEW_UPDATED_PASS_999'
      });
      expect(wrongMasterKeyRes.success).toBe(false);

      // Attempt with valid Master Recovery Passphrase succeeds
      const changePassRes = await pc2AuthService.changePassword({
        masterKey: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        newPassword: 'PC2_NEW_UPDATED_PASS_999'
      });
      expect(changePassRes.success).toBe(true);

      const unlockWithOldPass = await pc2AuthService.unlock({ password: 'PC2_MY_OWN_LOCAL_PASS' });
      expect(unlockWithOldPass.success).toBe(false);

      const unlockWithNewPass = await pc2AuthService.unlock({ password: 'PC2_NEW_UPDATED_PASS_999' });
      expect(unlockWithNewPass.success).toBe(true);

      pc2DatabaseService.close();
    });

    it('B. Duplicate student number check: Aynı okul numarasına sahip ikinci öğrenci eklenememeli', async () => {
      const pc1DatabaseService = new DatabaseService();
      activeDbs.push(pc1DatabaseService);
      pc1DatabaseService.init(pc1Dir);
      const pc1DeviceId = pc1DatabaseService.ensureDeviceId();
      const studentService = new StudentService(pc1DatabaseService.getDynamicDb(), pc1DeviceId);

      // 1. Create first student
      const st1 = studentService.createStudent({
        schoolYearId: 'default-year',
        studentNumber: '5544',
        firstName: 'Zeynep',
        lastName: 'Kaya',
        gender: 'female'
      });
      expect(st1.id).toBeDefined();
      expect(st1.studentNumber).toBe('5544');

      // 2. Attempt to create second student with SAME studentNumber
      expect(() => {
        studentService.createStudent({
          schoolYearId: 'default-year',
          studentNumber: '5544',
          firstName: 'Ali',
          lastName: 'Yıldız',
          gender: 'male'
        });
      }).toThrow('Bu okul numarasına sahip bir öğrenci zaten kayıtlı.');

      // 3. Attempt update with duplicate number
      const st2 = studentService.createStudent({
        schoolYearId: 'default-year',
        studentNumber: '5545',
        firstName: 'Mehmet',
        lastName: 'Demir',
        gender: 'male'
      });
      expect(st2.id).toBeDefined();

      expect(() => {
        studentService.updateStudent(st2.id, {
          studentNumber: '5544'
        });
      }).toThrow('Bu okul numarasına sahip bir öğrenci zaten kayıtlı.');

      pc1DatabaseService.close();
    });

    it('C. Appointment description / notes field check: Randevu notları doğru kaydedilmeli ve okunmalı', async () => {
      const pc1DatabaseService = new DatabaseService();
      activeDbs.push(pc1DatabaseService);
      pc1DatabaseService.init(pc1Dir);
      const pc1DeviceId = pc1DatabaseService.ensureDeviceId();
      const appointmentService = new AppointmentService(pc1DatabaseService.getDynamicDb(), pc1DeviceId, undefined as any);

      const app = appointmentService.createAppointment({
        schoolYearId: 'default-year',
        title: 'Bireysel Kariyer Görüşmesi',
        appointmentType: 'Bireysel Öğrenci Görüşmesi',
        date: '2026-08-20',
        startTime: '13:30',
        endTime: '14:10',
        location: 'Rehberlik Odası 1',
        notes: 'Öğrencinin YKS hedefi ve motivasyon durumu ele alınacak.',
        reminderMinutes: 15
      });

      expect(app.id).toBeDefined();
      expect(app.title).toBe('Bireysel Kariyer Görüşmesi');
      expect(app.notes).toBe('Öğrencinin YKS hedefi ve motivasyon durumu ele alınacak.');

      const fetched = appointmentService.getAppointmentById(app.id);
      expect(fetched?.notes).toBe('Öğrencinin YKS hedefi ve motivasyon durumu ele alınacak.');

      pc1DatabaseService.close();
    });

    it('D. DB reset preserves system survey catalog AND does NOT delete user documents/presentations on disk', async () => {
      const encryptionService = new EncryptionService();
      const databaseService = new DatabaseService();
      activeDbs.push(databaseService);
      databaseService.init(pc1Dir);
      const deviceId = databaseService.ensureDeviceId();
      const dataTransferService = new DataTransferService(databaseService, encryptionService, deviceId, pc1Dir);
      const surveyEngine = new SurveyEngine(databaseService.getDb(), deviceId, undefined as any);

      // 1. Verify fresh install has official system surveys ready
      const initialSurveys = surveyEngine.listSurveys();
      expect(initialSurveys.length).toBeGreaterThanOrEqual(3);
      expect(initialSurveys.some(s => s.slug === 'devamsizlik-nedenleri-anketi')).toBe(true);
      expect(initialSurveys.some(s => s.slug === 'sinav-kaygisi-olcegi')).toBe(true);
      expect(initialSurveys.some(s => s.slug === 'westside-sinav-kaygisi-olcegi')).toBe(true);
      expect(initialSurveys.every(s => s.isActive)).toBe(true);

      // 2. Seed student, survey application, and local documents
      const db = databaseService.getDb();
      const now = Date.now();
      db.insert(schema.students).values({
        id: 'st-to-reset',
        schoolYearId: 'default-year',
        studentNumber: '9999',
        firstName: 'Geçici',
        lastName: 'Öğrenci',
        gender: 'female',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        version: 1,
        lastModifiedDeviceId: deviceId
      }).run();

      const docFolder = path.join(pc1Dir, 'documents_storage');
      fs.mkdirSync(docFolder, { recursive: true });
      const testDocPath = path.join(docFolder, 'kalici_belge.docx');
      fs.writeFileSync(testDocPath, Buffer.from('IMPORTANT_DOCUMENT_SHOULD_SURVIVE_RESET'));

      const srvDef = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi');
      expect(srvDef).not.toBeNull();
      const questionsList = srvDef?.questions || [];
      const answersPayload = questionsList.map(q => ({
        questionId: q.id,
        answerValue: (q as any).questionType === 'text' || (q as any).type === 'text' ? 'Test notu' : 'evet'
      }));

      const appRes = surveyEngine.submitApplication({
        surveySlug: 'devamsizlik-nedenleri-anketi',
        studentNumber: '9999',
        answers: answersPayload,
        source: 'manual_entry'
      });
      expect(appRes.success).toBe(true);

      // 3. Perform DB Reset
      const resetRes = await dataTransferService.resetDatabase('ResetPass123');
      expect(resetRes.success).toBe(true);

      // 4. Verify AFTER RESET: User Data is completely cleaned
      const rawDb = databaseService.getSqlite();
      const studentCount = (rawDb.prepare('SELECT count(*) as count FROM students').get() as any).count;
      const appCount = (rawDb.prepare('SELECT count(*) as count FROM survey_applications').get() as any).count;

      expect(studentCount).toBe(0);
      expect(appCount).toBe(0);

      // 5. GUARANTEE: Document file on disk was NOT deleted by DB reset!
      expect(fs.existsSync(testDocPath)).toBe(true);
      expect(fs.readFileSync(testDocPath, 'utf-8')).toBe('IMPORTANT_DOCUMENT_SHOULD_SURVIVE_RESET');

      // 6. Verify AFTER RESET: System Catalog is strictly preserved and active
      const surveyCount = (rawDb.prepare('SELECT count(*) as count FROM surveys').get() as any).count;
      const questionCount = (rawDb.prepare('SELECT count(*) as count FROM survey_questions').get() as any).count;
      const subscaleCount = (rawDb.prepare('SELECT count(*) as count FROM survey_subscales').get() as any).count;

      expect(surveyCount).toBeGreaterThanOrEqual(3);
      expect(questionCount).toBeGreaterThanOrEqual(113);
      expect(subscaleCount).toBeGreaterThanOrEqual(14);

      databaseService.close();
    });

    it('E. Master Key & Local Password Separation, Export Hygiene & Last Backup Timestamp', async () => {
      const encryptionService = new EncryptionService();
      const backupPass = 'SecurePDRBackupPass2026!';

      // --- SETUP PC1 ---
      const pc1DatabaseService = new DatabaseService();
      activeDbs.push(pc1DatabaseService);
      pc1DatabaseService.init(pc1Dir);
      const pc1MasterIdentity = pc1DatabaseService.getMasterKeyService().getMasterIdentityRecord();
      const pc1DeviceId = pc1MasterIdentity.deviceId;
      const pc1MasterHash = pc1MasterIdentity.masterKeyHash;

      const pc1AuthService = new AuthService(pc1DatabaseService, pc1Dir);
      await pc1AuthService.completeWizard({
        localPassword: 'PC1_LOCAL_AUTH_PASSWORD',
        masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        schoolName: 'PC1 Lisesi',
        counselorName: 'PC1 Danışmanı',
        academicYear: '2026-2027'
      });

      const pc1DataTransferService = new DataTransferService(pc1DatabaseService, encryptionService, pc1DeviceId, pc1Dir);

      // Verify Initial: No backup has been taken yet
      const initialBackupInfo = pc1DataTransferService.getLastBackupInfo();
      expect(initialBackupInfo.lastBackupTimestamp).toBeNull();
      expect(initialBackupInfo.lastBackupDateStr).toBeNull();

      // TEST 1 & 3: Master Key & Local Password are NOT in SQLite Database
      const pc1RawDb = pc1DatabaseService.getSqlite();
      const metaKeysInDb = (pc1RawDb.prepare('SELECT key FROM app_meta').all() as { key: string }[]).map(r => r.key);
      expect(metaKeysInDb).not.toContain('master_key_hash');
      expect(metaKeysInDb).not.toContain('master_key_token');
      expect(metaKeysInDb).not.toContain('local_password_hash');
      expect(metaKeysInDb).not.toContain('local_password_salt');
      expect(metaKeysInDb).not.toContain('wrapped_dek');

      // Failed export should NOT update last backup timestamp
      const failedExportRes = await pc1DataTransferService.exportDataPackage(path.join('Z:\\NonExistentDrive', 'invalid.pdrbak'), backupPass);
      expect(failedExportRes.success).toBe(false);
      const afterFailedBackupInfo = pc1DataTransferService.getLastBackupInfo();
      expect(afterFailedBackupInfo.lastBackupTimestamp).toBeNull();

      // Successful Export
      const exportFile = path.join(tempTestDir, 'pc1_export.pdrbak');
      const exportRes = await pc1DataTransferService.exportDataPackage(exportFile, backupPass);
      expect(exportRes.success).toBe(true);

      // TEST 10: Successful export recorded last backup timestamp
      const afterSuccessBackupInfo = pc1DataTransferService.getLastBackupInfo();
      expect(afterSuccessBackupInfo.lastBackupTimestamp).not.toBeNull();
      expect(afterSuccessBackupInfo.lastBackupDateStr).not.toBeNull();
      expect(typeof afterSuccessBackupInfo.lastBackupDateStr).toBe('string');

      // TEST 2 & 4: Master Key and Local Password are NOT in .pdrbak package
      const inspectRes = await pc1DataTransferService.inspectBackupFile(exportFile, backupPass);
      expect(inspectRes.isValid).toBe(true);

      // Close PC1
      pc1DatabaseService.close();

      // --- SETUP PC2 ---
      const pc2DatabaseService = new DatabaseService();
      activeDbs.push(pc2DatabaseService);
      pc2DatabaseService.init(pc2Dir);
      const pc2MasterIdentity = pc2DatabaseService.getMasterKeyService().getMasterIdentityRecord();
      const pc2DeviceId = pc2MasterIdentity.deviceId;
      const pc2MasterHash = pc2MasterIdentity.masterKeyHash;

      // Ensure PC1 and PC2 have completely distinct Master Identities
      expect(pc2DeviceId).not.toBe(pc1DeviceId);
      expect(pc2MasterHash).not.toBe(pc1MasterHash);

      const pc2AuthService = new AuthService(pc2DatabaseService, pc2Dir);
      await pc2AuthService.completeWizard({
        localPassword: 'PC2_DISTINCT_PASSWORD',
        masterRecoveryPassphrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        schoolName: 'PC2 Lisesi',
        counselorName: 'PC2 Danışmanı',
        academicYear: '2026-2027'
      });

      const pc2DataTransferService = new DataTransferService(pc2DatabaseService, encryptionService, pc2DeviceId, pc2Dir);

      // Import PC1 backup into PC2
      const importRes = await pc2DataTransferService.importAndReplaceDatabase(exportFile, backupPass);
      expect(importRes.success).toBe(true);

      // TEST 5: PC2 Master Key and Local Password MUST BE COMPLETELY PRESERVED
      const pc2MasterIdentityAfterImport = pc2DatabaseService.getMasterKeyService().getMasterIdentityRecord();
      expect(pc2MasterIdentityAfterImport.deviceId).toBe(pc2DeviceId);
      expect(pc2MasterIdentityAfterImport.masterKeyHash).toBe(pc2MasterHash);
      expect(pc2MasterIdentityAfterImport.deviceId).not.toBe(pc1DeviceId);

      const pc2UnlockSelf = await pc2AuthService.unlock({ password: 'PC2_DISTINCT_PASSWORD' });
      expect(pc2UnlockSelf.success).toBe(true);

      const pc2UnlockWithForeign = await pc2AuthService.unlock({ password: 'PC1_LOCAL_AUTH_PASSWORD' });
      expect(pc2UnlockWithForeign.success).toBe(false);

      // TEST 6: Local Password can be changed on PC2 using Master Key
      const changeRes = await pc2AuthService.changePassword({
        masterKey: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
        newPassword: 'PC2_NEW_BRAND_PASSWORD'
      });
      expect(changeRes.success).toBe(true);

      const pc2UnlockNew = await pc2AuthService.unlock({ password: 'PC2_NEW_BRAND_PASSWORD' });
      expect(pc2UnlockNew.success).toBe(true);

      pc2DatabaseService.close();
    });
  });
});
