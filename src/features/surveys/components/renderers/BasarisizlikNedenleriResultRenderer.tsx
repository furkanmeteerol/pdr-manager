import React, { useState } from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import {
  evaluateIndividualBNA,
  BNA_SCALE_METADATA,
  BNA_DISCLAIMER_TEXT
} from '../../../../../shared/basarisizlikNedenleriEvaluation';
import { BookOpen, AlertCircle, CheckCircle2, ListFilter } from 'lucide-react';

export interface BasarisizlikNedenleriResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const BasarisizlikNedenleriResultRenderer: React.FC<BasarisizlikNedenleriResultRendererProps> = ({
  application
}) => {
  const [activeTab, setActiveTab] = useState<'marked' | 'all'>('marked');

  const rawMetrics = typeof (application.resultSnapshot as any)?.rawMetrics === 'string'
    ? (() => { try { return JSON.parse((application.resultSnapshot as any).rawMetrics); } catch { return {}; } })()
    : ((application.resultSnapshot as any)?.rawMetrics || {});

  const subjectTextOverride =
    (application.resultSnapshot as any)?.subjectText ||
    rawMetrics?.subjectText ||
    (application as any).subjectText;

  const result = evaluateIndividualBNA(application, subjectTextOverride);
  const markedItems = result.itemStates.filter(i => i.isSelected);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                {BNA_SCALE_METADATA.code}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Başarısızlık Nedenleri Anketi Sonucu
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
            <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-950/40 px-4 py-3 rounded-xl border border-sky-200 dark:border-sky-800/60">
              <BookOpen className="w-8 h-8 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <div className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Belirtilen Neden Sayısı</div>
                <div className="text-2xl font-black text-sky-900 dark:text-sky-100 tracking-tight">
                  {result.selectedReasonCount} <span className="text-sm font-normal text-sky-500">/ 44 Neden</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Text Subject Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-700">
          <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
            İlgili Ders(ler) ve Gerekçe Bildirimi:
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-neutral-200">
            <span className="text-sky-600 dark:text-sky-400">
              {result.subjectText ? result.subjectText : '................................'}
            </span>{' '}
            derslerinden notlarım düşük ve başarılı değilim. Çünkü;
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong className="font-bold">Rehberlik Değerlendirme Esası:</strong> Bu anket bir toplam puan veya tanı ölçeği değildir. Öğrencinin işaretlediği maddeler, ders başarısını olumsuz etkilediğini belirttiği bireysel nedenlerdir ve okul psikolojik danışmanı tarafından rehberlik görüşmesinde ele alınmalıdır.
          </div>
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('marked')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'marked'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            İşaretlenen Nedenler ({markedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200'
            }`}
          >
            44 Nedenin Tamamı (44)
          </button>
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'marked' ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-4">
            Öğrencinin Belirttiği Başarısızlık Nedenleri ({markedItems.length})
          </h3>
          {markedItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400 italic">
              Öğrenci bu uygulamada herhangi bir başarısızlık nedeni işaretlememiştir.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markedItems.map((item) => (
                <div
                  key={item.itemNumber}
                  className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {item.itemNumber}
                  </span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-neutral-200 pt-0.5">
                    {item.itemText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
              Tüm Maddelerin İşaretlenme Durumu (1–44)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Başarısızlık Nedeni / İfade</th>
                  <th className="p-3 w-32 text-center">İşaretleme Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {result.itemStates.map((item) => (
                  <tr
                    key={item.itemNumber}
                    className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-750 transition ${
                      item.isSelected ? 'bg-sky-50/30 dark:bg-sky-950/10' : ''
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-neutral-500 font-mono">
                      {item.itemNumber}
                    </td>
                    <td className="p-3 text-neutral-800 dark:text-neutral-200 font-medium">
                      {item.itemText}
                    </td>
                    <td className="p-3 text-center">
                      {item.isSelected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
                          ✓ İşaretledi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodological Disclaimer */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <strong className="font-semibold text-neutral-700 dark:text-neutral-300">Bilgilendirme:</strong> {BNA_DISCLAIMER_TEXT}
        </div>
      </div>
    </div>
  );
};
