# PDR Manager — End-to-End System Architecture

This document defines the high-level architecture, subsystem boundaries, data flow patterns, security model, and component layout for **PDR Manager**, a next-generation offline-first desktop application built for school psychological counselors and guidance professionals.

---

## 1. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PDR MANAGER CLIENT                                  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              RENDERER PROCESS (UI)                               │  │
│  │                                                                                  │  │
│  │   React 18 + TypeScript + Tailwind CSS                                           │  │
│  │   ├── Feature Modules (Students, Meetings, Exams, Surveys, Reports, Plans)      │  │
│  │   ├── Presentation Engine (Devamsızlık Nedenleri & Generic Result Renderers)     │  │
│  │   ├── Zustand Stores (AppState, LockState, SyncState, NotificationState)         │  │
│  │   └── IPC Client Adapter (`window.api`)                                         │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ Context Bridge Isolation                 │
│  ┌──────────────────────────────────────────▼───────────────────────────────────────┐  │
│  │                              PRELOAD SCRIPT LAYER                                │  │
│  │  - Context Isolation: ON                                                         │  │
│  │  - Node Integration: OFF                                                         │  │
│  │  - Strictly Typed IPC Whitelist Channels (No arbitrary SQL/FS execution)        │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ IPC Messaging (electron.ipcRenderer)     │
│  ┌──────────────────────────────────────────▼───────────────────────────────────────┐  │
│  │                               MAIN PROCESS (CORE)                                │  │
│  │                                                                                  │  │
│  │  ┌───────────────────────────────┐        ┌───────────────────────────────────┐  │  │
│  │  │        IPC CONTROLLERS        │        │          BUSINESS SERVICES        │  │  │
│  │  │  • StudentIPC   • MeetingIPC  │        │  • StudentService • MeetingService│  │  │
│  │  │  • SurveyIPC    • ExamIPC     │◄──────►│  • SurveyEngine   • ExamEngine    │  │  │
│  │  │  • SyncIPC      • BackupIPC   │        │  • ReportService  • DocumentServ. │  │  │
│  │  │  • AuthIPC      • SystemIPC   │        │  • AuditService   • NotifService  │  │  │
│  │  └──────────────┬────────────────┘        └─────────────────┬─────────────────┘  │  │
│  │                 │                                           │                    │  │
│  │  ┌──────────────▼───────────────────────────────────────────▼──────────────────┐  │  │
│  │  │                                DATA LAYER                                   │  │  │
│  │  │  • Drizzle ORM  • SQLite Database (WAL Mode)  • Migrations Engine           │  │  │
│  │  │  • Entity Repositories  • Local Sync Queue (`sync_changes`)                 │  │  │
│  │  │  • Windows Data Store: `%APPDATA%/PDRManager/database/pdr.sqlite`           │  │  │
│  │  └───────────────────────┬───────────────────────────────────┬─────────────────┘  │  │
│  │                          │                                   │                    │  │
│  │  ┌───────────────────────▼───────────┐   ┌───────────────────▼────────────────┐  │  │
│  │  │        SYNC & BACKUP ENGINE       │   │        EXTERNAL INTEGRATIONS       │  │  │
│  │  │  • SyncWorker (Push/Pull/Queue)   │   │  • Cloudflare Worker / D1 Sync     │  │  │
│  │  │  • ConflictResolver (3-Way Merge) │   │  • Firebase Multi-PC Sync          │  │  │
│  │  │  • BackupService (IBackupStorage) │   │  • Cloudflare R2 Backup Adapter    │  │  │
│  │  │  • Cloudflare R2 S3 Adapter       │   │  • Windows Native Toast System     │  │  │
│  │  │  • Argon2id + AES-256-GCM (.pdrbak│   │                                    │  │  │
│  │  └───────────────────────┬───────────┘   └───────────────────┬────────────────┘  │  │
│  └──────────────────────────┼───────────────────────────────────┼───────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┼──────────────────────┘
                              │                                   │
         ┌────────────────────┴──────────────────┐                │
         ▼                                       ▼                ▼
┌───────────────────────────────┐ ┌─────────────────────────────┐ ┌───────────────────────────────┐
│     FIREBASE CLOUD SYNC       │ │   CLOUDFLARE R2 BACKUP      │ │  CLOUDFLARE SURVEY ENGINE     │
│  • Auth: Identity & Access    │ │  • Zero-Egress Object Store │ │  • Worker: Edge API Endpoints │
│  • Firestore: Multi-PC Sync   │ │  • Zero-Knowledge Ciphertext│ │  • D1: Server-Side Scoring    │
│  • Vault: Wrapped Key Storage │ │  • Encrypted .pdrbak Files  │ │  • Student Hash / Zero PII    │
└───────────────────────────────┘ └─────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Process Separation & Security Boundaries

### 2.1 Renderer Process (UI Layer)
- Built with **React 18**, **TypeScript**, and **Tailwind CSS**.
- State Management: **Zustand** stores for UI state, current selection, active school year, lock status, and sync status.
- Routing: **React Router v6**.
- Visualizations: **Recharts** for exam performance, net distributions, question tracking trends, and guidance statistics.
- Icons: **Lucide React**.
- **Security Constraint:** Renderer never receives direct Node.js filesystem or database handles; all operations execute via strictly typed `window.api` IPC channels.

### 2.2 Preload Script (`preload.ts`)
- Configured with `contextIsolation: true` and `nodeIntegration: false`.
- Uses `contextBridge.exposeInMainWorld('api', apiObject)`.
- Exposes typed request/response methods returning Promises.

### 2.3 Main Process (Node.js Environment)
- Window lifecycle, application single-instance locking (`app.requestSingleInstanceLock()`).
- File storage and database connection lifecycle.
- Electron native notification scheduling.
- Background worker for automatic periodic synchronization and network connectivity listening.

---

## 3. Storage & Filesystem Architecture

All persistent data resides in standard OS application data directories:

```
%APPDATA%/PDRManager/                       (e.g., C:\Users\<Username>\AppData\Roaming\PDRManager\)
├── database/
│   ├── pdr.sqlite                          (Main operational SQLite database in WAL mode)
│   ├── pdr.sqlite-wal                      (Write-Ahead Log)
│   └── pdr.sqlite-shm                      (Shared memory index)
├── documents/
│   └── students/
│       ├── {student_id_uuid_1}/
│       │   ├── rapor-2026.pdf
│       │   └── bep-plani.docx
│       └── {student_id_uuid_2}/
├── backups/
│   ├── local_emergency/                    (Emergency snapshots taken before migrations/restores)
│   └── exports/                            (Generated PDF and Excel reports)
├── temp/                                   (Scratchpad for decrypting/extracting backup archives)
├── logs/
│   ├── app.log
│   └── sync-errors.log
└── local/
    ├── device.json                         (Unique device_id, device_name, registered_at)
    └── app-state.json                      (Last active school year, window bounds, UI preferences)
```

---

## 4. Layered Software Design

### 4.1 Domain Services Layer
Every business feature in PDR Manager is encapsulated into a dedicated Service class in `electron/services/`:

1. **`DatabaseService`**: Manages SQLite connection via Drizzle ORM, executes schema migrations, manages SQLite PRAGMA tuning (`journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL`).
2. **`StudentService`**: Student CRUD, parent/teacher link management, soft deletes, student profile aggregations.
3. **`MeetingService`**: Counseling sessions, dynamic tag assignments, follow-up flags, date range queries.
4. **`AppointmentService` & `TaskService`**: Scheduling, priority task lists, reminders, triggering Windows notifications.
5. **`SurveyEngine`**: Real MEB survey registration, versioning, subscales, and score calculation engine.
6. **`CloudflareSurveySyncService`**: Cloudflare Worker & D1 survey sync, student salted HMAC generation, result sync, and result presentation resolution.
7. **`ExamService`**: Exam definition, subject net scoring (e.g., `Net = Correct - (Wrong / 4)`), target tracking, study plan progress tracking, daily question counters.
8. **`SpecialEducationService`**: Sensitive Individualized Education Plan (IEP/BEP) records, specialized accommodations, encryption for notes.
9. **`ReportService`**: Compiles student summary dossiers, guidance statistics, exam progress cards to PDF and XLSX formats.
10. **`SyncEngine`**: Multi-PC change tracking, `sync_changes` queue worker, Firestore push/pull synchronization, 3-way conflict detection.
11. **`BackupService` (`IBackupStorage`)**:
    - Abstraction: `IBackupStorage`
    - Primary Provider: `CloudflareR2BackupStorage` (S3 API Client)
    - Packaging: Point-in-time SQLite snapshot + documents + manifest -> Tar archive
    - Encryption: Client-Side **AES-256-GCM + Argon2id** derived key -> `.pdrbak`
    - Restoration: Download ciphertext -> verify 128-bit GCM Auth Tag -> decrypt -> integrity check -> safe transactional restore with automatic pre-restore emergency snapshot.
12. **`AuditService`**: Logs all create, update, delete, sync, backup, and restore events for data integrity and forensic auditability.

---

## 5. Technology Stack Details

| Domain | Technology / Library | Rationale |
|---|---|---|
| **Runtime** | Electron 34+ | Native Windows integration, file system isolation, background services |
| **Language** | TypeScript 5.7+ | End-to-end type safety across Main, Preload, and Renderer |
| **Frontend Framework** | React 18+ | Declarative component model, rich ecosystem, snappy reactive UI |
| **Styling** | Tailwind CSS 3.4+ | Consistent design system, rapid styling, zero runtime CSS overhead |
| **State Management** | Zustand | Lightweight, unopinionated, no boilerplate, easy sync with IPC events |
| **Local Database** | `better-sqlite3` + Drizzle ORM | Ultra-fast synchronous execution in Node Main process, type-safe migrations |
| **Validation** | Zod | Runtime schema validation at IPC boundary and external sync boundaries |
| **Charts** | Recharts | Composable SVG charts for exam scores, net trends, and school analytics |
| **PDF Generation** | HTML5 Print Engine & PDF Export | Vector-crisp student guidance reports, test results, official forms |
| **Cloud Synchronization** | Firebase JS SDK (Firestore & Auth) | Real-time security, scoped subcollections, serverless multi-PC syncing |
| **Online Survey Engine** | Cloudflare Workers & D1 | Edge serverless survey engine, server-side scoring, zero PII token security |
| **Disaster Backup Storage** | Cloudflare R2 (`IBackupStorage`) | Zero-egress fee, S3-compatible, client-side zero-knowledge encrypted `.pdrbak` archives |
| **Cryptography** | Node `crypto` (`aes-256-gcm`) + WASM `argon2id` | Military-grade authenticated encryption for cloud backups and master keys |
| **Credential Storage** | Electron `safeStorage` (Windows DPAPI) | Zero plaintext tokens or encryption keys on disk |
| **Packaging** | `electron-builder` | Production Windows executable / NSIS installer |
