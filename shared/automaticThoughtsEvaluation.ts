export interface AutomaticThoughtsItemScore {
  itemNumber: number;
  itemText: string;
  rawScore: number;
  calculatedScore: number;
  selectedOptionLabel: string;
}

export interface AutomaticThoughtsEvaluationResult {
  totalScore: number;
  minPossibleScore: number;
  maxPossibleScore: number;
  averageScore: number;
  answeredItemCount: number;
  totalItemCount: number;
  isComplete: boolean;
  itemScores: AutomaticThoughtsItemScore[];
  sourceInterpretation: string;
  sourceDisclaimer: string;
}

export const ATQ_SCALE_METADATA = {
  name: "Otomatik Düşünceler Ölçeği",
  englishName: "Automatic Thoughts Questionnaire",
  code: "ATQ-30",
  slug: "otomatik-dusunceler-olcegi",
  itemCount: 30,
  subscaleCount: 1,
  scaleType: "Likert (5'li)",
  scoring: "Toplam Puan",
  targetAudience: "Yetişkinler",
  cronbachAlpha: 0.930,
  theoreticalMin: 30,
  theoreticalMax: 150,
  sourceCitation: "Sahin, N.H. & Sahin, N. (1992). How dysfunctional are the dysfunctional attitudes in another culture? British Journal of Medical Psychology, 65(1), 17-26."
};

export const AUTOMATIC_THOUGHTS_OPTIONS = [
  { label: 'Hiç', value: '1', score: 1 },
  { label: 'Nadiren', value: '2', score: 2 },
  { label: 'Bazen', value: '3', score: 3 },
  { label: 'Sıklıkla', value: '4', score: 4 },
  { label: 'Her zaman', value: '5', score: 5 }
];

export const AUTOMATIC_THOUGHTS_OPTION_LABELS: Record<number, string> = {
  1: 'Hiç',
  2: 'Nadiren',
  3: 'Bazen',
  4: 'Sıklıkla',
  5: 'Her zaman'
};

export const AUTOMATIC_THOUGHTS_QUESTIONS: string[] = [
  "Her şey benim için anlamsız",
  "Keşke daha iyi bir insan olsaydım",
  "Hiç bir şeyi başaramıyorum",
  "Kimse beni anlamıyor",
  "İnsanları hayal kırıklığına uğrattım",
  "Kendime katlanamıyorum",
  "Keşke başka bir yerde olsaydım",
  "Kendimi bir araya toplayamıyorum",
  "Mutsuzluğumdan kurtulamıyorum",
  "Hayatım berbat",
  "Artık dayanamıyorum",
  "Hiçbir şeye başlayamıyorum",
  "Bende bir terslik var",
  "Hayatım istediğim gibi gitmiyor",
  "Kendimden nefret ediyorum",
  "Değerim yok",
  "Keşke yok olsaydım",
  "Gelecek ne getirecek bilmiyorum",
  "İşler düzelmeyecek",
  "Yapabileceğim hiçbir şey yok",
  "Benim için gelecek yok",
  "Hiçbir şey değişmez",
  "Bir yanlışlık var bende",
  "Hayatım tamamen berbat",
  "Başarısızım",
  "Bunu asla başaramayacağım",
  "Bir şeyler değiştirmem lazım ama yapamıyorum",
  "Geleceğimle ilgili karamsarım",
  "Bu uğraş buna değmez",
  "Hiçbir şeyi bitiremedim"
];

export const SOURCE_INTERPRETATION_TEXT = "Yüksek puan daha fazla olumsuz otomatik düşünceyi ifade eder.";
export const SOURCE_DISCLAIMER_TEXT = "Bu ölçekten elde edilen toplam puan yükseldikçe, olumsuz otomatik düşüncelerin daha fazla olduğu belirtilmektedir. Bu sonuç tek başına klinik tanı veya değerlendirme anlamına gelmez.";

/**
 * Extracts normalized answers map from any ATQ application, snapshot, array, or object format.
 */
export function extractATQAnswersMap(input: any): Record<string, number | string> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return extractATQAnswersMap(parsed);
    } catch {
      return {};
    }
  }

  if (typeof input === 'object') {
    const evalObj = input.atqEvaluation || input.resultSnapshot?.atqEvaluation || input.rawMetrics?.atqEvaluation || (input.itemScores && Array.isArray(input.itemScores) ? input : null);
    if (evalObj?.itemScores && Array.isArray(evalObj.itemScores) && evalObj.itemScores.length > 0) {
      const map: Record<string, number | string> = {};
      evalObj.itemScores.forEach((it: any) => {
        const num = it.itemNumber;
        if (num) {
          map[`q${num}`] = it.calculatedScore || it.rawScore;
        }
      });
      return map;
    }

    if (input.resultSnapshot?.rawMetrics?.answers) {
      return extractATQAnswersMap(input.resultSnapshot.rawMetrics.answers);
    }
    if (input.resultSnapshot?.answers) {
      return extractATQAnswersMap(input.resultSnapshot.answers);
    }
    if (input.rawMetrics?.answers) {
      return extractATQAnswersMap(input.rawMetrics.answers);
    }
    if (input.answersJson) {
      return extractATQAnswersMap(input.answersJson);
    }
    if (input.answers_json) {
      return extractATQAnswersMap(input.answers_json);
    }
    if (Array.isArray(input.answers)) {
      return extractATQAnswersMap(input.answers);
    }
    if (input.answers && typeof input.answers === 'object') {
      return extractATQAnswersMap(input.answers);
    }
    if (Array.isArray(input)) {
      const map: Record<string, number | string> = {};
      input.forEach((a: any, idx: number) => {
        const qNum = a.questionOrder || a.itemNumber || a.order || idx + 1;
        const val = a.answerScore ?? a.score ?? a.scoreValue ?? a.answerValue ?? a.selectedOptionLabel ?? a.selectedOptionValue ?? a.value ?? a.rawScore ?? a.calculatedScore ?? '';
        map[`q${qNum}`] = val;
        if (a.questionId) map[a.questionId] = val;
      });
      return map;
    }
  }
  return input;
}

export function evaluateAutomaticThoughts(input: any): AutomaticThoughtsEvaluationResult {
  const answers = extractATQAnswersMap(input);
  const itemScores: AutomaticThoughtsItemScore[] = [];
  let totalScore = 0;
  let answeredCount = 0;

  for (let i = 1; i <= 30; i++) {
    const key = `q${i}`;
    const altKey = `m${i}`;
    const rawVal = answers[key] ?? answers[altKey] ?? answers[String(i)] ?? answers[`q-otomatik-dusunceler-olcegi-${i}`];
    
    let rawNum = 0;
    if (typeof rawVal === "number") {
      rawNum = rawVal;
    } else if (typeof rawVal === "string") {
      const parsed = parseInt(rawVal, 10);
      if (!isNaN(parsed)) {
        rawNum = parsed;
      }
    }

    const itemText = AUTOMATIC_THOUGHTS_QUESTIONS[i - 1] || `Madde ${i}`;
    let calcScore = 0;
    let selectedOptionLabel = '-';

    if (rawNum >= 1 && rawNum <= 5) {
      answeredCount++;
      calcScore = rawNum;
      totalScore += calcScore;
      selectedOptionLabel = AUTOMATIC_THOUGHTS_OPTION_LABELS[rawNum] || String(rawNum);
    }

    itemScores.push({
      itemNumber: i,
      itemText,
      rawScore: rawNum,
      calculatedScore: calcScore,
      selectedOptionLabel
    });
  }

  const minPossibleScore = 30;
  const maxPossibleScore = 150;
  const averageScore = answeredCount > 0 ? parseFloat((totalScore / answeredCount).toFixed(2)) : 0;

  return {
    totalScore,
    minPossibleScore,
    maxPossibleScore,
    averageScore,
    answeredItemCount: answeredCount,
    totalItemCount: 30,
    isComplete: answeredCount === 30,
    itemScores,
    sourceInterpretation: SOURCE_INTERPRETATION_TEXT,
    sourceDisclaimer: SOURCE_DISCLAIMER_TEXT
  };
}
