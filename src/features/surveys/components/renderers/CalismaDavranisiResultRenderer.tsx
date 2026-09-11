import React, { useState } from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import {
  evaluateCalismaDavranisi,
  CDDE_SCALE_METADATA,
  CDDE_CATEGORY_LIST
} from '../../../../../shared/calismaDavranisiEvaluation';
import { AlertCircle, CheckCircle2, AlertTriangle, BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export interface CalismaDavranisiResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const CalismaDavranisiResultRenderer: React.FC<CalismaDavranisiResultRendererProps> = ({
  application
}) => {
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const result = evaluateCalismaDavranisi(application);

  const getLevelBadgeClass = (level: string) => {
    const lower = level.toLowerCase();
    if (lower.includes('ciddi') || lower.includes('olumsuz') || lower.includes('eksik')) {
      return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    }
    if (lower.includes('bazı') || lower.includes('hata')) {
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }
    if (lower.includes('yok') || lower.includes('olumlu') || lower.includes('yeterli')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
    return 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300';
  };

  const filteredItems = result.itemDetails.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.categoryKey === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                {CDDE_SCALE_METADATA.code}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {CDDE_SCALE_METADATA.title} Sonuç Raporu
              </h2>
            </div>
            {application.studentName && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Öğrenci: <span className="font-medium text-neutral-900 dark:text-white">{application.studentName}</span>
                {application.studentNumber && ` (${application.studentNumber})`}
                {application.className && ` • Sınıf: ${application.className}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/40 px-4 py-3 rounded-xl border border-sky-200 dark:border-sky-800/60">
            <BookOpen className="w-7 h-7 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <div className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Toplam Madde Sayısı</div>
              <div className="text-xl font-black text-sky-900 dark:text-sky-100 tracking-tight">
                73 <span className="text-xs font-normal text-sky-500">Madde (7 Alan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guidance Notice */}
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong className="font-bold">Değerlendirme İlkesi:</strong> Bu ölçekte genel toplam puan hesaplanmaz ve genel risk teşhisi yapılmaz. Öğrencinin çalışma davranışı 7 bağımsız alt alanda ayrı ayrı değerlendirilir. Puanlar, ilgili alandaki olumsuz (güçlük belirten) yanıt sayısını ifade eder.
          </div>
        </div>
      </div>

      {/* 7 Category Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
          <span>Alt Alan Değerlendirmeleri (A–G)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.categoryResults.map((cat) => (
            <div
              key={cat.categoryKey}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {cat.categoryKey}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getLevelBadgeClass(cat.level)}`}>
                    {cat.levelText}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2 leading-snug">
                  {cat.categoryName}
                </h4>

                <div className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400 mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-700/60">
                  <span>Güçlük Puanı:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {cat.score} / {cat.itemCount}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Değerlendirme:
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {cat.interpretation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Details Collapsible Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
              Madde Düzeyinde Cevap ve Uyum Analizi (1–73)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-lg px-2.5 py-1.5 font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer"
            >
              <option value="ALL">Tüm Alanlar (73 Madde)</option>
              {CDDE_CATEGORY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  Alan {c.code}: {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowItemDetails(!showItemDetails)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              {showItemDetails ? (
                <>
                  <span>Gizle</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Detayları Göster</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {showItemDetails && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-semibold">
                <tr>
                  <th className="p-2.5 w-12 text-center">No</th>
                  <th className="p-2.5 w-16 text-center">Alan</th>
                  <th className="p-2.5">Madde İfadesi</th>
                  <th className="p-2.5 w-20 text-center">Beklenen</th>
                  <th className="p-2.5 w-20 text-center">Öğrenci</th>
                  <th className="p-2.5 w-28 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item.itemNumber}
                    className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-750 transition ${
                      item.isDifficulty ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="p-2.5 text-center font-bold text-neutral-500 font-mono">
                      {item.itemNumber}
                    </td>
                    <td className="p-2.5 text-center font-bold text-sky-700 dark:text-sky-300">
                      {item.categoryKey}
                    </td>
                    <td className="p-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                      {item.itemText}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-neutral-600 dark:text-neutral-300">
                      {item.expectedAnswer}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-neutral-800 dark:text-white">
                      {item.studentAnswer || '—'}
                    </td>
                    <td className="p-2.5 text-center">
                      {item.isDifficulty ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          Güçlük Var
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Uyumlu
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Methodological Disclaimer */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <strong className="font-semibold text-neutral-700 dark:text-neutral-300">Bilgilendirme:</strong> Bu rapor Çalışma Davranışını Değerlendirme Ölçeği standart anahtarlarına göre üretilmiştir. Sonuçlar psikolojik danışman veya rehber öğretmen tarafından öğrencinin çalışma alışkanlıklarını geliştirmeye yönelik rehberlik sürecinde değerlendirilmelidir.
        </div>
      </div>
    </div>
  );
};
