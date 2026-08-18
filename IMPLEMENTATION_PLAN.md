# PDR Manager — Master Implementation Plan (V1 → V2 → V3)
## Version 2.0.0 — Refined: True 3-Way Merge, Key-Wrapping & Field Encryption

> **Note:** V1, V2, and V3 are sequential development phases. The final application incorporates 100% of all features described in `PROJECT_SPEC.md`.

---

## 1. Project Phase Overview & Timeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 0: FOUNDATION & TOOLING                         │
│  • Project Scaffolding (Electron + React 18 + Vite + TS + Tailwind + Drizzle)   │
│  • Security Skeleton (IPC Preload Bridge, CSP, Strict Context Isolation)        │
│  • SQLite Storage Engine + Drizzle Schema + Migration Runner                     │
│  • Cryptography Core (Argon2id KDF, AES-256-GCM Envelope Key-Wrapping Engine)   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PHASE V1: CORE FOUNDATION & DAILY WORKFLOW                   │
│  • First-Run Setup Wizard (Master Recovery Passphrase, Local Password, School)  │
│  • Local Session App Lock (Argon2id Local KEK -> In-memory DEK)                 │
│  • Institutional Management (Schools, School Years, Classes)                   │
│  • Student Dossier & Directory (CRUD, Family links, Teachers, Soft Delete)     │
│  • Counseling Sessions / Meetings (Types, Dynamic Tags, Notes, Follow-up)      │
│  • Appointments & Tasks Management (Calendar views, Windows Notifications)      │
│  • Dashboard & Global Command Search (Ctrl + K)                                │
│  • Multi-PC Sync Foundation:                                                    │
│    - `sync_changes` queue with `base_version` & `base_snapshot`                 │
│    - Firestore Client with AES-256-GCM Field Encryption on sensitive notes      │
│    - True 3-Way Merge Engine (`BASE` vs `LOCAL` vs `REMOTE`)                    │
│  • Phase V1 Automated Tests & Verification                                      │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              PHASE V2: ACADEMIC, SURVEY ENGINE, CLOUD BACKUPS & REPORTS         │
│  • Dynamic Survey / Inventory Builder (Multi-type questions, Scoring models)   │
│  • Local Student Mode (Locked survey kiosk with counselor PIN unlock)          │
│  • Google Cloud Integration (OAuth 2.0 loopback, safeStorage, Forms & Sheets)  │
│  • Academic & Exam Analysis (Configurable Net formulas, Targets, Study Plans)  │
│  • Question Tracking Engine (Daily/Weekly counters, Accuracy charts)           │
│  • Annual Guidance Plan Management                                             │
│  • Guidance Analytics & School Aggregations                                    │
│  • Document Dossier Management (Local file storage + metadata index)           │
│  • Reporting Engine (PDF dossier generator, Excel/CSV bidirectional imports)   │
│  • Zero-Knowledge Encrypted Cloud Disaster Backup (AES-256-GCM with Shared DEK)│
│  • Cloud Disaster Restore with Emergency Rollback Safety Snapshot              │
│  • Multi-PC Sync for All V2 Entities                                           │
│  • Phase V2 Automated Tests & Verification                                      │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│             PHASE V3: ADVANCED FEATURES, SPECIAL ED, HARDENING & RELEASE        │
│  • Special Education & BEP / IEP Management (Diagnostic records, goals)        │
│  • Offline Mobile Survey Package (Standalone HTML/JS export & JSON response)  │
│  • Visual Conflict Resolution UI (Side-by-Side 3-Way Merge Comparison Modal)   │
│  • Multi-PC Device Manager (List, Rename, Revoke paired devices)               │
│  • Dynamic Module Activation / Feature Toggles                                 │
│  • Production Windows Packaging (`electron-builder` NSIS Installer)            │
│  • End-to-End Multi-PC Sync & Disaster Recovery Simulation Tests               │
│  • Final Verification & Documentation                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase-by-Phase Detailed Work Breakdown

### Phase 0: Project Setup & Cryptographic Scaffolding
- [ ] Initialize Vite + Electron + React + TypeScript project layout.
- [ ] Configure Tailwind CSS with custom design tokens (typography, surfaces, colors).
- [ ] Set up `better-sqlite3` and `drizzle-orm` in Electron Main process.
- [ ] Implement Drizzle migration manager with automatic pre-migration backup hooks.
- [ ] Implement Cryptography module:
  - Argon2id key derivation functions.
  - AES-256-GCM encryption/decryption with authentication tag verification.
  - 2-Tier Envelope Key-Wrapping (Local KEK wraps Shared DEK).
  - Windows DPAPI integration via Electron `safeStorage`.
- [ ] Establish strict Preload security bridge (`contextIsolation: true`, `nodeIntegration: false`).
- [ ] Configure Vitest for unit & integration testing.

---

### Phase V1: Core Foundation & Daily Workflow
#### 1. Security, Keys & First-Run Setup
- [ ] First-Run Setup Wizard:
  - Step 1: Welcome & Setup Mode (New System vs Connect Existing Account).
  - Step 2: Generate 256-bit DEK & Create Master Recovery Passphrase (or enter existing on PC B).
  - Step 3: Set Local PC Password (derives local KEK and wraps DEK).
  - Step 4: School & Counselor Info.
  - Step 5: Active School Year.
  - Step 6: Firebase Setup (Optional / Skip for offline).
  - Step 7: Google Workspace Setup (Optional / Skip for offline).
- [ ] App Lock session manager (Inactivity timeout, in-memory DEK locking).

#### 2. Core Entities & Database Repositories
- [ ] `SchoolRepository` & `SchoolYearRepository` (Single active year rule, archived years).
- [ ] `ClassRepository` (Grade, branch, class teacher link).
- [ ] `StudentRepository` (Student CRUD, status, student number, soft deletion).
- [ ] `ParentRepository` & `TeacherRepository` with relational junction mapping.

#### 3. Counseling & Daily Schedule
- [ ] `MeetingRepository` & UI (Student, Parent, Teacher meeting types, notes, follow-up alarms).
- [ ] `MeetingTagRepository` & UI (Academic, Motivation, Anxiety, Family, Social, etc.).
- [ ] `AppointmentRepository` & UI (Date/time schedule, reminder triggers, Windows native toast alerts).
- [ ] `TaskRepository` & `ReminderRepository` (Priority badges, completion toggles).

#### 4. UI Layout, Dashboard & Global Search
- [ ] Main Layout: Collapsible Sidebar, Top Navigation Bar (Sync status, Backup status, Lock, Search).
- [ ] Global Command Palette (`Ctrl + K`) indexing Students, Meetings, Appointments, Tasks.
- [ ] Executive Dashboard (Today's agenda, overdue tasks, follow-up alerts, quick action buttons).
- [ ] Student Profile Dossier with multi-tab structure (General, Meetings, Schedule).

#### 5. Multi-PC Sync Foundation
- [ ] `sync_changes` table & transactional hook on all SQLite mutations (captures `base_version` & `base_snapshot`).
- [ ] Firebase Auth integration (Email/Password login, session persistence).
- [ ] Firestore client with **AES-256-GCM Field Encryption** on sensitive notes using Shared DEK.
- [ ] True 3-Way Merge algorithm engine (`BASE` vs `LOCAL` vs `REMOTE`).
- [ ] Top-bar Sync button with live state (`Synced`, `Syncing`, `Pending`, `Offline`, `Conflict`).

#### Definition of Done (DoD) for Phase V1:
1. First-Run Wizard generates Master Recovery Passphrase, sets local password, and wraps DEK safely.
2. Complete CRUD for School, Year, Class, Student, Parent, Teacher, Meeting, Appointment, Task.
3. Appointments trigger native Windows toast notifications.
4. Global search (`Ctrl + K`) instantly finds student and meeting records.
5. Mutating any entity writes a corresponding record with `base_version` & `base_snapshot` to `sync_changes`.
6. Sensitive meeting notes are encrypted client-side with AES-256-GCM before writing to Firestore.
7. Unit tests pass for 3-Way Merge logic, Key-Wrapping, and Repositories.

---

### Phase V2: Academic, Survey Engine, Cloud Backups & Reports
#### 1. Dynamic Survey / Inventory Engine
- [ ] Dynamic Survey Builder UI (Single choice, Multiple choice, Scale, Text, Yes/No).
- [ ] Scoring Engine (Sum, Category Averages, Likert Scale scoring models).
- [ ] Survey Assignment module (Generate unique `PDR-XXXXXX` assignment codes).
- [ ] Local Student Mode (Locked kiosk screen for in-office survey taking with counselor PIN unlock).

#### 2. Google Forms & Sheets Cloud Survey Integration
- [ ] Google OAuth 2.0 loopback authentication flow (Tokens stored via Electron `safeStorage`).
- [ ] Google Forms Generator (Automatically creates Google Form matching internal survey schema).
- [ ] Google Sheets Synchronizer (Idempotently imports student responses, parses `PDR-XXXXXX`, saves to SQLite).

#### 3. Academic & Exam Analysis Engine
- [ ] Exam Definition & Subjects (TYT, AYT, LGS, Custom).
- [ ] Configurable Net Calculation Formula (e.g. `Correct - Wrong / 4`).
- [ ] Exam Results entry & Batch XLSX import.
- [ ] Student Targets tracking (TYT/AYT net targets, university/department goals).
- [ ] Study Plan Manager (Planned vs actual study questions).
- [ ] Question Tracking Engine (Daily/weekly subject question counters & Recharts visualization).
- [ ] Annual Guidance Plan Manager (Planned items, progress status, auto-reminders).
- [ ] School Guidance Analytics (Class averages, meeting distribution, cohort analysis).

#### 4. Document Dossier & Export / Reporting Engine
- [ ] Local Student Document Storage (`%APPDATA%/PDRManager/documents/students/{studentId}/`).
- [ ] PDF Report Generator (Student dossiers, meeting reports, survey results, exam progress cards).
- [ ] Bidirectional Excel (XLSX) & CSV Import/Export with column mapping & duplicate resolution.

#### 5. Zero-Knowledge Encrypted Cloud Disaster Backup
- [ ] Backup Archive Engine (SQLite snapshot + document files + manifest).
- [ ] AES-256-GCM authenticated encryption using the Shared DEK with per-backup random salt.
- [ ] Firebase Cloud Storage uploader & retention policy manager (Default: last 10 backups).
- [ ] Safe Restore Flow (Automatic emergency snapshot + checksum verification + atomic activation).

#### 6. Multi-PC Sync Integration for V2
- [ ] All V2 entities (`surveys`, `responses`, `exams`, `results`, `targets`, `plans`) synced via Firestore with field-level encryption.

#### Definition of Done (DoD) for Phase V2:
1. Dynamic surveys can be designed, scored, and answered locally in Student Mode.
2. Google Form can be created via Google API and responses synced back from Google Sheets into SQLite.
3. Exam results calculate net scores correctly and display progress trends in Recharts.
4. PDF dossiers and Excel spreadsheets export and import cleanly.
5. Cloud disaster backups upload encrypted to Firebase Storage and restore cleanly after tampering checks.
6. All V2 automated unit & integration tests pass.

---

### Phase V3: Advanced Features, Hardening & Release
#### 1. Special Education & BEP / IEP Module
- [ ] Special Education records (RAM reports, support types, diagnostic notes with field-level encryption).
- [ ] Individualized Education Plan (IEP/BEP) builder (Long/short term goals, exam accommodations).
- [ ] Privacy safeguards and sensitive data flags.

#### 2. Standalone Mobile Survey Package (Offline)
- [ ] Standalone single-file HTML/JS survey package export.
- [ ] Encrypted/Signed JSON survey response export on mobile browser.
- [ ] One-click Offline Response Import into PDR Manager SQLite.

#### 3. Advanced Multi-PC Conflict Resolution & Device Management
- [ ] Side-by-Side Visual Diff Modal (Compare BASE, LOCAL, and REMOTE values field-by-field).
- [ ] Paired Device Manager UI (List active devices, rename, view sync timestamps, revoke).
- [ ] Dynamic Module Toggle UI (Enable/Disable modules in navigation without data loss).

#### 4. Packaging, E2E Testing & Release
- [ ] Full End-to-End simulated Multi-PC sync test suite (PC A offline → PC B offline → Reconnect & Sync).
- [ ] `electron-builder` configuration for Windows NSIS installer and portable executable.
- [ ] Complete user guides (`README.md`, recovery guide, first-run checklist).

#### Definition of Done (DoD) for Phase V3:
1. Special education and BEP records fully functional with field-level encryption and privacy controls.
2. Offline mobile survey package can be answered on a disconnected phone and imported via JSON.
3. Visual 3-way conflict resolution resolves field collisions gracefully.
4. Multi-PC simulated sync scenario passes 100% without data loss.
5. Windows NSIS installer builds without errors.
