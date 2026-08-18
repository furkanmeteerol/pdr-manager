import React from 'react';
import { CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';

export interface SurveyResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const GenericSurveyResultRenderer: React.FC<SurveyResultRendererProps> = ({
  application,
  presentationConfig
}) => {
  const result = application.resultSnapshot;
  const subscales = result?.subscales || [];
  const interp = result?.interpretation;
  const showTotalScore = presentationConfig?.options?.showTotalScore !== false;

  const getBadgeColorClass = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* 1. Score & Interpretation Snapshot Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Score Card */}
        {showTotalScore && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 flex flex-col justify-between shadow-2xs">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Toplam Puan</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight">
                {result?.totalScore ?? application.totalScore ?? 0}
              </span>
              {result?.maxPossibleScore ? (
                <span className="text-xs text-blue-500 font-bold">/ {result.maxPossibleScore} puan</span>
              ) : null}
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              {result?.rawMetrics?.answeredQuestionsCount || 0} / {result?.rawMetrics?.totalQuestionsCount || 0} Soru Cevaplandı
            </div>
          </div>
        )}

        {/* Overall Interpretation Card */}
        <div className={`${showTotalScore ? 'md:col-span-2' : 'md:col-span-3'} p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sonuç ve Değerlendirme Özeti</span>
            </div>
            {interp?.label && (
              <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-xs ${getBadgeColorClass(interp.colorCode)}`}>
                {interp.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {interp?.description || 'Öğrencinin yanıtları hesaplanmış ve sonuç kaydı dondurulmuştur.'}
          </p>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-1 border-t border-slate-100">
            <span>Versiyon Snapshot: v{result?.versionSnapshot || 1}</span>
            <span>•</span>
            <span>Hesaplanma: {result?.calculatedAt ? new Date(result.calculatedAt).toLocaleString('tr-TR') : '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. Subscale Breakdowns (Alt Boyutlar) */}
      {subscales.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-xs text-slate-800">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Alt Boyut Dağılımı ve Puanları</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subscales.map((sub, idx) => {
              const pct = sub.percentage ?? (sub.maxScore ? Math.round((sub.score / sub.maxScore) * 100) : 50);
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 truncate">{sub.title}</span>
                    <span className="font-mono font-bold text-blue-700 text-xs">
                      {sub.averageScore !== undefined ? `${sub.averageScore} ort.` : `${sub.score} ${sub.maxScore ? `/ ${sub.maxScore}` : 'puan'}`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>%{pct} Oran</span>
                    {sub.interpretation && (
                      <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {sub.interpretation}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Question-by-Question Response Breakdown */}
      {application.answers && application.answers.length > 0 && (
        <QuestionBreakdownTable
          answers={application.answers}
          subscales={subscales.map(s => ({ code: s.code, title: s.title }))}
        />
      )}
    </div>
  );
};
