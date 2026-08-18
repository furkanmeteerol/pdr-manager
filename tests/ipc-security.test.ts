import { describe, it, expect } from 'vitest';
import { SetupWizardSchema, CreateStudentSchema, CreateMeetingSchema } from '../shared/validation';
import { AuthService } from '../electron/services/auth/AuthService';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { safeStorageService } from '../electron/services/security/SafeStorageService';
import path from 'node:path';
import fs from 'node:fs';

describe('IPC Validation & Security Boundary Tests', () => {
  it('should validate SetupWizardPayload correctly and reject weak passwords', () => {
    const valid = {
      schoolName: 'Atatürk Anadolu Lisesi',
      counselorName: 'Ayşe Demir',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'bu-cok-guvenli-bir-kurtarma-parolasidir',
      localPassword: 'strongpassword123'
    };
    expect(SetupWizardSchema.safeParse(valid).success).toBe(true);

    const invalidYear = { ...valid, academicYear: '2026/27' };
    expect(SetupWizardSchema.safeParse(invalidYear).success).toBe(false);

    const weakRecovery = { ...valid, masterRecoveryPassphrase: 'short' };
    expect(SetupWizardSchema.safeParse(weakRecovery).success).toBe(false);
  });

  it('should validate CreateStudentSchema and reject missing required fields', () => {
    const validStudent = {
      schoolYearId: '550e8400-e29b-41d4-a716-446655440000',
      studentNumber: '1042',
      firstName: 'Mehmet',
      lastName: 'Öztürk',
      gender: 'male' as const,
      status: 'active' as const
    };
    expect(CreateStudentSchema.safeParse(validStudent).success).toBe(true);

    const invalidGender = { ...validStudent, gender: 'unknown' };
    expect(CreateStudentSchema.safeParse(invalidGender).success).toBe(false);

    const missingName = { ...validStudent, firstName: '' };
    expect(CreateStudentSchema.safeParse(missingName).success).toBe(false);
  });

  it('should validate CreateMeetingSchema and reject invalid time/date formats', () => {
    const validMeeting = {
      schoolYearId: '550e8400-e29b-41d4-a716-446655440000',
      meetingType: 'student' as const,
      date: '2026-08-20',
      startTime: '14:30',
      duration: 30,
      subject: 'Akademik Başarı ve Motivasyon',
      summary: 'Görüşme yapıldı ve hedefler belirlendi.'
    };
    expect(CreateMeetingSchema.safeParse(validMeeting).success).toBe(true);

    const invalidDate = { ...validMeeting, date: '20-08-2026' };
    expect(CreateMeetingSchema.safeParse(invalidDate).success).toBe(false);

    const invalidTime = { ...validMeeting, startTime: '2:30 PM' };
    expect(CreateMeetingSchema.safeParse(invalidTime).success).toBe(false);
  });

  it('should clear in-memory encryption keys immediately when session is locked', async () => {
    const tempDir = path.join(process.cwd(), 'temp_auth_test');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    safeStorageService.init(tempDir);

    const dbService = new DatabaseService();
    dbService.init(tempDir);

    const authService = new AuthService(dbService);
    expect(authService.getIsLocked()).toBe(true);
    expect(authService.getActiveDEK()).toBeNull();

    // Complete wizard
    const wizardRes = await authService.completeWizard({
      schoolName: 'Test School',
      counselorName: 'Test Counselor',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: 'test-recovery-phrase-long-1234',
      localPassword: 'test-local-pass'
    });

    expect(wizardRes.success).toBe(true);
    expect(authService.getIsLocked()).toBe(false);
    expect(authService.getActiveDEK()).toBeInstanceOf(Buffer);

    // Lock session
    authService.lock();
    expect(authService.getIsLocked()).toBe(true);
    expect(authService.getActiveDEK()).toBeNull();

    // Unlock session
    const unlockRes = await authService.unlock({ password: 'test-local-pass' });
    expect(unlockRes.success).toBe(true);
    expect(authService.getIsLocked()).toBe(false);
    expect(authService.getActiveDEK()).toBeInstanceOf(Buffer);

    dbService.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
