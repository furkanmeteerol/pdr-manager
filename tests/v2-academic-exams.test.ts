import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';
import { StudentService } from '../electron/services/students/StudentService';
import { AcademicEngine } from '../electron/services/academic/AcademicEngine';

describe('Phase V2: Academic Performance, Net Calculations, Targets & Study Plans', () => {
  const tempDir = path.join(process.cwd(), 'temp_academic_test_db');
  const dbPath = path.join(tempDir, 'test_academic.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;
  let studentService: StudentService;
  let academicEngine: AcademicEngine;

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
    academicEngine = new AcademicEngine(conn.db, 'DEVICE-TEST', syncEngine);
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should calculate subject nets using ÖSYM 4-wrong-1-correct rule for TYT and record exam result', () => {
    const student = studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '5001',
      firstName: 'Kaan',
      lastName: 'Öztürk',
      gender: 'male'
    });

    const exam = academicEngine.createExam({
      schoolYearId: 'year-2026',
      name: 'Özdebir TYT 1. Deneme',
      examType: 'TYT',
      date: '2026-10-15'
    });

    const subjects = academicEngine.getSubjects('TYT');
    expect(subjects.length).toBeGreaterThanOrEqual(4);

    const turkce = subjects.find(s => s.name === 'TYT Türkçe')!;
    const mat = subjects.find(s => s.name === 'TYT Temel Matematik')!;

    // 32 correct, 8 wrong on Turkish -> Net = 32 - (8 / 4) = 30.00
    // 35 correct, 4 wrong on Math    -> Net = 35 - (4 / 4) = 34.00
    const result = academicEngine.recordExamResult({
      examId: exam.id,
      studentId: student.id,
      items: [
        { subjectId: turkce.id, correct: 32, wrong: 8, empty: 0 },
        { subjectId: mat.id, correct: 35, wrong: 4, empty: 1 }
      ]
    });

    expect(result.totalCorrect).toBe(67);
    expect(result.totalWrong).toBe(12);
    expect(result.totalNet).toBe(64.0); // 30 + 34

    const turkceItem = result.items.find(i => i.subjectId === turkce.id)!;
    expect(turkceItem.net).toBe(30.0);

    const matItem = result.items.find(i => i.subjectId === mat.id)!;
    expect(matItem.net).toBe(34.0);
  });

  it('should calculate LGS net using MEB 3-wrong-1-correct rule', () => {
    const student = studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '8001',
      firstName: 'Ayşe',
      lastName: 'Güler',
      gender: 'female'
    });

    const exam = academicEngine.createExam({
      schoolYearId: 'year-2026',
      name: 'MEB LGS Deneme',
      examType: 'LGS',
      date: '2026-11-01'
    });

    const subjects = academicEngine.getSubjects('LGS');
    const lgsMat = subjects.find(s => s.name === 'LGS Matematik')!;

    // 17 correct, 3 wrong -> Net = 17 - (3 / 3) = 16.00
    const result = academicEngine.recordExamResult({
      examId: exam.id,
      studentId: student.id,
      items: [
        { subjectId: lgsMat.id, correct: 17, wrong: 3, empty: 0 }
      ]
    });

    expect(result.totalNet).toBe(16.0);
  });

  it('should track student targets, study plans, and daily question logs', () => {
    const student = studentService.createStudent({
      schoolYearId: 'year-2026',
      studentNumber: '5002',
      firstName: 'Mert',
      lastName: 'Demir',
      gender: 'male'
    });

    // 1. Create Target
    const target = academicEngine.createTarget({
      studentId: student.id,
      targetType: 'net',
      title: 'TYT 90+ Net Hedefi',
      targetValue: '90',
      unit: 'net',
      targetDate: '2027-01-15'
    });

    expect(target.id).toBeDefined();
    expect(target.status).toBe('in_progress');

    // Update target status
    const updatedTarget = academicEngine.updateTargetStatus(target.id, 'achieved');
    expect(updatedTarget.status).toBe('achieved');

    // 2. Create Study Plan
    const plan = academicEngine.createStudyPlan({
      studentId: student.id,
      title: 'Haftalık Yoğun Matematik & Fen Programı',
      startDate: '2026-10-01',
      endDate: '2026-10-07',
      items: [
        { date: '2026-10-01', subject: 'Matematik', topic: 'Fonksiyonlar', plannedQuestions: 50 },
        { date: '2026-10-02', subject: 'Fizik', topic: 'Kuvvet ve Hareket', plannedQuestions: 40 }
      ]
    });

    expect(plan.items).toHaveLength(2);

    // Complete item
    academicEngine.updateStudyPlanItemStatus(plan.items![0].id, 'completed', 55);
    const refreshedPlans = academicEngine.listStudyPlans(student.id);
    expect(refreshedPlans[0].completionRate).toBe(50);

    // 3. Log Daily Questions
    const subjects = academicEngine.getSubjects('TYT');
    const qLog = academicEngine.logQuestions({
      studentId: student.id,
      date: '2026-10-01',
      subjectId: subjects[0].id,
      questionCount: 60,
      correctCount: 52,
      wrongCount: 8,
      emptyCount: 0
    });

    expect(qLog.net).toBe(50.0); // 52 - 8/4 = 50.0
  });
});
