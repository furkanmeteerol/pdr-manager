export type MeslekDegeriKey =
  | 'ARKADASLIK'
  | 'EKIP_CALISMASI'
  | 'FIZIKSEL_OZELLIKLERIN_KULLANIM'
  | 'LIDERLIK'
  | 'OZGURLUK'
  | 'KAZANC'
  | 'SAGLIK'
  | 'YARATICILIK'
  | 'YARDIM';

export interface MeslekDegeriMetadata {
  key: MeslekDegeriKey;
  code: string;
  title: string;
  questions: number[];
  itemCount: number;
  divisor: number;
  description: string;
  colors: {
    badge: string;
    bg: string;
    border: string;
    text: string;
    barColor: string;
    hex: string;
  };
}

export const MESLEK_DEGERI_METADATA: Record<MeslekDegeriKey, MeslekDegeriMetadata> = {
  ARKADASLIK: {
    key: 'ARKADASLIK',
    code: 'ARK',
    title: 'Arkadaşlık',
    questions: [8, 17, 21, 24],
    itemCount: 4,
    divisor: 4,
    description: 'İş ortamında sıcak, samimi, dostça ilişkiler ve uyum içinde olmaya verilen öncelik.',
    colors: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      barColor: 'bg-indigo-600',
      hex: '#4f46e5'
    }
  },
  EKIP_CALISMASI: {
    key: 'EKIP_CALISMASI',
    code: 'EKP',
    title: 'Ekip Çalışması',
    questions: [18, 23, 26, 32],
    itemCount: 4,
    divisor: 4,
    description: 'Takım ruhu ile ortak projeler yürütme, işbirliği yapma ve ortaklaşa kararlar almaya verilen öncelik.',
    colors: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      barColor: 'bg-blue-600',
      hex: '#2563eb'
    }
  },
  FIZIKSEL_OZELLIKLERIN_KULLANIM: {
    key: 'FIZIKSEL_OZELLIKLERIN_KULLANIM',
    code: 'FZK',
    title: 'Fiziksel Özelliklerin Kullanım',
    questions: [5, 20, 29, 33],
    itemCount: 4,
    divisor: 4,
    description: 'Fiziksel güç kullanma, mekanik işlerle uğraşma ve bir şeyleri tamir etmeye verilen öncelik.',
    colors: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      barColor: 'bg-amber-600',
      hex: '#d97706'
    }
  },
  LIDERLIK: {
    key: 'LIDERLIK',
    code: 'LDR',
    title: 'Liderlik',
    questions: [2, 11, 13, 27],
    itemCount: 4,
    divisor: 4,
    description: 'Çalışanları yönlendirme, yöneticilik yapma, liderlik becerilerini sergileme ve başkalarına yön vermeye verilen öncelik.',
    colors: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      barColor: 'bg-purple-600',
      hex: '#9333ea'
    }
  },
  OZGURLUK: {
    key: 'OZGURLUK',
    code: 'OZG',
    title: 'Özgürlük',
    questions: [3, 9, 35],
    itemCount: 3,
    divisor: 3,
    description: 'Çalışma koşullarını ve çalışma saatlerini kendisi belirleme, esnek çalışma imkânına sahip olmaya verilen öncelik.',
    colors: {
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
      bg: 'bg-teal-50/50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      barColor: 'bg-teal-600',
      hex: '#0d9488'
    }
  },
  KAZANC: {
    key: 'KAZANC',
    code: 'KZN',
    title: 'Kazanç',
    questions: [1, 14, 22, 31],
    itemCount: 4,
    divisor: 4,
    description: 'Lüks yaşam sürdürme, çok para kazanma, yüksek ücret ve ekonomik tatmin sağlamaya verilen öncelik.',
    colors: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      barColor: 'bg-emerald-600',
      hex: '#059669'
    }
  },
  SAGLIK: {
    key: 'SAGLIK',
    code: 'SGL',
    title: 'Sağlık',
    questions: [6, 12, 15, 19],
    itemCount: 4,
    divisor: 4,
    description: 'Sağlık risklerinin az olması, meslek hastalığından uzak kalma, hayati tehlike, yaralanma veya sakatlanma riski içermeyen işe verilen öncelik.',
    colors: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      bg: 'bg-rose-50/50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      barColor: 'bg-rose-600',
      hex: '#e11d48'
    }
  },
  YARATICILIK: {
    key: 'YARATICILIK',
    code: 'YRT',
    title: 'Yaratıcılık',
    questions: [7, 10, 30, 34],
    itemCount: 4,
    divisor: 4,
    description: 'Yaratıcılığını kullanma, orijinal fikirler üretme, sürekli yeni çalışmalar yapma ve daha önce düşünülmemiş orijinal çözümler sunmaya verilen öncelik.',
    colors: {
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      bg: 'bg-sky-50/50',
      border: 'border-sky-200',
      text: 'text-sky-800',
      barColor: 'bg-sky-600',
      hex: '#0284c7'
    }
  },
  YARDIM: {
    key: 'YARDIM',
    code: 'YRD',
    title: 'Yardım',
    questions: [4, 16, 25, 28],
    itemCount: 4,
    divisor: 4,
    description: 'İnsanların sorunlarını çözmeye yardım etme, topluma faydalı olma, diğer insanların iyiliği ve mutluluğu için katkıda bulunmaya verilen öncelik.',
    colors: {
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      bg: 'bg-cyan-50/50',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      barColor: 'bg-cyan-600',
      hex: '#0891b2'
    }
  }
};

export const MESLEK_DEGERI_KEYS_ORDER: MeslekDegeriKey[] = [
  'ARKADASLIK',
  'EKIP_CALISMASI',
  'FIZIKSEL_OZELLIKLERIN_KULLANIM',
  'LIDERLIK',
  'OZGURLUK',
  'KAZANC',
  'SAGLIK',
  'YARATICILIK',
  'YARDIM'
];

export const MESLEK_DEGERI_QUESTION_MAP = {
  ARKADASLIK: [8, 17, 21, 24],
  EKIP_CALISMASI: [18, 23, 26, 32],
  FIZIKSEL_OZELLIKLERIN_KULLANIM: [5, 20, 29, 33],
  LIDERLIK: [2, 11, 13, 27],
  OZGURLUK: [3, 9, 35],
  KAZANC: [1, 14, 22, 31],
  SAGLIK: [6, 12, 15, 19],
  YARATICILIK: [7, 10, 30, 34],
  YARDIM: [4, 16, 25, 28]
};

export const MESLEK_DEGERI_SOURCE_INFO =
  'Meslek Değeri Envanteri sonucunda bireyin meslek değerleri aldıkları puanlara (1.00 - 9.00) göre sıralanarak önem dereceleri belirlenir. Puanlar yalnızca bu envanter içerisindeki meslek değerlerinin göreli önceliğini göstermek amacıyla kullanılır.';

export interface MeslekDegeriScoreResult {
  key: MeslekDegeriKey;
  title: string;
  code: string;
  itemCount: number;
  divisor: number;
  rawSum: number;
  averageScore: number; // 1.00 .. 9.00
  percentage: number; // (averageScore / 9) * 100
  itemScores: { questionOrder: number; score: number }[];
  metadata: MeslekDegeriMetadata;
}

export interface MeslekDegeriEvaluationResult {
  valueResults: MeslekDegeriScoreResult[];
  sortedValues: MeslekDegeriScoreResult[];
  top3Values: MeslekDegeriScoreResult[];
  hasRank1Tie: boolean;
  hasTop3Tie: boolean;
  tieDescription?: string;
  summaryParagraph: string;
  methodologyNote: string;
}

export interface AnswerItemInput {
  questionOrder?: number;
  questionId?: string;
  selectedOptionValue?: string | number;
  value?: string | number;
  answer?: string | number;
  answerScore?: number;
}

export function normalizeMeslekDegeriAnswerValue(raw: any): number {
  if (raw === undefined || raw === null) return 1;
  if (typeof raw === 'number' && raw >= 1 && raw <= 9) return Math.round(raw);
  const str = String(raw).trim();
  const match = str.match(/^([1-9])/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 9) return n;
  }
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 9) return parsed;
  return 1;
}

export function calculateMeslekDegeriEvaluation(
  answersInput: AnswerItemInput[] | Record<string, string | number> | any
): MeslekDegeriEvaluationResult {
  const answerMap = new Map<number, number>();

  if (Array.isArray(answersInput)) {
    answersInput.forEach((a, index) => {
      let qNum = a.questionOrder;
      if (!qNum && a.questionId) {
        const numPart = a.questionId.replace(/^[^0-9]+/, '');
        if (numPart) qNum = parseInt(numPart, 10);
      }
      if (!qNum) qNum = index + 1;

      let val = 1;
      if (typeof a.answerScore === 'number' && a.answerScore >= 1 && a.answerScore <= 9) {
        val = Math.round(a.answerScore);
      } else {
        const raw = a.answerValue ?? a.selectedOptionValue ?? a.value ?? a.answer ?? a.score ?? a.selectedOptionLabel ?? '';
        val = normalizeMeslekDegeriAnswerValue(raw);
      }
      answerMap.set(qNum, val);
    });
  } else if (answersInput && typeof answersInput === 'object') {
    Object.keys(answersInput).forEach((key) => {
      const numPart = key.replace(/^[^0-9]+/, '');
      const qNum = parseInt(numPart, 10);
      if (!isNaN(qNum) && qNum >= 1 && qNum <= 35) {
        const raw = answersInput[key];
        const val = normalizeMeslekDegeriAnswerValue(raw);
        answerMap.set(qNum, val);
      }
    });
  }

  const valueResults: MeslekDegeriScoreResult[] = MESLEK_DEGERI_KEYS_ORDER.map((key) => {
    const meta = MESLEK_DEGERI_METADATA[key];
    const itemScores: { questionOrder: number; score: number }[] = [];
    let sum = 0;

    for (const qNum of meta.questions) {
      const score = answerMap.get(qNum) ?? 1;
      itemScores.push({ questionOrder: qNum, score });
      sum += score;
    }

    const averageScore = Number((sum / meta.divisor).toFixed(2));
    const percentage = Number(((averageScore / 9) * 100).toFixed(1));

    return {
      key,
      title: meta.title,
      code: meta.code,
      itemCount: meta.itemCount,
      divisor: meta.divisor,
      rawSum: sum,
      averageScore,
      percentage,
      itemScores,
      metadata: meta
    };
  });

  // Sort values descending by averageScore
  const sortedValues = [...valueResults].sort((a, b) => b.averageScore - a.averageScore);

  // Top 3 values
  const top3Values = sortedValues.slice(0, 3);

  // Check for ties
  const hasRank1Tie = sortedValues.length >= 2 && sortedValues[0].averageScore === sortedValues[1].averageScore;
  const hasRank3Tie = sortedValues.length >= 4 && sortedValues[2].averageScore === sortedValues[3].averageScore;
  const hasTop3Tie = hasRank1Tie || hasRank3Tie;

  let tieDescription: string | undefined;
  if (hasTop3Tie) {
    if (hasRank1Tie) {
      const tiedRank1 = sortedValues.filter((t) => t.averageScore === sortedValues[0].averageScore);
      tieDescription = `1. öncelik sırasında eşit puan (${sortedValues[0].averageScore.toFixed(2)}) bulunmaktadır: ${tiedRank1.map((t) => t.title).join(' • ')}.`;
    } else if (hasRank3Tie) {
      const tiedRank3 = sortedValues.filter((t) => t.averageScore === sortedValues[2].averageScore);
      tieDescription = `3. öncelik sınırında eşit puan (${sortedValues[2].averageScore.toFixed(2)}) bulunmaktadır: ${tiedRank3.map((t) => t.title).join(' • ')}.`;
    }
  }

  const top3LabelsFormatted = top3Values.map((t, idx) => `${idx + 1}. ${t.title} (${t.averageScore.toFixed(2)}/9.00)`).join(', ');

  const summaryParagraph = top3Values.length >= 3
    ? `Öğrencinin meslek seçiminde en yüksek öncelik verdiği değerler: ${top3LabelsFormatted} olarak belirlenmiştir.`
    : 'Meslek değerleri puanları ve öncelik sıralaması hesaplanmıştır.';

  const methodologyNote =
    'Meslek Değeri Envanteri sonucunda bireyin meslek değerleri aldıkları puanlara göre sıralanarak önem dereceleri belirlenir. Puanlar yalnızca bu envanter içerisindeki meslek değerlerinin göreli önceliğini göstermek amacıyla kullanılır.';

  return {
    valueResults,
    sortedValues,
    top3Values,
    hasRank1Tie,
    hasTop3Tie,
    tieDescription,
    summaryParagraph,
    methodologyNote
  };
}

/**
 * Resolves the canonical Meslek Değeri evaluation from an application DTO or answers map.
 * Checks frozen snapshot first, then rawMetrics, then recalculates if necessary.
 */
export function getMeslekDegeriEvaluation(app: any): MeslekDegeriEvaluationResult {
  const snapAny = app?.resultSnapshot as any;
  if (snapAny?.meslekDegeriEvaluation?.valueResults && Array.isArray(snapAny.meslekDegeriEvaluation.valueResults) && snapAny.meslekDegeriEvaluation.valueResults.length > 0) {
    return snapAny.meslekDegeriEvaluation;
  }
  if (snapAny?.rawMetrics?.meslekDegeriEvaluation?.valueResults && Array.isArray(snapAny.rawMetrics.meslekDegeriEvaluation.valueResults) && snapAny.rawMetrics.meslekDegeriEvaluation.valueResults.length > 0) {
    return snapAny.rawMetrics.meslekDegeriEvaluation;
  }
  if (snapAny?.rawMetrics?.answers) {
    return calculateMeslekDegeriEvaluation(snapAny.rawMetrics.answers);
  }
  if (app?.answers && Array.isArray(app.answers) && app.answers.length > 0) {
    return calculateMeslekDegeriEvaluation(app.answers);
  }
  if (Array.isArray(app) || (app && typeof app === 'object' && ('q1' in app || '1' in app || 'answers' in app))) {
    return calculateMeslekDegeriEvaluation(app.answers || app);
  }
  return calculateMeslekDegeriEvaluation([]);
}

export const evaluateMeslekDegeriResponses = calculateMeslekDegeriEvaluation;
