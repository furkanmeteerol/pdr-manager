import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { DevamsizlikNedenleriReport } from './DevamsizlikNedenleriReport';
import { ExamAnxietyReport } from './ExamAnxietyReport';
import { WestsideExamAnxietyReport } from './WestsideExamAnxietyReport';
import { HollandMeslekiTercihReport } from './HollandMeslekiTercihReport';
import { HollandKisaMeslekiTaramaReport } from './HollandKisaMeslekiTaramaReport';

import { MeslekDegeriReport } from './MeslekDegeriReport';
import { AcademicProcrastinationReport } from './AcademicProcrastinationReport';
import { BurdonDikkatTestResultRenderer } from '../renderers/BurdonDikkatTestResultRenderer';
import { AutomaticThoughtsReport } from './AutomaticThoughtsReport';
import { BasarisizlikNedenleriReport } from './BasarisizlikNedenleriReport';
import { CalismaDavranisiReport } from './CalismaDavranisiReport';
import { ProblemTaramaListesiReport } from './ProblemTaramaListesiReport';
import { RosenbergBenlikSaygisiReport } from './RosenbergBenlikSaygisiReport';
import { KimeGoreBenNeyimReport } from './KimeGoreBenNeyimReport';
import { AkademikBenlikAlgisiReport } from './AkademikBenlikAlgisiReport';

export interface SurveyReportComponentProps {
  application: SurveyApplicationDto;
}

const reportComponents: Record<string, React.FC<SurveyReportComponentProps>> = {
  'srv-devamsizlik-nedenleri': DevamsizlikNedenleriReport,
  'devamsizlik-nedenleri-anketi': DevamsizlikNedenleriReport,
  'srv-sinav-kaygisi-olcegi': ExamAnxietyReport,
  'sinav-kaygisi-olcegi': ExamAnxietyReport,
  'srv-westside-sinav-kaygisi-olcegi': WestsideExamAnxietyReport,
  'westside-sinav-kaygisi-olcegi': WestsideExamAnxietyReport,
  'srv-holland-mesleki-tercih-envanteri': HollandMeslekiTercihReport,
  'holland-mesleki-tercih-envanteri': HollandMeslekiTercihReport,
  'srv-holland-kisa-bicim-mesleki-tarama-envanteri': HollandKisaMeslekiTaramaReport,
  'holland-kisa-bicim-mesleki-tarama-envanteri': HollandKisaMeslekiTaramaReport,
  'srv-meslek-degeri-envanteri': MeslekDegeriReport as any,
  'meslek-degeri-envanteri': MeslekDegeriReport as any,
  'srv-akademik-erteleme-olcegi': AcademicProcrastinationReport as any,
  'akademik-erteleme-olcegi': AcademicProcrastinationReport as any,
  'srv-burdon-dikkat-testi': BurdonDikkatTestResultRenderer,
  'burdon-dikkat-testi': BurdonDikkatTestResultRenderer,
  'burdon': BurdonDikkatTestResultRenderer,
  'srv-otomatik-dusunceler-olcegi': AutomaticThoughtsReport as any,
  'otomatik-dusunceler-olcegi': AutomaticThoughtsReport as any,
  'atq-30': AutomaticThoughtsReport as any,
  'srv-basarisizlik-nedenleri-anketi': BasarisizlikNedenleriReport as any,
  'basarisizlik-nedenleri-anketi': BasarisizlikNedenleriReport as any,
  'bna-44': BasarisizlikNedenleriReport as any,
  'srv-calisma-davranisini-degerlendirme-olcegi': CalismaDavranisiReport as any,
  'calisma-davranisini-degerlendirme-olcegi': CalismaDavranisiReport as any,
  'calisma_davranisi': CalismaDavranisiReport as any,
  'cdde-73': CalismaDavranisiReport as any,
  'srv-problem-tarama-listesi': ProblemTaramaListesiReport as any,
  'problem-tarama-listesi': ProblemTaramaListesiReport as any,
  'ptl-176': ProblemTaramaListesiReport as any,
  'srv-rosenberg-benlik-saygisi': RosenbergBenlikSaygisiReport as any,
  'rosenberg-benlik-saygisi': RosenbergBenlikSaygisiReport as any,
  'rosenberg_benlik_saygisi': RosenbergBenlikSaygisiReport as any,
  'rosenberg-63': RosenbergBenlikSaygisiReport as any,
  'srv-kime-gore-ben-neyim': KimeGoreBenNeyimReport as any,
  'kime-gore-ben-neyim': KimeGoreBenNeyimReport as any,
  'kime_gore_ben_neyim': KimeGoreBenNeyimReport as any,
  'kgbn-40': KimeGoreBenNeyimReport as any,
  'srv-akademik-benlik-algisi': AkademikBenlikAlgisiReport as any,
  'akademik-benlik-algisi': AkademikBenlikAlgisiReport as any,
  'akademik_benlik_algisi': AkademikBenlikAlgisiReport as any,
  'abao-ii-56': AkademikBenlikAlgisiReport as any,
  'abaö-ii-56': AkademikBenlikAlgisiReport as any,
  'abao-56': AkademikBenlikAlgisiReport as any
};

export const UnconfiguredSurveyReport: React.FC<SurveyReportComponentProps> = ({ application }) => (
  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto my-8">
    <h3 className="text-base font-bold text-slate-800 mb-2">Özel Sonuç Raporu Bulunamadı</h3>
    <p className="text-xs text-slate-500">
      Bu anket (<strong className="text-slate-700">{application.surveyTitle}</strong>) için özel sonuç raporu henüz tanımlanmamıştır.
    </p>
  </div>
);

/**
 * Returns the specialized report component for a given survey or a controlled fallback.
 */
export function getSurveyReportComponent(surveySlugOrId?: string): React.FC<SurveyReportComponentProps> {
  if (!surveySlugOrId) return UnconfiguredSurveyReport;
  const normalizedKey = surveySlugOrId.toLowerCase();
  return reportComponents[normalizedKey] || UnconfiguredSurveyReport;
}
