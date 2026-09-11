import { RealSurveyDefinition, RealSurveyQuestionDefinition } from './devamsizlikNedenleriAnketi';
import { PTL_QUESTIONS_TEXTS, PTL_OPTIONS, PTL_SCALE_METADATA } from '../../../../shared/problemTaramaListesiEvaluation';

const questions: RealSurveyQuestionDefinition[] = PTL_QUESTIONS_TEXTS.map((text, idx) => ({
  orderIndex: idx + 1,
  text,
  type: 'single_choice',
  required: false,
  options: PTL_OPTIONS
}));

export const PROBLEM_TARAMA_LISTESI: RealSurveyDefinition = {
  id: PTL_SCALE_METADATA.id,
  slug: PTL_SCALE_METADATA.slug,
  code: PTL_SCALE_METADATA.code,
  title: PTL_SCALE_METADATA.name,
  description: "Öğrencilerin sağlık, okul, ders, aile, arkadaşlık, karşı cins, mesleki gelecek ve kişilik alanlarındaki problemlerini belirleme listesi.",
  type: 'SURVEY',
  repeatPolicy: 'UNLIMITED',
  version: '1.0.0',
  versionId: PTL_SCALE_METADATA.version,
  scoringType: 'CUSTOM',
  estimatedMinutes: 25,
  subscales: [],
  interpretations: [],
  questions,
  resultPresentation: {
    rendererType: 'problem-tarama-listesi',
    options: {
      showAnswersTable: true
    }
  }
};
