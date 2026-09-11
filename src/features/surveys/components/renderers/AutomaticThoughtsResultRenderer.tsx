import React from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { evaluateAutomaticThoughts, ATQ_SCALE_METADATA } from '../../../../../shared/automaticThoughtsEvaluation';
import { Brain, Info, HelpCircle } from 'lucide-react';

export interface AutomaticThoughtsResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const AutomaticThoughtsResultRenderer: React.FC<AutomaticThoughtsResultRendererProps> = ({
  application
}) => {
  const result = evaluateAutomaticThoughts(application);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                ATQ-30
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Otomatik Düşünceler Ölçeği Değerlendirme Sonucu
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
              <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">Toplam Puan</div>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100 tracking-tight">
                  {result.totalScore} <span className="text-sm font-normal text-indigo-500">/ 150</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Ortalama Madde Puanı</div>
                <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {result.averageScore.toFixed(2)} <span className="text-sm font-normal text-neutral-400">/ 5.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scale Range Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Puan Dağılım Ölçeği (30 - 150 Teorik Puan Aralığı)
            </span>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {result.totalScore} Puan
            </span>
          </div>
          <div className="relative h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-400 via-indigo-600 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, ((result.totalScore - 30) / 120) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            <span>30 (Tüm Maddeler: Hiç)</span>
            <span>90 (Orta Düzey)</span>
            <span>150 (Tüm Maddeler: Her zaman)</span>
          </div>
        </div>

        {/* Methodological / Source Guidance Note */}
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <div className="font-semibold text-indigo-950 dark:text-indigo-100">
              Kaynak Puanlama ve Değerlendirme Esasları:
            </div>
            <p>
              <strong>{result.sourceInterpretation}</strong>
            </p>
            <p className="text-indigo-800/90 dark:text-indigo-300/90">
              {result.sourceDisclaimer}
            </p>
            <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
              <strong>Ölçek Kaynağı:</strong> {ATQ_SCALE_METADATA.sourceCitation}
            </div>
          </div>
        </div>
      </div>

      {/* Item-by-item breakdown table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <span>Madde Düzeyinde Cevap ve Puan Dağılımı</span>
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({result.answeredItemCount} / 30 Madde Cevaplandı)
            </span>
          </h3>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <HelpCircle className="w-4 h-4" />
            <span>Puanlama: 1 = Hiç, 2 = Nadiren, 3 = Bazen, 4 = Sıklıkla, 5 = Her zaman</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Madde İfadesi</th>
                <th className="px-4 py-3 w-36 text-center">Verilen Cevap</th>
                <th className="px-4 py-3 w-20 text-center">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-neutral-700 dark:text-neutral-300">
              {result.itemScores.map((item) => {
                return (
                  <tr
                    key={item.itemNumber}
                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-semibold text-neutral-400 text-xs">
                      {item.itemNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {item.itemText}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300">
                        {item.selectedOptionLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {item.calculatedScore > 0 ? item.calculatedScore : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
