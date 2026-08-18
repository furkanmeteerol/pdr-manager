import React, { useState, useMemo } from 'react';
import { FileText, Filter } from 'lucide-react';
import { SurveyAnswerDto } from '@shared/ipc-types';

interface QuestionBreakdownTableProps {
  answers: SurveyAnswerDto[];
  subscales?: Array<{ code: string; title: string }>;
  excludeQuestionOrders?: number[];
}

const SUBSCALE_ORDER_RANGES: Record<string, [number, number]> = {
  OKUL_YONETIM: [1, 10],
  OGRETMEN: [11, 17],
  AILE: [18, 26],
  CEVRE: [27, 31],
  AKADEMIK_KAYGI: [32, 36],
  KISISEL_NEDENLER: [37, 45],
  ARKADAS_CEVRESI: [46, 51]
};

export const QuestionBreakdownTable: React.FC<QuestionBreakdownTableProps> = ({
  answers,
  subscales = [],
  excludeQuestionOrders = []
}) => {
  const [selectedSubscaleCode, setSelectedSubscaleCode] = useState<string>('ALL');

  const eligibleAnswers = useMemo(() => {
    return answers.filter(a => !excludeQuestionOrders.includes(a.questionOrder || 0));
  }, [answers, excludeQuestionOrders]);

  const filteredAnswers = useMemo(() => {
    if (selectedSubscaleCode === 'ALL') return eligibleAnswers;
    return eligibleAnswers.filter(a => {
      if (a.subscaleCode) {
        return a.subscaleCode.toUpperCase() === selectedSubscaleCode.toUpperCase();
      }
      const range = SUBSCALE_ORDER_RANGES[selectedSubscaleCode];
      if (range && a.questionOrder) {
        return a.questionOrder >= range[0] && a.questionOrder <= range[1];
      }
      return false;
    });
  }, [eligibleAnswers, selectedSubscaleCode]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Subscale Filter Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>{`Madde ve Yanıt Detayları (${filteredAnswers.length} Madde)`}</span>
        </div>

        {subscales.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubscaleCode}
              onChange={e => setSelectedSubscaleCode(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">{`Tüm Boyutlar (${eligibleAnswers.length})`}</option>
              {subscales.map(s => (
                <option key={s.code} value={s.code}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Answer List */}
      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {filteredAnswers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            Bu filtreye uygun yanıt bulunamadı.
          </div>
        ) : (
          filteredAnswers.map((ans, idx) => (
            <div key={idx} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-blue-600 font-bold text-xs shrink-0 mt-0.5">
                    #{ans.questionOrder || idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 text-xs leading-relaxed">
                    {ans.questionText || `Madde ${ans.questionOrder || idx + 1}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pl-6">
                  <span>
                    Verilen Yanıt: <strong className="text-slate-800 font-bold">{ans.selectedOptionLabel || ans.answerValue || 'Cevapsız'}</strong>
                  </span>
                  {ans.subscaleCode && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {subscales.find(s => s.code === ans.subscaleCode)?.title || ans.subscaleCode}
                    </span>
                  )}
                  {ans.isReverseScored && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Ters Madde
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                {ans.answerScore !== undefined ? (
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {ans.answerScore} Puan
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
