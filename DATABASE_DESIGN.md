# PDR Manager — Database Design & Schema Specification
## Engine: SQLite 3 with Drizzle ORM
## Document Version: 2.0.0 — Refined: True 3-Way Merge & Field Encryption

---

## 1. Core Database Principles & 3-Way Merge Metadata

### 1.1 Synchronization-Ready Entity Standard
Every mutable business entity in PDR Manager MUST include the standard sync columns:

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `TEXT` (UUIDv4) | NO | Primary Key. Globally unique across all PCs without sequence collision. |
| `created_at` | `INTEGER` | NO | Unix timestamp in milliseconds when the record was created. |
| `updated_at` | `INTEGER` | NO | Unix timestamp in milliseconds of the last modification. |
| `deleted_at` | `INTEGER` | YES | Unix timestamp in milliseconds for soft deletion (Tombstone). `NULL` = active. |
| `version` | `INTEGER` | NO | Monotonically incrementing integer (starts at 1) for optimistic locking & sync. |
| `last_modified_device_id` | `TEXT` | NO | Identifier of the device (e.g. `DEVICE-7F3A91`) that made the last mutation. |

### 1.2 SQLite Connection Configuration & PRAGMAs
```sql
PRAGMA journal_mode = WAL;          -- High concurrency, non-blocking reads during writes
PRAGMA foreign_keys = ON;           -- Enforce relational integrity
PRAGMA synchronous = NORMAL;        -- Fast writes while maintaining safety against power loss
PRAGMA temp_store = MEMORY;         -- In-memory temporary tables and indexes
PRAGMA cache_size = -64000;         -- 64MB memory page cache for lightning-fast queries
PRAGMA busy_timeout = 5000;         -- 5 second retry timeout on locked tables
```

---

## 2. Complete Relational Schema (Drizzle Definitions)

> **Cloud Encryption Legend:**
> Fields marked with `🔒 [ENCRYPTED_IN_CLOUD]` are stored as plaintext in the local operational SQLite database for local search/indexing, but are **encrypted with AES-256-GCM client-side using the shared Data Encryption Key (DEK)** before writing to Firestore.

---

### 2.1 System & Configuration Tables

#### `app_meta`
Local configuration and key-value store.
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT NOT NULL)
- `updated_at` (INTEGER NOT NULL)

Key storage mappings in `app_meta`:
- `'device_id'`: e.g. `'DEVICE-7F3A91'`
- `'device_name'`: e.g. `'Office Desktop'`
- `'local_password_salt'`: 32-byte hex salt for local app password
- `'local_password_hash'`: Argon2id hash of local PC password
- `'wrapped_dek'`: 256-bit Shared Data Encryption Key (DEK) wrapped/encrypted with Local KEK (AES-256-GCM)
- `'active_school_year_id'`: Currently active school year UUID
- `'db_schema_version'`: Current migration version number

#### `devices`
- `id` (TEXT PRIMARY KEY) — e.g. `'DEVICE-7F3A91'`
- `name` (TEXT NOT NULL) — e.g. `'Office PC'`
- `app_version` (TEXT NOT NULL)
- `registered_at` (INTEGER NOT NULL)
- `last_seen_at` (INTEGER NOT NULL)
- `is_current_device` (INTEGER NOT NULL DEFAULT 0)

---

### 2.2 Institutional & Student Core Tables

#### `schools`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `address` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `principal_name` (TEXT)
- `counselor_name` (TEXT)
- `notes` (TEXT)
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `school_years`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL) — e.g. `'2026-2027'`
- `start_date` (TEXT NOT NULL) — ISO `YYYY-MM-DD`
- `end_date` (TEXT NOT NULL) — ISO `YYYY-MM-DD`
- `is_active` (INTEGER NOT NULL DEFAULT 0)
- `is_archived` (INTEGER NOT NULL DEFAULT 0)
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `classes`
- `id` (TEXT PRIMARY KEY)
- `school_year_id` (TEXT NOT NULL REFERENCES `school_years(id)`)
- `name` (TEXT NOT NULL) — e.g. `'9-A'`, `'12-Fen'`
- `grade` (INTEGER NOT NULL) — e.g. `9`, `10`, `11`, `12`
- `branch` (TEXT NOT NULL) — e.g. `'A'`, `'B'`, `'Fen'`
- `teacher_name` (TEXT)
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `students`
- `id` (TEXT PRIMARY KEY)
- `school_year_id` (TEXT NOT NULL REFERENCES `school_years(id)`)
- `class_id` (TEXT REFERENCES `classes(id)`)
- `student_number` (TEXT NOT NULL) — e.g. `'1042'`
- `first_name` (TEXT NOT NULL)
- `last_name` (TEXT NOT NULL)
- `birth_date` (TEXT) — ISO `YYYY-MM-DD`
- `gender` (TEXT NOT NULL) — `'male'`, `'female'`, `'other'`
- `phone` (TEXT)
- `email` (TEXT)
- `status` (TEXT NOT NULL DEFAULT 'active') — `'active'`, `'inactive'`, `'graduated'`, `'transferred'`
- `avatar_path` (TEXT)
- `notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]` — Private counselor notes on student
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `parents`
- `id` (TEXT PRIMARY KEY)
- `first_name` (TEXT NOT NULL)
- `last_name` (TEXT NOT NULL)
- `phone` (TEXT)
- `email` (TEXT)
- `occupation` (TEXT)
- `address` (TEXT)
- `notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `student_parents`
- `student_id` (TEXT NOT NULL REFERENCES `students(id)` ON DELETE CASCADE)
- `parent_id` (TEXT NOT NULL REFERENCES `parents(id)` ON DELETE CASCADE)
- `relationship` (TEXT NOT NULL) — `'mother'`, `'father'`, `'guardian'`, `'relative'`
- `is_primary` (INTEGER NOT NULL DEFAULT 0)
- PRIMARY KEY (`student_id`, `parent_id`)

#### `teachers`
- `id` (TEXT PRIMARY KEY)
- `first_name` (TEXT NOT NULL)
- `last_name` (TEXT NOT NULL)
- `branch` (TEXT NOT NULL)
- `phone` (TEXT)
- `email` (TEXT)
- `notes` (TEXT)
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `student_teachers`
- `student_id` (TEXT NOT NULL REFERENCES `students(id)` ON DELETE CASCADE)
- `teacher_id` (TEXT NOT NULL REFERENCES `teachers(id)` ON DELETE CASCADE)
- `relationship` (TEXT)
- PRIMARY KEY (`student_id`, `teacher_id`)

---

### 2.3 Counseling & Daily Operations Tables

#### `meetings` (Counseling Sessions)
- `id` (TEXT PRIMARY KEY)
- `school_year_id` (TEXT NOT NULL REFERENCES `school_years(id)`)
- `student_id` (TEXT REFERENCES `students(id)`)
- `meeting_type` (TEXT NOT NULL) — `'student'`, `'parent'`, `'teacher'`, `'discipline'`, `'other'`
- `date` (TEXT NOT NULL) — ISO `YYYY-MM-DD`
- `start_time` (TEXT NOT NULL) — `'14:30'`
- `duration` (INTEGER NOT NULL DEFAULT 30)
- `subject` (TEXT NOT NULL)
- `summary` (TEXT NOT NULL) 🔒 `[ENCRYPTED_IN_CLOUD]`
- `notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]` — Highly sensitive psychological session notes
- `decisions` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
- `follow_up_required` (INTEGER NOT NULL DEFAULT 0)
- `follow_up_date` (TEXT) — ISO `YYYY-MM-DD`
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `meeting_tags` & `meeting_tag_relations`
- `meeting_tags`: `id` (TEXT PK), `name` (TEXT NOT NULL UNIQUE)
- `meeting_tag_relations`: `meeting_id` (TEXT REFERENCES `meetings(id)`), `tag_id` (TEXT REFERENCES `meeting_tags(id)`), PRIMARY KEY (`meeting_id`, `tag_id`)

#### `appointments`
- `id` (TEXT PRIMARY KEY)
- `school_year_id` (TEXT NOT NULL REFERENCES `school_years(id)`)
- `student_id` (TEXT REFERENCES `students(id)`)
- `title` (TEXT NOT NULL)
- `date` (TEXT NOT NULL) — ISO `YYYY-MM-DD`
- `start_time` (TEXT NOT NULL)
- `end_time` (TEXT NOT NULL)
- `location` (TEXT DEFAULT 'Rehberlik Servisi')
- `notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
- `status` (TEXT NOT NULL DEFAULT 'scheduled')
- `reminder_minutes` (INTEGER NOT NULL DEFAULT 15)
- `notification_sent` (INTEGER NOT NULL DEFAULT 0)
- `created_at`, `updated_at`, `deleted_at`, `version`, `last_modified_device_id`

#### `tasks` & `reminders`
- `tasks`: `id` (TEXT PK), `title`, `description` 🔒 `[ENCRYPTED_IN_CLOUD]`, `due_date`, `due_time`, `priority`, `category`, `student_id`, `completed`, `completed_at`, standard sync columns.
- `reminders`: `id` (TEXT PK), `title`, `description`, `trigger_at`, `repeat_type`, `is_completed`, standard sync columns.

---

### 2.4 Annual Guidance Plan Tables
- `annual_plans`: `id` (TEXT PK), `school_year_id`, `title`, `description`, `created_at`, `updated_at`
- `annual_plan_items`: `id` (TEXT PK), `annual_plan_id`, `planned_date`, `category`, `title`, `description`, `target_audience`, `status`, `completed_at`, `notes`, standard sync columns.

---

### 2.5 Dynamic Survey & Inventory Engine Tables
- `surveys`: `id` (TEXT PK), `title`, `description`, `survey_version`, `status`, `estimated_minutes`, `scoring_method`, standard sync columns.
- `survey_questions`: `id` (TEXT PK), `survey_id`, `question_order`, `question_text`, `question_type`, `category`, `required`, `help_text`, `created_at`, `updated_at`.
- `survey_options`: `id` (TEXT PK), `question_id`, `option_order`, `option_text`, `score`.
- `survey_assignments`: `id` (TEXT PK), `survey_id`, `student_id`, `assignment_ref` (UNIQUE), `assigned_at`, `due_date`, `status`, `started_at`, `completed_at`, `google_form_id`, `google_sheet_id`, standard sync columns.
- `survey_responses`: `id` (TEXT PK), `assignment_id`, `student_id`, `survey_id`, `source`, `external_response_id`, `started_at`, `completed_at`, `total_score`, `result_summary` 🔒 `[ENCRYPTED_IN_CLOUD]`, standard sync columns.
- `survey_answers`: `id` (TEXT PK), `response_id`, `question_id`, `selected_option_id`, `text_value` 🔒 `[ENCRYPTED_IN_CLOUD]`, `number_value`, `boolean_value`, `date_value`.

---

### 2.6 Academic Tracking, Exams & Target Tables
- `exams`: `id` (TEXT PK), `school_year_id`, `name`, `exam_type`, `date`, `description`, `net_calculation_formula`, standard sync columns.
- `subjects`: `id` (TEXT PK), `name`, `exam_type`, `category`, `question_count`.
- `exam_results`: `id` (TEXT PK), `exam_id`, `student_id`, `subject_id`, `correct`, `wrong`, `empty`, `net`, `score`, `rank`, standard sync columns.
- `student_targets`: `id` (TEXT PK), `student_id`, `target_type`, `title`, `description`, `target_value`, `unit`, `target_date`, `status`, standard sync columns.
- `study_plans`: `id` (TEXT PK), `student_id`, `title`, `start_date`, `end_date`, `notes` 🔒 `[ENCRYPTED_IN_CLOUD]`, standard sync columns.
- `study_plan_items`: `id` (TEXT PK), `study_plan_id`, `date`, `start_time`, `end_time`, `subject`, `topic`, `planned_questions`, `completed_questions`, `status`, `notes`, standard sync columns.
- `question_tracking`: `id` (TEXT PK), `student_id`, `date`, `subject_id`, `question_count`, `correct_count`, `wrong_count`, `empty_count`, `notes`, standard sync columns.

---

### 2.7 Special Education & Documents
- `special_education_records`:
  - `id` (TEXT PRIMARY KEY)
  - `student_id` (TEXT NOT NULL REFERENCES `students(id)` ON DELETE CASCADE)
  - `support_type` (TEXT NOT NULL)
  - `start_date` (TEXT NOT NULL)
  - `end_date` (TEXT)
  - `ram_report_no` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
  - `ram_decision_date` (TEXT)
  - `notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
  - `status` (TEXT NOT NULL DEFAULT 'active')
  - standard sync columns.

- `individual_education_plans` (BEP):
  - `id` (TEXT PRIMARY KEY)
  - `student_id` (TEXT NOT NULL REFERENCES `students(id)` ON DELETE CASCADE)
  - `school_year_id` (TEXT NOT NULL REFERENCES `school_years(id)`)
  - `title` (TEXT NOT NULL)
  - `start_date` (TEXT NOT NULL)
  - `end_date` (TEXT NOT NULL)
  - `goals` (TEXT NOT NULL) 🔒 `[ENCRYPTED_IN_CLOUD]`
  - `accommodations` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
  - `evaluation_notes` (TEXT) 🔒 `[ENCRYPTED_IN_CLOUD]`
  - standard sync columns.

- `documents`: `id` (TEXT PK), `student_id`, `name`, `file_path`, `mime_type`, `file_size`, standard sync columns.

---

### 2.8 True 3-Way Merge Sync Queue & Audit Tables

#### `sync_changes` (Local Queue with 3-Way Merge Ancestor Baseline)
This table captures the exact mutation context, including the base version and snapshot prior to mutation, enabling true 3-way merge on any remote PC:

```sql
CREATE TABLE sync_changes (
  id TEXT PRIMARY KEY,                       -- Unique change UUID
  entity_type TEXT NOT NULL,                 -- e.g. 'students', 'meetings', 'exams'
  entity_id TEXT NOT NULL,                   -- Target entity UUID
  operation TEXT NOT NULL,                   -- 'create', 'update', 'delete'
  base_version INTEGER NOT NULL,             -- The version this change was based on (Ancestor version)
  new_version INTEGER NOT NULL,              -- The version produced by this change
  base_snapshot TEXT,                        -- JSON string of entity state BEFORE mutation (Base for 3-way merge)
  payload TEXT NOT NULL,                     -- JSON string of entity state AFTER mutation (or delta)
  changed_at INTEGER NOT NULL,               -- Timestamp in milliseconds
  device_id TEXT NOT NULL,                   -- Device ID that made this change
  synced_at INTEGER,                         -- NULL if pending; timestamp ms when Firestore ack received
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);
```

#### `audit_logs`
- `id` (TEXT PRIMARY KEY)
- `timestamp` (INTEGER NOT NULL)
- `action` (TEXT NOT NULL)
- `entity_type` (TEXT NOT NULL)
- `entity_id` (TEXT)
- `device_id` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)

---

## 3. Database Indexes

```sql
CREATE INDEX idx_students_year_status ON students(school_year_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_class ON students(class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_name_search ON students(first_name, last_name);
CREATE INDEX idx_meetings_student ON meetings(student_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_date ON appointments(date, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(completed, due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_results_student ON exam_results(student_id, exam_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_question_tracking_date ON question_tracking(student_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_sync_changes_pending ON sync_changes(synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_sync_changes_entity ON sync_changes(entity_type, entity_id);
```
