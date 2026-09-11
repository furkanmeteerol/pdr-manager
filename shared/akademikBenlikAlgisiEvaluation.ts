// ============================================================================
// PDR Manager - Akademik Benlik Algısı Ölçeği (ABAÖ-II / ASDQ-II) Evaluation Engine
// ============================================================================

export type AkademikBenlikFactorCode =
  | 'turk_dili_edebiyati'
  | 'tarih'
  | 'matematik'
  | 'fizik'
  | 'kimya'
  | 'biyoloji'
  | 'cografya'
  | 'yabanci_dil';

export interface AkademikBenlikFactorMetadata {
  code: AkademikBenlikFactorCode;
  name: string;
  shortName: string;
  order: number;
  questionNumbers: number[];
  reverseQuestionNumbers: number[];
}

export interface AkademikBenlikLikertOption {
  value: number; // 1 to 8
  label: string;
}

export interface AkademikBenlikQuestionMetadata {
  questionNumber: number;
  text: string;
  factorCode: AkademikBenlikFactorCode;
  factorName: string;
  isReverse: boolean;
}

export const ABAÖ_SCALE_METADATA = {
  id: 'srv-akademik-benlik-algisi',
  slug: 'akademik-benlik-algisi',
  code: 'ABAÖ-II-56',
  version: 'ver-akademik-benlik-algisi-v1',
  title: 'Akademik Benlik Algısı Ölçeği',
  name: 'Akademik Benlik Algısı Ölçeği',
  totalQuestions: 56,
  factorCount: 8,
  minLikert: 1,
  maxLikert: 8,
  responseType: 'single_choice (8-point Likert)',
  purpose: 'Lise ve dengi okul öğrencilerinin 8 temel akademik ders alanındaki akademik benlik algılarını, yetenek inançlarını ve ders başarı algılarını 8\'li Likert tipi dereceleme ile değerlendirmek amacıyla geliştirilmiştir.'
};

export const ABAÖ_LIKERT_OPTIONS: AkademikBenlikLikertOption[] = [
  { value: 1, label: 'Tamamen yanlış' },
  { value: 2, label: 'Çoğunlukla yanlış' },
  { value: 3, label: 'Yanlış' },
  { value: 4, label: 'Yanlışa yakın' },
  { value: 5, label: 'Doğruya yakın' },
  { value: 6, label: 'Doğru' },
  { value: 7, label: 'Çoğunlukla doğru' },
  { value: 8, label: 'Tamamen doğru' }
];

export const ABAÖ_FACTORS: Record<AkademikBenlikFactorCode, AkademikBenlikFactorMetadata> = {
  turk_dili_edebiyati: {
    code: 'turk_dili_edebiyati',
    name: 'Türk Dili ve Edebiyatı',
    shortName: 'T. Dili ve Ed.',
    order: 1,
    questionNumbers: [1, 9, 11, 21, 31, 41, 51],
    reverseQuestionNumbers: [9]
  },
  tarih: {
    code: 'tarih',
    name: 'Tarih',
    shortName: 'Tarih',
    order: 2,
    questionNumbers: [2, 10, 12, 22, 32, 42, 52],
    reverseQuestionNumbers: [10]
  },
  matematik: {
    code: 'matematik',
    name: 'Matematik',
    shortName: 'Matematik',
    order: 3,
    questionNumbers: [3, 13, 19, 23, 33, 43, 53],
    reverseQuestionNumbers: [19]
  },
  fizik: {
    code: 'fizik',
    name: 'Fizik',
    shortName: 'Fizik',
    order: 4,
    questionNumbers: [4, 14, 20, 24, 34, 44, 54],
    reverseQuestionNumbers: [20]
  },
  kimya: {
    code: 'kimya',
    name: 'Kimya',
    shortName: 'Kimya',
    order: 5,
    questionNumbers: [5, 15, 25, 29, 35, 45, 55],
    reverseQuestionNumbers: [29]
  },
  biyoloji: {
    code: 'biyoloji',
    name: 'Biyoloji',
    shortName: 'Biyoloji',
    order: 6,
    questionNumbers: [6, 16, 26, 30, 36, 46, 56],
    reverseQuestionNumbers: [30]
  },
  cografya: {
    code: 'cografya',
    name: 'Coğrafya',
    shortName: 'Coğrafya',
    order: 7,
    questionNumbers: [7, 17, 27, 37, 39, 47, 49],
    reverseQuestionNumbers: [39]
  },
  yabanci_dil: {
    code: 'yabanci_dil',
    name: 'Yabancı Dil',
    shortName: 'Yabancı Dil',
    order: 8,
    questionNumbers: [8, 18, 28, 38, 40, 48, 50],
    reverseQuestionNumbers: [50]
  }
};

export const ABAÖ_QUESTIONS: AkademikBenlikQuestionMetadata[] = [
  { questionNumber: 1, text: 'Türk Dili ve Edebiyatı dersinde her zaman başarılıyımdır.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 2, text: 'Tarih dersinde her zaman başarılıyımdır.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 3, text: 'Matematik dersinde her zaman başarılıyımdır.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 4, text: 'Fizik dersinde her zaman başarılıyımdır.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 5, text: 'Kimya dersinde her zaman başarılıyımdır.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 6, text: 'Biyoloji dersinde her zaman başarılıyımdır.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false },
  { questionNumber: 7, text: 'Coğrafya dersinde her zaman başarılıyımdır.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 8, text: 'Yabancı Dil dersinde her zaman başarılıyımdır.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 9, text: 'Türk Dili ve Edebiyatı dersinde iyi değilimdir.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: true },
  { questionNumber: 10, text: 'Tarih dersinde iyi değilimdir.', factorCode: 'tarih', factorName: 'Tarih', isReverse: true },
  { questionNumber: 11, text: 'Türk Dili ve Edebiyatı ile ilgili konuları çabuk öğrenirim.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 12, text: 'Tarih ile ilgili konuları çabuk öğrenirim.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 13, text: 'Matematik ile ilgili konuları çabuk öğrenirim.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 14, text: 'Fizik ile ilgili konuları çabuk öğrenirim.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 15, text: 'Kimya ile ilgili konuları çabuk öğrenirim.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 16, text: 'Biyoloji ile ilgili konuları çabuk öğrenirim.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false },
  { questionNumber: 17, text: 'Coğrafya ile ilgili konuları çabuk öğrenirim.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 18, text: 'Yabancı Dil ile ilgili konuları çabuk öğrenirim.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 19, text: 'Matematik dersinde iyi değilimdir.', factorCode: 'matematik', factorName: 'Matematik', isReverse: true },
  { questionNumber: 20, text: 'Fizik dersinde iyi değilimdir.', factorCode: 'fizik', factorName: 'Fizik', isReverse: true },
  { questionNumber: 21, text: 'Türk Dili ve Edebiyatı dersinde aldığım notlar iyidir.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 22, text: 'Tarih dersinde aldığım notlar iyidir.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 23, text: 'Matematik dersinde aldığım notlar iyidir.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 24, text: 'Fizik dersinde aldığım notlar iyidir.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 25, text: 'Kimya dersinde aldığım notlar iyidir.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 26, text: 'Biyoloji dersinde aldığım notlar iyidir.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false },
  { questionNumber: 27, text: 'Coğrafya dersinde aldığım notlar iyidir.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 28, text: 'Yabancı Dil dersinde aldığım notlar iyidir.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 29, text: 'Kimya dersinde iyi değilimdir.', factorCode: 'kimya', factorName: 'Kimya', isReverse: true },
  { questionNumber: 30, text: 'Biyoloji dersinde iyi değilimdir.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: true },
  { questionNumber: 31, text: 'Türk Dili ve Edebiyatı dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 32, text: 'Tarih dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 33, text: 'Matematik dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 34, text: 'Fizik dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 35, text: 'Kimya dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 36, text: 'Biyoloji dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false },
  { questionNumber: 37, text: 'Coğrafya dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 38, text: 'Yabancı Dil dersinde yapılan sınavlar bana her zaman kolay gelir.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 39, text: 'Coğrafya dersinde iyi değilimdir.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: true },
  { questionNumber: 40, text: 'Yabancı Dil dersindeki en zor konuları bile anlayabilirim.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 41, text: 'Türk Dili ve Edebiyatı dersindeki en zor konuları bile anlayabilirim.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 42, text: 'Tarih dersindeki en zor konuları bile anlayabilirim.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 43, text: 'Matematik dersindeki en zor konuları bile anlayabilirim.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 44, text: 'Fizik dersindeki en zor konuları bile anlayabilirim.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 45, text: 'Kimya dersindeki en zor konuları bile anlayabilirim.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 46, text: 'Biyoloji dersindeki en zor konuları bile anlayabilirim.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false },
  { questionNumber: 47, text: 'Coğrafya dersindeki en zor konuları bile anlayabilirim.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 48, text: 'Yabancı Dil dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: false },
  { questionNumber: 49, text: 'Coğrafya dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'cografya', factorName: 'Coğrafya', isReverse: false },
  { questionNumber: 50, text: 'Yabancı Dil dersinde iyi değilimdir.', factorCode: 'yabanci_dil', factorName: 'Yabancı Dil', isReverse: true },
  { questionNumber: 51, text: 'Türk Dili ve Edebiyatı dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'turk_dili_edebiyati', factorName: 'Türk Dili ve Edebiyatı', isReverse: false },
  { questionNumber: 52, text: 'Tarih dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'tarih', factorName: 'Tarih', isReverse: false },
  { questionNumber: 53, text: 'Matematik dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'matematik', factorName: 'Matematik', isReverse: false },
  { questionNumber: 54, text: 'Fizik dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'fizik', factorName: 'Fizik', isReverse: false },
  { questionNumber: 55, text: 'Kimya dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'kimya', factorName: 'Kimya', isReverse: false },
  { questionNumber: 56, text: 'Biyoloji dersinde işlenen konularla ilgili her şeyi rahatlıkla yapabilirim.', factorCode: 'biyoloji', factorName: 'Biyoloji', isReverse: false }
];

export interface ItemEvaluationDetail {
  questionNumber: number;
  text: string;
  factorCode: AkademikBenlikFactorCode;
  factorName: string;
  isReverse: boolean;
  rawValue: number | null;
  rawLabel: string;
  scoredValue: number | null;
}

export interface FactorScoreResult {
  code: AkademikBenlikFactorCode;
  name: string;
  shortName: string;
  order: number;
  itemCount: number;
  answeredCount: number;
  sum: number;
  mean: number; // sum / answeredCount (or sum / 7)
  itemDetails: ItemEvaluationDetail[];
}

export interface AkademikBenlikEvaluationResult {
  scaleId: string;
  slug: string;
  code: string;
  title: string;
  totalQuestions: number;
  totalAnswered: number;
  overallMean: number;
  factors: Record<AkademikBenlikFactorCode, FactorScoreResult>;
  factorList: FactorScoreResult[];
  itemDetails: ItemEvaluationDetail[];
}

/**
 * Score a single item according to straight / reverse rules.
 */
export function scoreAkademikBenlikItem(questionNumber: number, rawValue: number | string | null | undefined): {
  rawValue: number | null;
  rawLabel: string;
  scoredValue: number | null;
  isReverse: boolean;
} {
  const qMeta = ABAÖ_QUESTIONS.find(q => q.questionNumber === questionNumber);
  const isReverse = qMeta ? qMeta.isReverse : false;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { rawValue: null, rawLabel: 'Cevaplanmadı', scoredValue: null, isReverse };
  }

  const numVal = typeof rawValue === 'string' ? parseInt(rawValue, 10) : Number(rawValue);
  if (isNaN(numVal) || numVal < 1 || numVal > 8) {
    return { rawValue: null, rawLabel: 'Geçersiz', scoredValue: null, isReverse };
  }

  const option = ABAÖ_LIKERT_OPTIONS.find(o => o.value === numVal);
  const rawLabel = option ? `${numVal} - ${option.label}` : `${numVal}`;

  const scoredValue = isReverse ? 9 - numVal : numVal;

  return {
    rawValue: numVal,
    rawLabel,
    scoredValue,
    isReverse
  };
}

/**
 * Evaluates raw survey answers for Akademik Benlik Algısı Ölçeği (ABAÖ-II).
 */
export function evaluateAkademikBenlikAlgisi(rawAnswers: Record<string, any> | undefined | null): AkademikBenlikEvaluationResult {
  const answers = rawAnswers || {};

  const itemDetails: ItemEvaluationDetail[] = ABAÖ_QUESTIONS.map(q => {
    // Check possible key formats: `q1`, `1`, `q_1`, etc.
    const keyCandidates = [
      `q${q.questionNumber}`,
      `${q.questionNumber}`,
      `q_${q.questionNumber}`,
      `question_${q.questionNumber}`
    ];

    let rawVal: any = undefined;
    for (const k of keyCandidates) {
      if (answers[k] !== undefined) {
        rawVal = answers[k];
        break;
      }
    }

    const scored = scoreAkademikBenlikItem(q.questionNumber, rawVal);

    return {
      questionNumber: q.questionNumber,
      text: q.text,
      factorCode: q.factorCode,
      factorName: q.factorName,
      isReverse: q.isReverse,
      rawValue: scored.rawValue,
      rawLabel: scored.rawLabel,
      scoredValue: scored.scoredValue
    };
  });

  const factorsRecord = {} as Record<AkademikBenlikFactorCode, FactorScoreResult>;
  const factorCodes: AkademikBenlikFactorCode[] = [
    'turk_dili_edebiyati',
    'tarih',
    'matematik',
    'fizik',
    'kimya',
    'biyoloji',
    'cografya',
    'yabanci_dil'
  ];

  let totalScoredSum = 0;
  let totalScoredCount = 0;

  factorCodes.forEach(fCode => {
    const meta = ABAÖ_FACTORS[fCode];
    const itemsInFactor = itemDetails.filter(it => it.factorCode === fCode);
    const answeredItems = itemsInFactor.filter(it => it.scoredValue !== null);

    const sum = answeredItems.reduce((acc, it) => acc + (it.scoredValue || 0), 0);
    const answeredCount = answeredItems.length;
    const mean = answeredCount > 0 ? parseFloat((sum / answeredCount).toFixed(2)) : 0;

    totalScoredSum += sum;
    totalScoredCount += answeredCount;

    factorsRecord[fCode] = {
      code: fCode,
      name: meta.name,
      shortName: meta.shortName,
      order: meta.order,
      itemCount: meta.questionNumbers.length,
      answeredCount,
      sum,
      mean,
      itemDetails: itemsInFactor
    };
  });

  const factorList = factorCodes.map(code => factorsRecord[code]);
  const overallMean = totalScoredCount > 0 ? parseFloat((totalScoredSum / totalScoredCount).toFixed(2)) : 0;

  return {
    scaleId: ABAÖ_SCALE_METADATA.id,
    slug: ABAÖ_SCALE_METADATA.slug,
    code: ABAÖ_SCALE_METADATA.code,
    title: ABAÖ_SCALE_METADATA.title,
    totalQuestions: ABAÖ_QUESTIONS.length,
    totalAnswered: totalScoredCount,
    overallMean,
    factors: factorsRecord,
    factorList,
    itemDetails
  };
}

// ============================================================================
// Collective Evaluation Types & Helper
// ============================================================================

export interface StudentFactorScoreMatrixItem {
  applicationId: string;
  studentId?: string;
  studentNumber?: string;
  studentName?: string;
  className?: string;
  gender?: string;
  completedAt?: string | number;
  overallMean: number;
  factorMeans: Record<AkademikBenlikFactorCode, number>;
  factorSums: Record<AkademikBenlikFactorCode, number>;
}

export interface FactorCollectiveStats {
  code: AkademikBenlikFactorCode;
  name: string;
  shortName: string;
  order: number;
  count: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
}

export interface CollectiveAkademikBenlikEvaluationResult {
  scaleId: string;
  title: string;
  totalStudents: number;
  classNames: string[];
  overallClassMean: number;
  factorStats: FactorCollectiveStats[];
  studentMatrix: StudentFactorScoreMatrixItem[];
  studentRows: StudentFactorScoreMatrixItem[];
}

export function evaluateCollectiveAkademikBenlikAlgisi(
  applications: Array<any>,
  options?: {
    classFilter?: string;
    scope?: 'latest_per_student' | 'all';
    latestPerStudentOnly?: boolean;
  }
): CollectiveAkademikBenlikEvaluationResult {
  let targetApps = applications || [];

  if (options?.classFilter && options.classFilter !== 'ALL') {
    targetApps = targetApps.filter(app => ((app.class_name || app.className || 'Belirtilmemiş') === options.classFilter));
  }

  if (options?.scope === 'latest_per_student' || options?.latestPerStudentOnly) {
    const studentLatest = new Map<string, any>();
    targetApps.forEach(app => {
      const sId = app.student_id || app.studentId || app.student_number || app.studentNumber || app.student_name || app.studentName || app.id;
      const rawTime = app.completed_at || app.completedAt || app.applied_at || app.appliedAt || 0;
      const appTime = typeof rawTime === 'number' ? rawTime : (new Date(rawTime).getTime() || 0);
      const existing = studentLatest.get(sId);
      const existingRawTime = existing ? (existing.completed_at || existing.completedAt || existing.applied_at || existing.appliedAt || 0) : 0;
      const existingTime = typeof existingRawTime === 'number' ? existingRawTime : (new Date(existingRawTime).getTime() || 0);
      if (!existing || appTime > existingTime) {
        studentLatest.set(sId, app);
      }
    });
    targetApps = Array.from(studentLatest.values());
  }

  const factorCodes: AkademikBenlikFactorCode[] = [
    'turk_dili_edebiyati',
    'tarih',
    'matematik',
    'fizik',
    'kimya',
    'biyoloji',
    'cografya',
    'yabanci_dil'
  ];

  const studentMatrix: StudentFactorScoreMatrixItem[] = targetApps.map(app => {
    let evalRes: AkademikBenlikEvaluationResult | null = null;

    if (app.evaluation_result && app.evaluation_result.factors && (app.evaluation_result.totalAnswered > 0 || app.evaluation_result.overallMean > 0)) {
      evalRes = app.evaluation_result as AkademikBenlikEvaluationResult;
    } else if (app.evaluationResult && app.evaluationResult.factors && (app.evaluationResult.totalAnswered > 0 || app.evaluationResult.overallMean > 0)) {
      evalRes = app.evaluationResult as AkademikBenlikEvaluationResult;
    } else if (app.resultSnapshot?.akademikBenlikEvaluation?.factors && (app.resultSnapshot.akademikBenlikEvaluation.totalAnswered > 0 || app.resultSnapshot.akademikBenlikEvaluation.overallMean > 0)) {
      evalRes = app.resultSnapshot.akademikBenlikEvaluation as AkademikBenlikEvaluationResult;
    } else if (app.resultSnapshot?.rawMetrics?.akademikBenlikEvaluation?.factors && (app.resultSnapshot.rawMetrics.akademikBenlikEvaluation.totalAnswered > 0 || app.resultSnapshot.rawMetrics.akademikBenlikEvaluation.overallMean > 0)) {
      evalRes = app.resultSnapshot.rawMetrics.akademikBenlikEvaluation as AkademikBenlikEvaluationResult;
    } else {
      let rawObj = app.raw_answers || app.rawAnswers || app.answers_json || app.answersJson || app.resultSnapshot?.rawMetrics?.answers;
      if (typeof rawObj === 'string') {
        try { rawObj = JSON.parse(rawObj); } catch { rawObj = {}; }
      } else if (!rawObj && app.answers && Array.isArray(app.answers)) {
        rawObj = {};
        app.answers.forEach((a: any, idx: number) => {
          const qNum = a.questionOrder || idx + 1;
          rawObj[`q${qNum}`] = a.selectedOptionValue || a.answerValue || a.selectedOptionLabel || '';
        });
      }

      if (rawObj && typeof rawObj === 'object' && Object.keys(rawObj).length > 0) {
        evalRes = evaluateAkademikBenlikAlgisi(rawObj);
      }
    }

    const factorMeans = {} as Record<AkademikBenlikFactorCode, number>;
    const factorSums = {} as Record<AkademikBenlikFactorCode, number>;
    let overallMean = 0;

    if (evalRes && (evalRes.totalAnswered > 0 || evalRes.overallMean > 0)) {
      factorCodes.forEach(f => {
        factorMeans[f] = evalRes!.factors[f] ? evalRes!.factors[f].mean : 0;
        factorSums[f] = evalRes!.factors[f] ? evalRes!.factors[f].sum : 0;
      });
      overallMean = evalRes.overallMean;
    } else if (app.resultSnapshot?.subscales && Array.isArray(app.resultSnapshot.subscales) && app.resultSnapshot.subscales.length > 0) {
      const factorMeansList: number[] = [];
      factorCodes.forEach(f => {
        const sub = app.resultSnapshot.subscales.find((s: any) => s.code === f || s.subscaleCode === f || s.subscaleId === f);
        if (sub) {
          const rawScore = sub.score ?? 0;
          const qCount = sub.questionCount ?? 7;
          let factorMean = 0;
          let factorSum = 0;
          if (sub.averageScore !== undefined && sub.averageScore !== null) {
            factorMean = Number(sub.averageScore);
            factorSum = sub.totalScore !== undefined ? Number(sub.totalScore) : Math.round(factorMean * qCount);
          } else if (rawScore > 8) {
            factorSum = rawScore;
            factorMean = qCount > 0 ? parseFloat((rawScore / qCount).toFixed(2)) : 0;
          } else {
            factorMean = rawScore;
            factorSum = Math.round(rawScore * qCount);
          }
          factorSums[f] = factorSum;
          factorMeans[f] = factorMean;
          factorMeansList.push(factorMean);
        } else {
          factorSums[f] = 0;
          factorMeans[f] = 0;
        }
      });
      overallMean = factorMeansList.length > 0
        ? parseFloat((factorMeansList.reduce((a, b) => a + b, 0) / factorMeansList.length).toFixed(2))
        : (app.totalScore ? (app.totalScore > 8 ? parseFloat((app.totalScore / 56).toFixed(2)) : app.totalScore) : 0);
    } else {
      factorCodes.forEach(f => {
        factorMeans[f] = 0;
        factorSums[f] = 0;
      });
      overallMean = app.totalScore !== undefined && app.totalScore > 0 ? (app.totalScore > 8 ? parseFloat((app.totalScore / 56).toFixed(2)) : app.totalScore) : 0;
    }

    return {
      applicationId: app.id,
      studentId: app.student_id || app.studentId,
      studentNumber: app.student_number || app.studentNumber,
      studentName: app.student_name || app.studentName || 'İsimsiz Öğrenci',
      className: app.class_name || app.className || '-',
      gender: app.gender,
      completedAt: app.completed_at || app.completedAt,
      overallMean,
      factorMeans,
      factorSums
    };
  });

  const distinctClasses = Array.from(
    new Set(targetApps.map(a => a.class_name || a.className).filter((c): c is string => Boolean(c)))
  );

  const factorStats: FactorCollectiveStats[] = factorCodes.map(fCode => {
    const meta = ABAÖ_FACTORS[fCode];
    const scores = studentMatrix.map(s => s.factorMeans[fCode]).filter(val => val !== undefined && !isNaN(val));
    const count = scores.length;

    if (count === 0) {
      return {
        code: fCode,
        name: meta.name,
        shortName: meta.shortName,
        order: meta.order,
        count: 0,
        mean: 0,
        sd: 0,
        min: 0,
        max: 0
      };
    }

    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = parseFloat((sum / count).toFixed(2));
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
    const sd = parseFloat(Math.sqrt(variance).toFixed(2));
    const min = parseFloat(Math.min(...scores).toFixed(2));
    const max = parseFloat(Math.max(...scores).toFixed(2));

    return {
      code: fCode,
      name: meta.name,
      shortName: meta.shortName,
      order: meta.order,
      count,
      mean,
      sd,
      min,
      max
    };
  });

  const overallClassMean = studentMatrix.length > 0
    ? parseFloat((studentMatrix.reduce((a, b) => a + b.overallMean, 0) / studentMatrix.length).toFixed(2))
    : 0;

  return {
    scaleId: ABAÖ_SCALE_METADATA.id,
    title: ABAÖ_SCALE_METADATA.title,
    totalStudents: studentMatrix.length,
    classNames: distinctClasses,
    overallClassMean,
    factorStats,
    studentMatrix,
    studentRows: studentMatrix
  };
}
