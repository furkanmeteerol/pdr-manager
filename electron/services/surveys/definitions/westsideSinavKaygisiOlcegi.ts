import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';

/**
 * 5-Point Likert Options for The Westside Test Anxiety Scale
 * According to official TOAD adaptation:
 * All questions are reverse scored where higher score indicates higher anxiety:
 * 1. Daima doğru = 5 Puan
 * 2. Genellikle doğru = 4 Puan
 * 3. Ara sıra doğru = 3 Puan
 * 4. Nadiren doğru = 2 Puan
 * 5. Asla doğru değil = 1 Puan
 */
export const WESTSIDE_OPTIONS: RealSurveyOptionDefinition[] = [
  { label: 'Daima doğru', value: 'daima_dogru', score: 5, reverseScore: 5 },
  { label: 'Genellikle doğru', value: 'genellikle_dogru', score: 4, reverseScore: 4 },
  { label: 'Ara sıra doğru', value: 'ara_sira_dogru', score: 3, reverseScore: 3 },
  { label: 'Nadiren doğru', value: 'nadiren_dogru', score: 2, reverseScore: 2 },
  { label: 'Asla doğru değil', value: 'asla_dogru_degil', score: 1, reverseScore: 1 }
];

/**
 * The Westside scale is unidimensional (single total score).
 * No subscales are used.
 */
export const WESTSIDE_SUBSCALES: RealSurveySubscaleDefinition[] = [];

/**
 * According to the source paper, NO FIXED CUTOFF exists.
 * +1 SD / -1 SD group comparison is recommended in large samples.
 * Hence, no artificial fixed score bands or "moderate" categories are defined.
 */
export const WESTSIDE_INTERPRETATIONS: RealSurveyInterpretationDefinition[] = [];

/**
 * Exact 11 items of The Westside Test Anxiety Scale (in exact original order 1..11)
 */
export const WESTSIDE_QUESTIONS: RealSurveyQuestionDefinition[] = [
  {
    orderIndex: 1,
    text: 'Önemli bir sınav yaklaştıkça ders çalışmaya yoğunlaşmam da zorlaşır',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 2,
    text: 'Ders çalışırken çalıştığım konuları sınavda hatırlayamayacağım diye endişelenirim',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 3,
    text: 'Önemli sınavlar sırasında yanlış yapıyorum diye düşünürüm',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 4,
    text: 'Önemli sınavlar sırasında dersten kalacağım diye düşünürüm',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 5,
    text: 'Önemli sınavlarda dikkatimi kaybederek bildiğim şeyleri hatırlamayabilirim',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 6,
    text: 'Sınav sorularının yanıtlarını sınav bittikten sonra hatırlarım',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 7,
    text: 'Önemli bir sınav öncesinde öylesine endişelenirim ki sonunda en iyi sınavımda bile çok yorgun olurum',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 8,
    text: 'Önemli bir sınavdayken kendimi keyifsiz hissederim',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 9,
    text: 'Önemli bir sınavdayken gerçekten kendim değilmişim gibi hissederim',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 10,
    text: 'Önemli sınavlar sırasında bazen zihnimi başka yerlere dağılmış olarak bulurum',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  },
  {
    orderIndex: 11,
    text: 'Bir sınavdan sonra soruları yeterince iyi yanıtlayıp yanıtlayamadığım konusunda endişelenirim',
    type: 'single_choice',
    required: true,
    options: WESTSIDE_OPTIONS
  }
];

export const WESTSIDE_SINAV_KAYGISI_OLCEGI: RealSurveyDefinition = {
  id: 'srv-westside-sinav-kaygisi-olcegi',
  slug: 'westside-sinav-kaygisi-olcegi',
  code: 'WST-11',
  title: 'The Westside Sınav Kaygısı Ölçeği',
  description: 'Öğrencilerin sınav kaygısı düzeylerini değerlendirmek amacıyla uygulanan 11 maddelik tek boyutlu ölçek (Ortaokul ve Lise).',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-westside-sinav-kaygisi-olcegi-v1',
  versionId: 'ver-westside-sinav-kaygisi-olcegi-v1',
  scoringType: 'TOTAL',
  estimatedMinutes: 10,
  subscales: WESTSIDE_SUBSCALES,
  interpretations: WESTSIDE_INTERPRETATIONS,
  questions: WESTSIDE_QUESTIONS,
  resultPresentation: {
    rendererType: 'westside-sinav-kaygisi-olcegi',
    options: {
      showTotalScore: true,
      showSubscales: false,
      showAnswersTable: true
    }
  }
};
