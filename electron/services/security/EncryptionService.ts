import crypto from 'node:crypto';
import { argon2id } from 'hash-wasm';
import { EncryptedEnvelope, WrappedKeyRecord } from '@shared/crypto-types';
import { logger } from '../logger/Logger';

export class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
  private readonly AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
  private readonly SALT_LENGTH = 16;

  /**
   * Derive a 256-bit key from passphrase using Argon2id (OWASP recommended KDF)
   * Parameters: Memory = 64MB (65536 KiB), Iterations = 3, Parallelism = 1
   */
  public async deriveKey(passphrase: string, salt: Buffer): Promise<Buffer> {
    try {
      const derivedBinary = await argon2id({
        password: passphrase,
        salt: new Uint8Array(salt),
        parallelism: 1,
        iterations: 3,
        memorySize: 65536, // 64MB RAM
        hashLength: 32, // 256-bit AES key
        outputType: 'binary'
      });
      return Buffer.from(derivedBinary);
    } catch (err) {
      logger.warn('Argon2id WASM derivation fallback to Scrypt:', err);
      return crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
    }
  }

  /**
   * Synchronous key derivation fallback using Node crypto Scrypt
   */
  public deriveKeySync(passphrase: string, salt: Buffer): Buffer {
    return crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
  }

  /**
   * Generate a cryptographically secure random 256-bit Data Encryption Key (DEK)
   */
  public generateDEK(): Buffer {
    return crypto.randomBytes(32);
  }

  /**
   * Generate a random salt
   */
  public generateSalt(): Buffer {
    return crypto.randomBytes(this.SALT_LENGTH);
  }

  /**
   * Encrypt plaintext string using AES-256-GCM
   */
  public encrypt(plainText: string, key: Buffer, salt?: Buffer): EncryptedEnvelope {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });

    let ciphertext = cipher.update(plainText, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const tag = cipher.getAuthTag().toString('base64');
    const saltStr = (salt || this.generateSalt()).toString('hex');

    return {
      ciphertext,
      iv: iv.toString('base64'),
      tag,
      salt: saltStr,
      algorithm: 'AES-256-GCM',
      version: 1
    };
  }

  /**
   * Decrypt AES-256-GCM encrypted envelope
   */
  public decrypt(envelope: EncryptedEnvelope, key: Buffer): string {
    const iv = Buffer.from(envelope.iv, 'base64');
    const tag = Buffer.from(envelope.tag, 'base64');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(envelope.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 2-Tier Envelope Key-Wrapping: Wrap (encrypt) the shared DEK with a Key Encryption Key (KEK)
   */
  public wrapKey(targetKey: Buffer, wrappingKey: Buffer, _keyType: 'local_kek' | 'recovery_kek', salt: Buffer): WrappedKeyRecord {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, wrappingKey, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });

    const wrappedKeyBuffer = Buffer.concat([cipher.update(targetKey), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      wrappedKey: wrappedKeyBuffer.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  /**
   * 2-Tier Envelope Key-Wrapping: Unwrap (decrypt) the shared DEK using a KEK
   */
  public unwrapKey(record: WrappedKeyRecord, wrappingKey: Buffer): Buffer {
    const iv = Buffer.from(record.iv, 'base64');
    const tag = Buffer.from(record.tag, 'base64');
    const wrappedKeyBuffer = Buffer.from(record.wrappedKey, 'base64');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, wrappingKey, iv, {
      authTagLength: this.AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(tag);

    const unwrapped = Buffer.concat([decipher.update(wrappedKeyBuffer), decipher.final()]);
    return unwrapped;
  }

  /**
   * Generate standard Device ID (format: DEVICE-XXXXXX)
   */
  public generateDeviceId(): string {
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `DEVICE-${hex}`;
  }
}

export const encryptionService = new EncryptionService();
