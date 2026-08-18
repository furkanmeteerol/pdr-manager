import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import { AuthService } from '../electron/services/auth/AuthService';
import { MasterKeyService } from '../electron/services/security/MasterKeyService';

describe('PDR Manager — Master Key Security & Local Password Change Verification', () => {
  const testDir = path.join(process.cwd(), 'temp_master_key_auth_test');
  let databaseService: DatabaseService;
  let authService: AuthService;
  const initialMasterRecoveryPhrase = 'guvenli-kurtarma-kelimeleri-master-passphrase-2026';
  const initialLocalPassword = 'OriginalLocalPassword123!';

  beforeEach(async () => {
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(testDir, { recursive: true });

    databaseService = new DatabaseService();
    databaseService.init(testDir);

    authService = new AuthService(databaseService, testDir);

    // Complete wizard setup
    const wizardRes = await authService.completeWizard({
      schoolName: 'Güvenlik Anadolu Lisesi',
      counselorName: 'Psk. Dan. Mehmet Test',
      academicYear: '2026-2027',
      masterRecoveryPassphrase: initialMasterRecoveryPhrase,
      localPassword: initialLocalPassword
    });

    expect(wizardRes.success).toBe(true);
  });

  afterEach(() => {
    if (databaseService) {
      try { databaseService.close(); } catch {}
    }
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. Master Key allows successfully changing the local password', async () => {
    const changeRes = await authService.changePassword({
      masterKey: initialMasterRecoveryPhrase,
      newPassword: 'BrandNewSecurePassword456!'
    });

    expect(changeRes.success).toBe(true);

    // Old password should now fail
    const oldUnlock = await authService.unlock({ password: initialLocalPassword });
    expect(oldUnlock.success).toBe(false);

    // New password should unlock successfully
    const newUnlock = await authService.unlock({ password: 'BrandNewSecurePassword456!' });
    expect(newUnlock.success).toBe(true);
    expect(authService.getIsLocked()).toBe(false);
  });

  it('2. Old local password CANNOT be used in place of Master Key to change password', async () => {
    const attackRes = await authService.changePassword({
      masterKey: initialLocalPassword, // Attacker tries passing local password as master key
      newPassword: 'HackedPassword789!'
    });

    expect(attackRes.success).toBe(false);
    expect(attackRes.error).toContain('Geçersiz Cihaz Master Key\'i');

    // Original password must remain intact
    const origUnlock = await authService.unlock({ password: initialLocalPassword });
    expect(origUnlock.success).toBe(true);
  });

  it('3. Wrong or random Master Key is rejected with an explicit error', async () => {
    const fakeKeyRes = await authService.changePassword({
      masterKey: 'completely-invalid-master-key-xyz-123',
      newPassword: 'AnotherPassword321!'
    });

    expect(fakeKeyRes.success).toBe(false);
    expect(fakeKeyRes.error).toContain('Geçersiz Cihaz Master Key\'i');

    // Empty master key is also rejected
    const emptyKeyRes = await authService.changePassword({
      masterKey: '   ',
      newPassword: 'AnotherPassword321!'
    });
    expect(emptyKeyRes.success).toBe(false);
    expect(emptyKeyRes.error).toContain('Cihaz Master Key\'i gereklidir');
  });

  it('4. Master Key in master_identity.json is NEVER modified during password change', async () => {
    const masterKeyService = new MasterKeyService(testDir);
    const originalMasterRecord = masterKeyService.getMasterIdentityRecord();
    const originalMasterHash = originalMasterRecord.masterKeyHash;
    const originalDeviceId = originalMasterRecord.deviceId;
    const originalMasterToken = originalMasterRecord.masterKeyToken;

    // Change local password
    const changeRes = await authService.changePassword({
      masterKey: initialMasterRecoveryPhrase,
      newPassword: 'NewPasswordForTestingImmutability!'
    });
    expect(changeRes.success).toBe(true);

    // Reload master_identity.json from disk directly
    const identityPath = path.join(testDir, 'security', 'master_identity.json');
    expect(fs.existsSync(identityPath)).toBe(true);
    const diskRecord = JSON.parse(fs.readFileSync(identityPath, 'utf-8'));

    expect(diskRecord.masterKeyHash).toBe(originalMasterHash);
    expect(diskRecord.deviceId).toBe(originalDeviceId);
    expect(diskRecord.masterKeyToken).toBe(originalMasterToken);
  });

  it('5. local_auth.json is properly updated with new salt, hash and wrappedDek', async () => {
    const localAuthPath = path.join(testDir, 'security', 'local_auth.json');
    const beforeAuthRecord = JSON.parse(fs.readFileSync(localAuthPath, 'utf-8'));

    const changeRes = await authService.changePassword({
      masterKey: initialMasterRecoveryPhrase,
      newPassword: 'UpdatedLocalPassword999!'
    });
    expect(changeRes.success).toBe(true);

    const afterAuthRecord = JSON.parse(fs.readFileSync(localAuthPath, 'utf-8'));

    expect(afterAuthRecord.localPasswordHash).not.toBe(beforeAuthRecord.localPasswordHash);
    expect(afterAuthRecord.localPasswordSaltBase64).not.toBe(beforeAuthRecord.localPasswordSaltBase64);
    expect(afterAuthRecord.wrappedDek.wrappedKey).not.toBe(beforeAuthRecord.wrappedDek.wrappedKey);
    // recoveryWrappedDek must be preserved so future changes with Master Key still work
    expect(afterAuthRecord.recoveryWrappedDek).toBeDefined();

    // Second password change with Master Key also works
    const secondChangeRes = await authService.changePassword({
      masterKey: initialMasterRecoveryPhrase,
      newPassword: 'SecondUpdatedLocalPassword000!'
    });
    expect(secondChangeRes.success).toBe(true);

    const finalUnlock = await authService.unlock({ password: 'SecondUpdatedLocalPassword000!' });
    expect(finalUnlock.success).toBe(true);
  });
});
