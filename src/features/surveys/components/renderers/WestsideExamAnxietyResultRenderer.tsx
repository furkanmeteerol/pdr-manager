import React from 'react';
import { Brain, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { getWestsideEvaluation } from '../../../../../shared/westsideEvaluation';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';

export interface WestsideExamAnxietyResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const WestsideExamAnxietyResultRenderer: React.FC<WestsideExamAnxietyResultRendererProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const rawTotal = result?.totalScore ?? (application.totalScore || 0);
  const evaluation = getWestsideEvaluation(rawTotal);

  return (
    <div className="space-y-6 text-xs font-sans text-slate-800">
      {/* 1. Result & Evaluation Summary */}
      <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              SONUÇ VE DEĞERLENDİRME ÖZETİ
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Tek Boyutlu Ölçek (WST-11)</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Main Card: Average Score 1.00 - 5.00 */}
          <div className="bg-white border-2 border-indigo-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-600 block">Ortalama Ölçek Puanı</span>
              <span className="text-[10px] text-slate-400">11 Madde Ortalaması (1.00 - 5.00)</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-indigo-950">{evaluation.averageScoreFormatted}</span>
              <span className="text-xs font-bold text-slate-400"> / 5.00</span>
            </div>
          </div>

          {/* Secondary Card: Evaluation Level Badge */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-500">Değerlendirme Seviyesi</span>
              <span className="text-[10px] text-slate-400 font-mono">11 Madde Toplamı: {rawTotal}/55</span>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold border ${evaluation.category.colorClasses.badge}`}>
                {evaluation.category.categoryLabel}
              </span>
            </div>
          </div>

          {/* Third Card: Risk Group Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-500">Risk Grubu Durumu</span>
              <span className="text-[10px] text-slate-400">Eşik: &gt; 3.00</span>
            </div>
            <div>
              {evaluation.isRiskGroup ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>RİSK GRUBU: EVET</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>RİSK GRUBU: HAYIR</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar (1.0 - 5.0) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Puan Skalası Konumu (1.00 - 5.00)</span>
            <span className="font-mono text-sm font-extrabold text-indigo-900">
              {evaluation.averageScoreFormatted} <span className="text-xs font-normal text-slate-400">/ 5.00</span>
            </span>
          </div>

          {/* Gradient Track with Tick indicator */}
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 relative">
            <div
              className={`h-3.5 rounded-full transition-all duration-300 ${evaluation.category.colorClasses.bar}`}
              style={{
                width: `${Math.min(100, Math.max(0, ((evaluation.averageScore - 1) / 4) * 100))}%`,
                backgroundColor: evaluation.category.colorClasses.hex
              }}
            />
          </div>

          {/* Scale Intervals Guide */}
          <div className="grid grid-cols-6 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100 gap-1 text-center">
            <div className="text-emerald-700">1.0 - 1.9<br/><span className="text-[9px] font-normal">Rahat/Düşük</span></div>
            <div className="text-blue-700">2.0 - 2.5<br/><span className="text-[9px] font-normal">Normal/İdeal</span></div>
            <div className="text-amber-700">2.6 - 2.9<br/><span className="text-[9px] font-normal">Sınırda/Hafif</span></div>
            <div className="text-orange-700">3.0 - 3.4<br/><span className="text-[9px] font-normal">Orta-Yüksek</span></div>
            <div className="text-rose-700">3.5 - 3.9<br/><span className="text-[9px] font-normal">Yüksek</span></div>
            <div className="text-red-900">4.0 - 5.0<br/><span className="text-[9px] font-normal">Aşırı/Panik</span></div>
          </div>
        </div>

        {/* Dynamic Non-Clinical Guidance & Information */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${evaluation.category.colorClasses.bg} ${evaluation.category.colorClasses.border}`}>
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Ölçek Değerlendirme ve Rehberlik Bilgilendirmesi</span>
          </div>
          <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
            {evaluation.category.description}
          </p>
        </div>
      </div>

      {/* 2. Question-by-Question Response Breakdown */}
      {application.answers && application.answers.length > 0 && (
        <div className="mt-6">
          <QuestionBreakdownTable
            answers={application.answers}
          />
        </div>
      )}
    </div>
  );
};
