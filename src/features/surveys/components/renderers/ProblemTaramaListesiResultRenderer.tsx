import React, { useState } from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import {
  evaluateProblemTaramaListesi,
  PTL_SCALE_METADATA,
  PTL_SECTIONS
} from '../../../../../shared/problemTaramaListesiEvaluation';
import { Info, AlertTriangle, FileText, ChevronUp, ChevronDown } from 'lucide-react';

export interface ProblemTaramaListesiResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const ProblemTaramaListesiResultRenderer: React.FC<ProblemTaramaListesiResultRendererProps> = ({
  application
}) => {
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');

  let answers = application.answers || [];
  if ((!answers || answers.length === 0) && (application as any).answers_json) {
    try {
      const parsed = JSON.parse((application as any).answers_json);
      if (Array.isArray(parsed)) answers = parsed;
      else if (typeof parsed === 'object') {
        answers = Object.entries(parsed).map(([k, v]) => ({
          questionId: k,
          answerValue: String(v)
        }));
      }
    } catch {}
  }

  const answersRecord: Record<string, string> = {};
  answers.forEach((a, idx) => {
    const qNum = a.questionOrder || idx + 1;
    const val = (a.answerValue ?? a.selectedOptionLabel ?? '').trim();
    answersRecord[`q${qNum}`] = val;
    if (a.questionId) {
      answersRecord[a.questionId] = val;
    }
  });

  const result = evaluateProblemTaramaListesi(answersRecord);

  const getClassificationBadgeClass = (level?: string) => {
    switch (level) {
      case 'Az':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'Biraz':
        return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      case 'Orta':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'Çok':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      case 'Çok fazla problemli':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  const filteredSections = result.sections.filter(s => {
    if (selectedSectionFilter === 'ALL') return true;
    return s.code === selectedSectionFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                {PTL_SCALE_METADATA.code}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {PTL_SCALE_METADATA.title} Sonuç Raporu
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
            <div className="bg-sky-50 dark:bg-sky-950/40 px-4 py-3 rounded-xl border border-sky-200 dark:border-sky-800/60">
              <div className="text-xs text-sky-700 dark:text-sky-300 font-semibold">İşaretlenen Problem</div>
              <div className="text-xl font-black text-sky-900 dark:text-sky-100 tracking-tight">
                {result.totalSelected} <span className="text-xs font-normal text-sky-500">/ 176 (%{result.percentage})</span>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="text-xs text-neutral-500 font-semibold">Kaynak Değerlendirmesi</div>
              <div className="mt-0.5">
                {result.sourceClassification.available ? (
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getClassificationBadgeClass(result.sourceClassification.level)}`}>
                    {result.sourceClassification.level} Problemli
                  </span>
                ) : (
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    Tanım Bulunmuyor
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Source Classification Notice / Guidance */}
        {result.sourceClassification.available ? (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-neutral-700/50 border border-slate-200 dark:border-neutral-600 rounded-xl flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong>Kaynak Norm Yorumu ({result.sourceClassification.min}–{result.sourceClassification.max} aralığı):</strong> {result.sourceClassification.guidanceNote}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Kaynak Notu:</strong> {result.sourceClassification.label}
            </div>
          </div>
        )}
      </div>

      {/* 7 Section Cards Summary Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <span>7 Alt Alan Problem Dağılımı</span>
          </h3>

          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-2.5 py-1.5 font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer"
          >
            <option value="ALL">Tüm Alanlar (7 Bölüm)</option>
            {PTL_SECTIONS.map(s => (
              <option key={s.code} value={s.code}>
                Bölüm {s.romanCode} ({s.code}): {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map(sec => (
            <div
              key={sec.code}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {sec.romanCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                    {sec.selectedCount} / {sec.totalCount} Problem (%{sec.percentage})
                  </span>
                </div>

                <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2 leading-snug">
                  {sec.title}
                </h4>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-sky-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${sec.percentage}%` }}
                  />
                </div>

                {/* Marked items count in section */}
                {sec.selectedCount > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      İşaretlenen Maddeler:
                    </div>
                    <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 max-h-36 overflow-y-auto pr-1">
                      {sec.selectedItems.map(item => (
                        <li key={item.globalIndex} className="leading-tight flex items-start gap-1.5">
                          <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold shrink-0">
                            [{item.questionNumber}]
                          </span>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-400 italic pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    Bu alanda işaretlenmiş problem yok.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full 176 Questions Inspect Collapsible */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
              Tüm Liste Maddeleri ve İşaretleme Durumu (1–176)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAllItems(!showAllItems)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            {showAllItems ? (
              <>
                <span>Gizle</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Tüm Maddeleri Göster</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {showAllItems && (
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {PTL_SECTIONS.map(sec => (
              <div key={sec.code} className="space-y-2">
                <div className="bg-slate-100 dark:bg-neutral-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200">
                  Bölüm {sec.romanCode} ({sec.code}): {sec.title}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sec.items.map((itemText, localIdx) => {
                    const qNum = localIdx + 1;
                    const globalIdx = sec.startGlobalIndex + localIdx;
                    const isMarked = result.selectedItemIndices.includes(globalIdx);

                    return (
                      <div
                        key={globalIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          isMarked
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 font-medium text-sky-950 dark:text-sky-200'
                            : 'bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-500'
                        }`}
                      >
                        <span className="font-mono font-bold text-[11px] text-neutral-400 shrink-0 w-6">
                          {qNum}.
                        </span>
                        <span className="flex-1 leading-snug">{itemText}</span>
                        {isMarked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white shrink-0">
                            İşaretlendi
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
