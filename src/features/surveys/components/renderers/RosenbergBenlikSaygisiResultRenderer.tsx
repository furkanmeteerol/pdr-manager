import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Info, 
  HelpCircle,
  Filter,
  ListOrdered
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateRosenbergBenlikSaygisi, 
  RosenbergSubscaleScore,
  ROSENBERG_SUBSCALES
} from '../../../../../shared/rosenbergBenlikSaygisiEvaluation';

interface Props {
  application: SurveyApplicationDto;
}

export const RosenbergBenlikSaygisiResultRenderer: React.FC<Props> = ({ application }) => {
  const [selectedSubscaleFilter, setSelectedSubscaleFilter] = useState<string>('D1');

  const answersObj = useMemo(() => {
    let result: Record<string, any> = {};
    const appAny = application as any;
    if (typeof appAny.answers_json === 'string') {
      try { result = JSON.parse(appAny.answers_json); } catch {}
    } else if (typeof appAny.answersJson === 'string') {
      try { result = JSON.parse(appAny.answersJson); } catch {}
    } else if (appAny.answersJson && typeof appAny.answersJson === 'object') {
      result = appAny.answersJson;
    } else if (application.answers && Array.isArray(application.answers)) {
      application.answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        result[`q${qNum}`] = (a as any).selectedOptionValue || a.answerValue || a.selectedOptionLabel || '';
      });
    }
    return result;
  }, [application]);

  const evaluation = useMemo(() => {
    return evaluateRosenbergBenlikSaygisi(answersObj);
  }, [answersObj]);

  // Filtered items for Puan Detayları
  const filteredItems = useMemo(() => {
    if (selectedSubscaleFilter === 'ALL') {
      return evaluation.itemResults;
    }
    return evaluation.itemResults.filter(item => item.subscaleCode === selectedSubscaleFilter);
  }, [evaluation.itemResults, selectedSubscaleFilter]);

  // Active subscale metadata for single subscale view
  const activeSubscale = useMemo(() => {
    if (selectedSubscaleFilter === 'ALL') return null;
    return evaluation.subscales.find(s => s.code === selectedSubscaleFilter) || null;
  }, [evaluation.subscales, selectedSubscaleFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Purpose Info */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Rosenberg Benlik Saygısı Envanteri</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Öğrencinin benlik saygısı ve benlik kavramı ile ilişkili 12 bağımsız alt alandaki değerlendirme sonuçları.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Yanıtlanan Soru</div>
            <div className="text-sm font-black text-blue-700">{evaluation.answeredCount} / {evaluation.totalQuestions}</div>
          </div>
        </div>
      </div>

      {/* Methodology Disclaimer Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-950">Ölçek Değerlendirme Kuralı:</strong> Rosenberg Benlik Saygısı Envanteri'nde genel toplam puan veya tüm ölçeği kapsayan tek bir kesme puanı bulunmamaktadır. Her alt ölçek kendi içinde bağımsız olarak değerlendirilir.
        </div>
      </div>

      {/* 12 Subscales Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evaluation.subscales.map((sub: RosenbergSubscaleScore) => {
          let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let borderAccent = 'border-slate-200';

          const levelStr = (sub.level || '').toLowerCase();
          if (!sub.interpretationAvailable) {
            badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
          } else if (
            levelStr.includes('düşük benlik') || 
            levelStr.includes('az') || 
            levelStr.includes('çok duyarlılık') || 
            levelStr.includes('yüksek') || 
            levelStr.includes('güçlük') || 
            levelStr.includes('tehdit')
          ) {
            badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
            borderAccent = 'border-rose-100 shadow-rose-50/50';
          } else if (levelStr.includes('orta')) {
            badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
            borderAccent = 'border-amber-100 shadow-amber-50/50';
          }

          const scoreDisplay = sub.code === 'D1' ? sub.score.toFixed(2) : String(sub.score);

          return (
            <div 
              key={sub.code}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md ${borderAccent} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-100">
                  <div>
                    <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold mb-1">
                      {sub.displayCode}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{sub.name}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-medium">Puan / Maks</div>
                    <div className="text-base font-black text-blue-600">
                      {scoreDisplay} <span className="text-xs text-slate-400 font-semibold">/ {sub.maxScore}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeBg}`}>
                    {sub.level || 'Tanımsız'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {sub.interpretation}
                </p>
              </div>

              {sub.sourceNote && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sub.sourceNote}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* PUAN DETAYLARI (Score Breakdown by Question/Options) */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">PUAN DETAYLARI</h4>
              <p className="text-xs text-slate-500">
                Alt ölçek puanının hangi sorulardan ve hangi seçilen şıklardan oluştuğunu inceleyin.
              </p>
            </div>
          </div>

          {/* Subscale Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSubscaleFilter}
              onChange={(e) => setSelectedSubscaleFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Tüm Alt Ölçekler (63 Soru)</option>
              {ROSENBERG_SUBSCALES.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.displayCode} — {sub.name} ({sub.questionNumbers.length} Soru)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subscale Active Summary Header (when specific subscale selected) */}
        {activeSubscale && (
          <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                {activeSubscale.displayCode}
              </span>
              <span className="font-bold text-slate-800">{activeSubscale.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-medium">
                Alt Ölçek Puanı: <strong className="text-blue-700 font-black text-sm">
                  {activeSubscale.code === 'D1' ? activeSubscale.score.toFixed(2) : activeSubscale.score}
                </strong> / {activeSubscale.maxScore}
              </span>
              <span className="inline-block px-2 py-0.5 bg-white border border-blue-200 text-blue-800 rounded-md font-bold text-[11px]">
                {activeSubscale.level || 'Tanımsız'}
              </span>
            </div>
          </div>
        )}

        {/* Details Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold text-center w-14">Soru</th>
                <th className="p-3 font-bold min-w-[280px]">Soru Metni</th>
                <th className="p-3 font-bold min-w-[180px]">Seçilen Şık & Yanıt</th>
                <th className="p-3 font-bold text-center w-24">Katkı Puanı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const hasAnswer = item.selectedOptionKey !== null;
                const scoreFormatted = item.subscaleCode === 'D1'
                  ? (item.score > 0 ? `+${item.score.toFixed(2)}` : '+0')
                  : (item.score > 0 ? `+${item.score}` : '+0');

                return (
                  <tr key={item.questionNumber} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 text-center align-top">
                      <div className="font-bold text-slate-800 font-mono">{item.questionNumber}</div>
                      {selectedSubscaleFilter === 'ALL' && (
                        <div className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                          {item.subscaleDisplayCode}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 font-medium leading-relaxed align-top">
                      {item.questionText}
                    </td>
                    <td className="p-3 align-top">
                      {hasAnswer ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold rounded-md text-[11px]">
                            {item.selectedOptionKey?.toUpperCase()}
                          </span>
                          <span className="text-slate-800 font-semibold">{item.selectedOptionLabel}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Yanıtlanmadı</span>
                      )}
                    </td>
                    <td className="p-3 text-center align-top">
                      <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${
                        item.score > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {scoreFormatted}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        {activeSubscale && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              {activeSubscale.displayCode} alt ölçeği toplam {activeSubscale.questionNumbers.length} sorudan oluşmaktadır.
            </div>
            <div className="font-bold text-slate-900">
              Toplam Puan: <span className="text-blue-600 font-black text-sm">
                {activeSubscale.code === 'D1' ? activeSubscale.score.toFixed(2) : activeSubscale.score}
              </span> / {activeSubscale.maxScore}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
