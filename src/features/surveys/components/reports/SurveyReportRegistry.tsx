import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { DevamsizlikNedenleriReport } from './DevamsizlikNedenleriReport';

export interface SurveyReportComponentProps {
  application: SurveyApplicationDto;
}

const reportComponents: Record<string, React.FC<SurveyReportComponentProps>> = {
  'srv-devamsizlik-nedenleri': DevamsizlikNedenleriReport,
  'devamsizlik-nedenleri-anketi': DevamsizlikNedenleriReport
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
