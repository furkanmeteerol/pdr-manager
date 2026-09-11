import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';
import { 
  AUTOMATIC_THOUGHTS_QUESTIONS, 
  AUTOMATIC_THOUGHTS_OPTIONS 
} from '../../../../shared/automaticThoughtsEvaluation';

export const AUTOMATIC_THOUGHTS_OPTIONS_DEF: RealSurveyOptionDefinition[] = AUTOMATIC_THOUGHTS_OPTIONS.map(opt => ({
  label: opt.label,
  value: opt.value,
  score: opt.score
}));

export const AUTOMATIC_THOUGHTS_SUBSCALES: RealSurveySubscaleDefinition[] = [];
export const AUTOMATIC_THOUGHTS_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [];

export const AUTOMATIC_THOUGHTS_QUESTIONS_DEF: RealSurveyQuestionDefinition[] = AUTOMATIC_THOUGHTS_QUESTIONS.map((text, idx) => {
  const orderIndex = idx + 1;
  return {
    orderIndex,
    text,
    type: 'single_choice',
    isReverseScored: false,
    required: true,
    options: AUTOMATIC_THOUGHTS_OPTIONS_DEF
  };
});

export const OTOMATIK_DUSUNCELER_OLCEGI: RealSurveyDefinition = {
  id: 'srv-otomatik-dusunceler-olcegi',
  slug: 'otomatik-dusunceler-olcegi',
  code: 'ATQ-30',
  title: 'Otomatik Düşünceler Ölçeği',
  description: 'Bireylerin kendileri, gelecekleri ve yaşadıkları durumlarla ilgili olumsuz otomatik düşüncelerinin sıklığını belirlemek amacıyla uygulanan 30 maddelik kendini değerlendirme ölçeği (Cronbach α = 0.930).',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-otomatik-dusunceler-olcegi-v1',
  versionId: 'ver-otomatik-dusunceler-olcegi-v1',
  scoringType: 'TOTAL',
  estimatedMinutes: 10,
  subscales: AUTOMATIC_THOUGHTS_SUBSCALES,
  interpretations: AUTOMATIC_THOUGHTS_INTERPRETATIONS,
  questions: AUTOMATIC_THOUGHTS_QUESTIONS_DEF,
  resultPresentation: {
    rendererType: 'otomatik-dusunceler-olcegi',
    options: {
      showTotalScore: true,
      showSubscales: false,
      showAnswersTable: true
    }
  }
};

export const automaticThoughtsSurvey = OTOMATIK_DUSUNCELER_OLCEGI;
