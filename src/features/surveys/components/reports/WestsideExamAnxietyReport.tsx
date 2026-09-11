import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { Brain, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getWestsideEvaluation } from '../../../../../shared/westsideEvaluation';

interface WestsideExamAnxietyReportProps {
  application: SurveyApplicationDto;
}

export const WestsideExamAnxietyReport: React.FC<WestsideExamAnxietyReportProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const rawTotal = result?.totalScore ?? (application.totalScore || 0);
  const evaluation = getWestsideEvaluation(rawTotal);

  const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const answers = application.answers || [];

  return (
    <div className="survey-print-report text-slate-900 bg-white p-6 sm:p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* 1. Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Rehberlik ve Psikolojik Danışma Servisi
        </div>
        <div className="inline-block mt-2 px-5 py-2 bg-slate-100 border border-slate-300 rounded-xl">
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 m-0">
            THE WESTSIDE SINAV KAYGISI ÖLÇEĞİ
          </h1>
          <div className="text-xs font-bold text-indigo-700 mt-0.5">
            Bireysel Değerlendirme ve Sonuç Raporu (WST-11)
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
            <span className="text-slate-500 font-medium">Uygulanan Ölçek:</span>
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

      {/* 3. Overall Score & Evaluation Summary */}
      <div className="border border-indigo-200 rounded-2xl p-5 mb-5 bg-indigo-50/40">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-200 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wide m-0">
                ORTALAMA ÖLÇEK PUANI
              </h2>
              <span className="text-[11px] font-medium text-indigo-700">11 Madde Ortalaması (1.00 - 5.00) &bull; Ham Toplam: {rawTotal}/55</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600">Ortalama Puan:</span>
            <span className="font-mono text-2xl font-black text-indigo-900 bg-white px-3.5 py-1 rounded-xl border border-indigo-300 shadow-2xs">
              {evaluation.averageScoreFormatted} <span className="text-sm font-normal text-slate-400">/ 5.00</span>
            </span>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2.5 mb-3.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Değerlendirme:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold border ${evaluation.category.colorClasses.badge}`}>
              {evaluation.category.categoryLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-bold text-slate-600">Risk Grubu (&gt; 3.00):</span>
            {evaluation.isRiskGroup ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>EVET</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>HAYIR</span>
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Bar (1.0 - 5.0) */}
        <div className="bg-white rounded-xl p-3 border border-indigo-100 space-y-2 mb-3">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full ${evaluation.category.colorClasses.bar}`}
              style={{
                width: `${Math.min(100, Math.max(0, ((evaluation.averageScore - 1) / 4) * 100))}%`,
                backgroundColor: evaluation.category.colorClasses.hex
              }}
            />
          </div>
          <div className="grid grid-cols-6 text-[9px] text-slate-500 font-semibold px-1 text-center">
            <span>1.0 - 1.9 (Rahat)</span>
            <span>2.0 - 2.5 (Normal)</span>
            <span>2.6 - 2.9 (Sınırda)</span>
            <span>3.0 - 3.4 (Orta-Yüksek)</span>
            <span>3.5 - 3.9 (Yüksek)</span>
            <span>4.0 - 5.0 (Aşırı)</span>
          </div>
        </div>

        {/* Guidance Note */}
        <div className="p-3.5 bg-white border border-indigo-200/80 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Ölçek Değerlendirmesi ve Rehberlik Yönlendirmesi</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {evaluation.category.description}
          </p>
        </div>
      </div>

      {/* 4. Question Breakdown Table */}
      {answers.length > 0 && (
        <div className="border border-slate-300 rounded-2xl overflow-hidden mb-6 shadow-2xs">
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 font-extrabold text-xs uppercase tracking-wider text-slate-800 flex justify-between items-center">
            <span>Madde ve Cevap Dağılımı</span>
            <span className="text-[11px] font-semibold text-slate-500">11 Madde (1-5 Puan)</span>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-2 px-3 w-10 text-center border-r border-slate-200">No</th>
                <th className="py-2 px-3 border-r border-slate-200">Ölçek Maddesi</th>
                <th className="py-2 px-3 w-40 border-r border-slate-200">Verilen Yanıt</th>
                <th className="py-2 px-3 w-20 text-center">Puan</th>
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
                  <td className="py-2 px-3 font-medium border-r border-slate-200">
                    {ans.selectedOptionLabel || ans.answerValue || '—'}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-center text-indigo-700 bg-indigo-50/30">
                    {ans.answerScore !== undefined ? ans.answerScore : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Signatures Block */}
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
