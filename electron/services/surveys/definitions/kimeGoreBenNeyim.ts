import { 
  RealSurveyDefinition, 
  RealSurveyQuestionDefinition 
} from './devamsizlikNedenleriAnketi';
import { 
  KGBN_SCALE_METADATA, 
  KGBN_DESCRIPTORS, 
  KGBN_PERSPECTIVES 
} from '../../../../shared/kimeGoreBenNeyimEvaluation';

const questionsDef: RealSurveyQuestionDefinition[] = KGBN_DESCRIPTORS.map(d => ({
  orderIndex: d.itemNumber,
  text: d.text,
  type: 'single_choice',
  required: false,
  options: KGBN_PERSPECTIVES.map(p => ({
    label: p.label,
    value: p.key,
    score: 0
  }))
}));

export const KIME_GORE_BEN_NEYIM: RealSurveyDefinition = {
  id: KGBN_SCALE_METADATA.id,
  slug: KGBN_SCALE_METADATA.slug,
  code: KGBN_SCALE_METADATA.code,
  title: KGBN_SCALE_METADATA.title,
  description: 'Öğrencinin kendisini nasıl algıladığı ve öğretmenleri, ailesi, kardeşleri, arkadaşları tarafından nasıl algılandığını karşılaştırmalı olarak belirleyen 40 maddelik rehberlik envanteri.',
  type: 'INVENTORY',
  repeatPolicy: 'UNLIMITED',
  version: '1.0.0',
  versionId: KGBN_SCALE_METADATA.version,
  scoringType: 'CUSTOM',
  estimatedMinutes: 15,
  subscales: [],
  interpretations: [],
  questions: questionsDef,
  resultPresentation: {
    rendererType: 'kime-gore-ben-neyim',
    options: {
      showTotalScore: false,
      showSubscales: false,
      showAnswersTable: true
    }
  }
};

export const kimeGoreBenNeyimSurvey = KIME_GORE_BEN_NEYIM;
