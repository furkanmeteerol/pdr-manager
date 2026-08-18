import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { OfflineSurveyPackageService } from '../electron/services/surveys/OfflineSurveyPackageService';

describe('Phase V3: Offline Survey Package & AES-256-GCM Import Service', () => {
  const tempDir = path.join(process.cwd(), 'temp_offline_survey_test_db');
  const dbPath = path.join(tempDir, 'test_offline_survey.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let surveyEngine: SurveyEngine;
  let service: OfflineSurveyPackageService;
  let studentSurveyId: string;
  let anonSurveyId: string;
  let testStudentId = 'student-test-101';

  beforeEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);

    syncEngine = new SyncEngine(conn.db, 'dev-test-1');
    surveyEngine = new SurveyEngine(conn.db, 'dev-test-1', syncEngine);
    service = new OfflineSurveyPackageService(sqlite, surveyEngine);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, version, last_modified_device_id, created_at, updated_at)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1, 'dev-1', 1000, 1000)
    `).run();

    // Add test student
    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, first_name, last_name, student_number, gender, version, last_modified_device_id, created_at, updated_at)
      VALUES (?, 'year-2026', 'Ahmet', 'Kaya', '1088', 'male', 1, 'dev-1', 1000, 1000)
    `).run(testStudentId);

    // Create Student Linked Survey via SurveyEngine
    const stdSurvey = surveyEngine.createSurvey({
      title: 'Akademik Öz-Yeterlik Ölçeği',
      description: 'Öğrenci başarı inancı',
      targetMode: 'student_linked',
      estimatedMinutes: 10,
      scoringMethod: 'categories',
      questions: [
        {
          questionText: 'Zor derslerin üstesinden gelebilirim.',
          questionType: 'likert_5',
          category: 'Akademik',
          required: true,
          options: [
            { optionText: '5 - Her Zaman', score: 5 },
            { optionText: '1 - Hiçbir Zaman', score: 1 }
          ]
        },
        {
          questionText: 'Sınavlara düzenli hazırlanırım.',
          questionType: 'likert_5',
          category: 'Çalışma Alışkanlığı',
          required: true,
          options: [
            { optionText: '4 - Sıklıkla', score: 4 },
            { optionText: '1 - Hiçbir Zaman', score: 1 }
          ]
        }
      ]
    });
    studentSurveyId = stdSurvey.id;

    // Create Anonymous Aggregated Survey via SurveyEngine
    const anSurvey = surveyEngine.createSurvey({
      title: 'Okul Memnuniyet Anketi',
      description: 'Genel iklim anketi',
      targetMode: 'anonymous_aggregated',
      estimatedMinutes: 5,
      scoringMethod: 'sum',
      questions: [
        {
          questionText: 'Okulumuzun fiziki imkanlarından memnunum.',
          questionType: 'likert_5',
          category: 'Fiziki',
          required: true,
          options: [
            { optionText: '5 - Evet', score: 5 },
            { optionText: '1 - Hayır', score: 1 }
          ]
        }
      ]
    });
    anonSurveyId = anSurvey.id;
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should generate a standalone single-file HTML offline survey bundle', () => {
    const html = service.generateOfflineHtmlPackage(studentSurveyId);

    expect(html).toBeDefined();
    expect(html).toContain('Akademik Öz-Yeterlik Ölçeği');
    expect(html).toContain('Zor derslerin üstesinden gelebilirim.');
    expect(html).toContain('AES-GCM');
    expect(html).toContain('PBKDF2');
  });

  it('should encrypt and decrypt payload using true AES-256-GCM', () => {
    const payload = {
      surveyId: studentSurveyId,
      respondentName: 'Ahmet Kaya',
      respondentStudentNumber: '1088',
      answers: [],
      totalScore: 9,
      completedAt: Date.now()
    };

    const encrypted = OfflineSurveyPackageService.encryptPayload(payload);
    expect(encrypted.startsWith('PDRSURV:v1:')).toBe(true);

    const decrypted = OfflineSurveyPackageService.decryptPayload(encrypted);
    expect(decrypted.surveyId).toBe(studentSurveyId);
    expect(decrypted.respondentName).toBe('Ahmet Kaya');
    expect(decrypted.totalScore).toBe(9);
  });

  it('should reject tampered or corrupted encrypted survey payloads', () => {
    const payload = { surveyId: studentSurveyId, answers: [] };
    const encrypted = OfflineSurveyPackageService.encryptPayload(payload);

    // Corrupt ciphertext part
    const parts = encrypted.split(':');
    parts[parts.length - 1] = parts[parts.length - 1].substring(0, parts[parts.length - 1].length - 4) + 'AAAA';
    const corrupted = parts.join(':');

    expect(() => OfflineSurveyPackageService.decryptPayload(corrupted)).toThrow();
  });

  it('should import STUDENT_LINKED offline survey and match SQLite student record', () => {
    const survey = surveyEngine.getSurveyById(studentSurveyId)!;
    const q1 = survey.questions![0];
    const q2 = survey.questions![1];

    const payload = {
      surveyId: studentSurveyId,
      targetMode: 'student_linked',
      respondentName: 'Ahmet Kaya',
      respondentStudentNumber: '1088',
      answers: [
        { questionId: q1.id, textValue: '5 - Her Zaman', numberValue: 5 },
        { questionId: q2.id, textValue: '4 - Sıklıkla', numberValue: 4 }
      ],
      submittedAt: Date.now()
    };

    const encrypted = OfflineSurveyPackageService.encryptPayload(payload);
    const importRes = service.importOfflineSurveyResult(encrypted);

    expect(importRes.success).toBe(true);
    expect(importRes.studentMatched).toBe(true);
    expect(importRes.studentName).toBe('Ahmet Kaya');
    expect(importRes.totalScore).toBe(9);

    // Verify response row in SQLite
    const responses = surveyEngine.listResponses({ surveyId: studentSurveyId, studentId: testStudentId });
    expect(responses.length).toBe(1);
    expect(responses[0].matchStatus).toBe('matched');
    expect(responses[0].source).toBe('offline_package');
  });

  it('should import ANONYMOUS_AGGREGATED offline survey without student linkage', () => {
    const survey = surveyEngine.getSurveyById(anonSurveyId)!;
    const q1 = survey.questions![0];

    const payload = {
      surveyId: anonSurveyId,
      targetMode: 'anonymous_aggregated',
      answers: [
        { questionId: q1.id, textValue: '5 - Evet', numberValue: 5 }
      ],
      submittedAt: Date.now()
    };

    const encrypted = OfflineSurveyPackageService.encryptPayload(payload);
    const importRes = service.importOfflineSurveyResult(encrypted);

    expect(importRes.success).toBe(true);
    expect(importRes.studentMatched).toBe(false);

    // Verify response row in SQLite has matchStatus = 'anonymous'
    const responses = surveyEngine.listResponses({ surveyId: anonSurveyId });
    expect(responses.length).toBe(1);
    expect(responses[0].matchStatus).toBe('anonymous');
    expect(responses[0].source).toBe('offline_package');
  });
});
