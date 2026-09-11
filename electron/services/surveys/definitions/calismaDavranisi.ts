import { 
  RealSurveyDefinition, 
  RealSurveyOptionDefinition, 
  RealSurveySubscaleDefinition, 
  RealSurveyInterpretationDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';
import { 
  CDDE_QUESTIONS, 
  CDDE_OPTIONS, 
  CDDE_CATEGORIES,
  CDDECategoryCode
} from '../../../../shared/calismaDavranisiEvaluation';

export const CDDE_OPTIONS_DEF: RealSurveyOptionDefinition[] = CDDE_OPTIONS.map(opt => ({
  label: opt.label,
  value: opt.value,
  score: opt.score
}));

// 7 Categories as Subscales
export const CDDE_SUBSCALES_DEF: RealSurveySubscaleDefinition[] = (Object.keys(CDDE_CATEGORIES) as CDDECategoryCode[]).map((code, idx) => {
  const cat = CDDE_CATEGORIES[code];
  return {
    code: cat.code,
    title: cat.name,
    description: `Kategori ${cat.code}: ${cat.name} (${cat.questions.length} soru, Maks. Puan: ${cat.maxScore})`,
    calculationMethod: 'SUM',
    orderIndex: idx + 1
  };
});

export const CDDE_INTERPRETATIONS_DEF: RealSurveyInterpretationDefinition[] = [];

// Build question to subscale code map
const questionToSubscaleMap = new Map<number, string>();
for (const cat of Object.values(CDDE_CATEGORIES)) {
  for (const qNum of cat.questions) {
    questionToSubscaleMap.set(qNum, cat.code);
  }
}

export const CDDE_QUESTIONS_DEF: RealSurveyQuestionDefinition[] = CDDE_QUESTIONS.map((text, idx) => {
  const orderIndex = idx + 1;
  const subscaleCode = questionToSubscaleMap.get(orderIndex);

  return {
    orderIndex,
    text,
    type: 'single_choice',
    subscaleCode: subscaleCode,
    isReverseScored: false,
    required: true,
    options: CDDE_OPTIONS_DEF
  };
});

export const CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI: RealSurveyDefinition = {
  id: 'srv-calisma-davranisini-degerlendirme-olcegi',
  slug: 'calisma-davranisini-degerlendirme-olcegi',
  code: 'CDDE-73',
  title: 'Çalışma Davranışını Değerlendirme Ölçeği',
  description: 'Öğrencilerin ders çalışma alışkanlıklarını, okuma tekniklerini, not tutma becerilerini, ödev yapma ve sınav hazırlıklarını 7 bağımsız kategoride değerlendiren 73 maddelik ölçek.',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: 'ver-calisma-davranisini-degerlendirme-olcegi-v1',
  versionId: 'ver-calisma-davranisini-degerlendirme-olcegi-v1',
  scoringType: 'SUBSCALES',
  estimatedMinutes: 20,
  subscales: CDDE_SUBSCALES_DEF,
  interpretations: CDDE_INTERPRETATIONS_DEF,
  questions: CDDE_QUESTIONS_DEF,
  resultPresentation: {
    rendererType: 'calisma-davranisini-degerlendirme-olcegi',
    options: {
      showTotalScore: false,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};

export const calismaDavranisiSurvey = CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI;
