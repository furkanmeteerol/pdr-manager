import { RealSurveyDefinition, RealSurveyQuestionDefinition } from './devamsizlikNedenleriAnketi';
import { BNA_QUESTIONS, BNA_OPTIONS, BNA_SCALE_METADATA } from '../../../../shared/basarisizlikNedenleriEvaluation';

const questions: RealSurveyQuestionDefinition[] = BNA_QUESTIONS.map((text, idx) => ({
  orderIndex: idx + 1,
  text,
  type: 'single_choice',
  required: false,
  options: BNA_OPTIONS
}));

export const BASARISIZLIK_NEDENLERI_ANKETI: RealSurveyDefinition = {
  id: BNA_SCALE_METADATA.id,
  slug: BNA_SCALE_METADATA.slug,
  code: BNA_SCALE_METADATA.code,
  title: BNA_SCALE_METADATA.name,
  description: "Öğrencilerin başarısız olmasına yol açan nedenleri belirleme ve rehberlik çalışmalarına temel oluşturma anketi.",
  type: 'SURVEY',
  repeatPolicy: 'UNLIMITED',
  version: '1.0.0',
  versionId: BNA_SCALE_METADATA.version,
  scoringType: 'CUSTOM',
  estimatedMinutes: 15,
  subscales: [],
  interpretations: [],
  questions,
  resultPresentation: {
    rendererType: 'basarisizlik-nedenleri-anketi',
    options: {
      showAnswersTable: true
    }
  }
};
