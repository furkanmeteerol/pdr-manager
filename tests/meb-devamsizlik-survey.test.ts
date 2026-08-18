import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SurveyEngine } from '../electron/services/surveys/SurveyEngine';
import { DEVAMSIZLIK_NEDENLERI_ANKETI } from '../electron/services/surveys/definitions/devamsizlikNedenleriAnketi';
import { getSurveyResultRenderer } from '../src/features/surveys/components/renderers/SurveyResultRendererRegistry';
import { DevamsizlikNedenleriResultRenderer } from '../src/features/surveys/components/renderers/DevamsizlikNedenleriResultRenderer';
import fs from 'node:fs';
import path from 'node:path';

describe('MEB Devamsızlık Nedenleri Anketi Local SQLite & Presentation Verification', () => {
  let sqliteDb: Database.Database;
  let db: any;
  let surveyEngine: SurveyEngine;
  const testDbDir = path.join(process.cwd(), 'temp_meb_survey_test_db');
  const testDbPath = path.join(testDbDir, 'test_meb.sqlite');

  beforeEach(() => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDbDir, { recursive: true });

    const conn = createDatabaseConnection(testDbPath);
    sqliteDb = conn.sqlite;
    db = conn.db;
    runMigrations(sqliteDb);

    const mockSyncEngine = {
      recordChange: () => {},
      subscribe: () => () => {},
      getPendingCount: () => 0
    } as any;

    surveyEngine = new SurveyEngine(db, 'test-device-meb', mockSyncEngine);
  });

  afterEach(() => {
    try {
      sqliteDb.close();
    } catch {}
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it('1. Should register MEB Devamsızlık Nedenleri Anketi into Local SQLite with 52 items and 7 subscales', () => {
    const res = surveyEngine.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
    expect(res.success).toBe(true);

    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi');
    expect(survey).toBeDefined();
    expect(survey?.title).toBe('Devamsızlık Nedenleri Anketi');
    expect(survey?.repeatPolicy).toBe('UNLIMITED');
    expect(survey?.currentVersion?.scoringType).toBe('SUBSCALES');
    expect(survey?.currentVersion?.questions?.length).toBe(52);
    expect(survey?.currentVersion?.subscales?.length).toBe(7);
    expect(survey?.currentVersion?.interpretations?.length).toBe(0); // No unverified interpretations in source
  });

  it('2. Subscales must match MEB guideline distribution with calculationMethod AVERAGE', () => {
    surveyEngine.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;

    const subscales = survey.currentVersion!.subscales!;
    expect(subscales).toHaveLength(7);

    const expectedSubscales = [
      { code: 'OKUL_YONETIM', order: 1, method: 'AVERAGE' },
      { code: 'OGRETMEN', order: 2, method: 'AVERAGE' },
      { code: 'AILE', order: 3, method: 'AVERAGE' },
      { code: 'CEVRE', order: 4, method: 'AVERAGE' },
      { code: 'AKADEMIK_KAYGI', order: 5, method: 'AVERAGE' },
      { code: 'KISISEL_NEDENLER', order: 6, method: 'AVERAGE' },
      { code: 'ARKADAS_CEVRESI', order: 7, method: 'AVERAGE' }
    ];

    for (const exp of expectedSubscales) {
      const sub = subscales.find(s => s.code === exp.code);
      expect(sub).toBeDefined();
      expect(sub?.orderIndex).toBe(exp.order);
      expect(sub?.calculationMethod).toBe(exp.method);
    }
  });

  it('3. Question subscale assignment and option scoring verification (Evet=2, Bazen=1, Hayır=0)', () => {
    surveyEngine.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;
    const questions = survey.currentVersion!.questions!;

    // 1-10: Okul ve Yönetim
    for (let i = 1; i <= 10; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
      expect(q.questionType).toBe('single_choice');
      expect(q.options).toHaveLength(3);
      expect(q.options.find(o => o.optionText === 'Evet')?.scoreValue).toBe(2);
      expect(q.options.find(o => o.optionText === 'Bazen')?.scoreValue).toBe(1);
      expect(q.options.find(o => o.optionText === 'Hayır')?.scoreValue).toBe(0);
    }

    // 11-17: Öğretmen
    for (let i = 11; i <= 17; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 18-26: Aile
    for (let i = 18; i <= 26; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 27-31: Çevre
    for (let i = 27; i <= 31; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 32-36: Akademik Kaygı
    for (let i = 32; i <= 36; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 37-45: Kişisel Nedenler
    for (let i = 37; i <= 45; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 46-51: Arkadaş Çevresi
    for (let i = 46; i <= 51; i++) {
      const q = questions.find(item => item.questionOrder === i)!;
      expect(q).toBeDefined();
      expect(q.isReverseScored).toBe(false);
    }

    // 52: Açık Uçlu
    const q52 = questions.find(item => item.questionOrder === 52)!;
    expect(q52).toBeDefined();
    expect(q52.questionType).toBe('text');
    expect(q52.questionText).toBe('Belirtmek istediğiniz diğer nedenler varsa yazınız.');
    expect(q52.options).toHaveLength(0);
  });

  it('4. Presentation configuration should resolve to DevamsizlikNedenleriResultRenderer', () => {
    surveyEngine.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
    const survey = surveyEngine.getSurveyBySlug('devamsizlik-nedenleri-anketi')!;

    expect(survey.resultPresentation?.rendererType).toBe('meb_devamsizlik');
    expect(survey.resultPresentation?.options?.showTotalScore).toBe(false);
    expect(survey.resultPresentation?.options?.scoreDisplayFormat).toBe('average');

    const Renderer = getSurveyResultRenderer(survey.resultPresentation?.rendererType);
    expect(Renderer).toBe(DevamsizlikNedenleriResultRenderer);
  });
});
