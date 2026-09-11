import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { Info, Compass } from 'lucide-react';
import { getHollandKisaEvaluation, HOLLAND_KISA_SOURCE_INFO } from '../../../../../shared/hollandKisaEvaluation';
import { HollandTypeHexagon } from '../shared/HollandTypeHexagon';
import { HollandHexagonNodeHighlight } from '../../../../../shared/hollandHexagonSvg';

interface HollandKisaMeslekiTaramaReportProps {
  application: SurveyApplicationDto;
}

export const HollandKisaMeslekiTaramaReport: React.FC<HollandKisaMeslekiTaramaReportProps> = ({
  application
}) => {
  const answers = application.answers || [];
  const evaluation = getHollandKisaEvaluation(application);

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
  evaluation.top3Types.forEach((t, idx) => {
    highlights[t.typeKey] = {
      key: t.typeKey as any,
      rank: idx + 1,
      badgeLabel: `${idx + 1}. Sıra`,
      scoreText: `${t.score}/45`
    };
  });

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-slate-800 font-sans print:p-0 print:max-w-none">
      {/* 1. Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          T.C. MİLLÎ EĞİTİM BAKANLIĞI
        </div>
        <div className="text-sm font-semibold text-slate-700">
          Rehberlik ve Psikolojik Danışma Servisi
        </div>
        <div className="inline-block mt-2 px-5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg">
          <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            HOLLAND KISA BİÇİM MESLEKİ TARAMA ENVANTERİ
          </h1>
          <div className="text-xs font-bold text-sky-700">
            Bireysel Değerlendirme ve Sonuç Raporu (HOLLAND-KISA-30)
          </div>
        </div>
      </div>

      {/* 2. Student & Application Info Card */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-5 text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2 mb-3">
          Öğrenci ve Uygulama Bilgileri
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6">
          <div>
            <span className="text-slate-500 font-medium">Adı Soyadı:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{application.studentName}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Okul Numarası:</span>
            <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">{application.studentNumber}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Sınıfı / Şubesi:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{application.className || '—'}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Envanter Türü:</span>
            <div className="font-bold text-slate-900 mt-0.5">30 Madde (9'lu Likert)</div>
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

      {/* 3. Top 3 Banner */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-5 shadow-2xs space-y-3">
        <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-xs font-extrabold text-emerald-900 uppercase">Mesleki Kişilik Profili (İlk 3 Tip)</span>
          </div>
          <span className="font-mono font-bold text-sm bg-white px-2.5 py-0.5 rounded border border-emerald-200 text-emerald-950">
            Holland Kodu: {evaluation.hollandCode}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {evaluation.top3Types.map((t, idx) => (
            <div key={t.typeKey} className="bg-white border border-emerald-200 rounded-lg p-2.5">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">{idx + 1}. Tip</div>
              <div className="text-sm font-black text-slate-900">{t.title} ({t.code})</div>
              <div className="text-xs font-mono font-bold text-emerald-800">{t.score} / 45 Puan</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-emerald-950 font-medium leading-relaxed">
          {evaluation.summaryParagraph}
        </p>
      </div>

      {/* 4. Holland Hexagon Chart */}
      <HollandTypeHexagon
        highlights={highlights}
        className="mb-5"
      />

      {/* 5. 6 Types Score Table */}
      <div className="mb-6 space-y-2">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          6 Mesleki Kişilik Tipi Puan Dağılımı (Sıralı)
        </div>
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3 w-16 text-center border-r border-slate-300">Sıra</th>
                <th className="py-2.5 px-4 w-48 border-r border-slate-300">Mesleki Kişilik Tipi</th>
                <th className="py-2.5 px-4 w-32 text-center border-r border-slate-300">Puan (5-45)</th>
                <th className="py-2.5 px-4">Tip Özellikleri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {evaluation.sortedTypes.map((r, rankIdx) => {
                const isTop3 = rankIdx < 3;
                return (
                  <tr key={r.typeKey} className={isTop3 ? 'bg-emerald-50/40 font-semibold' : ''}>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                      {rankIdx + 1}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 border-r border-slate-200">
                      {r.title} ({r.code}) {isTop3 && <span className="text-[10px] text-emerald-700 font-bold ml-1">(İlk 3)</span>}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                      {r.score} / 45
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {r.metadata.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Guidance Note */}
      <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1 mb-6">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Rehberlik ve Değerlendirme Bilgilendirmesi</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {evaluation.guidanceNote}
        </p>
        <p className="text-[10.5px] text-slate-500 leading-relaxed border-t border-slate-200 pt-1 mt-1">
          {HOLLAND_KISA_SOURCE_INFO}
        </p>
      </div>

      {/* 6. Answers Table */}
      {answers && answers.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            30 Envanter Maddesi ve Verilen Yanıtlar (1-9 Likert)
          </div>
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2 px-3 w-12 text-center border-r border-slate-200">No</th>
                  <th className="py-2 px-3 border-r border-slate-200">Envanter Maddesi</th>
                  <th className="py-2 px-3 w-36 text-center">Verilen Puan (1-9)</th>
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
                    <td className="py-2 px-3 font-mono font-bold text-center text-slate-900">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {ans.answerValue || ans.selectedOptionLabel || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Signatures */}
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
