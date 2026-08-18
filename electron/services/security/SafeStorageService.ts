import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger/Logger';

function getSafeStorage(): any {
  try {
    // Dynamic access to electron.safeStorage if running in Electron environment
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const electron = require('electron');
      return electron.safeStorage;
    }
  } catch {
    // In pure Node.js CLI or unit tests
  }
  return null;
}

export class SafeStorageService {
  private localDir: string = '';

  public init(userDataPath: string) {
    this.localDir = path.join(userDataPath, 'local');
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  public isEncryptionAvailable(): boolean {
    try {
      const ss = getSafeStorage();
      return !!ss && typeof ss.isEncryptionAvailable === 'function' && ss.isEncryptionAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Encrypt and save a secret (e.g. OAuth tokens) using Windows DPAPI
   */
  public saveEncryptedSecret(filename: string, plainText: string): void {
    if (!this.localDir) {
      logger.warn(`SafeStorageService not initialized, skipping writing ${filename}`);
      return;
    }
    const filePath = path.join(this.localDir, filename);

    if (this.isEncryptionAvailable()) {
      const ss = getSafeStorage();
      const encryptedBuffer = ss.encryptString(plainText);
      fs.writeFileSync(filePath, encryptedBuffer);
      logger.debug(`Saved DPAPI encrypted secret to ${filename}`);
    } else {
      // Development / Testing fallback
      fs.writeFileSync(filePath, Buffer.from(plainText, 'utf8').toString('base64'), 'utf8');
    }
  }

  /**
   * Load and decrypt a secret using Windows DPAPI
   */
  public getDecryptedSecret(filename: string): string | null {
    if (!this.localDir) return null;
    const filePath = path.join(this.localDir, filename);
    if (!fs.existsSync(filePath)) return null;

    try {
      if (this.isEncryptionAvailable()) {
        const ss = getSafeStorage();
        const encryptedBuffer = fs.readFileSync(filePath);
        return ss.decryptString(encryptedBuffer);
      } else {
        const content = fs.readFileSync(filePath, 'utf8');
        return Buffer.from(content, 'base64').toString('utf8');
      }
    } catch (err) {
      logger.error(`Failed decrypting secret ${filename}:`, err);
      return null;
    }
  }

  public deleteSecret(filename: string): boolean {
    if (!this.localDir) return false;
    const filePath = path.join(this.localDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

export const safeStorageService = new SafeStorageService();
