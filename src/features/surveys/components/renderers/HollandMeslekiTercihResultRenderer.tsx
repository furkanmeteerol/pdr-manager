import React from 'react';
import { Compass, Info } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { getHollandEvaluation, HOLLAND_TYPES_METADATA } from '../../../../../shared/hollandEvaluation';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';
import { HollandTypeHexagon } from '../shared/HollandTypeHexagon';
import { HollandHexagonNodeHighlight } from '../../../../../shared/hollandHexagonSvg';

export interface HollandMeslekiTercihResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const HollandMeslekiTercihResultRenderer: React.FC<HollandMeslekiTercihResultRendererProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const evaluation = getHollandEvaluation(application);

  const highlights: Record<string, HollandHexagonNodeHighlight> = {};
  evaluation.dominantTypes.forEach((d) => {
    highlights[d.typeKey] = {
      key: d.typeKey as any,
      rank: 1,
      badgeLabel: evaluation.isDominantTie ? '1. Baskın (Eşit)' : '1. Baskın'
    };
  });
  evaluation.distantTypes.forEach((d) => {
    if (!highlights[d.typeKey]) {
      highlights[d.typeKey] = {
        key: d.typeKey as any,
        isDistant: true,
        badgeLabel: 'En Uzak'
      };
    }
  });

  return (
    <div className="space-y-6 text-xs font-sans text-slate-800">
      {/* 1. Result & Evaluation Summary */}
      <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-sky-50/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              HOLLAND KİŞİLİK TİPLERİ VE MESLEKİ TERCİH SONUCU
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">90 Maddelik Envanter (HOLLAND-90)</span>
        </div>

        {/* Dominant & Distant Types Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dominant Type Card */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-4 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide">
                BASKIN KİŞİLİK TİPİ
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                En Yüksek Hoşlanırım
              </span>
            </div>
            <div className="text-xl font-black text-emerald-950">
              {evaluation.dominantTypeLabel}
            </div>
            <div className="text-xs text-emerald-800 font-semibold">
              Hoşlanırım Sayısı: <span className="font-mono font-bold text-emerald-950">{evaluation.maxHoslanirimScore}</span> / 15
            </div>
          </div>

          {/* Distant Type Card */}
          <div className="bg-rose-50/70 border-2 border-rose-300 rounded-xl p-4 shadow-2xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wide">
                EN UZAK KİŞİLİK TİPİ
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                En Yüksek Hoşlanmam
              </span>
            </div>
            <div className="text-xl font-black text-rose-950">
              {evaluation.distantTypeLabel}
            </div>
            <div className="text-xs text-rose-800 font-semibold">
              Hoşlanmam Sayısı: <span className="font-mono font-bold text-rose-950">{evaluation.maxHoslanmamScore}</span> / 15
            </div>
          </div>
        </div>

        {/* Summary & Clarity Box */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Envanter Değerlendirme ve Yorum Açıklaması</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
            {evaluation.summaryParagraph}
          </p>
          <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{evaluation.farketmezInterpretation}</span>
          </div>
        </div>
      </div>

      {/* 2. Holland Hexagon Relationship Map */}
      <HollandTypeHexagon highlights={highlights} width={340} height={270} />

      {/* 3. 6 Holland Types Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <span>6 HOLLAND KİŞİLİK TİPİ VE ÖZELLİKLERİ</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {evaluation.typeResults.map(r => {
            const isDominant = evaluation.dominantTypes.some(d => d.typeKey === r.typeKey);
            const isDistant = evaluation.distantTypes.some(d => d.typeKey === r.typeKey);
            const meta = HOLLAND_TYPES_METADATA[r.typeKey];

            return (
              <div 
                key={r.typeKey}
                className={`border rounded-2xl p-4 space-y-3 shadow-2xs transition-all ${
                  isDominant 
                    ? 'border-emerald-300 bg-emerald-50/40 ring-2 ring-emerald-400/20' 
                    : isDistant
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header with Badges */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${meta.colors.badge}`}>
                      {r.title} ({r.code})
                    </span>
                    {isDominant && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] shadow-2xs">
                        Baskın Tercih
                      </span>
                    )}
                    {isDistant && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] shadow-2xs">
                        En Uzak
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">30 Madde Kümesi</span>
                </div>

                {/* Tallies */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-emerald-800 block">Hoşlanırım</span>
                    <span className="font-mono text-base font-black text-emerald-950">{r.hoslanirimCount}</span>
                    <span className="text-[10px] text-emerald-600 font-medium"> / 15</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-slate-700 block">Farketmez</span>
                    <span className="font-mono text-base font-black text-slate-800">{r.farketmezCount}</span>
                    <span className="text-[10px] text-slate-400 font-medium"> / 30</span>
                  </div>
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-rose-800 block">Hoşlanmam</span>
                    <span className="font-mono text-base font-black text-rose-950">{r.hoslanmamCount}</span>
                    <span className="text-[10px] text-rose-600 font-medium"> / 15</span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="text-[11px] space-y-1.5 text-slate-700 pt-1">
                  <div>
                    <strong className="text-slate-900">Belirgin Özellikler:</strong> {meta.belirginOzellikler}
                  </div>
                  <div>
                    <strong className="text-slate-900">Baskın Etkinlikler:</strong> {meta.baskinTalepler.join(', ')}
                  </div>
                  <div className="text-indigo-900">
                    <strong>Tipik Meslekler (Kaynak):</strong> {meta.tipikMeslekler.join(', ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Question-by-Question Response Breakdown */}
      {answers.length > 0 && (
        <div className="mt-6">
          <QuestionBreakdownTable
            answers={answers}
          />
        </div>
      )}
    </div>
  );
};
