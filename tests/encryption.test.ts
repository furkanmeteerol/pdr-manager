import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../electron/services/security/EncryptionService';

describe('Cryptographic Engine & Key Management', () => {
  const service = new EncryptionService();

  it('should derive a 256-bit key from passphrase and salt using Argon2id', async () => {
    const salt = service.generateSalt();
    const key1 = await service.deriveKey('master-secret-passphrase', salt);
    const key2 = await service.deriveKey('master-secret-passphrase', salt);
    const key3 = await service.deriveKey('different-passphrase', salt);

    expect(key1).toHaveLength(32);
    expect(key1.equals(key2)).toBe(true);
    expect(key1.equals(key3)).toBe(false);
  });

  it('should encrypt and decrypt plaintext using AES-256-GCM', () => {
    const key = service.generateDEK();
    const originalText = 'Psikolojik Danışmanlık Seans Notu: Çok Gizli';

    const envelope = service.encrypt(originalText, key);
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.tag).toBeDefined();

    const decrypted = service.decrypt(envelope, key);
    expect(decrypted).toBe(originalText);
  });

  it('should fail decryption when ciphertext is tampered', () => {
    const key = service.generateDEK();
    const originalText = 'Hassas Öğrenci Görüşmesi';
    const envelope = service.encrypt(originalText, key);

    // Tamper ciphertext
    const tampered = {
      ...envelope,
      ciphertext: envelope.ciphertext.substring(0, envelope.ciphertext.length - 2) + 'AA'
    };

    expect(() => service.decrypt(tampered, key)).toThrow();
  });

  it('should wrap and unwrap shared DEK using 2-Tier Envelope Key-Wrapping', async () => {
    const sharedDEK = service.generateDEK();
    const salt = service.generateSalt();
    const localKEK = await service.deriveKey('local-user-password-pc-a', salt);

    // Wrap
    const wrappedRecord = service.wrapKey(sharedDEK, localKEK, 'local_kek', salt);
    expect(wrappedRecord.wrappedKey).toBeDefined();

    // Unwrap
    const unwrappedDEK = service.unwrapKey(wrappedRecord, localKEK);
    expect(unwrappedDEK.equals(sharedDEK)).toBe(true);
  });

  it('should generate valid Device ID format', () => {
    const deviceId = service.generateDeviceId();
    expect(deviceId).toMatch(/^DEVICE-[0-9A-F]{6}$/);
  });
});
