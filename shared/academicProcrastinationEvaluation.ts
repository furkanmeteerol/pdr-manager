export interface AcademicProcrastinationItemScore {
  itemNumber: number;
  itemText: string;
  rawScore: number;
  calculatedScore: number;
  isReverse: boolean;
}

export interface AcademicProcrastinationEvaluationResult {
  totalScore: number;
  minPossibleScore: number;
  maxPossibleScore: number;
  procrastinationPercentage: number;
  itemScores: AcademicProcrastinationItemScore[];
  answeredItemCount: number;
  totalItemCount: number;
  isComplete: boolean;
}

export const AEO_SCALE_METADATA = {
  name: "Akademik Erteleme Ölçeği",
  code: "AEO-19",
  slug: "akademik-erteleme-olcegi",
  itemCount: 19,
  subscaleCount: 1,
  scaleType: "Likert (5'li)",
  scoring: "Toplam Puan",
  targetAudience: "Üniversite öğrencileri",
  cronbachAlpha: 0.870,
  theoreticalMin: 19,
  theoreticalMax: 95
};

export const REVERSE_SCORED_ITEMS = new Set([3, 6, 11, 14, 17]);

export const ACADEMIC_PROCRASTINATION_QUESTIONS = [
  "Ders çalışmaya başlamayı sık sık ertelerim",
  "Ödevlerimi son dakikaya bırakma eğilimindeyim",
  "Sınava hazırlanmaya zamanında başlarım",
  "Ders çalışma planıma uyamam",
  "Yapılması gereken ödevleri diğer günlere ertelerim",
  "Akademik görevlerimi zamanında tamamlarım",
  "Ders çalışma yerine eğlenceli şeyler yaparım",
  "Sınav tarihini bilsem de son güne kadar çalışmayı ertelerim",
  "Ödev teslim tarihlerini sık sık kaçırırım",
  "Yapılacak listeme rağmen işlerimi ertelerim",
  "Derse hazırlıklı giderim",
  "Ders çalışmak için her zaman bir bahane bulurum",
  "Üniversite görevlerimi son ana bırakma alışkanlığım var",
  "Proje ve ödevlere erken başlarım",
  "Ders çalışmam gerektiğinde diğer işlerle meşgul olurum",
  "Dönem başında belirlediğim çalışma programına uyamam",
  "Zorlu ödevleri öncelikli olarak yaparım",
  "Sınav döneminde vakit darlığı yaşarım",
  "Erteleme alışkanlığım akademik başarımı olumsuz etkiler"
];

export function evaluateAcademicProcrastination(answers: Record<string, number | string>): AcademicProcrastinationEvaluationResult {
  const itemScores: AcademicProcrastinationItemScore[] = [];
  let totalScore = 0;
  let answeredCount = 0;

  for (let i = 1; i <= 19; i++) {
    const key = `q${i}`;
    const altKey = `m${i}`;
    const rawVal = answers[key] ?? answers[altKey] ?? answers[String(i)];
    const rawNum = typeof rawVal === "number" ? rawVal : typeof rawVal === "string" ? parseInt(rawVal, 10) : 0;
    const isReverse = REVERSE_SCORED_ITEMS.has(i);
    const itemText = ACADEMIC_PROCRASTINATION_QUESTIONS[i - 1] || `Madde ${i}`;

    let calcScore = 0;
    if (rawNum >= 1 && rawNum <= 5) {
      answeredCount++;
      calcScore = isReverse ? 6 - rawNum : rawNum;
      totalScore += calcScore;
    }

    itemScores.push({
      itemNumber: i,
      itemText,
      rawScore: rawNum,
      calculatedScore: calcScore,
      isReverse
    });
  }

  const minPossibleScore = 19;
  const maxPossibleScore = 95;
  const clampedScore = Math.max(minPossibleScore, Math.min(maxPossibleScore, totalScore));
  const procrastinationPercentage = Math.round(((clampedScore - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 100);

  return {
    totalScore,
    minPossibleScore,
    maxPossibleScore,
    procrastinationPercentage,
    itemScores,
    answeredItemCount: answeredCount,
    totalItemCount: 19,
    isComplete: answeredCount === 19
  };
}
