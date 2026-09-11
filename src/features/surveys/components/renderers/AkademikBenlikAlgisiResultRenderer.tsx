import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Info, 
  Filter, 
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { 
  evaluateAkademikBenlikAlgisi, 
  ABAÖ_FACTORS,
  AkademikBenlikFactorCode
} from '../../../../../shared/akademikBenlikAlgisiEvaluation';

interface Props {
  application: SurveyApplicationDto;
}

export const AkademikBenlikAlgisiResultRenderer: React.FC<Props> = ({ application }) => {
  const [selectedFactorFilter, setSelectedFactorFilter] = useState<string>('ALL');

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
    return evaluateAkademikBenlikAlgisi(answersObj);
  }, [answersObj]);

  const filteredItems = useMemo(() => {
    if (selectedFactorFilter === 'ALL') {
      return evaluation.itemDetails;
    }
    return evaluation.itemDetails.filter(it => it.factorCode === selectedFactorFilter);
  }, [evaluation.itemDetails, selectedFactorFilter]);

  const factorKeys: AkademikBenlikFactorCode[] = [
    'turk_dili_edebiyati',
    'tarih',
    'matematik',
    'fizik',
    'kimya',
    'biyoloji',
    'cografya',
    'yabanci_dil'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-teal-600/10 border border-blue-200/70 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{evaluation.title}</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md">ABAÖ-II</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Öğrencinin 8 akademik ders alanındaki benlik algısı, yetenek inancı ve ders başarı algısı profili.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Yanıtlanan Madde</div>
            <div className="text-sm font-black text-blue-700">{evaluation.totalAnswered} / {evaluation.totalQuestions}</div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-900">Değerlendirme Bilgisi:</strong> Her ders alt boyutu 7 maddeden (toplam 56 madde) oluşur. Maddeler 1 (Tamamen yanlış) ile 8 (Tamamen doğru) arasında puanlanır. Ters yönlü maddeler otomatik olarak dönüştürülmüştür. Yüksek ortalama puan, öğrencinin o ders alanındaki akademik benlik algısının olumlu ve güçlü olduğunu gösterir.
        </div>
      </div>

      {/* Overall Score Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-blue-300" />
              <span>Genel Akademik Benlik Algısı</span>
            </div>
            <h4 className="text-xl font-bold text-white mt-1">Genel Ortalama Puan</h4>
            <p className="text-xs text-blue-200/80 mt-1 max-w-md">
              Tüm 8 ders alanındaki 56 maddenin 1.00 - 8.00 puan aralığındaki genel ortalamasıdır.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center sm:text-right shrink-0">
            <div className="text-3xl font-black text-white">{evaluation.overallMean.toFixed(2)}</div>
            <div className="text-[11px] font-semibold text-blue-200">/ 8.00 Maks. Puan</div>
          </div>
        </div>
      </div>

      {/* 8 Subscales Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>8 Akademik Ders Alanı Benlik Algısı Puanları</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {evaluation.factorList.map(factor => {
            const percentage = Math.min(100, Math.max(0, (factor.mean / 8) * 100)).toFixed(1);
            return (
              <div 
                key={factor.code}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                    <span className="font-bold text-sm text-slate-900 line-clamp-1">{factor.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold shrink-0">
                      7 Madde
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Ortalama Puan:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-blue-700">{factor.mean.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ 8.00</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Toplam Puan:</span>
                      <span className="font-bold text-slate-700">{factor.sum} / 56</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right mt-1 font-semibold">
                        %{percentage} Düzey
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Details Breakdown / Puan Detayları */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Madde ve Puan Ayrıntıları</h4>
              <p className="text-xs text-slate-500">Öğrencinin her soruya verdiği yanıt ve hesaplanan puan karşılıkları</p>
            </div>
          </div>

          {/* Subscale Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFactorFilter}
              onChange={e => setSelectedFactorFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Tüm Ders Alanları (56 Madde)</option>
              {factorKeys.map(k => (
                <option key={k} value={k}>{ABAÖ_FACTORS[k].name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3">Madde İfadesi</th>
                <th className="py-2.5 px-3 w-40">Ders Alanı</th>
                <th className="py-2.5 px-3 w-44 text-center">Öğrenci Yanıtı</th>
                <th className="py-2.5 px-3 w-24 text-center">Hesaplanan Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.map(item => (
                <tr key={item.questionNumber} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-center">{item.questionNumber}</td>
                  <td className="py-2.5 px-3 text-slate-800">
                    <span>{item.text}</span>
                    {item.isReverse && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Ters Madde (9 - Puan)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">{item.factorName}</td>
                  <td className="py-2.5 px-3 text-center text-slate-700">
                    {item.rawValue !== null ? (
                      <span className="font-medium bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                        {item.rawLabel}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Boş</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.scoredValue !== null ? (
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-md">
                        {item.scoredValue}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
