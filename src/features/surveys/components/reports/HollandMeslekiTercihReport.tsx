import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { Info } from 'lucide-react';
import { getHollandEvaluation } from '../../../../../shared/hollandEvaluation';
import { HollandTypeHexagon } from '../shared/HollandTypeHexagon';
import { HollandHexagonNodeHighlight } from '../../../../../shared/hollandHexagonSvg';

interface HollandMeslekiTercihReportProps {
  application: SurveyApplicationDto;
}

export const HollandMeslekiTercihReport: React.FC<HollandMeslekiTercihReportProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const evaluation = getHollandEvaluation(application);

  const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

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
    <div className="survey-print-report text-slate-900 bg-white p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* 1. Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Rehberlik ve Psikolojik Danışma Servisi
        </div>
        <div className="inline-block mt-2 px-5 py-2 bg-slate-100 border border-slate-300 rounded-xl">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 m-0">
            HOLLAND MESLEKİ TERCİH ENVANTERİ
          </h1>
          <div className="text-xs font-bold text-sky-700 mt-0.5">
            Bireysel Değerlendirme ve Sonuç Raporu (HOLLAND-90)
          </div>
        </div>
      </div>

      {/* 2. Student & Application Info Card */}
      <div className="border border-slate-300 rounded-2xl p-4 mb-5 bg-slate-50/70 shadow-2xs">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-3">
          Öğrenci ve Uygulama Bilgileri
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Adı Soyadı:</span>
            <div className="font-extrabold text-slate-900 text-sm mt-0.5">{application.studentName}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Okul Numarası:</span>
            <div className="font-bold text-slate-900 mt-0.5 font-mono">{application.studentNumber || '—'}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Sınıfı / Şubesi:</span>
            <div className="font-bold text-slate-900 mt-0.5">{application.className || '—'}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Uygulanan Envanter:</span>
            <div className="font-bold text-slate-900 mt-0.5">{application.surveyTitle}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Uygulama Numarası:</span>
            <div className="font-bold text-slate-900 mt-0.5">{`Uygulama #${application.attemptNumber}`}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Uygulama Tarihi:</span>
            <div className="font-bold text-slate-900 mt-0.5">{`${formattedDate} ${formattedTime}`}</div>
          </div>
        </div>
      </div>

      {/* 3. Dominant & Distant Personality Types Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-emerald-800 uppercase">
            <span>Baskın Kişilik Tipi</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-200">En Yüksek Hoşlanırım</span>
          </div>
          <div className="text-lg font-black text-emerald-950 mt-1">
            {evaluation.dominantTypeLabel}
          </div>
          <div className="text-xs text-emerald-800 font-semibold mt-0.5">
            Hoşlanırım Sayısı: <span className="font-mono font-bold text-emerald-950">{evaluation.maxHoslanirimScore}</span> / 15
          </div>
        </div>

        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-rose-800 uppercase">
            <span>En Uzak Kişilik Tipi</span>
            <span className="bg-white px-2 py-0.5 rounded border border-rose-200">En Yüksek Hoşlanmam</span>
          </div>
          <div className="text-lg font-black text-rose-950 mt-1">
            {evaluation.distantTypeLabel}
          </div>
          <div className="text-xs text-rose-800 font-semibold mt-0.5">
            Hoşlanmam Sayısı: <span className="font-mono font-bold text-rose-950">{evaluation.maxHoslanmamScore}</span> / 15
          </div>
        </div>
      </div>

      {/* 4. Holland Hexagon Chart */}
      <HollandTypeHexagon
        highlights={highlights}
        className="mb-5"
      />

      {/* 4. Guidance Note */}
      <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1.5 mb-5">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Envanter Değerlendirmesi ve Rehberlik Bilgilendirmesi</span>
        </div>
        <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
          {evaluation.summaryParagraph}
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-1.5 mt-1.5">
          {evaluation.farketmezInterpretation}
        </p>
      </div>

      {/* 5. 6 Holland Types Scoring Table */}
      <div className="border border-slate-300 rounded-2xl overflow-hidden mb-6 shadow-2xs">
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider text-slate-800 flex justify-between items-center">
          <span>Holland 6 Kişilik Tipi Puanlama Cetveli</span>
          <span className="text-[11px] font-semibold text-slate-500">6 Kişilik Tipi &bull; 90 Madde</span>
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <th className="py-2.5 px-3 border-r border-slate-200">Kişilik Tipi</th>
              <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">Hoşlanırım (15)</th>
              <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">Farketmez (30)</th>
              <th className="py-2.5 px-3 w-36 text-center">Hoşlanmam (15)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {evaluation.typeResults.map(r => {
              const isDominant = evaluation.dominantTypes.some(d => d.typeKey === r.typeKey);
              const isDistant = evaluation.distantTypes.some(d => d.typeKey === r.typeKey);

              return (
                <tr key={r.typeKey} className={`hover:bg-slate-50/70 ${isDominant ? 'bg-emerald-50/40' : isDistant ? 'bg-rose-50/40' : ''}`}>
                  <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200">
                    {r.title}
                    {isDominant && <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">Baskın</span>}
                    {isDistant && <span className="ml-2 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">En Uzak</span>}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-center text-emerald-800 border-r border-slate-200">
                    {r.hoslanirimCount} <span className="text-[10px] text-slate-400 font-normal">/ 15</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-700 border-r border-slate-200">
                    {r.farketmezCount} <span className="text-[10px] text-slate-400 font-normal">/ 30</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black text-center text-rose-800">
                    {r.hoslanmamCount} <span className="text-[10px] text-slate-400 font-normal">/ 15</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Question Breakdown Table */}
      {answers.length > 0 && (
        <div className="border border-slate-300 rounded-2xl overflow-hidden mb-6 shadow-2xs">
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider text-slate-800 flex justify-between items-center">
            <span>Madde ve Cevap Dağılımı</span>
            <span className="text-[11px] font-semibold text-slate-500">90 Madde</span>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-2 px-3 w-10 text-center border-r border-slate-200">No</th>
                <th className="py-2 px-3 border-r border-slate-200">Envanter Maddesi</th>
                <th className="py-2 px-3 w-40 text-center">Verilen Yanıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {answers.map((ans, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 font-mono font-bold text-center text-slate-500 border-r border-slate-200">
                    {ans.questionOrder || idx + 1}
                  </td>
                  <td className="py-2 px-3 leading-relaxed border-r border-slate-200">
                    {ans.questionText || `Madde ${ans.questionOrder || idx + 1}`}
                  </td>
                  <td className="py-2 px-3 font-medium text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      (ans.answerValue || ans.selectedOptionLabel) === 'HOŞLANIRIM' || (ans.answerValue === 'hoslanirim')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (ans.answerValue || ans.selectedOptionLabel) === 'HOŞLANMAM' || (ans.answerValue === 'hoslanmam')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {ans.selectedOptionLabel || ans.answerValue || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Signatures Block */}
      <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
        <div>
          <div className="font-bold text-slate-800">Uygulayan / Değerlendiren</div>
          <div className="text-slate-500 mt-0.5">Psikolojik Danışman / Rehber Öğretmen</div>
          <div className="h-12 border-b border-dashed border-slate-300 mx-auto w-48 mt-2"></div>
          <div className="text-[10px] text-slate-400 mt-1">İmza / Mühür</div>
        </div>
        <div>
          <div className="font-bold text-slate-800">Onaylayan</div>
          <div className="text-slate-500 mt-0.5">Okul Müdürü</div>
          <div className="h-12 border-b border-dashed border-slate-300 mx-auto w-48 mt-2"></div>
          <div className="text-[10px] text-slate-400 mt-1">İmza / Mühür</div>
        </div>
      </div>
    </div>
  );
};
