# PDR Manager — Architectural Decision Records (ADR) & Risk Analysis
## Document Version: 2.2.0 — Disaster Backup via Cloudflare R2 & IBackupStorage

---

## 1. Architectural Decision Records (ADRs)

### ADR-001: Local-First SQLite Database with Drizzle ORM
- **Status:** Approved
- **Decision:** SQLite in WAL mode via Drizzle ORM in Electron Main process as authoritative operational DB.
- **Consequences:** Sub-millisecond queries, 100% offline usability, zero UI latency.

---

### ADR-002: Entity-Level Synchronization via Firestore
- **Status:** Approved
- **Decision:** Sync discrete entity changes via local `sync_changes` queue and Firestore documents under `users/{uid}/entities/`.
- **Consequences:** Prevents database file overwrites, enables fine-grained merging and minimal bandwidth.

---

### ADR-003: Zero-Knowledge AES-256-GCM + Argon2id Encrypted Disaster Backups
- **Status:** Approved
- **Decision:** Standalone client-side encrypted backup archives (`.pdrbak`) stored via `IBackupStorage` using the Shared DEK.
- **Consequences:** Zero-knowledge privacy; completely impervious to cloud storage breaches.

---

### ADR-004: Google Forms / Sheets API for Survey Distribution
- **Status:** Approved
- **Decision:** Dynamically generate Google Forms and sync responses via Sheets API with `PDR-XXXXXX` assignment codes.
- **Consequences:** Zero server hosting costs, high reliability on student mobile phones.

---

### ADR-005: Strict Electron Context Isolation & Typed Whitelist IPC
- **Status:** Approved
- **Decision:** `contextIsolation: true`, `nodeIntegration: false`, strict CSP, Zod-validated IPC.
- **Consequences:** Immunity against remote code execution and SQL/filesystem injection from renderer.

---

### ADR-006: Vite + React 18 + Tailwind CSS + Zustand
- **Status:** Approved
- **Decision:** Standardize on Vite + React 18, Tailwind CSS, Zustand, and Recharts.
- **Consequences:** High render performance, modern desktop UX, minimal bundle footprint.

---

### ADR-007: Append-Only Modeling for Historical Guidance Records
- **Status:** Approved
- **Decision:** Model counseling meetings, survey responses, exam results, and question tracking as append-only records.
- **Consequences:** Eliminates sync conflicts on historical counseling data between multiple PCs.

---

### ADR-008: Soft-Deletes with Tombstones for Cross-Device Synchronization
- **Status:** Approved
- **Decision:** Soft delete via `deleted_at` timestamps propagated to Firestore before physical cleanup.
- **Consequences:** Deletions on PC A correctly delete records on PC B without race conditions.

---

### ADR-009: True 3-Way Merge with Ancestor Baseline Tracking
- **Status:** Approved
- **Context:** Multiple PCs editing the same entity independently while offline can result in partial or conflicting updates.
- **Decision:** Store `base_version` and `base_snapshot` in `sync_changes` and Firestore `changes/` to enable a true 3-way merge algorithm (`BASE` vs `LOCAL` vs `REMOTE`).
- **Consequences:** Non-overlapping field updates (e.g. PC A changes phone, PC B changes class) auto-merge cleanly without false conflicts. Conflicting field updates are presented to the user via a Side-by-Side Diff modal.

---

### ADR-010: 2-Tier Envelope Key-Wrapping (Local Passwords vs Shared DEK)
- **Status:** Approved
- **Context:** Users may want different quick-unlock passwords on Office PC vs Laptop, but both PCs must decrypt the same cloud data.
- **Decision:** Generate a 256-bit random Data Encryption Key (DEK). On each PC, derive a local Key Encryption Key (KEK) from the local password to wrap the DEK. Use a Master Recovery Passphrase to securely transfer the DEK to new PCs via Firestore `vault/keys`.
- **Consequences:** Maximum usability (different local passwords per machine) combined with cryptographic rigor and cross-device sync.

---

### ADR-011: Application-Level Field Encryption for Sensitive Data in Firestore
- **Status:** Approved
- **Context:** Student counseling notes, RAM diagnostic reports, and psychological surveys require absolute privacy, even beyond Firestore Security Rules.
- **Decision:** Encrypt sensitive fields (`notes`, `summary`, `decisions`, `goals`) with AES-256-GCM using the Shared DEK before sending to Firestore. Non-sensitive routing metadata remains plaintext.
- **Consequences:** Full KVKK/FERPA compliance, zero risk of third-party cloud data exposure, while preserving Firestore querying and tombstone routing.

---

### ADR-012: Loopback OAuth 2.0 with Windows DPAPI (`safeStorage`) Token Storage
- **Status:** Approved
- **Context:** Google OAuth tokens must never leak or be committed to Git.
- **Decision:** Use local loopback listener for desktop OAuth and encrypt refresh tokens using Electron `safeStorage` (Windows DPAPI).
- **Consequences:** Zero plaintext credentials on disk, seamless auto-refresh, and zero Git leakage.

---

### ADR-013: Pure WebAssembly Argon2id KDF (Zero Native Toolchain Dependencies)
- **Status:** Approved
- **Decision:** Adopt `hash-wasm` pure WebAssembly implementation of Argon2id with 64MB memory hardness (65536 KiB), 3 iterations, and 1 parallelism with graceful Scrypt fallback.
- **Consequences:** 100% compliance with OWASP #1 password hashing standard, near-native execution speed, and zero native compiler compilation failures on any Windows environment.

---

### ADR-014: Principle of Least Privilege for Google OAuth Scopes
- **Status:** Approved
- **Decision:** Request only targeted, minimum-privilege scopes (`forms.body`, `forms.responses.readonly`, `spreadsheets`, `drive.file`). Never request broad Drive or account-wide scopes.
- **Consequences:** Maximum user trust, simplified Google OAuth verification, and strict per-file application boundaries.

---

### ADR-015: Storage Abstraction Layer (`IBackupStorage`) & Cloudflare R2 Primary Provider
- **Status:** Approved
- **Context:** Requiring Firebase Cloud Storage forces users onto paid Blaze plans with egress costs purely for disaster recovery archives.
- **Decision:** Decouple disaster recovery backups from Firebase Storage. Create an `IBackupStorage` abstraction and implement `CloudflareR2BackupStorage` using the standard S3 API protocol.
- **Consequences:** 100% zero-egress fees, 10 GB free monthly storage on Cloudflare R2, and client-side zero-knowledge encryption ensures R2 only ever receives AES-256-GCM ciphertext (`.pdrbak`). Firebase remains purely on free-tier Spark plan for Auth and Firestore sync.

---

## 2. Risk Identification & Mitigation Matrix

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **1. Dual-PC Conflicting Edits on Same Field** | High | Low | True 3-Way Merge algorithm automatically resolves non-overlapping fields. True field conflicts open a Side-by-Side Diff modal for user choice. |
| **2. Loss of Master Recovery Passphrase** | Critical | Low | If at least one PC is still logged in, user can export a new recovery phrase. Clear warnings during first-run setup. |
| **3. Database Migration Interruption** | Critical | Low | Automatic local backup snapshot (`pre_migration_vX.sqlite`) created immediately before running migrations inside a strict SQLite transaction. |
| **4. Google OAuth Token Expiration** | Medium | Medium | Auto-refresh access tokens via encrypted refresh token in Windows DPAPI (`safeStorage`). Friendly prompt to re-authenticate if revoked. |
| **5. Large Encrypted Backup Archiving** | Medium | Low | Database snapshot performed via non-blocking `VACUUM INTO`. Compression & AES-GCM streaming done asynchronously without freezing UI. |
