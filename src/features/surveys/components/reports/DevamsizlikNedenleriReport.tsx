import React from 'react';
import { SurveyApplicationDto } from '@shared/ipc-types';

interface DevamsizlikNedenleriReportProps {
  application: SurveyApplicationDto;
}

const SUBSCALE_META: Record<string, { range: string; count: number; desc: string }> = {
  OKUL_YONETIM: { range: '1–10. Maddeler', count: 10, desc: 'Okul kuralları, idare, fiziki mekan ve ders saatleri kaynaklı nedenler' },
  OGRETMEN: { range: '11–17. Maddeler', count: 7, desc: 'Öğretmen tutumları, ders anlatımı ve disiplin kaynaklı nedenler' },
  AILE: { range: '18–26. Maddeler', count: 9, desc: 'Aile içi ilişkiler, ekonomik durum ve sorumluluklar kaynaklı nedenler' },
  CEVRE: { range: '27–31. Maddeler', count: 5, desc: 'Mesafe, hava koşulları ve okul yolu güvenliği kaynaklı nedenler' },
  AKADEMIK_KAYGI: { range: '32–36. Maddeler', count: 5, desc: 'Sınav kaygısı, ders başarısızlığı ve gelecek kaygısı kaynaklı nedenler' },
  KISISEL_NEDENLER: { range: '37–45. Maddeler', count: 9, desc: 'Sağlık, uyku, motivasyon ve aidiyet kaynaklı nedenler' },
  ARKADAS_CEVRESI: { range: '46–51. Maddeler', count: 6, desc: 'Akran ilişkileri, dışlanma ve akran baskısı kaynaklı nedenler' }
};

export const DevamsizlikNedenleriReport: React.FC<DevamsizlikNedenleriReportProps> = ({
  application
}) => {
  const result = application.resultSnapshot;
  const subscales = result?.subscales || [];

  // Identify highest average subscale(s)
  const maxAverage = subscales.length > 0
    ? Math.max(...subscales.map(s => s.averageScore ?? (s.questionCount ? s.score / s.questionCount : s.score)))
    : 0;

  const highestSubscales = subscales.filter(s => {
    const avg = s.averageScore ?? (s.questionCount && s.questionCount > 0 ? Number((s.score / s.questionCount).toFixed(2)) : s.score);
    return maxAverage > 0 && Math.abs(avg - maxAverage) < 0.001;
  });

  const highestSubscalesText = highestSubscales.length > 0
    ? highestSubscales.map(s => `${s.title} (${(s.averageScore ?? (s.score / (s.questionCount || 1))).toFixed(2)} / 2.00)`).join(', ')
    : 'Belirgin bir alan tespit edilmemiştir';

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
      {/* 1. Header */}
      <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
        <div className="text-xs font-semibold text-slate-600">Rehberlik ve Psikolojik Danışma Servisi</div>
        <div className="inline-block mt-2 px-4 py-1.5 bg-slate-100 border border-slate-300 rounded-lg">
          <h1 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 m-0">
            DEVAMSIZLIK NEDENLERİ ANKETİ
          </h1>
          <div className="text-[11px] font-bold text-blue-700 mt-0.5">Öğrenci Değerlendirme Sonuç Raporu</div>
        </div>
      </div>

      {/* 2. Student & Application Info Card */}
      <div className="border border-slate-300 rounded-lg p-3.5 mb-4 bg-slate-50/60">
        <div className="text-[11px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-2.5">
          Öğrenci ve Uygulama Bilgileri
        </div>
        <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-xs">
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
      <div className="border-l-4 border-blue-600 bg-blue-50/50 p-2.5 rounded-r-lg mb-4 text-[11px] text-slate-700 leading-snug">
        <strong>MEB Değerlendirme Esasları:</strong> Bu ankette genel puan toplamı alınmaz; her bir alt boyutun <strong>Boyut Ortalama Puanına (0.00 – 2.00)</strong> bakılarak devamsızlığa en çok yol açan alan tespit edilir ve rehberlik çalışmaları bu doğrultuda planlanır. (Evet = 2, Bazen = 1, Hayır = 0).
      </div>

      {/* 4. En Belirgin Alan Card */}
      <div className="border border-blue-200 bg-gradient-to-r from-blue-50/80 to-slate-50 rounded-lg p-2.5 mb-4 flex items-center justify-between">
        <div className="text-xs">
          <span className="font-extrabold uppercase text-blue-900 mr-2">En Belirgin Alan:</span>
          <span className="font-extrabold text-slate-900">{highestSubscalesText}</span>
        </div>
        <div className="text-[10px] font-semibold text-slate-500">
          (En yüksek ortalama puana sahip alt boyut)
        </div>
      </div>

      {/* 5. 7 Subscales Table */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
              <th className="p-2.5 w-8 text-center">#</th>
              <th className="p-2.5">Alt Boyut Adı</th>
              <th className="p-2.5 text-center w-28">Madde Aralığı</th>
              <th className="p-2.5 text-center w-20">Soru Sayısı</th>
              <th className="p-2.5 text-right w-28">Ortalama Puan</th>
              <th className="p-2.5 text-center w-32">Puan Dağılımı</th>
              <th className="p-2.5 text-center w-28">Değerlendirme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {subscales.map((sub, idx) => {
              const avgScore = sub.averageScore ?? (sub.questionCount && sub.questionCount > 0 ? Number((sub.score / sub.questionCount).toFixed(2)) : sub.score);
              const isHighest = maxAverage > 0 && Math.abs(avgScore - maxAverage) < 0.001;
              const meta = SUBSCALE_META[sub.code] || { range: `${sub.questionCount || 0} Madde`, count: sub.questionCount || 0, desc: '' };
              const percentage = Math.min(100, Math.max(0, Math.round((avgScore / 2.0) * 100)));

              return (
                <tr key={idx} className={isHighest ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/50'}>
                  <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900">{sub.title}</td>
                  <td className="p-2.5 text-center text-slate-600">{meta.range}</td>
                  <td className="p-2.5 text-center text-slate-600">{`${meta.count} Soru`}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {`${avgScore.toFixed(2)} / 2.00`}
                  </td>
                  <td className="p-2.5 align-middle">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${isHighest ? 'bg-blue-600' : 'bg-slate-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-2.5 text-center">
                    {isHighest ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider">
                        En Belirgin Alan
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Signature Block */}
      <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-12 text-xs mt-auto">
        <div className="text-center space-y-8">
          <p className="font-bold text-slate-700">Öğrenci</p>
          <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 text-slate-400 italic text-[10px]">
            İmza
          </div>
        </div>
        <div className="text-center space-y-8">
          <p className="font-bold text-slate-700">Psikolojik Danışman / Rehber Öğretmen</p>
          <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 text-slate-400 italic text-[10px]">
            İmza / Mühür
          </div>
        </div>
      </div>
    </div>
  );
};
