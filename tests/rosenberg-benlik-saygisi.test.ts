import { describe, it, expect } from 'vitest';
import { 
  evaluateRosenbergBenlikSaygisi, 
  evaluateCollectiveRosenberg,
  getSubscaleInterpretation,
  ROSENBERG_SUBSCALES,
  ROSENBERG_SCALE_METADATA,
  ROSENBERG_QUESTION_METADATA
} from '../shared/rosenbergBenlikSaygisiEvaluation';

describe('Rosenberg Benlik Saygısı Envanteri (ROSENBERG-63) Complete Exact Scoring & Coverage Test Suite', () => {

  // ==========================================
  // 1. IDENTITY & STRUCTURE (63 QUESTIONS, 12 SUBSCALES)
  // ==========================================
  it('1. Identity: should have correct metadata, ID, slug, code, version, and 63 questions', () => {
    expect(ROSENBERG_SCALE_METADATA.id).toBe('srv-rosenberg-benlik-saygisi');
    expect(ROSENBERG_SCALE_METADATA.slug).toBe('rosenberg-benlik-saygisi');
    expect(ROSENBERG_SCALE_METADATA.code).toBe('ROSENBERG-63');
    expect(ROSENBERG_SCALE_METADATA.version).toBe('ver-rosenberg-benlik-saygisi-v1');
    expect(ROSENBERG_SCALE_METADATA.title).toBe('Rosenberg Benlik Saygısı Envanteri');
    expect(ROSENBERG_SCALE_METADATA.totalQuestions).toBe(63);
    expect(ROSENBERG_SCALE_METADATA.subscaleCount).toBe(12);
    expect(ROSENBERG_QUESTION_METADATA.length).toBe(63);
    expect(ROSENBERG_SUBSCALES.length).toBe(12);
  });

  // ==========================================
  // 2. SUBSCALE COUNTS & QUESTION ASSIGNMENTS
  // ==========================================
  it('2. Subscale Question Counts & Range Distribution', () => {
    const expectedDist: Record<string, { count: number; maxScore: number; start: number; end: number }> = {
      D1: { count: 10, maxScore: 6, start: 1, end: 10 },
      D2: { count: 5, maxScore: 5, start: 11, end: 15 },
      D3: { count: 5, maxScore: 5, start: 16, end: 20 },
      D4: { count: 3, maxScore: 3, start: 21, end: 23 },
      D5: { count: 6, maxScore: 6, start: 24, end: 29 },
      D6: { count: 4, maxScore: 4, start: 30, end: 33 },
      D7: { count: 10, maxScore: 10, start: 34, end: 43 },
      D8: { count: 3, maxScore: 3, start: 44, end: 46 },
      D9: { count: 2, maxScore: 2, start: 47, end: 48 },
      D10: { count: 7, maxScore: 7, start: 49, end: 55 },
      D11: { count: 6, maxScore: 6, start: 56, end: 61 },
      D12: { count: 2, maxScore: 2, start: 62, end: 63 }
    };

    let totalQ = 0;
    ROSENBERG_SUBSCALES.forEach(sub => {
      const exp = expectedDist[sub.code];
      expect(exp).toBeDefined();
      expect(sub.questionNumbers.length).toBe(exp.count);
      expect(sub.maxScore).toBe(exp.maxScore);
      expect(sub.questionNumbers[0]).toBe(exp.start);
      expect(sub.questionNumbers[sub.questionNumbers.length - 1]).toBe(exp.end);
      totalQ += sub.questionNumbers.length;
    });

    expect(totalQ).toBe(63);
  });

  // ==========================================
  // 3. OPTION COUNTS PER QUESTION
  // ==========================================
  it('3. Option Counts: verifies exact option count for each of the 63 items according to source', () => {
    const expectedOptionCounts: Record<number, number> = {
      // 1-12: 4 options
      1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4,
      // 13-20: 2 options
      13: 2, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2,
      // 21: 4, 22: 2, 23: 3
      21: 4, 22: 2, 23: 3,
      // 24: 4, 25: 2, 26: 4, 27-28: 2, 29: 5
      24: 4, 25: 2, 26: 4, 27: 2, 28: 2, 29: 5,
      // 30-32: 2, 33: 4
      30: 2, 31: 2, 32: 2, 33: 4,
      // 34-43: 4 options
      34: 4, 35: 4, 36: 4, 37: 4, 38: 4, 39: 4, 40: 4, 41: 4, 42: 4, 43: 4,
      // 44: 3, 45-46: 2
      44: 3, 45: 2, 46: 2,
      // 47-48: 4, 49-50: 4
      47: 4, 48: 4, 49: 4, 50: 4,
      // 51-54: 2, 55: 3
      51: 2, 52: 2, 53: 2, 54: 2, 55: 3,
      // 56: 7, 57: 4, 58-61: 5
      56: 7, 57: 4, 58: 5, 59: 5, 60: 5, 61: 5,
      // 62-63: 2
      62: 2, 63: 2
    };

    ROSENBERG_QUESTION_METADATA.forEach(q => {
      const expCount = expectedOptionCounts[q.questionNumber];
      expect(q.options.length, `Question ${q.questionNumber} option count`).toBe(expCount);
    });

    // Special checks highlighted in requirements
    expect(ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === 56)!.options.length).toBe(7);
    expect(ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === 29)!.options.length).toBe(5);
    expect(ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === 44)!.options.length).toBe(3);
    expect(ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === 55)!.options.length).toBe(3);
    [58, 59, 60, 61].forEach(qNum => {
      expect(ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === qNum)!.options.length).toBe(5);
    });
  });

  // ==========================================
  // 4. DATA-DRIVEN EXACT SCORING TEST (63/63 QUESTIONS & 211 OPTIONS)
  // ==========================================
  const EXACT_SOURCE_SCORING_KEY: Record<number, { sub: string; scores: Record<string, number> }> = {
    // D-1
    1: { sub: 'D1', scores: { a: 0, b: 0, c: 0.17, d: 0.34 } },
    2: { sub: 'D1', scores: { a: 0, b: 0, c: 0.16, d: 0.33 } },
    3: { sub: 'D1', scores: { a: 0.17, b: 0.33, c: 0, d: 0 } },
    4: { sub: 'D1', scores: { a: 0, b: 0, c: 0.25, d: 0.50 } },
    5: { sub: 'D1', scores: { a: 0, b: 0, c: 0.25, d: 0.50 } },
    6: { sub: 'D1', scores: { a: 0, b: 0, c: 0.50, d: 1.00 } },
    7: { sub: 'D1', scores: { a: 0, b: 0, c: 0.50, d: 1.00 } },
    8: { sub: 'D1', scores: { a: 1.00, b: 0.50, c: 0, d: 0 } },
    9: { sub: 'D1', scores: { a: 0.50, b: 0.25, c: 0, d: 0 } },
    10: { sub: 'D1', scores: { a: 0.50, b: 0.25, c: 0, d: 0 } },

    // D-2
    11: { sub: 'D2', scores: { a: 1, b: 1, c: 1, d: 0 } },
    12: { sub: 'D2', scores: { a: 1, b: 1, c: 1, d: 0 } },
    13: { sub: 'D2', scores: { a: 1, b: 0 } },
    14: { sub: 'D2', scores: { a: 1, b: 0 } },
    15: { sub: 'D2', scores: { a: 0, b: 1 } },

    // D-3
    16: { sub: 'D3', scores: { a: 1, b: 0 } },
    17: { sub: 'D3', scores: { a: 0, b: 1 } },
    18: { sub: 'D3', scores: { a: 0, b: 1 } },
    19: { sub: 'D3', scores: { a: 1, b: 0 } },
    20: { sub: 'D3', scores: { a: 0, b: 1 } },

    // D-4
    21: { sub: 'D4', scores: { a: 1, b: 1, c: 0, d: 0 } },
    22: { sub: 'D4', scores: { a: 1, b: 0 } },
    23: { sub: 'D4', scores: { a: 1, b: 1, c: 0 } },

    // D-5
    24: { sub: 'D5', scores: { a: 0, b: 0, c: 0, d: 1 } },
    25: { sub: 'D5', scores: { a: 0, b: 1 } },
    26: { sub: 'D5', scores: { a: 0, b: 0, c: 0, d: 1 } },
    27: { sub: 'D5', scores: { a: 0, b: 1 } },
    28: { sub: 'D5', scores: { a: 1, b: 0 } },
    29: { sub: 'D5', scores: { a: 1, b: 0, c: 1, d: 0, e: 0 } },

    // D-6
    30: { sub: 'D6', scores: { a: 1, b: 0 } },
    31: { sub: 'D6', scores: { a: 1, b: 0 } },
    32: { sub: 'D6', scores: { a: 1, b: 0 } },
    33: { sub: 'D6', scores: { a: 1, b: 0, c: 0, d: 0 } },

    // D-7
    34: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    35: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    36: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    37: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    38: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    39: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    40: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    41: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    42: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },
    43: { sub: 'D7', scores: { a: 1, b: 1, c: 0, d: 0 } },

    // D-8
    44: { sub: 'D8', scores: { a: 1, b: 0, c: 0 } },
    45: { sub: 'D8', scores: { a: 1, b: 0 } },
    46: { sub: 'D8', scores: { a: 1, b: 0 } },

    // D-9
    47: { sub: 'D9', scores: { a: 1, b: 1, c: 0, d: 0 } },
    48: { sub: 'D9', scores: { a: 0, b: 0, c: 1, d: 1 } },

    // D-10
    49: { sub: 'D10', scores: { a: 0, b: 0, c: 1, d: 1 } },
    50: { sub: 'D10', scores: { a: 0, b: 0, c: 1, d: 1 } },
    51: { sub: 'D10', scores: { a: 1, b: 0 } },
    52: { sub: 'D10', scores: { a: 1, b: 0 } },
    53: { sub: 'D10', scores: { a: 1, b: 0 } },
    54: { sub: 'D10', scores: { a: 1, b: 0 } },
    55: { sub: 'D10', scores: { a: 0, b: 0, c: 1 } },

    // D-11
    56: { sub: 'D11', scores: { a: 1, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 } },
    57: { sub: 'D11', scores: { a: 1, b: 1, c: 0, d: 0 } },
    58: { sub: 'D11', scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
    59: { sub: 'D11', scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
    60: { sub: 'D11', scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },
    61: { sub: 'D11', scores: { a: 1, b: 1, c: 0, d: 0, e: 0 } },

    // D-12
    62: { sub: 'D12', scores: { a: 1, b: 0 } },
    63: { sub: 'D12', scores: { a: 0, b: 1 } }
  };

  it('4. Data-Driven Exact Scoring: tests each question and each option through evaluateRosenbergBenlikSaygisi', () => {
    let testedQuestionsCount = 0;
    let testedOptionsCount = 0;

    for (let qNum = 1; qNum <= 63; qNum++) {
      const qConfig = EXACT_SOURCE_SCORING_KEY[qNum];
      expect(qConfig, `Missing test config for Q${qNum}`).toBeDefined();
      testedQuestionsCount++;

      const subCode = qConfig.sub;
      const optionEntries = Object.entries(qConfig.scores);

      for (const [optKey, expectedScore] of optionEntries) {
        testedOptionsCount++;

        // 1. Test by passing option letter (e.g. 'a')
        const evalResult = evaluateRosenbergBenlikSaygisi({ [`q${qNum}`]: optKey });
        const sub = evalResult.subscales.find(s => s.code === subCode)!;
        expect(sub, `Subscale ${subCode} for Q${qNum}`).toBeDefined();

        if (subCode === 'D1') {
          expect(sub.score, `Q${qNum} Option ${optKey}`).toBeCloseTo(expectedScore, 2);
        } else {
          expect(sub.score, `Q${qNum} Option ${optKey}`).toBe(expectedScore);
        }

        // Verify itemResults in evaluation output
        const itemRes = evalResult.itemResults.find(i => i.questionNumber === qNum);
        expect(itemRes).toBeDefined();
        if (subCode === 'D1') {
          expect(itemRes!.score).toBeCloseTo(expectedScore, 2);
        } else {
          expect(itemRes!.score).toBe(expectedScore);
        }
      }
    }

    expect(testedQuestionsCount).toBe(63);
    expect(testedOptionsCount).toBe(211);
  });

  // ==========================================
  // 5. SPECIFIC HIGH-PRIORITY AUDIT ASSERTIONS
  // ==========================================
  it('5. Audit Focus: Explicit verification of previously fixed items (14, 16-20, 24, 26)', () => {
    // Q14 (D-2)
    expect(evaluateRosenbergBenlikSaygisi({ q14: 'a' }).subscales.find(s => s.code === 'D2')!.score).toBe(1);
    expect(evaluateRosenbergBenlikSaygisi({ q14: 'b' }).subscales.find(s => s.code === 'D2')!.score).toBe(0);

    // Q16-Q20 (D-3)
    expect(evaluateRosenbergBenlikSaygisi({ q16: 'a' }).subscales.find(s => s.code === 'D3')!.score).toBe(1);
    expect(evaluateRosenbergBenlikSaygisi({ q16: 'b' }).subscales.find(s => s.code === 'D3')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q17: 'a' }).subscales.find(s => s.code === 'D3')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q17: 'b' }).subscales.find(s => s.code === 'D3')!.score).toBe(1);
    expect(evaluateRosenbergBenlikSaygisi({ q18: 'a' }).subscales.find(s => s.code === 'D3')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q18: 'b' }).subscales.find(s => s.code === 'D3')!.score).toBe(1);
    expect(evaluateRosenbergBenlikSaygisi({ q19: 'a' }).subscales.find(s => s.code === 'D3')!.score).toBe(1);
    expect(evaluateRosenbergBenlikSaygisi({ q19: 'b' }).subscales.find(s => s.code === 'D3')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q20: 'a' }).subscales.find(s => s.code === 'D3')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q20: 'b' }).subscales.find(s => s.code === 'D3')!.score).toBe(1);

    // Q24, Q26 (D-5)
    expect(evaluateRosenbergBenlikSaygisi({ q24: 'a' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q24: 'b' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q24: 'c' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q24: 'd' }).subscales.find(s => s.code === 'D5')!.score).toBe(1);

    expect(evaluateRosenbergBenlikSaygisi({ q26: 'a' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q26: 'b' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q26: 'c' }).subscales.find(s => s.code === 'D5')!.score).toBe(0);
    expect(evaluateRosenbergBenlikSaygisi({ q26: 'd' }).subscales.find(s => s.code === 'D5')!.score).toBe(1);
  });

  // ==========================================
  // 6. D-1 FLOATING POINT ACCURACY & BOUNDARIES
  // ==========================================
  it('6. D-1 Floating-point precision, min, and max boundary evaluations', () => {
    // Best answers: sum = 0 -> High self-esteem
    const bestD1 = evaluateRosenbergBenlikSaygisi({
      q1: 'a', q2: 'a', q3: 'c', q4: 'a', q5: 'a',
      q6: 'a', q7: 'a', q8: 'c', q9: 'c', q10: 'c'
    });
    const d1_best = bestD1.subscales.find(s => s.code === 'D1')!;
    expect(d1_best.score).toBeCloseTo(0.00, 2);
    expect(d1_best.level).toBe('Yüksek benlik saygısı');

    // Worst answers: sum = 6.00 -> Low self-esteem
    const worstD1 = evaluateRosenbergBenlikSaygisi({
      q1: 'd', q2: 'd', q3: 'b', q4: 'd', q5: 'd',
      q6: 'd', q7: 'd', q8: 'a', q9: 'a', q10: 'a'
    });
    const d1_worst = worstD1.subscales.find(s => s.code === 'D1')!;
    expect(d1_worst.score).toBeCloseTo(6.00, 2);
    expect(d1_worst.level).toBe('Düşük benlik saygısı');

    // Mid-range sample: Q1:C(0.17), Q2:C(0.16), Q6:D(1), Q7:D(1) -> 2.33 -> Medium
    const midD1 = evaluateRosenbergBenlikSaygisi({
      q1: 'c', q2: 'c', q6: 'd', q7: 'd'
    });
    const d1_mid = midD1.subscales.find(s => s.code === 'D1')!;
    expect(d1_mid.score).toBeCloseTo(2.33, 2);
    expect(d1_mid.level).toBe('Orta benlik saygısı');
  });

  // ==========================================
  // 7. INTERPRETATION BOUNDARIES (ALL 12 SUBSCALES)
  // ==========================================
  it('7. Interpretation Boundaries: exact cutoff testing for all 12 subscales', () => {
    // D-1 (0-1: Yüksek, 2-4: Orta, 5-6: Düşük)
    expect(getSubscaleInterpretation('D1', 0).level).toBe('Yüksek benlik saygısı');
    expect(getSubscaleInterpretation('D1', 1).level).toBe('Yüksek benlik saygısı');
    expect(getSubscaleInterpretation('D1', 1.99).level).toBe('Yüksek benlik saygısı');
    expect(getSubscaleInterpretation('D1', 2).level).toBe('Orta benlik saygısı');
    expect(getSubscaleInterpretation('D1', 4).level).toBe('Orta benlik saygısı');
    expect(getSubscaleInterpretation('D1', 4.99).level).toBe('Orta benlik saygısı');
    expect(getSubscaleInterpretation('D1', 5).level).toBe('Düşük benlik saygısı');
    expect(getSubscaleInterpretation('D1', 6).level).toBe('Düşük benlik saygısı');

    // D-2 (0-2: Süreklilik fazla, 3-5: Süreklilik az)
    expect(getSubscaleInterpretation('D2', 0).level).toBe('Kendilik kavramının sürekliliği fazla');
    expect(getSubscaleInterpretation('D2', 2).level).toBe('Kendilik kavramının sürekliliği fazla');
    expect(getSubscaleInterpretation('D2', 3).level).toBe('Kendilik kavramının sürekliliği az');
    expect(getSubscaleInterpretation('D2', 5).level).toBe('Kendilik kavramının sürekliliği az');

    // D-3 (0-1: Güven çok, 2-3: Orta, 4-5: Az)
    expect(getSubscaleInterpretation('D3', 0).level).toBe('İnsanlara olan güven çok');
    expect(getSubscaleInterpretation('D3', 1).level).toBe('İnsanlara olan güven çok');
    expect(getSubscaleInterpretation('D3', 2).level).toBe('İnsanlara orta düzeyde güven');
    expect(getSubscaleInterpretation('D3', 3).level).toBe('İnsanlara orta düzeyde güven');
    expect(getSubscaleInterpretation('D3', 4).level).toBe('İnsanlara az güven');
    expect(getSubscaleInterpretation('D3', 5).level).toBe('İnsanlara az güven');

    // D-4 (0-1: Az, 2-3: Çok, 4: undefined)
    expect(getSubscaleInterpretation('D4', 0).level).toBe('Eleştiriye az duyarlılık');
    expect(getSubscaleInterpretation('D4', 1).level).toBe('Eleştiriye az duyarlılık');
    expect(getSubscaleInterpretation('D4', 2).level).toBe('Eleştiriye çok duyarlılık');
    expect(getSubscaleInterpretation('D4', 3).level).toBe('Eleştiriye çok duyarlılık');
    expect(getSubscaleInterpretation('D4', 4).interpretationAvailable).toBe(false);

    // D-5 (0: Yok, 1-2: Az, 3-4: Orta, 5-6: Yüksek)
    expect(getSubscaleInterpretation('D5', 0).level).toBe('Depresif duygulanım yok');
    expect(getSubscaleInterpretation('D5', 1).level).toBe('Depresif duygulanım az');
    expect(getSubscaleInterpretation('D5', 2).level).toBe('Depresif duygulanım az');
    expect(getSubscaleInterpretation('D5', 3).level).toBe('Depresif duygulanım orta düzeyde');
    expect(getSubscaleInterpretation('D5', 4).level).toBe('Depresif duygulanım orta düzeyde');
    expect(getSubscaleInterpretation('D5', 5).level).toBe('Depresif duygulanım yüksek düzeyde');
    expect(getSubscaleInterpretation('D5', 6).level).toBe('Depresif duygulanım yüksek düzeyde');

    // D-6 (0-1: Az, 2-3: Orta, 4: Üst seviyede)
    expect(getSubscaleInterpretation('D6', 0).level).toBe('Hayalperestlik az');
    expect(getSubscaleInterpretation('D6', 1).level).toBe('Hayalperestlik az');
    expect(getSubscaleInterpretation('D6', 2).level).toBe('Hayalperestlik orta düzeyde');
    expect(getSubscaleInterpretation('D6', 3).level).toBe('Hayalperestlik orta düzeyde');
    expect(getSubscaleInterpretation('D6', 4).level).toBe('Hayalperestlik üst seviyede');

    // D-7 (0-2: Belirtiler az, 3-4: Orta, 5: Fazla, 6-10: undefined)
    expect(getSubscaleInterpretation('D7', 0).level).toBe('Belirtiler az');
    expect(getSubscaleInterpretation('D7', 2).level).toBe('Belirtiler az');
    expect(getSubscaleInterpretation('D7', 3).level).toBe('Orta düzeyde psikosomatik belirti');
    expect(getSubscaleInterpretation('D7', 4).level).toBe('Orta düzeyde psikosomatik belirti');
    expect(getSubscaleInterpretation('D7', 5).level).toBe('Belirtiler fazla');
    expect(getSubscaleInterpretation('D7', 6).interpretationAvailable).toBe(false);
    expect(getSubscaleInterpretation('D7', 10).interpretationAvailable).toBe(false);

    // D-8 (0: Yok, 1: Az, 2: Orta, 3: Yüksek)
    expect(getSubscaleInterpretation('D8', 0).level).toBe('Tehdit hissedilmez');
    expect(getSubscaleInterpretation('D8', 1).level).toBe('Az hissedilir');
    expect(getSubscaleInterpretation('D8', 2).level).toBe('Orta düzeyde hissedilir');
    expect(getSubscaleInterpretation('D8', 3).level).toBe('Kişilerarası ilişkilerde yüksek düzeyde tehdit hissedilir');

    // D-9 (0: Az, 1: Orta, 2: Çok)
    expect(getSubscaleInterpretation('D9', 0).level).toBe('Tartışmalara katılma derecesi az');
    expect(getSubscaleInterpretation('D9', 1).level).toBe('Tartışmalara katılma derecesi orta');
    expect(getSubscaleInterpretation('D9', 2).level).toBe('Tartışmalara katılma derecesi çok');

    // D-10 (0-2: Çok, 3-4: Orta, 5-7: Az)
    expect(getSubscaleInterpretation('D10', 0).level).toBe('Ana-baba ilgisi çok');
    expect(getSubscaleInterpretation('D10', 2).level).toBe('Ana-baba ilgisi çok');
    expect(getSubscaleInterpretation('D10', 3).level).toBe('Orta düzeyde ilgi');
    expect(getSubscaleInterpretation('D10', 4).level).toBe('Orta düzeyde ilgi');
    expect(getSubscaleInterpretation('D10', 5).level).toBe('Ana-baba ilgisi az');
    expect(getSubscaleInterpretation('D10', 7).level).toBe('Ana-baba ilgisi az');

    // D-11 (0-2: Az, 3-4: Orta, 5-6: Fazla)
    expect(getSubscaleInterpretation('D11', 0).level).toBe('Babayla ilişki az');
    expect(getSubscaleInterpretation('D11', 2).level).toBe('Babayla ilişki az');
    expect(getSubscaleInterpretation('D11', 3).level).toBe('Orta düzeyde bir ilişki');
    expect(getSubscaleInterpretation('D11', 4).level).toBe('Orta düzeyde bir ilişki');
    expect(getSubscaleInterpretation('D11', 5).level).toBe('Babayla ilişkinin fazla olduğu');
    expect(getSubscaleInterpretation('D11', 6).level).toBe('Babayla ilişkinin fazla olduğu');

    // D-12 (0: undefined, 1: İzolasyon az, 2: İzolasyon çok)
    expect(getSubscaleInterpretation('D12', 0).interpretationAvailable).toBe(false);
    expect(getSubscaleInterpretation('D12', 1).level).toBe('İzolasyon az');
    expect(getSubscaleInterpretation('D12', 2).level).toBe('İzolasyon çok');
  });

  // ==========================================
  // 8. UNDEFINED SOURCE RANGES SAFETY
  // ==========================================
  it('8. Undefined Source Ranges: safely returns interpretationAvailable = false and standard message', () => {
    const d4_4 = getSubscaleInterpretation('D4', 4);
    expect(d4_4.interpretationAvailable).toBe(false);
    expect(d4_4.interpretation).toBe('Kaynakta bu puan için ayrı bir değerlendirme tanımı bulunmamaktadır.');

    const d7_8 = getSubscaleInterpretation('D7', 8);
    expect(d7_8.interpretationAvailable).toBe(false);
    expect(d7_8.interpretation).toBe('Kaynakta bu puan için ayrı bir değerlendirme tanımı bulunmamaktadır.');

    const d12_0 = getSubscaleInterpretation('D12', 0);
    expect(d12_0.interpretationAvailable).toBe(false);
    expect(d12_0.interpretation).toBe('Kaynakta bu puan için ayrı bir değerlendirme tanımı bulunmamaktadır.');
  });

  // ==========================================
  // 9. NO OVERALL CUTOFF / CLASSIFICATION
  // ==========================================
  it('9. No Overall Cutoff: verifies evaluation result returns 12 independent subscales and no overall score', () => {
    const res = evaluateRosenbergBenlikSaygisi({});
    expect(res.subscales.length).toBe(12);
    expect((res as any).totalScore).toBeUndefined();
    expect((res as any).overallClassification).toBeUndefined();
    expect((res as any).overallLevel).toBeUndefined();
  });

  // ==========================================
  // 10. PERSISTENCE & REPEATABILITY
  // ==========================================
  it('10. Persistence: ensures saving and re-evaluating returns consistent 12 subscale scores', () => {
    const rawAnswers = {
      q1: 'd', q14: 'a', q16: 'a', q17: 'b', q24: 'd', q26: 'd', q56: 'a'
    };

    const res1 = evaluateRosenbergBenlikSaygisi(rawAnswers);
    const serialized = JSON.stringify(rawAnswers);
    const deserialized = JSON.parse(serialized);
    const res2 = evaluateRosenbergBenlikSaygisi(deserialized);

    expect(res1.subscales.map(s => s.score)).toEqual(res2.subscales.map(s => s.score));
  });

  // ==========================================
  // 11. COLLECTIVE EVALUATION SUITE
  // ==========================================
  it('11. Collective Evaluation: computes student matrix and 12 subscale averages correctly', () => {
    const mockApps = [
      {
        studentId: 'st-1',
        studentName: 'Ahmet Yılmaz',
        studentNumber: '101',
        className: '9-A',
        attemptNumber: 1,
        completedAt: '2026-09-01T10:00:00Z',
        answers: { q1: 'a', q14: 'a', q16: 'a', q24: 'd' }
      },
      {
        studentId: 'st-2',
        studentName: 'Ayşe Kaya',
        studentNumber: '102',
        className: '9-B',
        attemptNumber: 1,
        completedAt: '2026-09-02T10:00:00Z',
        answers: { q1: 'd', q14: 'b', q16: 'b', q24: 'a' }
      }
    ];

    const collective = evaluateCollectiveRosenberg(mockApps as any);
    expect(collective.totalEvaluated).toBe(2);
    expect(collective.subscaleSummaries.length).toBe(12);
    expect(collective.studentMatrix.length).toBe(2);

    const d2Summ = collective.subscaleSummaries.find(s => s.code === 'D2')!;
    expect(d2Summ.totalEvaluated).toBe(2);
  });


  // ==========================================
  // 12. D-4 EXACT SCORING & MAXIMUM SCORE TESTS (3 QUESTIONS, MAX 3)
  // ==========================================
  it('12. D-4 Exact Scoring & Range: max is 3, exactly 3 questions (21, 22, 23)', () => {
    const d4Subscale = ROSENBERG_SUBSCALES.find(s => s.code === 'D4')!;
    expect(d4Subscale.maxScore).toBe(3);
    expect(d4Subscale.questionNumbers).toEqual([21, 22, 23]);

    // Test case: 21=B (1), 22=A (1), 23=C (0) -> 2 / 3
    const res1 = evaluateRosenbergBenlikSaygisi({ q21: 'b', q22: 'a', q23: 'c' });
    const d4_1 = res1.subscales.find(s => s.code === 'D4')!;
    expect(d4_1.score).toBe(2);
    expect(d4_1.maxScore).toBe(3);
    expect(d4_1.interpretation).toBe('Eleştiriye çok duyarlılık.');

    // Test case: Max score 3/3 (21=A, 22=A, 23=A)
    const resMax = evaluateRosenbergBenlikSaygisi({ q21: 'a', q22: 'a', q23: 'a' });
    const d4_max = resMax.subscales.find(s => s.code === 'D4')!;
    expect(d4_max.score).toBe(3);
    expect(d4_max.maxScore).toBe(3);
    expect(d4_max.interpretation).toBe('Eleştiriye çok duyarlılık.');

    // Test case: Min score 0/3 (21=C, 22=B, 23=C)
    const resMin = evaluateRosenbergBenlikSaygisi({ q21: 'c', q22: 'b', q23: 'c' });
    const d4_min = resMin.subscales.find(s => s.code === 'D4')!;
    expect(d4_min.score).toBe(0);
    expect(d4_min.maxScore).toBe(3);
    expect(d4_min.interpretation).toBe('Eleştiriye az duyarlılık.');

    // Boundary interpretations
    expect(getSubscaleInterpretation('D4', 0).interpretation).toBe('Eleştiriye az duyarlılık.');
    expect(getSubscaleInterpretation('D4', 1).interpretation).toBe('Eleştiriye az duyarlılık.');
    expect(getSubscaleInterpretation('D4', 2).interpretation).toBe('Eleştiriye çok duyarlılık.');
    expect(getSubscaleInterpretation('D4', 3).interpretation).toBe('Eleştiriye çok duyarlılık.');
    expect(getSubscaleInterpretation('D4', 4).interpretationAvailable).toBe(false);
  });

  // ==========================================
  // 13. ALL 12 SUBSCALES MAX SCORES VERIFICATION
  // ==========================================
  it('13. All 12 Subscales Max Scores strictly match source specifications', () => {
    const expectedMaxScores: Record<string, number> = {
      D1: 6,
      D2: 5,
      D3: 5,
      D4: 3,
      D5: 6,
      D6: 4,
      D7: 10,
      D8: 3,
      D9: 2,
      D10: 7,
      D11: 6,
      D12: 2
    };

    ROSENBERG_SUBSCALES.forEach(sub => {
      expect(sub.maxScore).toBe(expectedMaxScores[sub.code]);
    });
  });

  // ==========================================
  // 14. QUESTION CONTRIBUTION CONSISTENCY (FOR UI PUAN DETAYLARI)
  // ==========================================
  it('14. Question Contribution Consistency: sum of individual question points matches subscale score', () => {
    // Generate a comprehensive sample answer set
    const answers: Record<string, string> = {};
    for (let i = 1; i <= 63; i++) {
      const qMeta = ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === i)!;
      answers['q' + i] = qMeta.options[0].key;
    }

    const res = evaluateRosenbergBenlikSaygisi(answers);

    res.subscales.forEach(sub => {
      const qNumbers = sub.questionNumbers;
      let calculatedSum = 0;
      qNumbers.forEach(qNum => {
        const qMeta = ROSENBERG_QUESTION_METADATA.find(q => q.questionNumber === qNum)!;
        const selectedVal = answers['q' + qNum];
        const opt = qMeta.options.find(o => o.key === selectedVal);
        calculatedSum += opt?.score || 0;
      });

      const expectedSubScore = sub.code === 'D1' ? Math.round(calculatedSum * 100) / 100 : Math.round(calculatedSum);
      expect(Math.abs(expectedSubScore - sub.score)).toBeLessThan(0.01);
    });

    // Also verify itemResults from the evaluation
    expect(res.itemResults.length).toBe(63);
    res.subscales.forEach(sub => {
      const subItems = res.itemResults.filter(it => it.subscaleCode === sub.code);
      const itemsSum = subItems.reduce((acc, curr) => acc + curr.score, 0);
      const roundedExpected = sub.code === 'D1' ? Math.round(itemsSum * 100) / 100 : Math.round(itemsSum);
      expect(roundedExpected).toBe(sub.score);
    });
  });
});
