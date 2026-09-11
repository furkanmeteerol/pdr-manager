export type WestsideLevelKey = 'low' | 'normal' | 'borderline' | 'mid_high' | 'high' | 'panic';

export interface WestsideCategoryInfo {
  categoryLabel: string;
  levelKey: WestsideLevelKey;
  isRiskGroup: boolean;
  colorClasses: {
    badge: string;
    bar: string;
    text: string;
    border: string;
    bg: string;
    hex: string;
    hexBorder: string;
    hexBg: string;
  };
  description: string;
}

export interface WestsideEvaluationResult {
  rawTotal: number;
  averageScore: number;
  averageScoreFormatted: string;
  progressPercent: number;
  isRiskGroup: boolean;
  category: WestsideCategoryInfo;
}

/**
 * Calculates average score (1.00 - 5.00), evaluation interval category (6 levels),
 * and risk group status for The Westside Test Anxiety Scale (WST-11).
 *
 * @param rawTotal Sum of answers across 11 items (range: 11 - 55)
 */
export function getWestsideEvaluation(rawTotal: number): WestsideEvaluationResult {
  const clampedRaw = Math.max(11, Math.min(55, rawTotal || 11));
  const rawAvg = clampedRaw / 11;
  const averageScore = Math.round(rawAvg * 100) / 100;
  const averageScoreFormatted = averageScore.toFixed(2);
  
  // Risk group: Average score strictly greater than 3.00 (3.01 - 5.00)
  const isRiskGroup = averageScore > 3.00;

  // Normalized progress percentage: (averageScore - 1) / 4 * 100
  // 1.00 -> 0%, 2.00 -> 25%, 3.00 -> 50%, 4.00 -> 75%, 5.00 -> 100%
  // 3.09 -> 52.25%
  const progressPercent = Math.min(100, Math.max(0, ((averageScore - 1) / 4) * 100));

  let categoryLabel: string;
  let levelKey: WestsideLevelKey;
  let colorClasses: WestsideCategoryInfo['colorClasses'];

  if (averageScore < 2.00) {
    categoryLabel = 'Rahat / Düşük Kaygı';
    levelKey = 'low';
    colorClasses = {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/50',
      hex: '#059669',
      hexBorder: '#a7f3d0',
      hexBg: '#ecfdf5'
    };
  } else if (averageScore < 2.60) {
    categoryLabel = 'Normal / İdeal Düzey';
    levelKey = 'normal';
    colorClasses = {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      bar: 'bg-blue-500',
      text: 'text-blue-700',
      border: 'border-blue-200',
      bg: 'bg-blue-50/50',
      hex: '#2563eb',
      hexBorder: '#bfdbfe',
      hexBg: '#eff6ff'
    };
  } else if (averageScore < 3.00) {
    categoryLabel = 'Sınırda / Hafif Kaygı';
    levelKey = 'borderline';
    colorClasses = {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      text: 'text-amber-700',
      border: 'border-amber-200',
      bg: 'bg-amber-50/50',
      hex: '#d97706',
      hexBorder: '#fde68a',
      hexBg: '#fffbeb'
    };
  } else if (averageScore < 3.50) {
    categoryLabel = 'Orta-Yüksek Kaygı';
    levelKey = 'mid_high';
    colorClasses = {
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      bar: 'bg-orange-500',
      text: 'text-orange-700',
      border: 'border-orange-200',
      bg: 'bg-orange-50/50',
      hex: '#ea580c',
      hexBorder: '#fed7aa',
      hexBg: '#fff7ed'
    };
  } else if (averageScore < 4.00) {
    categoryLabel = 'Yüksek Kaygı';
    levelKey = 'high';
    colorClasses = {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      bar: 'bg-rose-500',
      text: 'text-rose-700',
      border: 'border-rose-200',
      bg: 'bg-rose-50/50',
      hex: '#e11d48',
      hexBorder: '#fecdd3',
      hexBg: '#fff1f2'
    };
  } else {
    categoryLabel = 'Aşırı / Panik Düzeyi';
    levelKey = 'panic';
    colorClasses = {
      badge: 'bg-red-100 text-red-900 border-red-300',
      bar: 'bg-red-700',
      text: 'text-red-900',
      border: 'border-red-300',
      bg: 'bg-red-50/60',
      hex: '#b91c1c',
      hexBorder: '#fca5a5',
      hexBg: '#fef2f2'
    };
  }

  const description = isRiskGroup
    ? `Öğrencinin The Westside Sınav Kaygısı Ölçeği ortalama puanı ${averageScoreFormatted} / 5.00 olup "${categoryLabel}" düzeyindedir. Ortalama puanın 3.00 üzerinde olması nedeniyle öğrenci risk grubunda değerlendirilmektedir. Sınav kaygısının akademik performansa ve sınav esnasındaki dikkat/hatırlama süreçlerine olası etkilerini azaltmak amacıyla öğrenciyle bireysel rehberlik görüşmesi yapılması, gevşeme/nefes egzersizleri ve sınav stratejileri desteği sağlanması önerilir.`
    : `Öğrencinin The Westside Sınav Kaygısı Ölçeği ortalama puanı ${averageScoreFormatted} / 5.00 olup "${categoryLabel}" düzeyindedir. Öğrencinin sınav kaygısı yönetilebilir ve işlevsel sınırlar içerisindedir. Mevcut olumlu tutumun ve sınav hazırlık alışkanlıklarının korunması desteklenebilir.`;

  return {
    rawTotal: clampedRaw,
    averageScore,
    averageScoreFormatted,
    progressPercent,
    isRiskGroup,
    category: {
      categoryLabel,
      levelKey,
      isRiskGroup,
      colorClasses,
      description
    }
  };
}

export interface ClassGroupStatistics {
  count: number;
  mean: number;
  stdDev: number;
  highThreshold: number; // mean + stdDev
  lowThreshold: number;  // mean - stdDev
  hasEnoughData: boolean; // count >= 2
}

/**
 * Calculates group statistics (mean, sample standard deviation, +1 SD, -1 SD)
 * strictly using 1.00 - 5.00 average scores.
 */
export function calculateClassGroupStats(averageScores: number[]): ClassGroupStatistics {
  const count = averageScores.length;
  if (count < 2) {
    const mean = count === 1 ? Number(averageScores[0].toFixed(2)) : 0;
    return {
      count,
      mean,
      stdDev: 0,
      highThreshold: mean,
      lowThreshold: mean,
      hasEnoughData: false
    };
  }
  const mean = averageScores.reduce((a, b) => a + b, 0) / count;
  const variance = averageScores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1);
  const stdDev = Math.sqrt(variance);

  return {
    count,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    highThreshold: Number((mean + stdDev).toFixed(2)),
    lowThreshold: Number((mean - stdDev).toFixed(2)),
    hasEnoughData: true
  };
}

export type WestsideSdPosition = 'high' | 'low' | 'within_sd' | 'insufficient_data';

export interface WestsideSdPositionInfo {
  position: WestsideSdPosition;
  label: string;
}

/**
 * Evaluates student average score against their class group statistics (+1 SD / -1 SD).
 */
export function getWestsideSdPosition(averageScore: number, stats?: ClassGroupStatistics): WestsideSdPositionInfo {
  if (!stats || !stats.hasEnoughData) {
    return { position: 'insufficient_data', label: '— (Veri < 2)' };
  }
  if (averageScore >= stats.highThreshold) {
    return { position: 'high', label: 'Yüksek Kaygı (+1 SD ve üzeri)' };
  }
  if (averageScore <= stats.lowThreshold) {
    return { position: 'low', label: 'Düşük Kaygı (-1 SD ve altı)' };
  }
  return { position: 'within_sd', label: '±1 SD aralığında' };
}
