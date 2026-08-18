import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';

interface SurveyResultPrintReportProps {
  application: SurveyApplicationDto;
}

const SUBSCALE_META: Record<string, { range: string; count: number; desc: string }> = {
  OKUL_YONETIM: { range: '1–10. Maddeler', count: 10, desc: 'Okul kuralları, idare, fiziki mekan ve ders saatleri' },
  OGRETMEN: { range: '11–17. Maddeler', count: 7, desc: 'Öğretmen tutumları, ders anlatımı ve disiplin' },
  AILE: { range: '18–26. Maddeler', count: 9, desc: 'Aile içi ilişkiler, ekonomik durum ve sorumluluklar' },
  CEVRE: { range: '27–31. Maddeler', count: 5, desc: 'Mesafe, hava koşulları ve okul yolu güvenliği' },
  AKADEMIK_KAYGI: { range: '32–36. Maddeler', count: 5, desc: 'Sınav kaygısı, ders başarısızlığı ve gelecek kaygısı' },
  KISISEL_NEDENLER: { range: '37–45. Maddeler', count: 9, desc: 'Sağlık, uyku, motivasyon ve aidiyet' },
  ARKADAS_CEVRESI: { range: '46–51. Maddeler', count: 6, desc: 'Akran ilişkileri, dışlanma ve akran baskısı' }
};

export const SurveyResultPrintReport: React.FC<SurveyResultPrintReportProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const subscales = result?.subscales || [];

  // Calculate highest average
  const maxAverage = subscales.length > 0
    ? Math.max(...subscales.map(s => s.averageScore ?? (s.questionCount ? s.score / s.questionCount : s.score)))
    : 0;

  const formattedDate = new Date(application.completedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = new Date(application.completedAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="survey-print-report text-slate-900 bg-white p-8 max-w-4xl mx-auto font-sans leading-normal">
      {/* 1. Formal Report Header */}
      <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
          DEVAMSIZLIK NEDENLERİ ANKETİ
        </h1>
        <h2 className="text-sm font-semibold text-slate-600 tracking-normal mt-1">
          Anket Sonuç Raporu
        </h2>
      </div>

      {/* 2. Student & Application Information Grid */}
      <div className="border border-slate-300 rounded-lg p-4 mb-6 bg-slate-50/50">
        <h3 className="text-xs font-bold uppercase text-slate-700 mb-3 border-b border-slate-200 pb-1">
          Öğrenci ve Uygulama Bilgileri
        </h3>
        <div className="grid grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Adı Soyadı:</span>
            <div className="font-bold text-slate-900 mt-0.5">{application.studentName}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Okul Numarası:</span>
            <div className="font-bold text-slate-900 mt-0.5 font-mono">{application.studentNumber}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Sınıfı / Şubesi:</span>
            <div className="font-bold text-slate-900 mt-0.5">{application.className || '—'}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Uygulanan Anket:</span>
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

      {/* 3. MEB Evaluation Notice */}
      <div className="border-l-4 border-blue-600 bg-blue-50/40 p-3 rounded-r-lg mb-6 text-xs text-slate-700">
        <p className="font-semibold text-slate-900 mb-0.5">Değerlendirme Esası:</p>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Bu ankette toplam puan hesaplanmaz. Her bir alt boyutun <strong>Ortalama Puanı (0.00 – 2.00 aralığı)</strong> incelenerek öğrencinin devamsızlığına en çok etki eden alanlar tespit edilir (Evet = 2, Bazen = 1, Hayır = 0).
        </p>
      </div>

      {/* 4. 7 Subscales Summary Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase text-slate-800 mb-2">
          7 Alt Boyut Sonuç Tablosu
        </h3>
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5">Alt Boyut Adı</th>
                <th className="p-2.5 text-center">Madde Aralığı</th>
                <th className="p-2.5 text-center">Soru Sayısı</th>
                <th className="p-2.5 text-right">Ortalama Puan</th>
                <th className="p-2.5 text-center">Değerlendirme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscales.map((sub, idx) => {
                const avgScore = sub.averageScore ?? (sub.questionCount && sub.questionCount > 0 ? Number((sub.score / sub.questionCount).toFixed(2)) : sub.score);
                const isHighest = maxAverage > 0 && avgScore === maxAverage;
                const meta = SUBSCALE_META[sub.code] || { range: `${sub.questionCount || 0} Madde`, count: sub.questionCount || 0, desc: '' };

                return (
                  <tr key={idx} className={isHighest ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/50'}>
                    <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900">{sub.title}</td>
                    <td className="p-2.5 text-center text-slate-600">{meta.range}</td>
                    <td className="p-2.5 text-center text-slate-600">{`${meta.count} Soru`}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {`${avgScore.toFixed(2)} / 2.00`}
                    </td>
                    <td className="p-2.5 text-center">
                      {isHighest ? (
                        <span className="inline-block px-2 py-0.5 rounded-sm bg-blue-600 text-white font-bold text-[10px] uppercase">
                          En Belirgin Alan
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Subscale Cards Grid for Visual Detail */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase text-slate-800 mb-2.5">
          Alt Boyut Dağılımı ve Detaylar
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {subscales.map((sub, idx) => {
            const avgScore = sub.averageScore ?? (sub.questionCount && sub.questionCount > 0 ? Number((sub.score / sub.questionCount).toFixed(2)) : sub.score);
            const isHighest = maxAverage > 0 && avgScore === maxAverage;
            const meta = SUBSCALE_META[sub.code] || { range: `${sub.questionCount || 0} Madde`, count: sub.questionCount || 0, desc: '' };
            const percentage = Math.min(100, Math.round((avgScore / 2.0) * 100));

            return (
              <div 
                key={idx}
                className={`p-3 border rounded-lg ${
                  isHighest ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900">{sub.title}</span>
                  {isHighest && (
                    <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-100 px-1.5 py-0.5 rounded-sm">
                      En Belirgin Alan
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mb-2">
                  {meta.range} ({meta.count} Soru) • {meta.desc}
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Ortalama Puan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {avgScore.toFixed(2)} / 2.00
                  </span>
                </div>
                {/* Visual Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${isHighest ? 'bg-blue-600' : 'bg-slate-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Formal Signature Block */}
      <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs mt-auto">
        <div className="text-center space-y-12">
          <p className="font-bold text-slate-700">Öğrenci</p>
          <p className="text-slate-400 italic">İmza</p>
        </div>
        <div className="text-center space-y-12">
          <p className="font-bold text-slate-700">Psikolojik Danışman / Rehber Öğretmen</p>
          <p className="text-slate-400 italic">İmza / Mühür</p>
        </div>
      </div>
    </div>
  );
};
