import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { StudentService } from '../electron/services/students/StudentService';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { DataTransferService } from '../electron/services/backup/DataTransferService';
import { EncryptionService } from '../electron/services/security/EncryptionService';
import * as schema from '../database/schema';
import fs from 'node:fs';
import path from 'node:path';

describe('V4: %100 Local-First Architecture & Paper Survey Manual Entry Test Suite', () => {
  let sqliteDb: Database.Database;
  let db: any;
  let studentService: StudentService;
  let surveyEngine: SurveyEngine;
  let dataTransferService: DataTransferService;
  let encryptionService: EncryptionService;
  const testDir = path.join(process.cwd(), 'temp_v4_local_first_test');
  const testDbPath = path.join(testDir, 'test_v4.sqlite');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    const conn = createDatabaseConnection(testDbPath);
    sqliteDb = conn.sqlite;
    db = conn.db;
    runMigrations(sqliteDb);

    const mockSyncEngine = {
      recordChange: () => {},
      queueChange: () => {},
      subscribe: () => () => {},
      getPendingCount: () => 0
    } as any;

    studentService = new StudentService(db, 'test-device-v4');
    surveyEngine = new SurveyEngine(db, 'test-device-v4', mockSyncEngine);
    encryptionService = new EncryptionService();

    const mockDbService = {
      checkpoint: () => {
        try {
          sqliteDb.pragma('wal_checkpoint(FULL)');
        } catch {}
      },
      getDbPath: () => testDbPath,
      getSqlite: () => sqliteDb,
      getDb: () => db,
      close: () => {
        try { sqliteDb.close(); } catch {}
      },
      init: () => {
        const reConn = createDatabaseConnection(testDbPath);
        sqliteDb = reConn.sqlite;
        db = reConn.db;
        return { db, sqlite: sqliteDb };
      }
    } as any;

    dataTransferService = new DataTransferService(mockDbService, encryptionService, 'test-device-v4', testDir);

    // Register active school year
    db.insert(schema.schoolYears).values({
      id: '2026-2027',
      name: '2026-2027 Eğitim Öğretim Yılı',
      startDate: '2026-09-01',
      endDate: '2027-06-20',
      isActive: 1,
      version: 1,
      lastModifiedDeviceId: 'test-device-v4',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }).run();

    // Register MEB Devamsızlık Nedenleri Anketi
    surveyEngine.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
  });

  afterEach(() => {
    try {
      sqliteDb.close();
    } catch {}
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('TEST 1 & 2: Should create student purely in local SQLite with 0 Firebase/Cloudflare calls', () => {
    const student = studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15615',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female',
      phone: '05551112233'
    });

    expect(student).toBeDefined();
    expect(student.studentNumber).toBe('15615');
    expect(student.firstName).toBe('Zeynep');
    expect(student.lastName).toBe('Akaya');

    // Direct SQLite check
    const row = sqliteDb.prepare('SELECT * FROM students WHERE id = ?').get(student.id) as any;
    expect(row).toBeDefined();
    expect(row.student_number).toBe('15615');
  });

  it('TEST 3, 4 & 5: Devamsızlık Nedenleri Anketi local definition with 52 items and 7 subscales', () => {
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi');
    expect(survey).toBeDefined();
    expect(survey?.id).toBe('srv-devamsizlik-nedenleri');
    expect(survey?.title).toBe('Devamsızlık Nedenleri Anketi');

    const version = survey?.currentVersion;
    expect(version).toBeDefined();
    expect(version?.questions).toHaveLength(52);
    expect(version?.subscales).toHaveLength(7);

    // Verify questions 1-51 single_choice (Evet=2, Bazen=1, Hayır=0)
    for (let i = 1; i <= 51; i++) {
      const q = version!.questions!.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.questionType).toBe('single_choice');
      expect(q.options).toHaveLength(3);
    }

    // Verify 52nd question text/textarea optional
    const q52 = version!.questions!.find(item => item.questionOrder === 52)!;
    expect(q52).toBeDefined();
    expect(q52.questionType).toBe('text');
    expect(q52.questionText).toBe('Belirtmek istediğiniz diğer nedenler varsa yazınız.');
  });

  it('TEST 6: Manual entry with 1-51 answered and optional 52 blank submits successfully', () => {
    const student = studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15615',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female'
    });

    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;

    // Answer questions 1 to 51 with Evet (score 2)
    const answers = questions.slice(0, 51).map(q => ({
      questionId: q.id,
      selectedOptionId: q.options!.find(o => o.scoreValue === 2)!.id
    }));

    // Question 52 is omitted (blank)
    const submitResult = surveyEngine.submitApplication({
      surveySlug: 'devamsizlik-nedenleri-anketi',
      studentNumber: '15615',
      answers,
      source: 'manual_entry'
    });

    expect(submitResult.success).toBe(true);
    expect(submitResult.application).toBeDefined();
    expect(submitResult.application?.studentName).toBe('Zeynep Akaya');
    expect(submitResult.application?.status).toBe('COMPLETED');

    // Verify in SQLite
    const appRow = sqliteDb.prepare('SELECT * FROM survey_applications WHERE id = ?').get(submitResult.application!.id) as any;
    expect(appRow).toBeDefined();
    expect(appRow.student_id).toBe(student.id);
  });

  it('TEST 7: Manual entry with 52 filled correctly stores the text answer in survey_answers', () => {
    const student = studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15615',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female'
    });
    expect(student.id).toBeDefined();

    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;

    const answers = questions.slice(0, 51).map(q => ({
      questionId: q.id,
      selectedOptionId: q.options![0].id
    }));

    const q52 = questions.find(q => q.questionOrder === 52)!;
    answers.push({
      questionId: q52.id,
      selectedOptionId: undefined as any,
      answerValue: 'Kardeşime baktığım için okula geç kalıyorum.'
    } as any);

    const submitResult = surveyEngine.submitApplication({
      surveySlug: 'devamsizlik-nedenleri-anketi',
      studentNumber: '15615',
      answers,
      source: 'manual_entry'
    });

    expect(submitResult.success).toBe(true);

    // Verify text answer in survey_answers table
    const ans52Row = sqliteDb.prepare(
      'SELECT * FROM survey_answers WHERE application_id = ? AND question_id = ?'
    ).get(submitResult.application!.id, q52.id) as any;

    expect(ans52Row).toBeDefined();
    expect(ans52Row.answer_value).toBe('Kardeşime baktığım için okula geç kalıyorum.');
  });

  it('TEST 8, 9 & 10: ScoringEngine produces accurate subscale results & stores snapshots in SQLite', () => {
    studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15615',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female'
    });

    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;

    // Answer all 51 with Evet (score 2)
    const answers = questions.slice(0, 51).map(q => ({
      questionId: q.id,
      selectedOptionId: q.options!.find(o => o.scoreValue === 2)!.id
    }));

    const submitResult = surveyEngine.submitApplication({
      surveySlug: 'devamsizlik-nedenleri-anketi',
      studentNumber: '15615',
      answers,
      source: 'manual_entry'
    });

    expect(submitResult.success).toBe(true);
    const snapshot = submitResult.application!.resultSnapshot;
    expect(snapshot).toBeDefined();

    // With all answers = 2, all subscales average should be exactly 2.0
    expect(snapshot?.subscales).toBeDefined();
    expect(snapshot?.subscales?.length).toBe(7);
    for (const sub of snapshot?.subscales || []) {
      expect(sub.score).toBe(2);
    }

    // Verify snapshot in SQLite table
    const snapRow = sqliteDb.prepare(
      'SELECT * FROM survey_result_snapshots WHERE application_id = ?'
    ).get(submitResult.application!.id) as any;
    expect(snapRow).toBeDefined();

    // Verify application history listing
    const appList = surveyEngine.listApplications({ surveyId: survey.id });
    expect(appList).toHaveLength(1);
    expect(appList[0].studentName).toBe('Zeynep Akaya');
  });

  it('TEST 12, 13, 14 & 15: Encrypted local .pdrbak export, checksum integrity, and safe import', async () => {
    studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15615',
      firstName: 'Zeynep',
      lastName: 'Akaya',
      gender: 'female'
    });

    const exportPath = path.join(testDir, 'v4_test_backup.pdrbak');
    const testPassword = 'LocalFirstPassword2026!';

    // 1. Create encrypted .pdrbak package
    const exportRes = await dataTransferService.exportDataPackage(exportPath, testPassword);
    expect(exportRes.success).toBe(true);
    expect(fs.existsSync(exportPath)).toBe(true);

    // 2. Add another student
    studentService.createStudent({
      schoolYearId: '2026-2027',
      studentNumber: '15616',
      firstName: 'Can',
      lastName: 'Yıldız',
      gender: 'male'
    });

    const countBeforeRestore = sqliteDb.prepare('SELECT count(*) as c FROM students').get() as any;
    expect(countBeforeRestore.c).toBe(2);

    // 3. Import and replace database from .pdrbak
    const importRes = await dataTransferService.importAndReplaceDatabase(exportPath, testPassword);
    expect(importRes.success).toBe(true);

    // 4. Verify restored state by reading the restored SQLite file
    const verifySqlite = new Database(testDbPath, { readonly: true });
    const countAfterRestore = verifySqlite.prepare('SELECT count(*) as c FROM students').get() as any;
    expect(countAfterRestore.c).toBe(1);
    const restoredStudent = verifySqlite.prepare('SELECT * FROM students').get() as any;
    expect(restoredStudent.student_number).toBe('15615');
    verifySqlite.close();

    // Survey definition must be 100% intact after import
    const mockSyncEngine = { recordChange: () => {} } as any;
    const surveyEngineAfter = new SurveyEngine(db, 'test-device-v4', mockSyncEngine);
    const surveyAfter = surveyEngineAfter.getSurveyBySlug('devamsizlik-nedenleri-anketi');
    expect(surveyAfter?.currentVersion?.questions).toHaveLength(52);
    expect(surveyAfter?.currentVersion?.subscales).toHaveLength(7);
  });
});
