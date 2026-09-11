import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';
import { ACADEMIC_PROCRASTINATION_QUESTIONS, REVERSE_SCORED_ITEMS } from '../../../../shared/academicProcrastinationEvaluation';

export const ACADEMIC_PROCRASTINATION_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: '1', value: '1', score: 1, reverseScore: 5 },
  { label: '2', value: '2', score: 2, reverseScore: 4 },
  { label: '3', value: '3', score: 3, reverseScore: 3 },
  { label: '4', value: '4', score: 4, reverseScore: 2 },
  { label: '5', value: '5', score: 5, reverseScore: 1 }
];

export const ACADEMIC_PROCRASTINATION_SUBSCALES: RealSurveySubscaleDefinition[] = [];
export const ACADEMIC_PROCRASTINATION_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [];

export const ACADEMIC_PROCRASTINATION_QUESTIONS_DEF: RealSurveyQuestionDefinition[] = ACADEMIC_PROCRASTINATION_QUESTIONS.map((text, idx) => {
  const orderIndex = idx + 1;
  const isReverseScored = REVERSE_SCORED_ITEMS.has(orderIndex);
  return {
    orderIndex,
    text,
    type: 'single_choice',
    isReverseScored,
    required: true,
    options: ACADEMIC_PROCRASTINATION_OPTIONS
  };
});

export const AKADEMIK_ERTELEME_OLCEGI: RealSurveyDefinition = {
  id: 'srv-akademik-erteleme-olcegi',
  slug: 'akademik-erteleme-olcegi',
  code: 'AEO-19',
  title: 'Akademik Erteleme Ölçeği',
  description: 'Öğrencilerin akademik görev ve sorumlulukları erteleme eğilimlerini ve düzeylerini belirlemek amacıyla uygulanan 19 maddelik kendini değerlendirme ölçeği (Cronbach α = 0.870).',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-akademik-erteleme-olcegi-v1',
  versionId: 'ver-akademik-erteleme-olcegi-v1',
  scoringType: 'TOTAL',
  estimatedMinutes: 10,
  subscales: ACADEMIC_PROCRASTINATION_SUBSCALES,
  interpretations: ACADEMIC_PROCRASTINATION_INTERPRETATIONS,
  questions: ACADEMIC_PROCRASTINATION_QUESTIONS_DEF,
  resultPresentation: {
    rendererType: 'akademik-erteleme-olcegi',
    options: {
      showTotalScore: true,
      showSubscales: false,
      showAnswersTable: true
    }
  }
};

export const academicProcrastinationSurvey = AKADEMIK_ERTELEME_OLCEGI;
