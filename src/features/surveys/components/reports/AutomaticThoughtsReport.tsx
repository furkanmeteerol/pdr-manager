import React from 'react';
import { evaluateAutomaticThoughts, ATQ_SCALE_METADATA } from '../../../../../shared/automaticThoughtsEvaluation';
import { Info } from 'lucide-react';

interface AutomaticThoughtsReportProps {
  application: any;
  student?: any;
  onPrint?: () => void;
  onClose?: () => void;
}

export const AutomaticThoughtsReport: React.FC<AutomaticThoughtsReportProps> = ({
  application,
  student,
  onPrint,
  onClose
}) => {
  const result = evaluateAutomaticThoughts(application);

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
        <h1 className="text-xl font-bold">Otomatik Düşünceler Ölçeği Raporu</h1>
        <div className="flex gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
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
          <h4 className="text-base font-semibold text-indigo-700 dark:text-indigo-400">
            Otomatik Düşünceler Ölçeği (ATQ-30) Bireysel Sonuç Raporu
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

        {/* Primary Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Ölçek Toplam Puanı
            </div>
            <div className="text-4xl font-black text-indigo-950 dark:text-indigo-100 my-2">
              {result.totalScore} <span className="text-lg font-medium text-indigo-500">/ 150</span>
            </div>
            <div className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
              Teorik Puan Aralığı: 30 – 150
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Ortalama Madde Puanı
            </div>
            <div className="text-4xl font-black text-neutral-900 dark:text-neutral-100 my-2">
              {result.averageScore.toFixed(2)} <span className="text-lg font-medium text-neutral-400">/ 5.00</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Cevaplanan Madde: {result.answeredItemCount} / 30
            </div>
          </div>
        </div>

        {/* Source Guidance / Safe Disclaimer Note */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 rounded-xl p-4 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-100">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Kaynak Değerlendirme Esasları</span>
          </div>
          <p className="leading-relaxed">
            <strong>{result.sourceInterpretation}</strong> {result.sourceDisclaimer}
          </p>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40">
            <strong>Ölçek Kaynağı:</strong> {ATQ_SCALE_METADATA.sourceCitation}
          </div>
        </div>

        {/* 30 Items Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Madde Bazlı Cevap Özeti
          </h4>
          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-3 py-2 text-center w-10">#</th>
                  <th className="px-3 py-2">Madde İfadesi</th>
                  <th className="px-3 py-2 text-center w-32">Verilen Cevap</th>
                  <th className="px-3 py-2 text-center w-16">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                {result.itemScores.map((item) => (
                  <tr key={item.itemNumber} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-3 py-2 text-center font-semibold text-neutral-400">
                      {item.itemNumber}
                    </td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">
                      {item.itemText}
                    </td>
                    <td className="px-3 py-2 text-center font-medium">
                      {item.selectedOptionLabel}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {item.calculatedScore > 0 ? item.calculatedScore : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-400 dark:text-neutral-500">
          <span>PDR Manager • Otomatik Düşünceler Ölçeği</span>
          <span>Rapor Oluşturulma: {new Date().toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    </div>
  );
};
