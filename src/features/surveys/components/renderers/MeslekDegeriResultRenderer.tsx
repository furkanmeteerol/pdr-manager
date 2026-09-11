import React from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { 
  Compass, 
  Award, 
  BarChart3, 
  Info, 
  ListOrdered
} from 'lucide-react';
import { 
  calculateMeslekDegeriEvaluation, 
  MESLEK_DEGERI_SOURCE_INFO 
} from '../../../../../shared/meslekDegeriEvaluation';

interface MeslekDegeriResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const MeslekDegeriResultRenderer: React.FC<MeslekDegeriResultRendererProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const evaluation = calculateMeslekDegeriEvaluation(
    answers.map((a, idx) => ({
      questionOrder: a.questionOrder || idx + 1,
      selectedOptionValue: a.answerValue || a.selectedOptionLabel || '1'
    }))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Top 3 Priority Summary Cards */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>MESLEK DEĞERİ ENVANTERİ</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 font-semibold text-indigo-300">
                    35 Madde &bull; 9 Değer
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Öğrencinin meslek seçiminde önem verdiği değerlerin göreli öncelik sıralaması
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-lg bg-white/10 border border-white/20 font-bold text-slate-200">
                Uygulama #{application.attemptNumber || 1}
              </span>
            </div>
          </div>

          {/* Top 3 Value Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {evaluation.top3Values.map((val, idx) => (
              <div 
                key={val.key}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{idx + 1}. Öncelikli Değer</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {val.itemCount} Madde
                  </span>
                </div>
                
                <div>
                  <div className="text-base font-black text-white">{val.title}</div>
                  <div className="text-xs font-mono font-extrabold text-indigo-200 mt-0.5">
                    {val.averageScore.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 9.00</span>
                  </div>
                </div>

                <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${val.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tie Info if present */}
          {evaluation.hasTop3Tie && evaluation.tieDescription && (
            <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{evaluation.tieDescription}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Priority Ranking of All 9 Values */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Meslek Değerleri Öncelik Sıralaması (9 Alt Boyut)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">1.00 – 9.00 Puan Skalası</span>
        </div>

        <div className="space-y-3">
          {evaluation.sortedValues.map((val, rankIdx) => {
            const isTop3 = rankIdx < 3;

            return (
              <div
                key={val.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTop3
                    ? 'bg-slate-50/90 border-indigo-200 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      rankIdx === 0 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : rankIdx === 1 
                          ? 'bg-slate-200 text-slate-800' 
                          : rankIdx === 2 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-slate-100 text-slate-600'
                    }`}>
                      {rankIdx + 1}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">{val.title}</span>
                    {isTop3 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {rankIdx + 1}. Öncelik
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {val.itemCount} soru &bull; Toplam: <span className="font-mono font-bold text-slate-700">{val.rawSum}</span>
                    </span>
                    <div className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {val.averageScore.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 9.00</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${val.metadata.colors.barColor}`}
                      style={{ width: `${val.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 pt-0.5">
                    {val.metadata.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Guidance and Methodology Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Rehberlik ve Değerlendirme Bilgilendirmesi</span>
        </div>
        <p className="leading-relaxed">
          {evaluation.summaryParagraph}
        </p>
        <p className="text-slate-500 border-t border-slate-200 pt-2 leading-relaxed">
          {MESLEK_DEGERI_SOURCE_INFO}
        </p>
      </div>

      {/* 4. 35 Inventory Items and Selected Answers */}
      {answers && answers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                35 Envanter Maddesi ve Verilen Yanıtlar
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">1–9 Likert Seçenekleri</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Envanter Maddesi</th>
                  <th className="py-2.5 px-3 w-44 text-center">Verilen Yanıt (1-9)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {answers.map((ans, idx) => {
                  const qNum = ans.questionOrder || idx + 1;
                  const rawVal = ans.answerValue || ans.selectedOptionLabel || '';
                  const numVal = parseInt(String(rawVal), 10);
                  const displayLabel = !isNaN(numVal)
                    ? numVal === 1
                      ? '1 — Hiç Katılmıyorum'
                      : numVal === 9
                        ? '9 — Tamamen Katılıyorum'
                        : `${numVal}`
                    : rawVal;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-center text-slate-500 border-r border-slate-200">
                        {qNum}
                      </td>
                      <td className="py-2 px-3 leading-relaxed border-r border-slate-200">
                        {ans.questionText || `Madde ${qNum}`}
                      </td>
                      <td className="py-2 px-3 font-medium text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                          {displayLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
