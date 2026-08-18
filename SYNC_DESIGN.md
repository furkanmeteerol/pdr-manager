# PDR Manager — Local-First Data Transfer & Synchronization Architecture
## Document Version: 3.0.0 — 100% Local-First / Zero Cloud Dependency

---

## 1. Architectural Philosophy & Guarantees

1. **100% Local-First Independence:**
   All operations execute synchronously against the local SQLite database in WAL (Write-Ahead Logging) mode. The application operates with zero runtime network dependencies.

2. **Isolated Machine Security:**
   - **Master Key (Hardware Identity):** Stored in `userData/security/master_identity.json`. Machine-bound cryptographic identity that is never placed in the database and never exported.
   - **Local Password (Lock Screen):** Stored in `userData/security/local_auth.json`. User login credentials and Argon2id KEK/DEK keys that remain on the local machine.

3. **Secure Data Transfer (.pdrbak Packages):**
   - Point-in-time encrypted backups exported with AES-256-GCM and Argon2id.
   - All machine-specific auth and device tokens are stripped prior to export.
   - Importing on a target machine replaces application data while strictly preserving the target machine's Master Key and Local Password.

---

## 2. Local Architecture Flow

```
                 PDR MANAGER
                      │
                      ▼
              LOCAL SQLITE (WAL)
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     Anketler      Öğrenciler    Görüşmeler
        │
        ▼
   Local Scoring
        │
        ▼
     Local PDF
        │
        ▼
   .pdrbak Export / Import
```

---

## 3. Storage Hierarchy

| Component | Storage Path | Description |
| :--- | :--- | :--- |
| **SQLite Database** | `userData/database/pdr.sqlite` | Primary relational data store |
| **Master Key** | `userData/security/master_identity.json` | Immutable device cryptographic ID |
| **Local Auth** | `userData/security/local_auth.json` | Lock credentials and wrapped DEK |
| **Backup Meta** | `userData/security/backup_meta.json` | Last successful backup timestamps |
| **Documents Archive** | `userData/counselor_documents/` | Stored counselor document files |
| **Presentations Archive** | `userData/presentations_storage/` | Stored presentation slide files |
