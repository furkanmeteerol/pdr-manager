import React from 'react';
import { Compass, Info, Award } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { getHollandKisaEvaluation, HOLLAND_KISA_SOURCE_INFO } from '../../../../../shared/hollandKisaEvaluation';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';
import { HollandTypeHexagon } from '../shared/HollandTypeHexagon';
import { HollandHexagonNodeHighlight } from '../../../../../shared/hollandHexagonSvg';

export interface HollandKisaMeslekiTaramaResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const HollandKisaMeslekiTaramaResultRenderer: React.FC<HollandKisaMeslekiTaramaResultRendererProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const evaluation = getHollandKisaEvaluation(application);

  const highlights: Record<string, HollandHexagonNodeHighlight> = {};
  evaluation.top3Types.forEach((t, idx) => {
    highlights[t.typeKey] = {
      key: t.typeKey as any,
      rank: idx + 1,
      badgeLabel: `${idx + 1}. Sıra`,
      scoreText: `${t.score}/45`
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Top 3 Banner Card */}
      <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Mesleki Kişilik Profili (İlk 3 Tip)</h2>
              <p className="text-xs text-slate-600 font-medium">{evaluation.top3Label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Holland Kodu:</span>
            <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-sm rounded-lg shadow-2xs">
              {evaluation.hollandCode}
            </span>
          </div>
        </div>

        {/* Top 3 Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {evaluation.top3Types.map((t, idx) => (
            <div key={t.typeKey} className="bg-white/90 border border-emerald-200 rounded-xl p-3 shadow-2xs space-y-1 text-center">
              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{idx + 1}. Sıra</span>
              </div>
              <div className="text-sm font-black text-slate-900">{t.title} ({t.code})</div>
              <div className="text-xs font-mono font-bold text-emerald-700">{t.score} / 45 Puan</div>
            </div>
          ))}
        </div>

        {/* Guidance Summary */}
        <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Profil Özeti ve Değerlendirme</span>
          </div>
          <p className="text-[11px] leading-relaxed font-medium text-slate-700">
            {evaluation.summaryParagraph}
          </p>
          {evaluation.hasTop3Tie && evaluation.tieDescription && (
            <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
              ⚠️ {evaluation.tieDescription}
            </div>
          )}
        </div>
      </div>

      {/* 2. Holland Hexagon Relationship Map */}
      <HollandTypeHexagon highlights={highlights} width={340} height={270} />

      {/* 3. 6 Types Score Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <span>6 MESLEKİ KİŞİLİK TİPİ PUAN DAĞILIMI (5 - 45)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {evaluation.sortedTypes.map((r, rankIdx) => {
            const isTop3 = rankIdx < 3;
            const meta = r.metadata;

            return (
              <div 
                key={r.typeKey}
                className={`border rounded-2xl p-4 space-y-3 shadow-2xs transition-all ${
                  isTop3 
                    ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-300/50' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {rankIdx + 1}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${meta.colors.badge}`}>
                      {r.title} ({r.code})
                    </span>
                    {isTop3 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] shadow-2xs">
                        İlk 3 Tip
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 font-mono">{r.score}</span>
                    <span className="text-[11px] text-slate-400 font-medium"> / 45</span>
                  </div>
                </div>

                {/* Progress Bar (Visual indicator 5-45) */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${r.percentage}%`,
                        backgroundColor: meta.colors.hex
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Min: 5</span>
                    <span>%${r.percentage}</span>
                    <span>Maks: 45</span>
                  </div>
                </div>

                {/* Description & Characteristics */}
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {meta.description}
                </p>

                {/* Sample Activities */}
                <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 space-y-0.5">
                  <div className="font-bold text-slate-700">Örnek İlgi ve Faaliyetler:</div>
                  <div>{meta.sampleActivities.join(' • ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Methodological Info Box */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800">Envanter Bilgisi ve Değerlendirme Yönergesi</div>
        <p className="text-[11px] leading-relaxed">
          {HOLLAND_KISA_SOURCE_INFO}
        </p>
      </div>

      {/* 4. Question Breakdown Table */}
      {answers && answers.length > 0 && (
        <QuestionBreakdownTable answers={answers} />
      )}
    </div>
  );
};
