import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { EncryptionService } from '../electron/services/security/EncryptionService';
import { MasterKeyService } from '../electron/services/security/MasterKeyService';
import { AuthService } from '../electron/services/auth/AuthService';
import { StudentService } from '../electron/services/students/StudentService';
import { MeetingService } from '../electron/services/meetings/MeetingService';
import { AppointmentService } from '../electron/services/appointments/AppointmentService';
import { TaskService } from '../electron/services/tasks/TaskService';
import { DataTransferService } from '../electron/services/backup/DataTransferService';
import { SyncEngine } from '../electron/services/sync/SyncEngine';

describe('PDR Manager — M2 MacBook Air (Apple Silicon) & Cross-Platform Verification Suite', () => {
  const rootTemp = path.join(process.cwd(), 'temp_m2_mac_test_env');
  const winAppData = path.join(rootTemp, 'win_pc_userData');
  const macAppData = path.join(rootTemp, 'mac_m2_userData');

  const encryptionService = new EncryptionService();
  let activeDbs: DatabaseService[] = [];

  beforeEach(() => {
    for (const d of activeDbs) {
      try { d.close(); } catch {}
    }
    activeDbs = [];
    if (fs.existsSync(rootTemp)) {
      try { fs.rmSync(rootTemp, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(winAppData, { recursive: true });
    fs.mkdirSync(macAppData, { recursive: true });
  });

  afterEach(() => {
    for (const d of activeDbs) {
      try { d.close(); } catch {}
    }
    activeDbs = [];
    if (fs.existsSync(rootTemp)) {
      try { fs.rmSync(rootTemp, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. macOS Path & SQLite Initialization: Should cleanly create database, run 14 migrations and seed system survey catalog', () => {
    // Simulate macOS clean boot in macAppData (~/Library/Application Support/pdr-manager)
    const macDbService = new DatabaseService();
    activeDbs.push(macDbService);
    const { sqlite } = macDbService.init(macAppData);
    const macDeviceId = macDbService.ensureDeviceId();

    // Verify DB file was created inside database subdirectory
    const expectedDbPath = path.join(macAppData, 'database', 'pdr.sqlite');
    expect(fs.existsSync(expectedDbPath)).toBe(true);
    expect(macDbService.getDbPath()).toBe(expectedDbPath);

    // Verify migrations up to v14 via app_meta db_schema_version
    const versionRow = sqlite.prepare("SELECT value FROM app_meta WHERE key = 'db_schema_version'").get() as any;
    expect(versionRow).toBeDefined();
    expect(parseInt(versionRow.value, 10)).toBe(14);

    // Verify system survey catalog auto-seeded
    const surveyRow = sqlite.prepare("SELECT * FROM surveys WHERE slug = 'devamsizlik-nedenleri-anketi'").get() as any;
    expect(surveyRow).toBeDefined();
    expect(surveyRow.title).toContain('Devamsızlık Nedenleri Anketi');

    const questionCount = sqlite.prepare('SELECT count(*) as count FROM survey_questions WHERE survey_id = ?').get(surveyRow.id) as any;
    expect(questionCount.count).toBe(52);

    // Verify MasterKey is created in macOS userData/security/master_identity.json
    const masterIdentityFile = path.join(macAppData, 'security', 'master_identity.json');
    expect(fs.existsSync(masterIdentityFile)).toBe(true);

    const masterKeyService = new MasterKeyService(macAppData);
    expect(masterKeyService.getDeviceId()).toBe(macDeviceId);
    expect(masterKeyService.getMasterKeyHash()).toBeTruthy();

    macDbService.close();
  });

  it('2. Bi-directional .pdrbak Exchange: Windows -> Export -> M2 Mac (Import) & M2 Mac -> Export -> Windows (Import)', async () => {
    // --- STEP A: Set up Windows PC with initial data ---
    const winDbService = new DatabaseService();
    activeDbs.push(winDbService);
    const { db: winDb } = winDbService.init(winAppData);
    const winDeviceId = winDbService.ensureDeviceId();
    const winSyncEngine = new SyncEngine(winDb, winDeviceId);

    const winAuthService = new AuthService(winDbService, winAppData);
    await winAuthService.completeWizard({
      schoolName: 'Ankara Anadolu Lisesi (Win PC)',
      counselorName: 'Rehber Öğretmen (Win)',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'win-recovery-passphrase-12345',
      localPassword: 'WinPassword123!'
    });

    const winStudentService = new StudentService(winDb, winDeviceId, winSyncEngine);
    const winMeetingService = new MeetingService(winDb, winDeviceId, winSyncEngine);
    const winAppointmentService = new AppointmentService(winDb, winDeviceId, winSyncEngine);
    const winTaskService = new TaskService(winDb, winDeviceId, winSyncEngine);
    const winDataTransferService = new DataTransferService(winDbService, encryptionService, winDeviceId, winAppData);

    // Create records on Windows PC
    const studentWin = winStudentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '1001',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      gender: 'male'
    });

    winMeetingService.createMeeting({
      schoolYearId: 'default-year',
      studentId: studentWin.id,
      date: '2026-08-18',
      startTime: '10:00',
      meetingType: 'individual',
      subject: 'Oryantasyon Görüşmesi',
      summary: 'Öğrenci oryantasyon görüşmesi tamamlandı.'
    });

    winAppointmentService.createAppointment({
      schoolYearId: 'default-year',
      studentId: studentWin.id,
      title: 'Takip Randevusu',
      date: '2026-08-25',
      startTime: '11:00',
      endTime: '11:40'
    });

    winTaskService.createTask({
      title: 'Veli Bilgilendirme Raporu',
      dueDate: '2026-08-30',
      priority: 'high',
      studentId: studentWin.id
    });

    // Windows PC Exports .pdrbak
    const winExportPath = path.join(rootTemp, 'win_to_mac_export.pdrbak');
    const transferPassword = 'CrossPlatformSecretPassword2026!';
    const winExportRes = await winDataTransferService.exportDataPackage(winExportPath, transferPassword);
    expect(winExportRes.success).toBe(true);
    expect(fs.existsSync(winExportPath)).toBe(true);

    winDbService.close();

    // --- STEP B: Set up M2 Mac with its own Master Key and Local Password ---
    const macDbService = new DatabaseService();
    activeDbs.push(macDbService);
    const { db: macDb } = macDbService.init(macAppData);
    const macDeviceId = macDbService.ensureDeviceId();
    const macSyncEngine = new SyncEngine(macDb, macDeviceId);

    const macAuthService = new AuthService(macDbService, macAppData);
    await macAuthService.completeWizard({
      schoolName: 'M2 MacBook Air Okulu',
      counselorName: 'Mac Counselor',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'mac-recovery-passphrase-99999',
      localPassword: 'MacLocalPassword456!'
    });

    const macMasterKeyBefore = new MasterKeyService(macAppData).getMasterKeyHash();
    const macDataTransferService = new DataTransferService(macDbService, encryptionService, macDeviceId, macAppData);

    // M2 Mac imports Windows .pdrbak
    const macImportRes = await macDataTransferService.importAndReplaceDatabase(winExportPath, transferPassword);
    expect(macImportRes.success).toBe(true);

    // Verify M2 Mac Master Key and Local Password are 100% PRESERVED
    const macMasterKeyAfter = new MasterKeyService(macAppData).getMasterKeyHash();
    expect(macMasterKeyAfter).toBe(macMasterKeyBefore);
    expect(macMasterKeyAfter).toBeTruthy();

    const macUnlockTest = await macAuthService.unlock({ password: 'MacLocalPassword456!' });
    expect(macUnlockTest.success).toBe(true);

    const macUnlockWithWinPassword = await macAuthService.unlock({ password: 'WinPassword123!' });
    expect(macUnlockWithWinPassword.success).toBe(false);

    // Verify imported Windows data exists on M2 Mac
    const macStudentService = new StudentService(macDb, macDeviceId, macSyncEngine);
    const macMeetingService = new MeetingService(macDb, macDeviceId, macSyncEngine);
    const macAppointmentService = new AppointmentService(macDb, macDeviceId, macSyncEngine);
    const macTaskService = new TaskService(macDb, macDeviceId, macSyncEngine);

    const importedStudents = macStudentService.listStudents();
    expect(importedStudents.length).toBe(1);
    expect(importedStudents[0].studentNumber).toBe('1001');
    expect(importedStudents[0].firstName).toBe('Ahmet');

    const importedMeetings = macMeetingService.listMeetings();
    expect(importedMeetings.length).toBe(1);
    expect(importedMeetings[0].subject).toBe('Oryantasyon Görüşmesi');

    const importedAppointments = macAppointmentService.listAppointments();
    expect(importedAppointments.length).toBe(1);
    expect(importedAppointments[0].title).toBe('Takip Randevusu');

    const importedTasks = macTaskService.listTasks();
    expect(importedTasks.length).toBe(1);
    expect(importedTasks[0].title).toBe('Veli Bilgilendirme Raporu');

    // --- STEP C: Add new data on M2 Mac and Export back to Windows ---
    const studentMac = macStudentService.createStudent({
      schoolYearId: 'default-year',
      studentNumber: '2002',
      firstName: 'Elif',
      lastName: 'Kaya',
      gender: 'female'
    });

    macMeetingService.createMeeting({
      schoolYearId: 'default-year',
      studentId: studentMac.id,
      date: '2026-08-19',
      startTime: '14:00',
      meetingType: 'individual',
      subject: 'M2 Mac Kariyer Planlama',
      summary: 'Kariyer planlama görüşmesi yapıldı.'
    });

    const macExportPath = path.join(rootTemp, 'mac_to_win_export.pdrbak');
    const macExportRes = await macDataTransferService.exportDataPackage(macExportPath, transferPassword);
    expect(macExportRes.success).toBe(true);

    macDbService.close();

    // --- STEP D: Windows PC imports M2 Mac .pdrbak ---
    const winDbService2 = new DatabaseService();
    activeDbs.push(winDbService2);
    const { db: winDb2 } = winDbService2.init(winAppData);
    const winSyncEngine2 = new SyncEngine(winDb2, winDeviceId);
    const winDataTransferService2 = new DataTransferService(winDbService2, encryptionService, winDeviceId, winAppData);
    const winAuthService2 = new AuthService(winDbService2, winAppData);

    const winImportRes = await winDataTransferService2.importAndReplaceDatabase(macExportPath, transferPassword);
    expect(winImportRes.success).toBe(true);

    // Verify Windows retains its original Windows Password
    const winUnlockTest = await winAuthService2.unlock({ password: 'WinPassword123!' });
    expect(winUnlockTest.success).toBe(true);

    const winStudentService2 = new StudentService(winDb2, winDeviceId, winSyncEngine2);
    const winMeetingService2 = new MeetingService(winDb2, winDeviceId, winSyncEngine2);

    const allStudentsOnWin = winStudentService2.listStudents();
    expect(allStudentsOnWin.length).toBe(2);
    expect(allStudentsOnWin.some(s => s.studentNumber === '2002' && s.firstName === 'Elif')).toBe(true);

    const allMeetingsOnWin = winMeetingService2.listMeetings();
    expect(allMeetingsOnWin.some(m => m.subject === 'M2 Mac Kariyer Planlama')).toBe(true);

    winDbService2.close();
  }, 30000);
});
