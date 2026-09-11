import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger/Logger';

export interface MigrationStep {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: MigrationStep[] = [
  {
    version: 1,
    name: '0001_initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        app_version TEXT NOT NULL,
        registered_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        is_current_device INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        principal_name TEXT,
        counselor_name TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS school_years (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        name TEXT NOT NULL,
        grade INTEGER NOT NULL,
        branch TEXT NOT NULL,
        teacher_name TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        class_id TEXT REFERENCES classes(id),
        student_number TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date TEXT,
        gender TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        avatar_path TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_students_year_status ON students(school_year_id, status) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(first_name, last_name);

      CREATE TABLE IF NOT EXISTS parents (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        occupation TEXT,
        address TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_parents (
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        relationship TEXT NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (student_id, parent_id)
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        branch TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_teachers (
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        relationship TEXT,
        PRIMARY KEY (student_id, teacher_id)
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        student_id TEXT REFERENCES students(id),
        meeting_type TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 30,
        subject TEXT NOT NULL,
        summary TEXT NOT NULL,
        notes TEXT NOT NULL,
        decisions TEXT,
        follow_up_required INTEGER NOT NULL DEFAULT 0,
        follow_up_date TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_meetings_student_date ON meetings(student_id, date) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS meeting_tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS meeting_tag_relations (
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES meeting_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (meeting_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        student_id TEXT REFERENCES students(id),
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT DEFAULT 'Rehberlik Servisi',
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        reminder_minutes INTEGER NOT NULL DEFAULT 15,
        notification_sent INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        due_time TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT NOT NULL DEFAULT 'general',
        student_id TEXT REFERENCES students(id),
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        trigger_at INTEGER NOT NULL,
        repeat_type TEXT NOT NULL DEFAULT 'none',
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS annual_plans (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        title TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS annual_plan_items (
        id TEXT PRIMARY KEY,
        annual_plan_id TEXT NOT NULL REFERENCES annual_plans(id) ON DELETE CASCADE,
        planned_date TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_audience TEXT,
        status TEXT NOT NULL DEFAULT 'planned',
        completed_at INTEGER,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        target_mode TEXT NOT NULL DEFAULT 'student_linked',
        survey_version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'draft',
        estimated_minutes INTEGER NOT NULL DEFAULT 15,
        scoring_method TEXT NOT NULL DEFAULT 'none',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_questions (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        question_order INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        category TEXT,
        required INTEGER NOT NULL DEFAULT 1,
        help_text TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_options (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        option_order INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0.0
      );

      CREATE TABLE IF NOT EXISTS survey_assignments (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL REFERENCES surveys(id),
        student_id TEXT NOT NULL REFERENCES students(id),
        assignment_ref TEXT NOT NULL UNIQUE,
        assigned_at INTEGER NOT NULL,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'assigned',
        started_at INTEGER,
        completed_at INTEGER,
        google_form_id TEXT,
        google_sheet_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        assignment_id TEXT REFERENCES survey_assignments(id),
        student_id TEXT REFERENCES students(id),
        respondent_name TEXT,
        respondent_student_number TEXT,
        respondent_email TEXT,
        match_status TEXT NOT NULL DEFAULT 'matched',
        mismatch_reason TEXT,
        survey_id TEXT NOT NULL REFERENCES surveys(id),
        source TEXT NOT NULL,
        external_response_id TEXT,
        started_at INTEGER,
        completed_at INTEGER NOT NULL,
        total_score REAL,
        result_summary TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_answers (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES survey_questions(id),
        selected_option_id TEXT REFERENCES survey_options(id),
        text_value TEXT,
        number_value REAL,
        boolean_value INTEGER,
        date_value TEXT
      );

      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        name TEXT NOT NULL,
        exam_type TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        net_calculation_formula TEXT NOT NULL DEFAULT 'C - (W / 4)',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        exam_type TEXT NOT NULL,
        category TEXT NOT NULL,
        question_count INTEGER NOT NULL DEFAULT 40
      );

      CREATE TABLE IF NOT EXISTS exam_results (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject_id TEXT NOT NULL REFERENCES subjects(id),
        correct INTEGER NOT NULL DEFAULT 0,
        wrong INTEGER NOT NULL DEFAULT 0,
        empty INTEGER NOT NULL DEFAULT 0,
        net REAL NOT NULL DEFAULT 0.0,
        score REAL NOT NULL DEFAULT 0.0,
        rank INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_targets (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_value TEXT NOT NULL,
        unit TEXT,
        target_date TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS study_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS study_plan_items (
        id TEXT PRIMARY KEY,
        study_plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        planned_questions INTEGER NOT NULL DEFAULT 0,
        completed_questions INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS question_tracking (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        subject_id TEXT NOT NULL REFERENCES subjects(id),
        question_count INTEGER NOT NULL DEFAULT 0,
        correct_count INTEGER NOT NULL DEFAULT 0,
        wrong_count INTEGER NOT NULL DEFAULT 0,
        empty_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS special_education_records (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        support_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        ram_report_no TEXT,
        ram_decision_date TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS individual_education_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        goals TEXT NOT NULL,
        accommodations TEXT,
        evaluation_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_changes (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        base_version INTEGER NOT NULL,
        new_version INTEGER NOT NULL,
        base_snapshot TEXT,
        payload TEXT NOT NULL,
        changed_at INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        synced_at INTEGER,
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sync_changes_pending ON sync_changes(synced_at) WHERE synced_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_sync_changes_entity ON sync_changes(entity_type, entity_id);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        device_id TEXT NOT NULL,
        description TEXT NOT NULL
      );
    `
  },
  {
    version: 2,
    name: '0002_special_education_bep_bip_and_ram',
    sql: `
      CREATE TABLE IF NOT EXISTS ram_reports (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        report_number TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        valid_until TEXT NOT NULL,
        diagnosis_category TEXT NOT NULL,
        placement_decision TEXT NOT NULL,
        support_education_type TEXT NOT NULL DEFAULT 'destek_egitim_odasi',
        recommended_weekly_hours INTEGER NOT NULL DEFAULT 4,
        educational_evaluation TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ram_reports_student ON ram_reports(student_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS bep_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        ram_report_id TEXT REFERENCES ram_reports(id),
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        committee_members TEXT,
        general_performance_summary TEXT NOT NULL,
        accommodations TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bep_plans_student ON bep_plans(student_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS bep_goals (
        id TEXT PRIMARY KEY,
        bep_plan_id TEXT NOT NULL REFERENCES bep_plans(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        lesson_name TEXT NOT NULL,
        long_term_goal TEXT NOT NULL,
        short_term_goal TEXT NOT NULL,
        target_date TEXT,
        success_criteria TEXT NOT NULL DEFAULT '%80 Doğrulukla',
        evaluation_method TEXT NOT NULL DEFAULT 'Gözlem ve Kontrol Listesi',
        responsible_person TEXT NOT NULL DEFAULT 'Ders Öğretmeni',
        achievement_status TEXT NOT NULL DEFAULT 'not_started',
        achievement_date TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bep_goals_plan ON bep_goals(bep_plan_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS bip_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        target_behavior TEXT NOT NULL,
        behavior_frequency_intensity TEXT NOT NULL,
        antecedents TEXT NOT NULL,
        consequences TEXT NOT NULL,
        replacement_behavior TEXT NOT NULL,
        intervention_strategies TEXT NOT NULL,
        crisis_plan TEXT,
        evaluation_schedule TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bip_plans_student ON bip_plans(student_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS development_evaluations (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        bep_plan_id TEXT REFERENCES bep_plans(id),
        period_name TEXT NOT NULL,
        evaluation_date TEXT NOT NULL,
        academic_development TEXT NOT NULL,
        social_emotional_development TEXT NOT NULL,
        behavioral_development TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        next_term_goals TEXT,
        evaluator_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_evaluations_student ON development_evaluations(student_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS ram_referrals (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        referral_reason TEXT NOT NULL,
        referral_type TEXT NOT NULL DEFAULT 'yeniden_inceleme',
        referral_date TEXT NOT NULL,
        school_report_summary TEXT NOT NULL,
        committee_decision_date TEXT,
        dispatch_date TEXT,
        appointment_date TEXT,
        result_status TEXT NOT NULL DEFAULT 'pending',
        result_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ram_referrals_student ON ram_referrals(student_id) WHERE deleted_at IS NULL;
    `
  },
  {
    version: 3,
    name: '0003_ui_revamp_classes_pdf_and_activities',
    sql: `
      -- 1. Add PDF support to classes
      ALTER TABLE classes ADD COLUMN pdf_path TEXT;
      ALTER TABLE classes ADD COLUMN pdf_name TEXT;

      -- 2. Counseling Activities (Yapılan Çalışmalar)
      CREATE TABLE IF NOT EXISTS counseling_activities (
        id TEXT PRIMARY KEY,
        school_year_id TEXT NOT NULL REFERENCES school_years(id),
        title TEXT NOT NULL,
        description TEXT,
        class_ids TEXT NOT NULL, -- JSON array e.g. ["class-1", "class-2"]
        class_names TEXT NOT NULL, -- e.g. "9-A, 9-B"
        activity_date TEXT NOT NULL, -- 'YYYY-MM-DD'
        participant_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_activities_year ON counseling_activities(school_year_id, activity_date) WHERE deleted_at IS NULL;

      -- 3. Study Plan Templates (Ders Çalışma Programı Taslakları)
      CREATE TABLE IF NOT EXISTS study_plan_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        settings TEXT NOT NULL, -- JSON
        weekly_schedule TEXT NOT NULL, -- JSON
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      -- 4. Insert Default Study Plan Templates
      INSERT OR IGNORE INTO study_plan_templates (id, title, settings, weekly_schedule, created_at, updated_at, version, last_modified_device_id)
      VALUES 
      ('tpl-dil', 'Dil', '{"includeHours":true,"pomodoro":false,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"İngilizce Gramer + Kelime Tekrarı","tuesday":"Reading & Paragraf Çözümü","wednesday":"Listening & Kelime Kartları","thursday":"Dilbilgisi + Deneme","friday":"YDT Soru Çözümü","saturday":"Genel YDT Denemesi","sunday":"Haftalık Tekrar & Dinlenme"}', 1770000000000, 1770000000000, 1, 'SYSTEM'),
      ('tpl-ea', 'Eşit Ağırlık', '{"includeHours":true,"pomodoro":false,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"TYT Türkçe + Matematik Temel","tuesday":"AYT Edebiyat + Tarih-1","wednesday":"AYT Matematik (Fonksiyonlar)","thursday":"AYT Coğrafya + Mantık","friday":"TYT Genel Soru Çözümü","saturday":"AYT Eşit Ağırlık Denemesi","sunday":"Haftalık Analiz & Dinlenme"}', 1770000000000, 1770000000000, 1, 'SYSTEM'),
      ('tpl-sayisal', 'Sayısal', '{"includeHours":true,"pomodoro":false,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"TYT/AYT Matematik + Fizik","tuesday":"AYT Kimya + Biyoloji","wednesday":"TYT Geometri + Matematik","thursday":"AYT Fizik (Mekanik) + Kimya","friday":"AYT Biyoloji + Problem Çözümü","saturday":"AYT Sayısal Denemesi","sunday":"Deneme Analizi & Eksik Tamamlama"}', 1770000000000, 1770000000000, 1, 'SYSTEM'),
      ('tpl-pom-dil', 'pomodoro Dil', '{"includeHours":true,"pomodoro":true,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"4x25dk Dilbilgisi & Kelime","tuesday":"4x25dk Okuma & Paragraf","wednesday":"4x25dk Kelime Ezberi & Test","thursday":"4x25dk Çıkmış Sorular","friday":"4x25dk Gramer Tekrarı","saturday":"YDT Deneme + Analiz","sunday":"Dinlenme & Kitap Okuma"}', 1770000000000, 1770000000000, 1, 'SYSTEM'),
      ('tpl-pom-ea', 'pomodoro Eşit Ağırlık', '{"includeHours":true,"pomodoro":true,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"6x25dk Matematik & Edebiyat","tuesday":"6x25dk Tarih & Coğrafya","wednesday":"6x25dk TYT/AYT Matematik","thursday":"6x25dk Türkçe Paragraf & Mantık","friday":"6x25dk Karma Soru Çözümü","saturday":"Alan Denemesi","sunday":"Haftalık Değerlendirme"}', 1770000000000, 1770000000000, 1, 'SYSTEM'),
      ('tpl-pom-sayisal', 'pomodoro Sayısal', '{"includeHours":true,"pomodoro":true,"generalReview":true,"tomorrowPrep":true,"bookReading":true}', '{"monday":"6x25dk Matematik & Fizik","tuesday":"6x25dk Kimya & Biyoloji","wednesday":"6x25dk Geometri & Problem","thursday":"6x25dk Fizik & Kimya Soru","friday":"6x25dk Biyoloji & Matematik","saturday":"Sayısal Deneme","sunday":"Haftalık Analiz & Dinlenme"}', 1770000000000, 1770000000000, 1, 'SYSTEM');
    `
  },
  {
    version: 4,
    name: '0004_mebbis_and_guidance_service_types',
    sql: `
      -- 1. MEBBIS processing status and Guidance Service Type in meetings
      ALTER TABLE meetings ADD COLUMN mebbis_processed INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE meetings ADD COLUMN guidance_service_type TEXT NOT NULL DEFAULT 'Psikolojik Danışma';
      ALTER TABLE meetings ADD COLUMN student_ids TEXT;

      -- 2. Appointment Type and Group Students in appointments
      ALTER TABLE appointments ADD COLUMN appointment_type TEXT NOT NULL DEFAULT 'Bireysel Öğrenci Görüşmesi';
      ALTER TABLE appointments ADD COLUMN student_ids TEXT;
    `
  },
  {
    version: 5,
    name: '0005_daily_notes',
    sql: `
      CREATE TABLE IF NOT EXISTS daily_notes (
        id TEXT PRIMARY KEY,
        school_year_id TEXT REFERENCES school_years(id),
        note_date TEXT NOT NULL, -- 'YYYY-MM-DD'
        content TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(note_date);
    `
  },
  {
    version: 6,
    name: '0006_appointment_result_notes',
    sql: `
      ALTER TABLE appointments ADD COLUMN result_note TEXT;
    `
  },
  {
    version: 7,
    name: '0007_agenda_and_annual_plan_updates',
    sql: `
      -- 1. Agenda items (Ajanda Notları / Toplantılar)
      CREATE TABLE IF NOT EXISTS agenda_items (
        id TEXT PRIMARY KEY,
        school_year_id TEXT REFERENCES school_years(id),
        title TEXT NOT NULL,
        agenda_date TEXT NOT NULL, -- 'YYYY-MM-DD'
        start_time TEXT, -- 'HH:MM'
        completed INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agenda_items_date ON agenda_items(agenda_date);

      -- 2. Annual plan items date range & activity type
      ALTER TABLE annual_plan_items ADD COLUMN activity_type TEXT;
      ALTER TABLE annual_plan_items ADD COLUMN start_date TEXT;
      ALTER TABLE annual_plan_items ADD COLUMN end_date TEXT;
    `
  },
  {
    version: 8,
    name: '0008_meeting_topics_and_extended_details',
    sql: `
      ALTER TABLE meetings ADD COLUMN meeting_topic TEXT;
      ALTER TABLE meetings ADD COLUMN meeting_topic_other TEXT;
      ALTER TABLE meetings ADD COLUMN activity_type TEXT;
      ALTER TABLE meetings ADD COLUMN activity_type_other TEXT;
      ALTER TABLE meetings ADD COLUMN end_time TEXT;
      ALTER TABLE meetings ADD COLUMN referral_institutions TEXT;
      ALTER TABLE meetings ADD COLUMN referral_other TEXT;
      ALTER TABLE meetings ADD COLUMN participant_type TEXT;
      ALTER TABLE meetings ADD COLUMN parent_relation TEXT;
      ALTER TABLE meetings ADD COLUMN teacher_name TEXT;
      ALTER TABLE meetings ADD COLUMN teacher_branch TEXT;
      ALTER TABLE meetings ADD COLUMN session_number INTEGER;
    `
  },
  {
    version: 9,
    name: '0009_meeting_groups_and_followup_appointments',
    sql: `
      ALTER TABLE appointments ADD COLUMN related_meeting_id TEXT;
      ALTER TABLE meetings ADD COLUMN planned_sessions INTEGER;
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_student ON meeting_participants(student_id);
    `
  },
  {
    version: 10,
    name: '0010_appointment_participants',
    sql: `
      CREATE TABLE IF NOT EXISTS appointment_participants (
        id TEXT PRIMARY KEY,
        appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_appointment_participants_appointment ON appointment_participants(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_participants_student ON appointment_participants(student_id);
    `
  },
  {
    version: 11,
    name: '0011_counselor_documents_archive',
    sql: `
      CREATE TABLE IF NOT EXISTS counselor_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        upload_date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_counselor_docs_title ON counselor_documents(title);
    `
  },
  {
    version: 12,
    name: '0012_presentations_archive',
    sql: `
      CREATE TABLE IF NOT EXISTS presentations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        slide_count INTEGER,
        upload_date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_presentations_title ON presentations(title);
    `
  },
  {
    version: 13,
    name: '0013_study_plans_redesign',
    sql: `
      ALTER TABLE study_plan_templates ADD COLUMN name TEXT;
      ALTER TABLE study_plan_templates ADD COLUMN features TEXT;
      ALTER TABLE study_plan_templates ADD COLUMN monday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN tuesday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN wednesday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN thursday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN friday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN saturday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plan_templates ADD COLUMN sunday TEXT NOT NULL DEFAULT '';

      UPDATE study_plan_templates SET name = title WHERE name IS NULL OR name = '';

      ALTER TABLE study_plans ADD COLUMN template_id TEXT;
      ALTER TABLE study_plans ADD COLUMN template_name_snapshot TEXT;
      ALTER TABLE study_plans ADD COLUMN features_snapshot TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN monday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN tuesday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN wednesday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN thursday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN friday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN saturday TEXT NOT NULL DEFAULT '';
      ALTER TABLE study_plans ADD COLUMN sunday TEXT NOT NULL DEFAULT '';

      UPDATE study_plans SET template_name_snapshot = title WHERE template_name_snapshot IS NULL OR template_name_snapshot = '';

      CREATE INDEX IF NOT EXISTS idx_study_plans_student_created ON study_plans(student_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_study_plan_templates_created ON study_plan_templates(created_at);
    `
  },
  {
    version: 14,
    name: '0014_survey_engine_redesign',
    sql: `
      -- 1. Extend Surveys Table
      ALTER TABLE surveys ADD COLUMN slug TEXT;
      ALTER TABLE surveys ADD COLUMN type TEXT NOT NULL DEFAULT 'SURVEY';
      ALTER TABLE surveys ADD COLUMN repeat_policy TEXT NOT NULL DEFAULT 'UNLIMITED';
      ALTER TABLE surveys ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE surveys ADD COLUMN current_version_number INTEGER NOT NULL DEFAULT 1;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_surveys_slug ON surveys(slug) WHERE deleted_at IS NULL;

      -- 2. Survey Versions Table (Immutable Question & Scoring Blueprint)
      CREATE TABLE IF NOT EXISTS survey_versions (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL DEFAULT 1,
        title_snapshot TEXT NOT NULL,
        description_snapshot TEXT,
        scoring_type TEXT NOT NULL DEFAULT 'SUM',
        is_published INTEGER NOT NULL DEFAULT 1,
        published_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_survey_versions_survey ON survey_versions(survey_id, version_number);

      -- 3. Survey Subscales Table
      CREATE TABLE IF NOT EXISTS survey_subscales (
        id TEXT PRIMARY KEY,
        survey_version_id TEXT NOT NULL REFERENCES survey_versions(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        calculation_method TEXT NOT NULL DEFAULT 'SUM',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_survey_subscales_version ON survey_subscales(survey_version_id);

      -- 4. Survey Interpretations Table
      CREATE TABLE IF NOT EXISTS survey_interpretations (
        id TEXT PRIMARY KEY,
        survey_version_id TEXT NOT NULL REFERENCES survey_versions(id) ON DELETE CASCADE,
        subscale_id TEXT REFERENCES survey_subscales(id) ON DELETE SET NULL,
        min_score REAL NOT NULL,
        max_score REAL NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        color_code TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_survey_interpretations_version ON survey_interpretations(survey_version_id);

      -- 5. Extend Survey Questions Table
      ALTER TABLE survey_questions ADD COLUMN survey_version_id TEXT REFERENCES survey_versions(id);
      ALTER TABLE survey_questions ADD COLUMN subscale_id TEXT REFERENCES survey_subscales(id);
      ALTER TABLE survey_questions ADD COLUMN is_reverse_scored INTEGER NOT NULL DEFAULT 0;

      -- 6. Extend Survey Options Table
      ALTER TABLE survey_options ADD COLUMN option_label TEXT;
      ALTER TABLE survey_options ADD COLUMN option_value TEXT;
      ALTER TABLE survey_options ADD COLUMN score_value REAL NOT NULL DEFAULT 0.0;
      ALTER TABLE survey_options ADD COLUMN reverse_score_value REAL NOT NULL DEFAULT 0.0;

      -- 7. Survey Applications / Attempts Table (Anket != Uygulama)
      CREATE TABLE IF NOT EXISTS survey_applications (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL REFERENCES surveys(id),
        survey_version_id TEXT NOT NULL REFERENCES survey_versions(id),
        student_id TEXT NOT NULL REFERENCES students(id),
        student_number_snapshot TEXT NOT NULL,
        school_year_id TEXT REFERENCES school_years(id),
        attempt_number INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        source TEXT NOT NULL DEFAULT 'web',
        started_at INTEGER,
        completed_at INTEGER NOT NULL,
        result_snapshot TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified_device_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_survey_applications_student ON survey_applications(student_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_survey_applications_survey ON survey_applications(survey_id, created_at);

      -- 8. Recreate Survey Answers Table to make response_id nullable & support application_id
      CREATE TABLE IF NOT EXISTS survey_answers_new (
        id TEXT PRIMARY KEY,
        response_id TEXT REFERENCES survey_responses(id) ON DELETE CASCADE,
        application_id TEXT REFERENCES survey_applications(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES survey_questions(id),
        selected_option_id TEXT REFERENCES survey_options(id),
        text_value TEXT,
        number_value REAL,
        boolean_value INTEGER,
        date_value TEXT,
        answer_value TEXT,
        answer_score REAL
      );

      INSERT OR IGNORE INTO survey_answers_new (id, response_id, question_id, selected_option_id, text_value, number_value, boolean_value, date_value)
      SELECT id, response_id, question_id, selected_option_id, text_value, number_value, boolean_value, date_value FROM survey_answers;

      DROP TABLE survey_answers;
      ALTER TABLE survey_answers_new RENAME TO survey_answers;

      -- 9. Survey Result Snapshots Table
      CREATE TABLE IF NOT EXISTS survey_result_snapshots (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL UNIQUE REFERENCES survey_applications(id) ON DELETE CASCADE,
        total_score REAL NOT NULL,
        subscale_scores_json TEXT,
        interpretation_label TEXT,
        interpretation_description TEXT,
        raw_metrics_json TEXT,
        calculated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_survey_snapshots_app ON survey_result_snapshots(application_id);
    `
  },
  {
    version: 15,
    name: '0015_classes_pdf_upload_datetime',
    sql: `
      ALTER TABLE classes ADD COLUMN pdf_uploaded_at INTEGER;
      ALTER TABLE classes ADD COLUMN pdf_upload_date TEXT;
      ALTER TABLE classes ADD COLUMN pdf_upload_time TEXT;
    `
  },
  {
    version: 16,
    name: '0016_counseling_activities_type_and_time',
    sql: `
      ALTER TABLE counseling_activities ADD COLUMN type TEXT NOT NULL DEFAULT 'activity';
      ALTER TABLE counseling_activities ADD COLUMN activity_time TEXT;
    `
  }
];

export function runMigrations(sqlite: Database.Database, emergencyBackupDir?: string): void {
  // Ensure app_meta exists to check schema version
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const row = sqlite.prepare("SELECT value FROM app_meta WHERE key = 'db_schema_version'").get() as { value: string } | undefined;
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  logger.info(`Current database schema version: ${currentVersion}`);

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      logger.info(`Applying migration v${migration.version}: ${migration.name}`);

      // Create emergency snapshot before running DDL if backup dir is specified
      if (emergencyBackupDir && fs.existsSync(sqlite.name) && fs.statSync(sqlite.name).size > 0) {
        if (!fs.existsSync(emergencyBackupDir)) {
          fs.mkdirSync(emergencyBackupDir, { recursive: true });
        }
        const snapshotPath = path.join(emergencyBackupDir, `pre_migration_v${migration.version}_${Date.now()}.sqlite`);
        try {
          fs.copyFileSync(sqlite.name, snapshotPath);
          logger.info(`Emergency backup saved to ${snapshotPath}`);
        } catch (err) {
          logger.warn(`Could not create emergency migration backup:`, err);
        }
      }

      // Execute in transaction
      const runTx = sqlite.transaction(() => {
        sqlite.exec(migration.sql);
        sqlite.prepare(`
          INSERT INTO app_meta (key, value, updated_at) 
          VALUES ('db_schema_version', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(migration.version.toString(), Date.now());
      });

      runTx();
      logger.info(`Migration v${migration.version} applied successfully.`);
    }
  }
}
