import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';
import { BURDON_RAW_ROWS } from '../../../../shared/burdonDikkatEvaluation';

export const BURDON_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: 'İşaretlendi', value: 'marked', score: 1 }
];

export const BURDON_SUBSCALES: RealSurveySubscaleDefinition[] = [];
export const BURDON_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [];

export const BURDON_QUESTIONS_DEF: RealSurveyQuestionDefinition[] = BURDON_RAW_ROWS.map((rowText, idx) => ({
  orderIndex: idx + 1,
  text: `Satır ${idx + 1}: ${rowText}`,
  type: 'single_choice',
  required: false,
  options: BURDON_OPTIONS
}));

export const BURDON_DIKKAT_TESTI: RealSurveyDefinition = {
  id: 'srv-burdon-dikkat-testi',
  slug: 'burdon-dikkat-testi',
  code: 'BURDON',
  title: 'Burdon Dikkat Testi',
  description: '10-20 yaş arası bireylerin dikkat gücünü, yoğunlaşmasını ve dikkat sürdürülebilirliğini değerlendirmeye yönelik 30 satırlık harf işaretleme performans testi (Süre: 5 Dakika).',
  type: 'SCALE', // Using SCALE/TEST in database catalog
  repeatPolicy: 'UNLIMITED',
  version: 'ver-burdon-dikkat-testi-v1',
  versionId: 'ver-burdon-dikkat-testi-v1',
  scoringType: 'TOTAL',
  estimatedMinutes: 5,
  subscales: BURDON_SUBSCALES,
  interpretations: BURDON_INTERPRETATIONS,
  questions: BURDON_QUESTIONS_DEF,
  resultPresentation: {
    rendererType: 'burdon-dikkat-testi',
    options: {
      showTotalScore: false,
      showSubscales: false,
      showAnswersTable: false
    }
  }
};

export const burdonDikkatTestDefinition = BURDON_DIKKAT_TESTI;
