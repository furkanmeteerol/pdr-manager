# PDR Manager — Security, Cryptography & Key Management Specification
## Document Version: 2.2.0 — Zero-Knowledge Cloudflare R2 Disaster Backups & IBackupStorage

---

## 1. Key Hierarchy & Cryptographic Architecture

To allow **different local passwords on different computers** (e.g. PC A uses `LocalPassA`, PC B uses `LocalPassB`) while seamlessly decrypting the **same encrypted cloud data and disaster backups**, PDR Manager uses a formal **2-Tier Key-Wrapping Architecture (Envelope Encryption)**.

```
                                  ┌──────────────────────────────────────────────┐
                                  │       FIRST-RUN INITIAL SETUP (PC A)         │
                                  │                                              │
                                  │  1. Generate 256-bit Random DEK              │
                                  │     (Data Encryption Key - AES-256)          │
                                  │                                              │
                                  │  2. User creates Master Recovery Passphrase  │
                                  │     (or 24-Word BIP39 Mnemonic Phrase)       │
                                  │                                              │
                                  │  3. Derive Recovery KEK via Argon2id (WASM)  │
                                  │     (64MB RAM, 3 Iterations, 1 Parallelism)  │
                                  │                                              │
                                  │  4. Encrypt DEK with Recovery KEK            │
                                  │     -> Upload to Firestore Vault:            │
                                  │        `users/{uid}/vault/keys`              │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                        ┌────────────────────────────────┴────────────────────────────────┐
                        ▼                                                                 ▼
      ┌───────────────────────────────────┐                             ┌───────────────────────────────────┐
      │           WINDOWS PC A            │                             │           WINDOWS PC B            │
      │                                   │                             │                                   │
      │  • User sets: [ Local Pass A ]    │                             │  • User sets: [ Local Pass B ]    │
      │  • Argon2id -> Local KEK_A        │                             │  • Argon2id -> Local KEK_B        │
      │  • Encrypts DEK with KEK_A        │                             │  • Enters Master Recovery Phrase  │
      │  • Stores wrapped DEK in:         │                             │  • Argon2id -> Unwraps Cloud DEK  │
      │    - Windows DPAPI (safeStorage)  │                             │  • Encrypts DEK with KEK_B        │
      │    - SQLite `app_meta`            │                             │  • Stores wrapped DEK in safeStore│
      └─────────────────┬─────────────────┘                             └─────────────────┬─────────────────┘
                        │                                                                 │
                        │ Unlocks Session on Daily Login                                  │ Unlocks Session on Daily Login
                        ▼                                                                 ▼
      ┌───────────────────────────────────┐                             ┌───────────────────────────────────┐
      │      ACTIVE IN-MEMORY DEK         │                             │      ACTIVE IN-MEMORY DEK         │
      │  • Decrypts local student notes   │                             │  • Decrypts local student notes   │
      │  • Encrypts Firestore fields      │                             │  • Encrypts Firestore fields      │
      │  • Encrypts Cloudflare R2 Backups │                             │  • Decrypts Cloudflare R2 Backups │
      └───────────────────────────────────┘                             └───────────────────────────────────┘
```

---

## 2. Application-Level Field Encryption in Firestore

All sensitive guidance data is encrypted client-side using **AES-256-GCM** with the **DEK** before being transmitted over the network to Firestore.

### 2.1 Encryption Envelope Format
When writing a sensitive field or document payload to Firestore:

```typescript
interface EncryptedFieldPayload {
  version: 1;              // Envelope schema version
  iv: string;              // 12-byte initialization vector (Base64)
  tag: string;             // 16-byte GCM authentication tag (Base64)
  ciphertext: string;      // AES-256-GCM encrypted UTF-8 string (Base64)
}
```

### 2.2 Protected Data Fields
- **Meetings:** `summary`, `notes`, `decisions`
- **Students & Parents:** Private guidance `notes`
- **Special Education & BEP:** `ram_report_no`, `notes`, `goals`, `accommodations`, `evaluation_notes`
- **Survey Responses:** `result_summary` (Psychological assessment interpretations)

Non-sensitive metadata (`id`, `date`, `meeting_type`, `version`, `updated_at`, `deleted_at`, `status`) remains plaintext in Firestore to allow efficient Firestore indexing, tombstone tracking, and 3-way version queries.

---

## 3. Zero-Knowledge Disaster Backups

To preserve zero-knowledge privacy, local disaster recovery backups use `IBackupStorage`.

### 3.1 Zero-Knowledge Privacy Guarantee
The encryption key is NEVER transmitted across the network and cannot be read by any third party.

```
  ┌────────────────────────┐
  │ 1. SQLite Snapshot     │  VACUUM INTO creates point-in-time database snapshot
  └───────────┬────────────┘
              │
              ▼
  ┌────────────────────────┐
  │ 2. Archive Assembly    │  SQLite snapshot + documents/ + manifest.json -> uncompressed Tar stream
  └───────────┬────────────┘
              │
              ▼
  ┌────────────────────────┐
  │ 3. Client Encryption   │  Key derived from Shared DEK via Argon2id (per-backup 32-byte salt).
  │    (AES-256-GCM)       │  Stream encrypted with 96-bit IV and 128-bit Auth Tag.
  └───────────┬────────────┘
              │
              ▼
  ┌────────────────────────┐
  │ 4. Header & Payload    │  [ 6B: "PDRBKP" ][ 1B: Ver ][ 32B: Salt ][ 12B: IV ][ 16B: Tag ][ Encrypted Body ]
  └───────────┬────────────┘
              │
              ▼
   ┌────────────────────────┐
   │ 5. Local Export (.pdrbak)│ Saved to user-selected local or external drive
   └────────────────────────┘
```

### 3.2 Safe Restoration Workflow
1. **Selection:** User selects `.pdrbak` encrypted package file.
2. **Key Resolution & Verification:** AES-256-GCM verifies the 128-bit authentication tag and decrypts using the transfer password.
3. **Pre-Import Safety Snapshot:** An emergency backup snapshot of the current local SQLite database is taken automatically before applying changes.
4. **Atomic Swap:** The decrypted SQLite database is imported while strictly preserving the target machine's Master Key and Local Password.

---

## 4. Local Credential & Key Management

| Configuration Item | Type | Storage Location | Protection |
|---|---|---|---|
| **Master Key** | Persistent Hardware ID | `userData/security/master_identity.json` | Local machine bound, immutable |
| **Local Password & KEK** | Application Lock | `userData/security/local_auth.json` | Argon2id salted hash + wrapped DEK |
| **B2 / S3 Config** | Optional Backup Config | Windows DPAPI via Electron `safeStorage` | Local encrypted storage |
