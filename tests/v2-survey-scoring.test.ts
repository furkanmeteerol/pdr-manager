import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { StudentService } from '../electron/services/students/StudentService';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';

describe('Phase V2: Dynamic Survey Engine, Category Scoring & Dual Verification Matching', () => {
  const tempDir = path.join(process.cwd(), 'temp_survey_test_db');
  const dbPath = path.join(tempDir, 'test_survey.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let studentService: StudentService;
  let surveyEngine: SurveyEngine;

  beforeEach(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-15', 1, 1000, 1000, 1, 'DEVICE-TEST')
    `).run();

    syncEngine = new SyncEngine(conn.db, 'DEVICE-TEST');
    studentService = new StudentService(conn.db, 'DEVICE-TEST', syncEngine);
    surveyEngine = new SurveyEngine(conn.db, 'DEVICE-TEST', syncEngine);
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create dynamic survey, assign to students, and calculate sub-scale category scores on submit', () => {
    // 1. Create Student
    const student = studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '2001',
      firstName: 'Zeynep',
      lastName: 'Aksoy',
      gender: 'female'
    });

    // 2. Create Dynamic Survey with Likert & Sub-scale categories
    const survey = surveyEngine.createSurvey({
      title: 'Sınav Kaygısı Ölçeği',
      description: 'LGS/YKS Öğrencileri için Kaygı Değerlendirme Envanteri',
      targetMode: 'student_linked',
      estimatedMinutes: 10,
      scoringMethod: 'categories',
      questions: [
        {
          questionText: 'Sınavdan önce kalp çarpıntısı yaşarım.',
          questionType: 'likert_5',
          category: 'Bedensel',
          options: [
            { optionText: 'Hiçbir Zaman', score: 1 },
            { optionText: 'Bazen', score: 3 },
            { optionText: 'Her Zaman', score: 5 }
          ]
        },
        {
          questionText: 'Sınavda başarısız olursam herkes benimle alay eder diye düşünürüm.',
          questionType: 'likert_5',
          category: 'Bilişsel',
          options: [
            { optionText: 'Hiçbir Zaman', score: 1 },
            { optionText: 'Bazen', score: 3 },
            { optionText: 'Her Zaman', score: 5 }
          ]
        }
      ]
    });

    expect(survey.id).toBeDefined();
    expect(survey.targetMode).toBe('student_linked');
    expect(survey.questions).toHaveLength(2);

    // 3. Assign Survey to Student
    const assignments = surveyEngine.assignSurvey({
      surveyId: survey.id,
      studentIds: [student.id],
      dueDate: '2026-09-30'
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].status).toBe('assigned');

    // 4. Submit Response with high anxiety answers
    const q1 = survey.questions![0];
    const q2 = survey.questions![1];

    const optQ1_HerZaman = q1.options.find(o => o.score === 5)!;
    const optQ2_Bazen = q2.options.find(o => o.score === 3)!;

    const response = surveyEngine.submitResponse({
      assignmentId: assignments[0].id,
      studentId: student.id,
      surveyId: survey.id,
      source: 'student_kiosk',
      answers: [
        { questionId: q1.id, selectedOptionId: optQ1_HerZaman.id },
        { questionId: q2.id, selectedOptionId: optQ2_Bazen.id }
      ]
    });

    expect(response.totalScore).toBe(8);
    expect(response.categoryScores).toBeDefined();
    expect(response.categoryScores!['Bedensel']).toBe(5);
    expect(response.categoryScores!['Bilişsel']).toBe(3);

    // 5. Verify assignment marked completed
    const updatedAssignments = surveyEngine.listAssignments({ studentId: student.id });
    expect(updatedAssignments[0].status).toBe('completed');
    expect(updatedAssignments[0].completedAt).toBeDefined();

    // 6. Verify sync_changes recorded
    const changes = sqlite.prepare("SELECT * FROM sync_changes WHERE entity_type = 'survey_responses'").all() as any[];
    expect(changes.length).toBe(1);
    expect(changes[0].operation).toBe('create');
  });

  // =========================================================================
  // DUAL-VERIFICATION MATCHING TEST SUITE (Okul Numarası + Ad Soyad)
  // =========================================================================
  describe('Dual-Verification Student Matching (School Number + Name Verification)', () => {
    let studentAhmet: any;
    let studentMehmet: any;
    let studentAliCan101: any;
    let studentAliCan202: any;
    let survey: any;

    beforeEach(() => {
      studentAhmet = studentService.createStudent({
        schoolYearId: 'year-2026',
        studentNumber: '1042',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        gender: 'male',
        email: 'ahmet.yilmaz@okul.k12.tr'
      });

      studentMehmet = studentService.createStudent({
        schoolYearId: 'year-2026',
        studentNumber: '1043',
        firstName: 'Mehmet',
        lastName: 'Kaya',
        gender: 'male'
      });

      // Two students with same name but different school numbers
      studentAliCan101 = studentService.createStudent({
        schoolYearId: 'year-2026',
        studentNumber: '101',
        firstName: 'Ali',
        lastName: 'Can',
        gender: 'male'
      });

      studentAliCan202 = studentService.createStudent({
        schoolYearId: 'year-2026',
        studentNumber: '202',
        firstName: 'Ali',
        lastName: 'Can',
        gender: 'male'
      });

      survey = surveyEngine.createSurvey({
        title: 'Öğrenci Değerlendirme Formu',
        targetMode: 'student_linked',
        questions: [
          {
            questionText: 'Okul ortamından memnunum.',
            questionType: 'likert_5',
            options: [{ optionText: 'Evet', score: 5 }, { optionText: 'Hayır', score: 1 }]
          }
        ]
      });
    });

    it('1. [Doğru Okul No + Doğru İsim] -> Otomatik eşleşmeli ve Ahmet Yılmaz kaydına yazılmalı', () => {
      const match = surveyEngine.matchStudentResponse({
        schoolNumber: '1042',
        name: 'Ahmet Yılmaz'
      });

      expect(match.matched).toBe(true);
      expect(match.status).toBe('matched');
      expect(match.student?.id).toBe(studentAhmet.id);
      expect(match.student?.firstName).toBe('Ahmet');

      // Submit response
      const res = surveyEngine.submitResponse({
        studentId: match.student?.id,
        respondentName: 'Ahmet Yılmaz',
        respondentStudentNumber: '1042',
        matchStatus: match.status,
        surveyId: survey.id,
        source: 'local',
        answers: [{ questionId: survey.questions[0].id, numberValue: 5 }]
      });

      expect(res.matchStatus).toBe('matched');
      expect(res.studentId).toBe(studentAhmet.id);

      // Verify in list
      const studentResponses = surveyEngine.listResponses({ studentId: studentAhmet.id });
      expect(studentResponses.length).toBe(1);
    });

    it('2. [Doğru Okul No + Yanlış İsim] -> Eşleşme REDDEDİLMELİ ve Ahmet Yılmaz kaydına YAZILMAMALI', () => {
      // Student entered No: 1042, but Name: "Mehmet Kaya"
      const match = surveyEngine.matchStudentResponse({
        schoolNumber: '1042',
        name: 'Mehmet Kaya'
      });

      expect(match.matched).toBe(false);
      expect(match.status).toBe('mismatch_rejected');
      expect(match.reason).toContain('uyuşmuyor');

      // Submit response with mismatch status
      const res = surveyEngine.submitResponse({
        studentId: match.student?.id,
        respondentName: 'Mehmet Kaya',
        respondentStudentNumber: '1042',
        matchStatus: match.status,
        mismatchReason: match.reason,
        surveyId: survey.id,
        source: 'local',
        answers: [{ questionId: survey.questions[0].id, numberValue: 5 }]
      });

      expect(res.matchStatus).toBe('mismatch_rejected');
      expect(res.studentId).toBeUndefined();

      // CRITICAL: Ahmet Yılmaz must NOT have received this response!
      const ahmetResponses = surveyEngine.listResponses({ studentId: studentAhmet.id });
      expect(ahmetResponses.length).toBe(0);

      // Mehmet Kaya must NOT have received this response automatically either
      const mehmetResponses = surveyEngine.listResponses({ studentId: studentMehmet.id });
      expect(mehmetResponses.length).toBe(0);
    });

    it('3. [Bulunamayan Okul No] -> Eşleşmemeli ve unmatched_pending olarak işaretlenmeli', () => {
      const match = surveyEngine.matchStudentResponse({
        schoolNumber: '9999',
        name: 'Bilinmeyen Öğrenci'
      });

      expect(match.matched).toBe(false);
      expect(match.status).toBe('unmatched_pending');
      expect(match.reason).toContain('kayıtlı değil');

      const res = surveyEngine.submitResponse({
        respondentName: 'Bilinmeyen Öğrenci',
        respondentStudentNumber: '9999',
        matchStatus: match.status,
        mismatchReason: match.reason,
        surveyId: survey.id,
        source: 'local',
        answers: [{ questionId: survey.questions[0].id, numberValue: 5 }]
      });

      expect(res.matchStatus).toBe('unmatched_pending');
      expect(res.studentId).toBeUndefined();
    });

    it('4. [Boş Okul No] -> Eşleşmemeli', () => {
      const match = surveyEngine.matchStudentResponse({
        schoolNumber: '   ',
        name: 'Ahmet Yılmaz'
      });

      expect(match.matched).toBe(false);
      expect(match.status).toBe('unmatched_pending');
      expect(match.reason).toContain('boş bırakılmış');
    });

    it('5. [Türkçe Karakter / Büyük-Küçük Harf / Boşluk Farkları] -> Normalize edilerek doğru eşleşmeli', () => {
      const variations = [
        '  ahmet   yılmaz  ',
        'AHMET YILMAZ',
        'ahmet yilmaz',
        'Ahmet  YILMAZ',
        'Yılmaz Ahmet',
        'yilmaz ahmet'
      ];

      for (const nameVar of variations) {
        const match = surveyEngine.matchStudentResponse({
          schoolNumber: '1042',
          name: nameVar
        });
        expect(match.matched).toBe(true);
        expect(match.status).toBe('matched');
        expect(match.student?.id).toBe(studentAhmet.id);
      }
    });

    it('6. [Aynı İsimli İki Öğrenci] -> Okul numarası sayesinde doğru öğrenci seçilmeli', () => {
      // Ali Can #101
      const match101 = surveyEngine.matchStudentResponse({
        schoolNumber: '101',
        name: 'Ali Can'
      });
      expect(match101.matched).toBe(true);
      expect(match101.student?.id).toBe(studentAliCan101.id);
      expect(match101.student?.studentNumber).toBe('101');

      // Ali Can #202
      const match202 = surveyEngine.matchStudentResponse({
        schoolNumber: '202',
        name: 'Ali Can'
      });
      expect(match202.matched).toBe(true);
      expect(match202.student?.id).toBe(studentAliCan202.id);
      expect(match202.student?.studentNumber).toBe('202');
    });
  });

  // =========================================================================
  // ANONYMOUS_AGGREGATED VS STUDENT_LINKED SURVEY MODE & ANALYTICS TEST SUITE
  // =========================================================================
  describe('ANONYMOUS_AGGREGATED Mode & Aggregate Analytics', () => {
    let studentTest: any;
    let anonymousSurvey: any;

    beforeEach(() => {
      studentTest = studentService.createStudent({
        schoolYearId: 'year-2026',
        studentNumber: '3001',
        firstName: 'Selin',
        lastName: 'Aydın',
        gender: 'female',
        email: 'selin.aydin@okul.k12.tr'
      });

      anonymousSurvey = surveyEngine.createSurvey({
        title: 'Öğretmen ve Okul İklimi Genel Değerlendirme Anketi',
        description: 'Tüm okul paydaşları için genel memnuniyet formu',
        targetMode: 'anonymous_aggregated',
        scoringMethod: 'categories',
        questions: [
          {
            questionText: 'Okulun fiziksel çalışma ortamını yeterli buluyorum.',
            questionType: 'likert_5',
            category: 'Fiziksel Ortam',
            options: [
              { optionText: '1 - Katılmıyorum', score: 1 },
              { optionText: '3 - Kararsızım', score: 3 },
              { optionText: '5 - Tamamen Katılıyorum', score: 5 }
            ]
          },
          {
            questionText: 'Okul içi iletişim ve işbirliği etkilidir.',
            questionType: 'likert_5',
            category: 'İletişim',
            options: [
              { optionText: '1 - Katılmıyorum', score: 1 },
              { optionText: '3 - Kararsızım', score: 3 },
              { optionText: '5 - Tamamen Katılıyorum', score: 5 }
            ]
          }
        ]
      });
    });

    it('1. [ANONYMOUS_AGGREGATED] -> Öğrenciye atama yapılamamalı (hata fırlatmalı)', () => {
      expect(() => {
        surveyEngine.assignSurvey({
          surveyId: anonymousSurvey.id,
          studentIds: [studentTest.id]
        });
      }).toThrow('Anonim / Toplu anketler belirli öğrencilere atanamaz.');
    });

    it('2. [ANONYMOUS_AGGREGATED] -> Cevap kaydedildiğinde hiçbir öğrenciye bağlanmamalı ve studentId null olmalı', () => {
      const q1 = anonymousSurvey.questions[0];
      const q2 = anonymousSurvey.questions[1];

      const res = surveyEngine.submitResponse({
        surveyId: anonymousSurvey.id,
        source: 'local',
        answers: [
          { questionId: q1.id, selectedOptionId: q1.options[2].id }, // 5
          { questionId: q2.id, selectedOptionId: q2.options[1].id }  // 3
        ]
      });

      expect(res.matchStatus).toBe('anonymous');
      expect(res.studentId).toBeUndefined();
      expect(res.respondentName).toBeUndefined();
      expect(res.respondentStudentNumber).toBeUndefined();
      expect(res.totalScore).toBe(8);

      // Student record must have 0 survey responses
      const studentResponses = surveyEngine.listResponses({ studentId: studentTest.id });
      expect(studentResponses.length).toBe(0);
    });

    it('3. [ANONYMOUS_AGGREGATED] -> Payload içinde öğrenci e-postası veya okul no gönderilse bile backend eşleştirmeyi engellemeli', () => {
      const q1 = anonymousSurvey.questions[0];

      const res = surveyEngine.submitResponse({
        studentId: studentTest.id,
        respondentName: 'Selin Aydın',
        respondentStudentNumber: '3001',
        respondentEmail: 'selin.aydin@okul.k12.tr',
        surveyId: anonymousSurvey.id,
        source: 'local',
        answers: [
          { questionId: q1.id, selectedOptionId: q1.options[0].id } // 1
        ]
      });

      // Strict backend enforcement: must strip student identification and mark anonymous
      expect(res.matchStatus).toBe('anonymous');
      expect(res.studentId).toBeUndefined();
      expect(res.respondentName).toBeUndefined();
      expect(res.respondentStudentNumber).toBeUndefined();
      expect(res.respondentEmail).toBeUndefined();

      const studentResponses = surveyEngine.listResponses({ studentId: studentTest.id });
      expect(studentResponses.length).toBe(0);
    });

    it('4. [ANONYMOUS_AGGREGATED] -> Toplu istatistikler ve alt boyut puanları (getSurveyAnalytics) doğru hesaplanmalı', () => {
      const q1 = anonymousSurvey.questions[0];
      const q2 = anonymousSurvey.questions[1];

      // Respondent 1: Q1 = 5, Q2 = 5 (Total = 10)
      surveyEngine.submitResponse({
        surveyId: anonymousSurvey.id,
        source: 'local',
        answers: [
          { questionId: q1.id, selectedOptionId: q1.options[2].id },
          { questionId: q2.id, selectedOptionId: q2.options[2].id }
        ]
      });

      // Respondent 2: Q1 = 3, Q2 = 3 (Total = 6)
      surveyEngine.submitResponse({
        surveyId: anonymousSurvey.id,
        source: 'local',
        answers: [
          { questionId: q1.id, selectedOptionId: q1.options[1].id },
          { questionId: q2.id, selectedOptionId: q2.options[1].id }
        ]
      });

      // Respondent 3: Q1 = 1, Q2 = 1 (Total = 2)
      surveyEngine.submitResponse({
        surveyId: anonymousSurvey.id,
        source: 'local',
        answers: [
          { questionId: q1.id, selectedOptionId: q1.options[0].id },
          { questionId: q2.id, selectedOptionId: q2.options[0].id }
        ]
      });

      const analytics = surveyEngine.getSurveyAnalytics(anonymousSurvey.id);
      expect(analytics).not.toBeNull();
      expect(analytics!.totalRespondents).toBe(3);
      expect(analytics!.targetMode).toBe('anonymous_aggregated');
      expect(analytics!.overallAverageScore).toBe(6); // (10 + 6 + 2) / 3 = 6.0

      // Category Averages:
      // Fiziksel Ortam: 5 + 3 + 1 = 9 -> avg = 3.0
      // İletişim: 5 + 3 + 1 = 9 -> avg = 3.0
      expect(analytics!.categoryAverages?.['Fiziksel Ortam']?.average).toBe(3);
      expect(analytics!.categoryAverages?.['İletişim']?.average).toBe(3);

      // Question Option Distribution
      const q1Stats = analytics!.questionStats.find((s: any) => s.questionId === q1.id);
      expect(q1Stats?.responseCount).toBe(3);
      expect(q1Stats?.averageScore).toBe(3);
      expect(q1Stats?.optionDistribution?.['1 - Katılmıyorum']).toBe(1);
      expect(q1Stats?.optionDistribution?.['3 - Kararsızım']).toBe(1);
      expect(q1Stats?.optionDistribution?.['5 - Tamamen Katılıyorum']).toBe(1);
    });
  });
});
