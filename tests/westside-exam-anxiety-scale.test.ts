import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { WESTSIDE_SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/westsideSinavKaygisiOlcegi';
import { SINAV_KAYGISI_OLCEGI } from '../electron/services/surveys/definitions/sinavKaygisiOlcegi';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { WestsideExamAnxietyPdfReport } from '../electron/services/surveys/reports/WestsideExamAnxietyPdfReport';
import { SurveyReportRegistry } from '../electron/services/surveys/reports/SurveyReportRegistry';
import { 
  getWestsideEvaluation, 
  calculateClassGroupStats, 
  getWestsideSdPosition 
} from '../shared/westsideEvaluation';
import { 
  filterApplicationsByScope 
} from '../src/features/surveys/components/reports/WestsideExamAnxietyCollectiveReportModal';
import { SurveyApplicationDto } from '../shared/ipc-types';

describe('The Westside Sınav Kaygısı Ölçeği (WST-11) Complete Testing Suite', () => {
  const tempDir = path.join(process.cwd(), 'temp_test_westside_suite');
  const dbPath = path.join(tempDir, 'test_pdr.sqlite');
  let sqlite: Database.Database;
  let db: any;
  let surveyEngine: SurveyEngine;

  beforeAll(async () => {
    if (fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    db = conn.db;

    runMigrations(sqlite);

    const mockSyncEngine = {
      recordChange: () => {},
      subscribe: () => () => {},
      getPendingCount: () => 0
    } as any;

    surveyEngine = new SurveyEngine(db, 'dev-test-1', mockSyncEngine);

    sqlite.prepare(`
      INSERT INTO schools (id, name, created_at, updated_at, version, last_modified_device_id)
      VALUES ('sch-1', 'Cumhuriyet Anadolu Lisesi', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO school_years (id, name, start_date, end_date, is_active, created_at, updated_at, version, last_modified_device_id)
      VALUES ('year-2026', '2026-2027', '2026-09-01', '2027-06-20', 1, 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO classes (id, school_year_id, name, grade, branch, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('class-9a', 'year-2026', '9-A', 9, 'A', 1000, 1000, 1, 'dev-test-1'),
        ('class-9b', 'year-2026', '9-B', 9, 'B', 1000, 1000, 1, 'dev-test-1'),
        ('class-10a', 'year-2026', '10-A', 10, 'A', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();

    sqlite.prepare(`
      INSERT INTO students (id, school_year_id, class_id, student_number, first_name, last_name, gender, status, notes, created_at, updated_at, version, last_modified_device_id)
      VALUES 
        ('st-fevzi', 'year-2026', 'class-9b', '101', 'Fevzi', 'Dümen', 'male', 'active', '', 1000, 1000, 1, 'dev-test-1'),
        ('st-ayse', 'year-2026', 'class-9b', '102', 'Ayşe', 'Kazım', 'female', 'active', '', 1000, 1000, 1, 'dev-test-1'),
        ('st-ahmet', 'year-2026', 'class-9a', '103', 'Ahmet', 'Yılmaz', 'male', 'active', '', 1000, 1000, 1, 'dev-test-1'),
        ('st-mehmet', 'year-2026', 'class-9a', '104', 'Mehmet', 'Öztürk', 'male', 'active', '', 1000, 1000, 1, 'dev-test-1')
      ON CONFLICT(id) DO NOTHING;
    `).run();
  });

  afterAll(() => {
    try {
      if (sqlite) sqlite.close();
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // A) Test exact average calculations
  it('A) should calculate exact average scores across all benchmark values', () => {
    expect(getWestsideEvaluation(11).averageScoreFormatted).toBe('1.00');
    expect(getWestsideEvaluation(22).averageScoreFormatted).toBe('2.00');
    expect(getWestsideEvaluation(27.5).averageScoreFormatted).toBe('2.50');
    expect(getWestsideEvaluation(33).averageScoreFormatted).toBe('3.00');
    expect(getWestsideEvaluation(38.5).averageScoreFormatted).toBe('3.50');
    expect(getWestsideEvaluation(44).averageScoreFormatted).toBe('4.00');
    expect(getWestsideEvaluation(55).averageScoreFormatted).toBe('5.00');
  });

  // B) Test normalized progress bar formula: (averageScore - 1) / 4 * 100 and dynamic level colors
  it('B) should calculate exact progress percentages with normalized formula ((averageScore - 1) / 4 * 100) and colors', () => {
    const eval1 = getWestsideEvaluation(11);
    expect(eval1.progressPercent).toBe(0);     // 1.00 -> 0%
    expect(eval1.category.colorClasses.hex).toBe('#059669'); // Green

    const eval2 = getWestsideEvaluation(22);
    expect(eval2.progressPercent).toBe(25);    // 2.00 -> 25%
    expect(eval2.category.colorClasses.hex).toBe('#2563eb'); // Blue

    const eval29 = getWestsideEvaluation(29);
    expect(eval29.category.colorClasses.hex).toBe('#d97706'); // Amber

    const eval3 = getWestsideEvaluation(33);
    expect(eval3.progressPercent).toBe(50);    // 3.00 -> 50%
    expect(eval3.category.colorClasses.hex).toBe('#ea580c'); // Orange

    const eval4 = getWestsideEvaluation(44);
    expect(eval4.progressPercent).toBe(75);    // 4.00 -> 75%
    expect(eval4.category.colorClasses.hex).toBe('#b91c1c'); // Red

    const eval5 = getWestsideEvaluation(55);
    expect(eval5.progressPercent).toBe(100);   // 5.00 -> 100%
    expect(eval5.category.colorClasses.hex).toBe('#b91c1c'); // Red
    
    const eval34 = getWestsideEvaluation(34); // 34 / 11 = 3.0909 -> 3.09
    expect(eval34.averageScoreFormatted).toBe('3.09');
    expect(Number(eval34.progressPercent.toFixed(2))).toBe(52.25);
    expect(eval34.category.colorClasses.hex).toBe('#ea580c'); // Orange
  });

  // C) Test user example: Fevzi Dümen 34/55 -> 3.09/5.00, Orta-Yüksek Kaygı, Risk Grubu: EVET
  it('C) should correctly classify Fevzi Dümen example (34/55 -> 3.09/5.00 -> Orta-Yüksek Kaygı -> Risk Grubu EVET)', () => {
    const evalResult = getWestsideEvaluation(34);
    expect(evalResult.averageScoreFormatted).toBe('3.09');
    expect(evalResult.category.categoryLabel).toBe('Orta-Yüksek Kaygı');
    expect(evalResult.isRiskGroup).toBe(true);
  });

  // D) Test class isolation: 9-A results must NEVER affect 9-B stats
  it('D) should guarantee strict class isolation for group statistics', () => {
    // 9-B students: Fevzi (3.09), Ayşe (4.55)
    const scores9B = [3.09, 4.55];
    const stats9B = calculateClassGroupStats(scores9B);

    expect(stats9B.count).toBe(2);
    expect(stats9B.mean).toBe(3.82);
    expect(stats9B.stdDev).toBe(1.03);
    expect(stats9B.highThreshold).toBe(4.85);
    expect(stats9B.lowThreshold).toBe(2.79);

    // 9-A students: Ahmet (2.00), Mehmet (2.55)
    const scores9A = [2.00, 2.55];
    const stats9A = calculateClassGroupStats(scores9A);

    expect(stats9A.count).toBe(2);
    expect(stats9A.mean).toBe(2.27);
    expect(stats9A.stdDev).toBe(0.39);

    // 9-A and 9-B stats are completely independent!
    expect(stats9B.mean).not.toBe(stats9A.mean);
  });

  // E) Test "Tümü" behavior: When viewing all classes, each student is evaluated against their own class stats
  it('E) should evaluate each student against their own class statistics when Tümü is selected', () => {
    const stats9B = calculateClassGroupStats([3.09, 4.55]); // Mean 3.82, StdDev 1.03, High 4.85, Low 2.79
    const stats9A = calculateClassGroupStats([2.00, 2.55]); // Mean 2.27, StdDev 0.39, High 2.66, Low 1.88

    // Fevzi (9-B, 3.09) evaluated against 9-B: between 2.79 and 4.85 -> within_sd
    const fevziSd = getWestsideSdPosition(3.09, stats9B);
    expect(fevziSd.position).toBe('within_sd');
    expect(fevziSd.label).toBe('±1 SD aralığında');

    // Mehmet (9-A, 2.55) evaluated against 9-A: between 1.89 and 2.67 -> within_sd
    const mehmetSd = getWestsideSdPosition(2.55, stats9A);
    expect(mehmetSd.position).toBe('within_sd');
    expect(mehmetSd.label).toBe('±1 SD aralığında');

    // A student in 9-A with 3.09 would be > 2.67 -> High anxiety in 9-A!
    const hypothetical9ASd = getWestsideSdPosition(3.09, stats9A);
    expect(hypothetical9ASd.position).toBe('high');
    expect(hypothetical9ASd.label).toBe('Yüksek Kaygı (+1 SD ve üzeri)');
  });

  // F) Test application scope filter: latest_per_student vs all
  it('F) should pick only the latest completed application per student when scope is latest_per_student', () => {
    const mockApps: SurveyApplicationDto[] = [
      {
        id: 'app-1',
        studentId: 'st-fevzi',
        studentNumber: '101',
        studentName: 'Fevzi Dümen',
        className: '9-B',
        attemptNumber: 1,
        completedAt: '2026-09-01T10:00:00.000Z',
        totalScore: 30
      } as any,
      {
        id: 'app-2',
        studentId: 'st-fevzi',
        studentNumber: '101',
        studentName: 'Fevzi Dümen',
        className: '9-B',
        attemptNumber: 2,
        completedAt: '2026-09-06T12:00:00.000Z',
        totalScore: 34
      } as any,
      {
        id: 'app-3',
        studentId: 'st-ayse',
        studentNumber: '102',
        studentName: 'Ayşe Kazım',
        className: '9-B',
        attemptNumber: 1,
        completedAt: '2026-09-06T14:00:00.000Z',
        totalScore: 50
      } as any
    ];

    const latest = filterApplicationsByScope(mockApps, 'latest_per_student');
    expect(latest).toHaveLength(2);

    const fevziLatest = latest.find(a => a.studentId === 'st-fevzi');
    expect(fevziLatest?.id).toBe('app-2');
    expect(fevziLatest?.totalScore).toBe(34);
    expect(fevziLatest?.attemptNumber).toBe(2);

    const all = filterApplicationsByScope(mockApps, 'all');
    expect(all).toHaveLength(3);
  });

  // G) Test multiple distinct students in the same class
  it('G) should represent all distinct students in a class once under latest_per_student', () => {
    const tenStudentsApps: SurveyApplicationDto[] = Array.from({ length: 10 }, (_, i) => ({
      id: `app-st-${i + 1}`,
      studentId: `st-${i + 1}`,
      studentNumber: `20${i + 1}`,
      studentName: `Öğrenci ${i + 1}`,
      className: '10-A',
      attemptNumber: 1,
      completedAt: '2026-09-06T10:00:00.000Z',
      totalScore: 20 + i * 2
    } as any));

    const result = filterApplicationsByScope(tenStudentsApps, 'latest_per_student');
    expect(result).toHaveLength(10);
    const stats = calculateClassGroupStats(result.map(a => Number(((a.totalScore || 0) / 11).toFixed(2))));
    expect(stats.count).toBe(10);
    expect(stats.hasEnoughData).toBe(true);
  });

  // H) Test PDF generator and registry output
  it('H) should generate PDF report with average score 3.09/5.00, raw 34/55, Orta-Yüksek Kaygı and Risk Grubu EVET', () => {
    const mockAppDetail = {
      id: 'app-wst-1',
      surveyId: 'srv-westside-sinav-kaygisi-olcegi',
      surveySlug: 'westside-sinav-kaygisi-olcegi',
      surveyTitle: 'The Westside Sınav Kaygısı Ölçeği',
      studentName: 'Fevzi Dümen',
      studentNumber: '101',
      className: '9-B',
      attemptNumber: 1,
      completedAt: '2026-09-06T14:30:00.000Z',
      totalScore: 34,
      answers: []
    } as unknown as SurveyApplicationDto;

    const html = WestsideExamAnxietyPdfReport.generateHtml(mockAppDetail, { schoolName: 'Cumhuriyet Anadolu Lisesi' });
    expect(html).toContain('THE WESTSIDE SINAV KAYGISI ÖLÇEĞİ');
    expect(html).toContain('Fevzi Dümen');
    expect(html).toContain('3.09');
    expect(html).toContain('5.00');
    expect(html).toContain('34');
    expect(html).toContain('55');
    expect(html).toContain('Orta-Yüksek Kaygı');
    expect(html).toContain('Risk Grubu: EVET');

    const registryHtml = SurveyReportRegistry.generateReportHtml(mockAppDetail, { schoolName: 'Cumhuriyet Anadolu Lisesi' });
    expect(registryHtml).toContain('THE WESTSIDE SINAV KAYGISI ÖLÇEĞİ');
    expect(registryHtml).toContain('3.09');
  });

  // I) Test complete isolation of legacy surveys: Devamsızlık Nedenleri Anketi & Sınav Kaygısı Ölçeği
  it('I) should keep Devamsızlık Nedenleri Anketi and 50-item Sınav Kaygısı Ölçeği completely untouched', () => {
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.id).toBe('srv-devamsizlik-nedenleri');
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.questions.length).toBeGreaterThanOrEqual(51);
    expect(DEVAMSIZLIK_NEDENLERI_ANKETI.subscales).toHaveLength(7);

    expect(SINAV_KAYGISI_OLCEGI.id).toBe('srv-sinav-kaygisi-olcegi');
    expect(SINAV_KAYGISI_OLCEGI.questions).toHaveLength(50);
    expect(SINAV_KAYGISI_OLCEGI.subscales).toHaveLength(7);

    expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.id).toBe('srv-westside-sinav-kaygisi-olcegi');
    expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.questions).toHaveLength(11);
    expect(WESTSIDE_SINAV_KAYGISI_OLCEGI.subscales).toHaveLength(0);

    const surveyFromEngine = surveyEngine.getSurveyBySlug('westside-sinav-kaygisi-olcegi');
    expect(surveyFromEngine).toBeDefined();
    expect(surveyFromEngine?.title).toBe('The Westside Sınav Kaygısı Ölçeği');
  });
});
