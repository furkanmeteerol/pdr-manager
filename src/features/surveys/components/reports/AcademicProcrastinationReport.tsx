import React from 'react';
import { evaluateAcademicProcrastination } from '../../../../../shared/academicProcrastinationEvaluation';
import { Info } from 'lucide-react';

interface AcademicProcrastinationReportProps {
  application: any;
  student?: any;
  onPrint?: () => void;
  onClose?: () => void;
}

export const AcademicProcrastinationReport: React.FC<AcademicProcrastinationReportProps> = ({
  application,
  student,
  onPrint,
  onClose
}) => {
  const answers = application?.answers || {};
  const result = evaluateAcademicProcrastination(answers);

  const studentName = student?.fullName || student?.name || application?.studentName || 'Öğrenci';
  const studentNo = student?.studentNumber || student?.schoolNumber || application?.studentNumber || '—';
  const className = student?.class || student?.className || application?.className || '—';
  const appDate = application?.completedAt || application?.createdAt
    ? new Date(application.completedAt || application.createdAt).toLocaleDateString('tr-TR')
    : new Date().toLocaleDateString('tr-TR');

  return (
    <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-screen p-6 md:p-8 space-y-6">
      {/* Header bar for modal view */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <h1 className="text-xl font-bold">Akademik Erteleme Ölçeği Raporu</h1>
        <div className="flex gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition"
            >
              PDF / Yazdır
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition"
            >
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title & Institutional Block */}
        <div className="text-center space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-black tracking-tight uppercase">T.C. MİLLÎ EĞİTİM BAKANLIĞI</h2>
          <h3 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
            Rehberlik ve Psikolojik Danışma Hizmetleri
          </h3>
          <h4 className="text-base font-semibold text-sky-700 dark:text-sky-400">
            Akademik Erteleme Ölçeği (AEO-19) Bireysel Sonuç Raporu
          </h4>
        </div>

        {/* Student Info Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm">
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Öğrenci Adı Soyadı</span>
            <span className="font-semibold">{studentName}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Okul No</span>
            <span className="font-semibold">{studentNo}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Sınıf / Şube</span>
            <span className="font-semibold">{className}</span>
          </div>
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Uygulama Tarihi</span>
            <span className="font-semibold">{appDate}</span>
          </div>
        </div>

        {/* Result Score Card */}
        <div className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Alınan Toplam Erteleme Puanı
              </span>
              <div className="text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {result.totalScore} <span className="text-lg font-normal text-neutral-400">/ 95</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Erteleme Eğilimi Düzeyi
              </span>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
                %{result.procrastinationPercentage}
              </div>
            </div>
          </div>

          <div className="relative h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-400 via-indigo-500 to-amber-500 rounded-full"
              style={{ width: `${result.procrastinationPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
            <span>19 (En Düşük Erteleme)</span>
            <span>57 (Orta Nokta)</span>
            <span>95 (En Yüksek Erteleme)</span>
          </div>
        </div>

        {/* Interpretation & Guidance Context */}
        <div className="p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3 text-sm">
          <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Ölçek ve Değerlendirme Hakkında Açıklama
          </h4>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
            Akademik Erteleme Ölçeği, bireyin ders çalışma, ödev hazırlama, sınavlara hazırlanma ve akademik görevleri yerine getirmedeki erteleme tutumlarını ölçmeyi amaçlar (Cronbach α = 0.870). Ölçekten elde edilen puan 19 ile 95 arasında değişmekte olup puanın yükselmesi akademik erteleme davranışının arttığına işaret eder.
          </p>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
            Ölçekteki <strong>3, 6, 11, 14 ve 17. maddeler</strong> ters yönde puanlanmaktadır. Elde edilen sonuçlar doğrultusunda öğrenci ile zaman yönetimi, ertelemeye yol açan duygusal/bilişsel etkenler ve hedef belirleme üzerine görüşmeler yapılması önerilir.
          </p>
        </div>

        {/* Detailed Item Scores Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-700 font-bold text-sm">
            Madde Puanları Çizelgesi
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-3 py-2 w-10 text-center">No</th>
                <th className="px-3 py-2">Madde İfadesi</th>
                <th className="px-3 py-2 w-20 text-center">Ters Madde</th>
                <th className="px-3 py-2 w-20 text-center">Verilen Yanıt</th>
                <th className="px-3 py-2 w-20 text-center">Hesaplanan Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60">
              {result.itemScores.map((item) => (
                <tr key={item.itemNumber} className={item.isReverse ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}>
                  <td className="px-3 py-2 text-center font-bold text-neutral-500">{item.itemNumber}</td>
                  <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{item.itemText}</td>
                  <td className="px-3 py-2 text-center font-medium">
                    {item.isReverse ? <span className="text-amber-600 dark:text-amber-400">Evet</span> : '—'}
                  </td>
                  <td className="px-3 py-2 text-center font-medium">{item.rawScore || '—'}</td>
                  <td className="px-3 py-2 text-center font-bold">{item.calculatedScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Area */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-8">
            <div className="font-semibold text-neutral-600 dark:text-neutral-400">Uygulayan / Danışman</div>
            <div className="border-t border-neutral-300 dark:border-neutral-700 w-40 mx-auto pt-1 font-medium">
              İmza
            </div>
          </div>
          <div className="space-y-8">
            <div className="font-semibold text-neutral-600 dark:text-neutral-400">Okul Psikolojik Danışmanı</div>
            <div className="border-t border-neutral-300 dark:border-neutral-700 w-40 mx-auto pt-1 font-medium">
              İmza / Mühür
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
