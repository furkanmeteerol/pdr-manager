import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseService } from '../database/DatabaseService';
import { encryptionService } from '../security/EncryptionService';
import { safeStorageService } from '../security/SafeStorageService';
import { logger } from '../logger/Logger';
import { SetupWizardPayload, UnlockPayload } from '@shared/ipc-types';
import { WrappedKeyRecord } from '@shared/crypto-types';

export interface LocalAuthRecord {
  localPasswordSaltBase64: string;
  localPasswordHash: string;
  wrappedDek: WrappedKeyRecord;
  recoveryWrappedDek?: WrappedKeyRecord;
  updatedAt: number;
}

export class AuthService {
  private databaseService: DatabaseService;
  private userDataPath: string;
  private isLocked: boolean = true;
  private activeDEK: Buffer | null = null;
  private localAuthFilePath: string;

  constructor(databaseService: DatabaseService, userDataPath?: string) {
    this.databaseService = databaseService;
    this.userDataPath = userDataPath || path.dirname(databaseService.getDbPath());
    this.localAuthFilePath = path.join(this.userDataPath, 'security', 'local_auth.json');
    this.ensureSecurityDirectory();
  }

  public setUserDataPath(userDataPath: string): void {
    this.userDataPath = userDataPath;
    this.localAuthFilePath = path.join(this.userDataPath, 'security', 'local_auth.json');
    this.ensureSecurityDirectory();
  }

  private ensureSecurityDirectory(): void {
    const secDir = path.join(this.userDataPath, 'security');
    if (!fs.existsSync(secDir)) {
      try {
        fs.mkdirSync(secDir, { recursive: true });
      } catch (err) {
        logger.warn('Could not create security directory:', err);
      }
    }
  }

  /**
   * Reads credentials from dedicated local security file (never exported with DB)
   * Falls back to legacy app_meta if local_auth.json does not exist yet.
   */
  private loadLocalAuthRecord(): LocalAuthRecord | null {
    try {
      if (fs.existsSync(this.localAuthFilePath)) {
        const raw = fs.readFileSync(this.localAuthFilePath, 'utf-8');
        return JSON.parse(raw) as LocalAuthRecord;
      }
    } catch (err) {
      logger.error('Failed reading local_auth.json:', err);
    }

    // Fallback: check legacy app_meta and migrate
    try {
      const storedSaltBase64 = this.databaseService.getMeta('local_password_salt');
      const storedHash = this.databaseService.getMeta('local_password_hash');
      const wrappedDekJson = this.databaseService.getMeta('wrapped_dek');

      if (storedSaltBase64 && storedHash && wrappedDekJson) {
        const record: LocalAuthRecord = {
          localPasswordSaltBase64: storedSaltBase64,
          localPasswordHash: storedHash,
          wrappedDek: JSON.parse(wrappedDekJson),
          updatedAt: Date.now()
        };
        // Save to dedicated local file and remove from DB meta
        this.saveLocalAuthRecord(record);
        this.databaseService.setMeta('local_password_salt', '');
        this.databaseService.setMeta('local_password_hash', '');
        this.databaseService.setMeta('wrapped_dek', '');
        return record;
      }
    } catch (err) {
      logger.warn('Legacy auth record migration error:', err);
    }

    return null;
  }

  /**
   * Saves local auth credentials to device-specific file outside SQLite database
   */
  private saveLocalAuthRecord(record: LocalAuthRecord): void {
    this.ensureSecurityDirectory();
    fs.writeFileSync(this.localAuthFilePath, JSON.stringify(record, null, 2), 'utf-8');
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public hasMasterKey(): boolean {
    const record = this.loadLocalAuthRecord();
    return record !== null && !!record.localPasswordHash;
  }

  public getActiveDEK(): Buffer | null {
    return this.activeDEK;
  }

  /**
   * Complete First-Run Setup Wizard:
   * 1. Generate 256-bit DEK
   * 2. Wrap DEK with Master Recovery Passphrase KEK (Argon2id)
   * 3. Wrap DEK with Local Password KEK (Argon2id)
   * 4. Save credentials into dedicated local storage (never transferred with SQLite)
   */
  public async completeWizard(payload: SetupWizardPayload): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Completing First-Run Wizard...');

      // 1. Generate fresh DEK
      const dek = encryptionService.generateDEK();

      // 2. Derive Local KEK from local password via Argon2id
      const localSalt = encryptionService.generateSalt();
      const localKek = await encryptionService.deriveKey(payload.localPassword, localSalt);
      const localPasswordHash = encryptionService.deriveKeySync(payload.localPassword, localSalt).toString('hex');

      // 3. Wrap DEK with Local KEK
      const localWrappedDek = encryptionService.wrapKey(dek, localKek, 'local_kek', localSalt);

      // 4. Derive Recovery KEK from Master Recovery Passphrase via Argon2id
      const recoverySalt = encryptionService.generateSalt();
      const recoveryKek = await encryptionService.deriveKey(payload.masterRecoveryPassphrase, recoverySalt);
      const recoveryWrappedDek = encryptionService.wrapKey(dek, recoveryKek, 'recovery_kek', recoverySalt);

      // 5. Save credentials into device-specific local file
      const authRecord: LocalAuthRecord = {
        localPasswordSaltBase64: localSalt.toString('base64'),
        localPasswordHash,
        wrappedDek: localWrappedDek,
        recoveryWrappedDek,
        updatedAt: Date.now()
      };
      this.saveLocalAuthRecord(authRecord);

      // 6. Save institutional metadata to database
      this.databaseService.setMeta('school_name', payload.schoolName);
      this.databaseService.setMeta('counselor_name', payload.counselorName);
      this.databaseService.setMeta('academic_year', payload.academicYear);
      this.databaseService.setMeta('active_school_year_id', 'default-year');

      // Update institutional tables
      const sqlite = this.databaseService.getSqlite();
      const deviceId = this.databaseService.ensureDeviceId();
      const now = Date.now();

      sqlite.prepare(`
        INSERT INTO schools (id, name, counselor_name, created_at, updated_at, version, last_modified_device_id)
        VALUES ('default-school', ?, ?, ?, ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, counselor_name = excluded.counselor_name, updated_at = excluded.updated_at
      `).run(payload.schoolName, payload.counselorName, now, now, deviceId);

      sqlite.prepare(`
        INSERT INTO school_years (id, name, start_date, end_date, is_active, is_archived, created_at, updated_at, version, last_modified_device_id)
        VALUES ('default-year', ?, '2026-09-01', '2027-06-30', 1, 0, ?, ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at
      `).run(payload.academicYear, now, now, deviceId);

      // 7. Save in OS DPAPI safeStorage as backup
      safeStorageService.saveEncryptedSecret('dek_backup.bin', dek.toString('base64'));

      // 8. Unlock session
      this.activeDEK = dek;
      this.isLocked = false;

      logger.info('First-Run Wizard completed successfully. Local credentials secured on this device.');
      return { success: true };
    } catch (err: any) {
      logger.error('Wizard completion failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Unlock application session using Local Password
   */
  public async unlock(payload: UnlockPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const authRecord = this.loadLocalAuthRecord();

      if (!authRecord || !authRecord.localPasswordSaltBase64 || !authRecord.localPasswordHash || !authRecord.wrappedDek) {
        return { success: false, error: 'Sistem henüz kurulmamış veya yerel parola bulunamadı.' };
      }

      const storedSalt = Buffer.from(authRecord.localPasswordSaltBase64, 'base64');

      // Verify password hash
      const computedHash = encryptionService.deriveKeySync(payload.password, storedSalt).toString('hex');
      if (computedHash !== authRecord.localPasswordHash) {
        return { success: false, error: 'Hatalı parola' };
      }

      // Unwrap DEK
      const localKek = await encryptionService.deriveKey(payload.password, storedSalt);
      this.activeDEK = encryptionService.unwrapKey(authRecord.wrappedDek, localKek);
      this.isLocked = false;

      logger.info('Application unlocked successfully.');
      return { success: true };
    } catch (err: any) {
      logger.error('Unlock failed:', err);
      return { success: false, error: 'Parola doğrulama başarısız' };
    }
  }

  /**
   * Change local master password on this specific PC authorized by Master Key
   * Re-encrypts DEK with new password and updates local credentials.
   * Master Key in master_identity.json is NEVER modified.
   */
  public async changePassword(payload: { masterKey: string; newPassword: string }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!payload.masterKey || !payload.masterKey.trim()) {
        return { success: false, error: 'Cihaz Master Key\'i gereklidir.' };
      }

      if (!payload.newPassword || payload.newPassword.trim().length < 4) {
        return { success: false, error: 'Yeni parola en az 4 karakter olmalıdır.' };
      }

      const authRecord = this.loadLocalAuthRecord();
      if (!authRecord) {
        return { success: false, error: 'Yerel güvenlik kaydı (local_auth.json) bulunamadı.' };
      }

      const masterKeyInput = payload.masterKey.trim();
      let dek: Buffer | null = null;

      // 1. Try unwrapping recoveryWrappedDek with masterKeyInput (Master Recovery Passphrase)
      if (authRecord.recoveryWrappedDek) {
        try {
          const recoverySalt = Buffer.from(authRecord.recoveryWrappedDek.salt, 'base64');
          const recoveryKek = await encryptionService.deriveKey(masterKeyInput, recoverySalt);
          dek = encryptionService.unwrapKey(authRecord.recoveryWrappedDek, recoveryKek);
        } catch {
          // Master Key did not unwrap recoveryWrappedDek
        }
      }

      // 2. Try matching against permanent machine master_identity.json
      if (!dek) {
        try {
          const masterIdentity = this.databaseService.getMasterKeyService().getMasterIdentityRecord();
          const inputHash = crypto.createHash('sha256').update(masterKeyInput).digest('hex');
          if (
            masterKeyInput === masterIdentity.masterKeyToken ||
            masterKeyInput === masterIdentity.masterKeyHash ||
            inputHash === masterIdentity.masterKeyHash
          ) {
            dek = this.activeDEK;
          }
        } catch {
          // master_identity not available
        }
      }

      // If Master Key verification failed:
      if (!dek) {
        return { success: false, error: 'Geçersiz Cihaz Master Key\'i. Parola değiştirilemedi.' };
      }

      // Generate new salt and derive new Local KEK for new password
      const newSalt = encryptionService.generateSalt();
      const newLocalKek = await encryptionService.deriveKey(payload.newPassword, newSalt);
      const newLocalPasswordHash = encryptionService.deriveKeySync(payload.newPassword, newSalt).toString('hex');

      // Wrap DEK with new Local KEK
      const newWrappedDek = encryptionService.wrapKey(dek, newLocalKek, 'local_kek', newSalt);

      // Save updated record to local_auth.json (preserving recoveryWrappedDek and master_identity)
      const updatedRecord: LocalAuthRecord = {
        ...authRecord,
        localPasswordSaltBase64: newSalt.toString('base64'),
        localPasswordHash: newLocalPasswordHash,
        wrappedDek: newWrappedDek,
        updatedAt: Date.now()
      };
      this.saveLocalAuthRecord(updatedRecord);

      this.activeDEK = dek;
      logger.info('Local master password changed successfully using Master Key authorization.');
      return { success: true };
    } catch (err: any) {
      logger.error('Change password failed:', err);
      return { success: false, error: err.message || 'Parola değiştirilemedi.' };
    }
  }

  /**
   * Lock application session and clear memory keys
   */
  public lock(): void {
    this.activeDEK = null;
    this.isLocked = true;
    logger.info('Application session locked.');
  }
}
