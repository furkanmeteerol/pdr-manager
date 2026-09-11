import React from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { GenericSurveyResultRenderer } from './GenericSurveyResultRenderer';
import { DevamsizlikNedenleriResultRenderer } from './DevamsizlikNedenleriResultRenderer';
import { ExamAnxietyResultRenderer } from './ExamAnxietyResultRenderer';
import { WestsideExamAnxietyResultRenderer } from './WestsideExamAnxietyResultRenderer';
import { HollandMeslekiTercihResultRenderer } from './HollandMeslekiTercihResultRenderer';
import { HollandKisaMeslekiTaramaResultRenderer } from './HollandKisaMeslekiTaramaResultRenderer';
import { MeslekDegeriResultRenderer } from './MeslekDegeriResultRenderer';
import { AcademicProcrastinationResultRenderer } from './AcademicProcrastinationResultRenderer';
import { BurdonDikkatTestResultRenderer } from './BurdonDikkatTestResultRenderer';
import { AutomaticThoughtsResultRenderer } from './AutomaticThoughtsResultRenderer';
import { BasarisizlikNedenleriResultRenderer } from './BasarisizlikNedenleriResultRenderer';
import { CalismaDavranisiResultRenderer } from './CalismaDavranisiResultRenderer';
import { ProblemTaramaListesiResultRenderer } from './ProblemTaramaListesiResultRenderer';
import { RosenbergBenlikSaygisiResultRenderer } from './RosenbergBenlikSaygisiResultRenderer';
import { KimeGoreBenNeyimResultRenderer } from './KimeGoreBenNeyimResultRenderer';
import { AkademikBenlikAlgisiResultRenderer } from './AkademikBenlikAlgisiResultRenderer';

export interface SurveyResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

/**
 * Registry mapping rendererType strings to dedicated Presentation Components.
 */
const RENDERER_REGISTRY: Record<string, React.FC<SurveyResultRendererProps>> = {
  'meb_devamsizlik': DevamsizlikNedenleriResultRenderer,
  'devamsizlik-nedenleri-anketi': DevamsizlikNedenleriResultRenderer,
  'srv-devamsizlik-nedenleri': DevamsizlikNedenleriResultRenderer,
  'sinav-kaygisi-olcegi': ExamAnxietyResultRenderer,
  'srv-sinav-kaygisi-olcegi': ExamAnxietyResultRenderer,
  'exam_anxiety': ExamAnxietyResultRenderer,
  'sinav_kaygisi': ExamAnxietyResultRenderer,
  'westside-sinav-kaygisi-olcegi': WestsideExamAnxietyResultRenderer,
  'srv-westside-sinav-kaygisi-olcegi': WestsideExamAnxietyResultRenderer,
  'westside_exam_anxiety': WestsideExamAnxietyResultRenderer,
  'holland-mesleki-tercih-envanteri': HollandMeslekiTercihResultRenderer,
  'srv-holland-mesleki-tercih-envanteri': HollandMeslekiTercihResultRenderer,
  'holland-kisa-bicim-mesleki-tarama-envanteri': HollandKisaMeslekiTaramaResultRenderer,
  'srv-holland-kisa-bicim-mesleki-tarama-envanteri': HollandKisaMeslekiTaramaResultRenderer,
  'holland_kisa_mesleki_tarama': HollandKisaMeslekiTaramaResultRenderer,
  'meslek-degeri-envanteri': MeslekDegeriResultRenderer,
  'srv-meslek-degeri-envanteri': MeslekDegeriResultRenderer,
  'meslek_degeri': MeslekDegeriResultRenderer,
  'akademik-erteleme-olcegi': AcademicProcrastinationResultRenderer,
  'srv-akademik-erteleme-olcegi': AcademicProcrastinationResultRenderer,
  'academic_procrastination': AcademicProcrastinationResultRenderer,
  'akademik_erteleme': AcademicProcrastinationResultRenderer,
  'burdon-dikkat-testi': BurdonDikkatTestResultRenderer,
  'srv-burdon-dikkat-testi': BurdonDikkatTestResultRenderer,
  'burdon_dikkat': BurdonDikkatTestResultRenderer,
  'burdon': BurdonDikkatTestResultRenderer,
  'otomatik-dusunceler-olcegi': AutomaticThoughtsResultRenderer,
  'srv-otomatik-dusunceler-olcegi': AutomaticThoughtsResultRenderer,
  'automatic_thoughts': AutomaticThoughtsResultRenderer,
  'otomatik_dusunceler': AutomaticThoughtsResultRenderer,
  'atq-30': AutomaticThoughtsResultRenderer,
  'basarisizlik-nedenleri-anketi': BasarisizlikNedenleriResultRenderer,
  'srv-basarisizlik-nedenleri-anketi': BasarisizlikNedenleriResultRenderer,
  'basarisizlik_nedenleri': BasarisizlikNedenleriResultRenderer,
  'bna-44': BasarisizlikNedenleriResultRenderer,
  'calisma-davranisini-degerlendirme-olcegi': CalismaDavranisiResultRenderer,
  'srv-calisma-davranisini-degerlendirme-olcegi': CalismaDavranisiResultRenderer,
  'calisma_davranisi': CalismaDavranisiResultRenderer,
  'cdde-73': CalismaDavranisiResultRenderer,
  'problem-tarama-listesi': ProblemTaramaListesiResultRenderer,
  'srv-problem-tarama-listesi': ProblemTaramaListesiResultRenderer,
  'problem_tarama': ProblemTaramaListesiResultRenderer,
  'problem_tarama_listesi': ProblemTaramaListesiResultRenderer,
  'ptl-176': ProblemTaramaListesiResultRenderer,
  'rosenberg-benlik-saygisi': RosenbergBenlikSaygisiResultRenderer,
  'srv-rosenberg-benlik-saygisi': RosenbergBenlikSaygisiResultRenderer,
  'rosenberg_benlik_saygisi': RosenbergBenlikSaygisiResultRenderer,
  'rosenberg-63': RosenbergBenlikSaygisiResultRenderer,
  'kime-gore-ben-neyim': KimeGoreBenNeyimResultRenderer,
  'srv-kime-gore-ben-neyim': KimeGoreBenNeyimResultRenderer,
  'kime_gore_ben_neyim': KimeGoreBenNeyimResultRenderer,
  'kgbn-40': KimeGoreBenNeyimResultRenderer,
  'akademik-benlik-algisi': AkademikBenlikAlgisiResultRenderer,
  'srv-akademik-benlik-algisi': AkademikBenlikAlgisiResultRenderer,
  'akademik_benlik_algisi': AkademikBenlikAlgisiResultRenderer,
  'abao-ii-56': AkademikBenlikAlgisiResultRenderer,
  'abaö-ii-56': AkademikBenlikAlgisiResultRenderer,
  'abao-56': AkademikBenlikAlgisiResultRenderer,
  'generic': GenericSurveyResultRenderer
};

/**
 * Resolves the appropriate Result Renderer component based on the immutable
 * resultPresentation configuration stored in the application / snapshot.
 *
 * Scoring type alone DOES NOT dictate the UI presentation; the renderer
 * is strictly resolved from `resultPresentation.rendererType` with a safe generic fallback.
 */
export function getSurveyResultRenderer(
  rendererType?: string
): React.FC<SurveyResultRendererProps> {
  if (rendererType && RENDERER_REGISTRY[rendererType]) {
    return RENDERER_REGISTRY[rendererType];
  }
  return GenericSurveyResultRenderer;
}

/**
 * Allows registering additional custom survey renderers at runtime or module init.
 */
export function registerSurveyResultRenderer(
  rendererType: string,
  component: React.FC<SurveyResultRendererProps>
): void {
  RENDERER_REGISTRY[rendererType] = component;
}
