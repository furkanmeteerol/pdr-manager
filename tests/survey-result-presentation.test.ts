import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../electron/services/survey/ScoringEngine';
import { 
  SurveyQuestionDto, 
  SurveySubscaleDto, 
  SurveyInterpretationDto, 
  SurveyResultPresentationConfig
} from '../shared/ipc-types';
import { getSurveyResultRenderer } from '../src/features/surveys/components/renderers/SurveyResultRendererRegistry';
import { DevamsizlikNedenleriResultRenderer } from '../src/features/surveys/components/renderers/DevamsizlikNedenleriResultRenderer';
import { GenericSurveyResultRenderer } from '../src/features/surveys/components/renderers/GenericSurveyResultRenderer';

describe('Survey Result Presentation Engine & Architecture Tests', () => {
  const sampleQuestions: SurveyQuestionDto[] = [
    {
      id: 'q-1',
      surveyId: 'srv-1',
      questionOrder: 1,
      questionText: 'Okul idaresi izin vermediği için',
      questionType: 'single_choice',
      subscaleId: 'sub-1',
      isReverseScored: false,
      required: true,
      options: [
        { id: 'opt-1', questionId: 'q-1', optionOrder: 1, optionText: 'Evet', score: 2, scoreValue: 2 },
        { id: 'opt-2', questionId: 'q-1', optionOrder: 2, optionText: 'Bazen', score: 1, scoreValue: 1 },
        { id: 'opt-3', questionId: 'q-1', optionOrder: 3, optionText: 'Hayır', score: 0, scoreValue: 0 }
      ]
    },
    {
      id: 'q-2',
      surveyId: 'srv-1',
      questionOrder: 2,
      questionText: 'Zor dersler aynı günde olduğunda',
      questionType: 'single_choice',
      subscaleId: 'sub-1',
      isReverseScored: false,
      required: true,
      options: [
        { id: 'opt-4', questionId: 'q-2', optionOrder: 1, optionText: 'Evet', score: 2, scoreValue: 2 },
        { id: 'opt-5', questionId: 'q-2', optionOrder: 2, optionText: 'Bazen', score: 1, scoreValue: 1 },
        { id: 'opt-6', questionId: 'q-2', optionOrder: 3, optionText: 'Hayır', score: 0, scoreValue: 0 }
      ]
    },
    {
      id: 'q-52',
      surveyId: 'srv-1',
      questionOrder: 52,
      questionText: 'Belirtmek istediğiniz diğer nedenler varsa yazınız.',
      questionType: 'text',
      isReverseScored: false,
      required: false,
      options: []
    }
  ];

  const sampleSubscales: SurveySubscaleDto[] = [
    {
      id: 'sub-1',
      surveyVersionId: 'ver-1',
      orderIndex: 1,
      code: 'OKUL_YONETIM',
      title: 'Okul ve Yönetim Boyutu',
      calculationMethod: 'AVERAGE'
    }
  ];

  const sampleInterpretations: SurveyInterpretationDto[] = [];

  it('1. ScoringEngine should embed resultPresentation into the frozen resultSnapshot', () => {
    const customPresentation: SurveyResultPresentationConfig = {
      rendererType: 'meb_devamsizlik',
      options: {
        showTotalScore: false,
        scoreDisplayFormat: 'average',
        scoreRangeMin: 0.0,
        scoreRangeMax: 2.0
      }
    };

    const calculated = ScoringEngine.calculate(
      sampleQuestions,
      sampleSubscales,
      sampleInterpretations,
      [
        { questionId: 'q-1', selectedOptionId: 'opt-1' }, // Evet (2)
        { questionId: 'q-2', selectedOptionId: 'opt-5' }, // Bazen (1)
        { questionId: 'q-52', answerValue: 'Servis geciktiğinde okula gidemiyorum.' }
      ],
      { resultPresentation: customPresentation, versionNumber: 1 } as any
    );

    expect(calculated.resultSnapshot.resultPresentation).toBeDefined();
    expect(calculated.resultSnapshot.resultPresentation?.rendererType).toBe('meb_devamsizlik');
    expect(calculated.resultSnapshot.resultPresentation?.options?.showTotalScore).toBe(false);
  });

  it('2. Subscales with calculationMethod AVERAGE should accurately compute arithmetic mean', () => {
    const calculated = ScoringEngine.calculate(
      sampleQuestions,
      sampleSubscales,
      sampleInterpretations,
      [
        { questionId: 'q-1', selectedOptionId: 'opt-1' }, // 2
        { questionId: 'q-2', selectedOptionId: 'opt-5' }  // 1 => Total 3 / 2 items = 1.50
      ],
      1
    );

    const sub = calculated.resultSnapshot.subscales?.find(s => s.code === 'OKUL_YONETIM');
    expect(sub).toBeDefined();
    expect(sub?.score).toBe(1.5);
    expect(sub?.averageScore).toBe(1.5);
    expect(sub?.questionCount).toBe(2);
  });

  it('3. Renderer Registry should resolve dedicated component for meb_devamsizlik', () => {
    const Renderer = getSurveyResultRenderer('meb_devamsizlik');
    expect(Renderer).toBe(DevamsizlikNedenleriResultRenderer);
  });

  it('4. Renderer Registry should fallback to GenericSurveyResultRenderer when rendererType is undefined or unknown', () => {
    const UnknownRenderer = getSurveyResultRenderer('non_existent_custom_renderer');
    expect(UnknownRenderer).toBe(GenericSurveyResultRenderer);

    const FallbackRenderer = getSurveyResultRenderer(undefined);
    expect(FallbackRenderer).toBe(GenericSurveyResultRenderer);
  });

  it('5. Two surveys with the exact same scoringType (SUBSCALES) can use completely distinct renderers', () => {
    // Survey A: MEB Devamsızlık Nedenleri Anketi (scoringType: SUBSCALES, rendererType: meb_devamsizlik)
    const surveyARenderer = getSurveyResultRenderer('meb_devamsizlik');

    // Survey B: Generic Holland Career Inventory (scoringType: SUBSCALES, rendererType: generic)
    const surveyBRenderer = getSurveyResultRenderer('generic');

    expect(surveyARenderer).toBe(DevamsizlikNedenleriResultRenderer);
    expect(surveyBRenderer).toBe(GenericSurveyResultRenderer);
    expect(surveyARenderer).not.toBe(surveyBRenderer);
  });
});
