import { 
  SurveyQuestionDto, 
  SurveySubscaleDto, 
  SurveyInterpretationDto, 
  SurveyResultSnapshotDto, 
  SurveyAnswerDto 
} from '@shared/ipc-types';

export interface RawAnswerInput {
  questionId: string;
  selectedOptionId?: string;
  answerValue?: string;
}

export interface CalculatedSurveyResult {
  totalScore: number;
  maxPossibleScore: number;
  resultSnapshot: SurveyResultSnapshotDto;
  answers: SurveyAnswerDto[];
}

export class ScoringEngine {
  /**
   * Calculates scores, reverse scoring, subscale breakdowns, and interpretation snapshots.
   */
  public static calculate(
    questions: SurveyQuestionDto[],
    subscales: SurveySubscaleDto[],
    interpretations: SurveyInterpretationDto[],
    rawAnswers: RawAnswerInput[],
    versionSnapshot: number = 1
  ): CalculatedSurveyResult {
    let totalScore = 0;
    let maxPossibleScore = 0;

    const subscaleTotals: Record<string, { score: number; count: number; maxScore: number }> = {};
    for (const sub of subscales) {
      subscaleTotals[sub.id] = { score: 0, count: 0, maxScore: 0 };
    }

    const questionMap = new Map<string, SurveyQuestionDto>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    const answerMap = new Map<string, RawAnswerInput>();
    for (const a of rawAnswers) {
      answerMap.set(a.questionId, a);
    }

    const processedAnswers: SurveyAnswerDto[] = [];

    for (const q of questions) {
      const userAns = answerMap.get(q.id);
      let calculatedScore = 0;
      let selectedOptionLabel = '';
      let selectedOptionValue = '';

      // Calculate max possible score for this question
      let questionMaxScore = 0;
      if (q.options && q.options.length > 0) {
        questionMaxScore = Math.max(...q.options.map(o => o.scoreValue ?? o.score ?? 0));
      } else if (q.questionType === 'likert_5') {
        questionMaxScore = 5;
      } else if (q.questionType === 'likert_4') {
        questionMaxScore = 4;
      } else if (q.questionType === 'yes_no') {
        questionMaxScore = 1;
      }
      maxPossibleScore += questionMaxScore;

      if (userAns) {
        if (userAns.selectedOptionId && q.options) {
          const opt = q.options.find(o => o.id === userAns.selectedOptionId);
          if (opt) {
            selectedOptionLabel = opt.optionLabel || opt.optionText;
            selectedOptionValue = opt.optionValue || opt.id;
            const rawScore = opt.scoreValue ?? opt.score ?? 0;

            if (q.isReverseScored) {
              if (opt.reverseScoreValue !== undefined && opt.reverseScoreValue !== null && opt.reverseScoreValue !== 0) {
                calculatedScore = opt.reverseScoreValue;
              } else if (q.questionType === 'likert_5') {
                calculatedScore = 6 - rawScore; // 1->5, 2->4, 3->3, 4->2, 5->1
              } else if (q.questionType === 'likert_4') {
                calculatedScore = 5 - rawScore; // 1->4, 2->3, 3->2, 4->1
              } else if (q.questionType === 'yes_no') {
                calculatedScore = rawScore === 1 ? 0 : 1;
              } else {
                calculatedScore = questionMaxScore > 0 ? (questionMaxScore + 1) - rawScore : rawScore;
              }
            } else {
              calculatedScore = rawScore;
            }
          }
        } else if (userAns.answerValue) {
          selectedOptionValue = userAns.answerValue;
          selectedOptionLabel = userAns.answerValue;
          const num = parseFloat(userAns.answerValue);
          if (!isNaN(num)) {
            calculatedScore = num;
          }
        }
      }

      totalScore += calculatedScore;

      // Accumulate subscale score
      if (q.subscaleId && subscaleTotals[q.subscaleId]) {
        subscaleTotals[q.subscaleId].score += calculatedScore;
        subscaleTotals[q.subscaleId].count += 1;
        subscaleTotals[q.subscaleId].maxScore += questionMaxScore;
      }

      const matchingSubscale = q.subscaleId ? subscales.find(s => s.id === q.subscaleId) : undefined;

      processedAnswers.push({
        questionId: q.id,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        selectedOptionId: userAns?.selectedOptionId,
        selectedOptionLabel: selectedOptionLabel || undefined,
        answerValue: selectedOptionValue || userAns?.answerValue,
        answerScore: calculatedScore,
        isReverseScored: q.isReverseScored,
        subscaleCode: matchingSubscale?.code
      });
    }

    // Process Subscale Breakdowns
    const calculatedSubscales: Array<{
      code: string;
      title: string;
      score: number;
      maxScore?: number;
      percentage?: number;
      interpretation?: string;
      questionCount?: number;
      averageScore?: number;
    }> = [];

    for (const sub of subscales) {
      const stats = subscaleTotals[sub.id] || { score: 0, count: 0, maxScore: 0 };
      const avg = stats.count > 0 ? Math.round((stats.score / stats.count) * 100) / 100 : 0;
      let finalSubscaleScore = stats.score;

      if (sub.calculationMethod === 'AVERAGE' && stats.count > 0) {
        finalSubscaleScore = avg;
      } else if (sub.calculationMethod === 'PERCENTAGE' && stats.maxScore > 0) {
        finalSubscaleScore = Math.round((stats.score / stats.maxScore) * 100);
      }

      // Match subscale specific interpretation
      const subInterp = interpretations.find(
        i => i.subscaleId === sub.id && finalSubscaleScore >= i.minScore && finalSubscaleScore <= i.maxScore
      );

      calculatedSubscales.push({
        code: sub.code,
        title: sub.title,
        score: finalSubscaleScore,
        maxScore: stats.maxScore,
        percentage: stats.maxScore > 0 ? Math.round((stats.score / stats.maxScore) * 100) : undefined,
        interpretation: subInterp?.label,
        questionCount: stats.count,
        averageScore: avg
      });
    }

    // Process Overall Interpretation
    const overallInterp = interpretations.find(
      i => (!i.subscaleId || i.subscaleId === '') && totalScore >= i.minScore && totalScore <= i.maxScore
    );

    const resultSnapshot: SurveyResultSnapshotDto = {
      totalScore,
      maxPossibleScore,
      subscales: calculatedSubscales.length > 0 ? calculatedSubscales : undefined,
      interpretation: overallInterp ? {
        label: overallInterp.label,
        description: overallInterp.description,
        colorCode: overallInterp.colorCode
      } : undefined,
      resultPresentation: (versionSnapshot as any)?.resultPresentation || undefined,
      rawMetrics: {
        answeredQuestionsCount: rawAnswers.length,
        totalQuestionsCount: questions.length
      },
      versionSnapshot: typeof versionSnapshot === 'number' ? versionSnapshot : 1,
      calculatedAt: Date.now()
    };

    return {
      totalScore,
      maxPossibleScore,
      resultSnapshot,
      answers: processedAnswers
    };
  }
}
