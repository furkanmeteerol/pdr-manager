import React from 'react';
import { MessageSquare, Info, BarChart3 } from 'lucide-react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { QuestionBreakdownTable } from './QuestionBreakdownTable';

export interface DevamsizlikNedenleriResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

const SUBSCALE_ITEM_RANGES: Record<string, { range: string; count: number; desc: string }> = {
  OKUL_YONETIM: { range: '1–10. Maddeler', count: 10, desc: 'Okul kuralları, idare, fiziki mekan ve ders saatleri' },
  OGRETMEN: { range: '11–17. Maddeler', count: 7, desc: 'Öğretmen tutumları, ders anlatımı ve disiplin' },
  AILE: { range: '18–26. Maddeler', count: 9, desc: 'Aile içi ilişkiler, ekonomik durum ve sorumluluklar' },
  CEVRE: { range: '27–31. Maddeler', count: 5, desc: 'Mesafe, hava koşulları ve okul yolu güvenliği' },
  AKADEMIK_KAYGI: { range: '32–36. Maddeler', count: 5, desc: 'Sınav kaygısı, ders başarısızlığı ve gelecek kaygısı' },
  KISISEL_NEDENLER: { range: '37–45. Maddeler', count: 9, desc: 'Sağlık, uyku, motivasyon ve aidiyet' },
  ARKADAS_CEVRESI: { range: '46–51. Maddeler', count: 6, desc: 'Akran ilişkileri, dışlanma ve akran baskısı' }
};

export const DevamsizlikNedenleriResultRenderer: React.FC<DevamsizlikNedenleriResultRendererProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const subscales = result?.subscales || [];

  // Find 52nd Open-Ended Question Answer
  const openEndedAnswer = application.answers?.find(
    a => a.questionOrder === 52 || a.questionText?.includes('diğer nedenler')
  );

  // Identify highest average subscale(s)
  const maxAverage = subscales.length > 0
    ? Math.max(...subscales.map(s => s.averageScore ?? (s.questionCount ? s.score / s.questionCount : s.score)))
    : 0;

  return (
    <div className="space-y-6 text-xs">
      {/* 1. MEB Evaluation Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-xs text-amber-950">
            MEB Devamsızlık Nedenleri Değerlendirme Esasları
          </h4>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            Bu ankette genel puan toplamı alınmaz; her bir alt boyutun <strong>Boyut Ortalama Puanına (0.00 – 2.00)</strong> bakılarak devamsızlığa en çok yol açan alan tespit edilir ve rehberlik çalışmaları bu doğrultuda planlanır.
          </p>
        </div>
      </div>

      {/* 2. 7 Subscale Average Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>7 Alt Boyut Ortalama Puanları (0.00 – 2.00 Aralığı)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            (Evet: 2, Bazen: 1, Hayır: 0)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {subscales.map((sub, idx) => {
            const avgScore = sub.averageScore ?? (sub.questionCount && sub.questionCount > 0 ? Number((sub.score / sub.questionCount).toFixed(2)) : sub.score);
            const isHighest = maxAverage > 0 && avgScore === maxAverage;
            const meta = SUBSCALE_ITEM_RANGES[sub.code] || { range: `${sub.questionCount || 0} Madde`, count: sub.questionCount || 0, desc: '' };
            const percentage = Math.min(100, Math.round((avgScore / 2.0) * 100));

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isHighest
                    ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800 leading-snug">
                      {sub.title}
                    </span>
                    {isHighest && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] shrink-0 shadow-2xs">
                        En Belirgin Alan
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {meta.range} ({meta.count} Soru)
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-600 font-semibold">Ortalama Puan:</span>
                    <span className="font-mono font-extrabold text-base text-slate-900">
                      {avgScore.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 2.00</span>
                    </span>
                  </div>

                  {/* Progress Bar (0 to 2 scale) */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isHighest ? 'bg-blue-600' : 'bg-slate-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-500 truncate" title={meta.desc}>
                    {meta.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Open-Ended Question Callout Card (Madde 52) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <span>Öğrencinin Belirttiği Diğer Nedenler (Madde 52)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-medium">
          {openEndedAnswer?.answerValue && openEndedAnswer.answerValue.trim() !== '' ? (
            <p className="text-xs text-slate-900 font-medium italic">
              "{openEndedAnswer.answerValue.trim()}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Öğrenci bu alana ek bir devamsızlık nedeni yazmamıştır.
            </p>
          )}
        </div>
      </div>

      {/* 4. Filterable Question Breakdown (Items 1–51) */}
      {application.answers && application.answers.length > 0 && (
        <QuestionBreakdownTable
          answers={application.answers}
          subscales={subscales.map(s => ({ code: s.code, title: s.title }))}
          excludeQuestionOrders={[52]}
        />
      )}
    </div>
  );
};
