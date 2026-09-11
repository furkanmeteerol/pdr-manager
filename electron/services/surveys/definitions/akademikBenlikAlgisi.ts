import { 
  RealSurveyDefinition, 
  RealSurveyQuestionDefinition, 
  RealSurveySubscaleDefinition 
} from './devamsizlikNedenleriAnketi';
import { 
  ABAÖ_SCALE_METADATA, 
  ABAÖ_QUESTIONS, 
  ABAÖ_FACTORS,
  ABAÖ_LIKERT_OPTIONS,
  AkademikBenlikFactorCode
} from '../../../../shared/akademikBenlikAlgisiEvaluation';

const factorCodes: AkademikBenlikFactorCode[] = [
  'turk_dili_edebiyati',
  'tarih',
  'matematik',
  'fizik',
  'kimya',
  'biyoloji',
  'cografya',
  'yabanci_dil'
];

const subscalesDef: RealSurveySubscaleDefinition[] = factorCodes.map((code) => {
  const f = ABAÖ_FACTORS[code];
  return {
    code: f.code,
    title: f.name,
    description: `${f.name} (${f.questionNumbers.length} soru, 1.00 - 8.00 puan)`,
    calculationMethod: 'AVERAGE',
    orderIndex: f.order
  };
});

const questionsDef: RealSurveyQuestionDefinition[] = ABAÖ_QUESTIONS.map(q => ({
  orderIndex: q.questionNumber,
  text: q.text,
  type: 'single_choice',
  subscaleCode: q.factorCode,
  required: true,
  options: ABAÖ_LIKERT_OPTIONS.map(opt => ({
    label: opt.label,
    value: String(opt.value),
    score: opt.value
  }))
}));

export const AKADEMIK_BENLIK_ALGISI_OLCEGI: RealSurveyDefinition = {
  id: ABAÖ_SCALE_METADATA.id,
  slug: ABAÖ_SCALE_METADATA.slug,
  code: ABAÖ_SCALE_METADATA.code,
  title: ABAÖ_SCALE_METADATA.title,
  description: ABAÖ_SCALE_METADATA.purpose,
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: '1.0.0',
  versionId: ABAÖ_SCALE_METADATA.version,
  scoringType: 'SUBSCALES',
  estimatedMinutes: 20,
  subscales: subscalesDef,
  interpretations: [],
  questions: questionsDef,
  resultPresentation: {
    rendererType: 'akademik-benlik-algisi',
    options: {
      showTotalScore: true,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};

export const akademikBenlikAlgisiSurvey = AKADEMIK_BENLIK_ALGISI_OLCEGI;
