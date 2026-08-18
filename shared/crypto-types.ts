export interface EncryptedEnvelope {
  version: number;        // Schema version (1)
  algorithm: 'AES-256-GCM';
  salt: string;           // 32-byte hex salt for KDF
  iv: string;             // 12-byte base64 IV
  tag: string;            // 16-byte base64 Auth Tag
  ciphertext: string;     // Base64 encrypted payload
}

export interface WrappedKeyRecord {
  wrappedKey: string;     // Base64 AES-GCM ciphertext of 256-bit DEK
  iv: string;             // Base64 12-byte IV
  tag: string;            // Base64 16-byte tag
  salt: string;           // Salt used for Argon2id derivation
}

export interface DecryptedDEKResult {
  dek: Buffer;
}
