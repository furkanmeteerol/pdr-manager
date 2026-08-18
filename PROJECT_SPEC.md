# PDR Manager — Complete Product & Antigravity Implementation Specification
## Version 2.0 — Full Scope: V1 + V2 + V3 + Multi-PC Sync

> **IMPORTANT:** V1, V2 and V3 below are development phases, NOT optional feature tiers.
> The final product must contain ALL features described in this document.
> Antigravity must implement the phases sequentially while preserving the architecture required by later phases.

---

# 1. Product Vision

PDR Manager is a Windows-first, local-first professional student guidance / psychological counseling management application.

The application is primarily used on a local Windows PC and must remain fully usable without an internet connection for core operations.

The application will also support:

- Google Forms / Google Sheets for student surveys
- Firebase Authentication
- Firebase Firestore for cross-device synchronization
- Firebase Cloud Storage for encrypted disaster-recovery backups
- multiple Windows PCs
- offline operation
- secure restore
- PDF / Excel / CSV import/export

The final system must support this workflow:

    PC A
      ↓
    local SQLite
      ↓
    Firebase sync
      ↓
    PC B
      ↓
    local SQLite
      ↓
    Firebase sync
      ↓
    PC A

Example:

    Use PC A for 2 weeks
        ↓
    use PC B for 1 week
        ↓
    return to PC A
        ↓
    press / automatically run Sync
        ↓
    PC A receives PC B's changes
        ↓
    continue working

The system must NOT require the user to manually restore a complete backup every time they change computers.

---

# 2. Core Architecture Principles

## 2.1 Local-first

The local SQLite database is the primary operational database.
Core functionality must work without internet.
Internet is required only for Google Forms, Sheets sync, Firebase sync, Firebase auth, cloud backup, and cloud restore.

## 2.2 Firebase has three separate responsibilities

### Firebase Authentication
Identity and account access.

### Firestore
Cross-device synchronization.

### Cloud Storage
Encrypted disaster-recovery backups.

These three responsibilities must not be mixed.

## 2.3 SQLite remains the local source of operational truth

The application must NOT become dependent on Firestore for normal local operations.

Architecture:

    React
      ↓
    Electron
      ↓
    SQLite
      ↓
    Sync Engine
      ↓
    Firestore

## 2.4 Firestore is a synchronization layer

Do NOT simply upload the SQLite database file to Firestore.
The application must synchronize entities and changes.

## 2.5 Cloud backups are encrypted

Backup:

    SQLite + documents
        ↓
    snapshot
        ↓
    archive
        ↓
    AES-256-GCM encryption
        ↓
    Firebase Storage

Plaintext database backups must never be uploaded to Firebase Storage.

---

# 3. Technology Stack

- Desktop: Electron, TypeScript
- Frontend: React, TypeScript, Tailwind CSS, React Router, Zustand
- Database: SQLite, Drizzle ORM, Zod
- Charts: Recharts
- PDF: React-PDF or PDFKit
- Cloud: Firebase Authentication, Firestore, Cloud Storage
- Google: Google OAuth 2.0, Google Forms API, Google Sheets API
- Packaging: electron-builder
- Development: Git, GitHub
