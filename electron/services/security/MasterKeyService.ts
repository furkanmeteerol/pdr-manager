import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { logger } from '../logger/Logger';

export interface MasterIdentityRecord {
  deviceId: string;
  masterKeyHash: string;
  masterKeyToken: string;
  createdAt: number;
}

export class MasterKeyService {
  private userDataPath: string;
  private identityFilePath: string;
  private cachedRecord: MasterIdentityRecord | null = null;

  constructor(userDataPath: string) {
    this.userDataPath = userDataPath;
    this.identityFilePath = path.join(this.userDataPath, 'security', 'master_identity.json');
    this.initMasterIdentity();
  }

  public setUserDataPath(userDataPath: string): void {
    this.userDataPath = userDataPath;
    this.identityFilePath = path.join(this.userDataPath, 'security', 'master_identity.json');
    this.cachedRecord = null;
    this.initMasterIdentity();
  }

  public getIdentityFilePath(): string {
    return this.identityFilePath;
  }

  private ensureSecurityDirectory(): void {
    const secDir = path.join(this.userDataPath, 'security');
    if (!fs.existsSync(secDir)) {
      try {
        fs.mkdirSync(secDir, { recursive: true });
      } catch (err) {
        logger.warn('Could not create security directory for master identity:', err);
      }
    }
  }

  /**
   * Initializes or loads the permanent, machine-bound Master Identity.
   * This is never stored in SQLite, never included in .pdrbak export/import,
   * and cannot be changed from within the application.
   */
  private initMasterIdentity(): MasterIdentityRecord {
    if (this.cachedRecord) {
      return this.cachedRecord;
    }

    try {
      if (fs.existsSync(this.identityFilePath)) {
        const raw = fs.readFileSync(this.identityFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as MasterIdentityRecord;
        if (parsed.deviceId && parsed.masterKeyHash && parsed.masterKeyToken) {
          this.cachedRecord = parsed;
          return this.cachedRecord;
        }
      }
    } catch (err) {
      logger.warn('Could not read existing master_identity.json, generating new identity:', err);
    }

    // Generate new permanent Master Identity for this machine
    this.ensureSecurityDirectory();

    const masterSecretBytes = crypto.randomBytes(32);
    const masterKeyToken = masterSecretBytes.toString('base64');
    const masterKeyHash = crypto.createHash('sha256').update(masterSecretBytes).digest('hex');
    const deviceId = `DEVICE-${masterKeyHash.substring(0, 6).toUpperCase()}`;

    const newRecord: MasterIdentityRecord = {
      deviceId,
      masterKeyHash,
      masterKeyToken,
      createdAt: Date.now()
    };

    try {
      fs.writeFileSync(this.identityFilePath, JSON.stringify(newRecord, null, 2), 'utf-8');
      this.cachedRecord = newRecord;
      logger.info(`Initialized permanent machine Master Identity: ${deviceId}`);
    } catch (err) {
      logger.error('Failed writing master_identity.json:', err);
      this.cachedRecord = newRecord;
    }

    return this.cachedRecord;
  }

  /**
   * Returns the permanent Device ID for this machine
   */
  public getDeviceId(): string {
    const rec = this.initMasterIdentity();
    return rec.deviceId;
  }

  /**
   * Returns the cryptographic Master Key Hash for this machine (never stored in DB)
   */
  public getMasterKeyHash(): string {
    const rec = this.initMasterIdentity();
    return rec.masterKeyHash;
  }

  /**
   * Returns the permanent Master Identity Record (local memory only)
   */
  public getMasterIdentityRecord(): MasterIdentityRecord {
    return this.initMasterIdentity();
  }
}
