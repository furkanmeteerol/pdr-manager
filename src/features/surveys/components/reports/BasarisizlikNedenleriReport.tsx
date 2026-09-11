import React from 'react';
import {
  evaluateIndividualBNA,
  BNA_SCALE_METADATA,
  BNA_DISCLAIMER_TEXT
} from '../../../../../shared/basarisizlikNedenleriEvaluation';
import { Info } from 'lucide-react';

interface BasarisizlikNedenleriReportProps {
  application: any;
  student?: any;
  onPrint?: () => void;
  onClose?: () => void;
}

export const BasarisizlikNedenleriReport: React.FC<BasarisizlikNedenleriReportProps> = ({
  application,
  student,
  onPrint,
  onClose
}) => {
  const rawMetrics = typeof application?.resultSnapshot?.rawMetrics === 'string'
    ? (() => { try { return JSON.parse(application.resultSnapshot.rawMetrics); } catch { return {}; } })()
    : (application?.resultSnapshot?.rawMetrics || {});

  const subjectTextOverride =
    application?.resultSnapshot?.subjectText ||
    rawMetrics?.subjectText ||
    application?.subjectText;

  const result = evaluateIndividualBNA(application, subjectTextOverride);

  const studentName = student?.fullName || student?.name || application?.studentName || 'Öğrenci';
  const studentNo = student?.studentNumber || student?.schoolNumber || application?.studentNumber || '—';
  const className = student?.class || student?.className || application?.className || '—';
  const appDate = application?.completedAt || application?.createdAt
    ? new Date(application.completedAt || application.createdAt).toLocaleDateString('tr-TR')
    : new Date().toLocaleDateString('tr-TR');

  return (
    <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-screen p-6 md:p-8 space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <h1 className="text-xl font-bold">Başarısızlık Nedenleri Anketi Raporu</h1>
        <div className="flex gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              PDF / Yazdır
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Formal Printable Document Header */}
      <div className="text-center space-y-1 pb-4 border-b-2 border-neutral-900 dark:border-neutral-100">
        <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">T.C. MİLLÎ EĞİTİM BAKANLIĞI</h2>
        <h1 className="text-lg font-bold uppercase">{BNA_SCALE_METADATA.name} (BNA-44)</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">Bireysel Değerlendirme ve Rehberlik Raporu</p>
      </div>

      {/* Student Meta Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
        <div>
          <span className="text-neutral-500 block">Öğrenci Adı Soyadı:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{studentName}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Okul Numarası:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{studentNo}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Sınıf / Şube:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{className}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Uygulama Tarihi:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{appDate}</span>
        </div>
      </div>

      {/* Subject Line */}
      <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-900 dark:text-sky-200">
        <span className="underline">{result.subjectText || '................................'}</span> derslerinden notlarım düşük ve başarılı değilim. Çünkü;
      </div>

      {/* 44 Items Table (2 Columns) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          📋 44 Başarısızlık Nedeninin Tamamı ve İşaretleme Durumu
        </h3>
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-2 text-center w-10 border-r border-neutral-200 dark:border-neutral-700">No</th>
                <th className="p-2 border-r border-neutral-200 dark:border-neutral-700">Neden / İfade</th>
                <th className="p-2 text-center w-14 border-r-2 border-neutral-300 dark:border-neutral-600">Durum</th>
                <th className="p-2 text-center w-10 border-r border-neutral-200 dark:border-neutral-700">No</th>
                <th className="p-2 border-r border-neutral-200 dark:border-neutral-700">Neden / İfade</th>
                <th className="p-2 text-center w-14">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {result.itemStates.slice(0, 22).map((left, idx) => {
                const right = result.itemStates[idx + 22];
                return (
                  <tr key={left.itemNumber} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-1.5 text-center font-bold text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700">
                      {left.itemNumber}
                    </td>
                    <td className="p-1.5 text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-700 text-[11px]">
                      {left.itemText}
                    </td>
                    <td className={`p-1.5 text-center font-extrabold border-r-2 border-neutral-300 dark:border-neutral-600 ${left.isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400'}`}>
                      {left.isSelected ? '✓' : '-'}
                    </td>
                    <td className="p-1.5 text-center font-bold text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700">
                      {right ? right.itemNumber : ''}
                    </td>
                    <td className="p-1.5 text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-700 text-[11px]">
                      {right ? right.itemText : ''}
                    </td>
                    <td className={`p-1.5 text-center font-extrabold ${right?.isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400'}`}>
                      {right ? (right.isSelected ? '✓' : '-') : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
        <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
        <div>
          <strong>Bilgilendirme:</strong> {BNA_DISCLAIMER_TEXT}
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-8 flex justify-between text-xs text-center border-t border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="font-bold">Psikolojik Danışman / Rehber Öğretmen</p>
          <div className="mt-8 text-neutral-400">İmza</div>
        </div>
        <div>
          <p className="font-bold">Okul Müdürü</p>
          <div className="mt-8 text-neutral-400">İmza / Mühür</div>
        </div>
      </div>
    </div>
  );
};
