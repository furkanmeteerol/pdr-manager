import { 
  RealSurveyDefinition, 
  RealSurveyQuestionDefinition, 
  RealSurveySubscaleDefinition 
} from './devamsizlikNedenleriAnketi';
import { 
  ROSENBERG_SCALE_METADATA, 
  ROSENBERG_QUESTIONS, 
  ROSENBERG_SUBSCALES 
} from '../../../../shared/rosenbergBenlikSaygisiEvaluation';

const subscalesDef: RealSurveySubscaleDefinition[] = ROSENBERG_SUBSCALES.map((sub, idx) => ({
  code: sub.code,
  title: sub.name,
  description: `${sub.displayCode} - ${sub.name} (${sub.questionNumbers.length} soru, Maks: ${sub.maxScore})`,
  calculationMethod: 'SUM',
  orderIndex: idx + 1
}));

const questionsDef: RealSurveyQuestionDefinition[] = ROSENBERG_QUESTIONS.map(q => ({
  orderIndex: q.questionNumber,
  text: q.text,
  type: 'single_choice',
  subscaleCode: q.subscaleCode,
  required: true,
  options: q.options.map(opt => ({
    label: opt.label,
    value: opt.value,
    score: opt.score
  }))
}));

export const ROSENBERG_BENLIK_SAYGISI: RealSurveyDefinition = {
  id: ROSENBERG_SCALE_METADATA.id,
  slug: ROSENBERG_SCALE_METADATA.slug,
  code: ROSENBERG_SCALE_METADATA.code,
  title: ROSENBERG_SCALE_METADATA.title,
  description: 'Öğrencilerin benlik saygısı ve benlik kavramı ile ilişkili 12 alt alandaki duygu, tutum ve algılarını belirlemeye yönelik 63 maddelik standart psikolojik envanter.',
  type: 'SCALE',
  repeatPolicy: 'UNLIMITED',
  version: '1.0.0',
  versionId: ROSENBERG_SCALE_METADATA.version,
  scoringType: 'SUBSCALES',
  estimatedMinutes: 20,
  subscales: subscalesDef,
  interpretations: [],
  questions: questionsDef,
  resultPresentation: {
    rendererType: 'rosenberg-benlik-saygisi',
    options: {
      showTotalScore: false,
      showSubscales: true,
      showAnswersTable: true
    }
  }
};

export const rosenbergBenlikSaygisiSurvey = ROSENBERG_BENLIK_SAYGISI;
