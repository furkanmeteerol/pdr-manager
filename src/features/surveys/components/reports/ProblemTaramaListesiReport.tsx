import React from 'react';
import {
  getPTLEvaluation,
  PTL_SCALE_METADATA
} from '../../../../../shared/problemTaramaListesiEvaluation';
import { Printer } from 'lucide-react';

interface ProblemTaramaListesiReportProps {
  application: any;
  student?: any;
  onPrint?: () => void;
  onClose?: () => void;
}

export const ProblemTaramaListesiReport: React.FC<ProblemTaramaListesiReportProps> = ({
  application,
  student,
  onPrint,
  onClose
}) => {
  const result = getPTLEvaluation(application);

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
        <h1 className="text-xl font-bold">Problem Tarama Listesi Raporu</h1>
        <div className="flex gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Yazdır</span>
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
        <h1 className="text-lg font-bold uppercase">{PTL_SCALE_METADATA.title} ({PTL_SCALE_METADATA.code})</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">Bireysel Problem Tarama ve Rehberlik Sonuç Raporu</p>
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

      {/* Overall Score Box */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between">
        <div>
          <div className="text-xs text-sky-800 dark:text-sky-300 font-bold uppercase">Toplam İşaretlenen Problem</div>
          <div className="text-2xl font-black text-sky-950 dark:text-sky-100 font-mono">
            {result.totalSelected} <span className="text-sm font-normal text-sky-600">/ 176 (%{result.percentage})</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500 font-semibold mb-1">Kaynak Sınıflandırması</div>
          {result.sourceClassification.available ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white">
              {result.sourceClassification.level} Problemli
            </span>
          ) : (
            <span className="text-xs text-neutral-600 font-medium">Tanım Bulunmuyor</span>
          )}
        </div>
      </div>

      {/* 7 Section Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          📊 7 Alt Alan Problem Sayıları
        </h3>
        <table className="w-full text-left text-xs border-collapse border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
              <th className="p-2.5 text-center w-16 border-r border-neutral-200 dark:border-neutral-700">Bölüm</th>
              <th className="p-2.5 border-r border-neutral-200 dark:border-neutral-700">Alan Adı</th>
              <th className="p-2.5 text-center w-28 border-r border-neutral-200 dark:border-neutral-700">İşaretlenen</th>
              <th className="p-2.5 text-center w-20">Oran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {result.sections.map(sec => (
              <tr key={sec.code} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="p-2.5 text-center font-bold font-mono text-sky-700 dark:text-sky-400 border-r border-neutral-200 dark:border-neutral-700">
                  {sec.romanCode} ({sec.code})
                </td>
                <td className="p-2.5 font-medium text-neutral-900 dark:text-neutral-100 border-r border-neutral-200 dark:border-neutral-700">
                  {sec.title}
                </td>
                <td className="p-2.5 text-center font-bold text-sky-700 dark:text-sky-400 border-r border-neutral-200 dark:border-neutral-700">
                  {sec.selectedCount} / {sec.totalCount}
                </td>
                <td className="p-2.5 text-center text-neutral-600 dark:text-neutral-400">
                  %{sec.percentage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Marked Items List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          📌 Öğrenci Tarafından İşaretlenen Problemler ({result.totalSelected})
        </h3>
        {result.totalSelected > 0 ? (
          <div className="space-y-3">
            {result.sections.filter(s => s.selectedCount > 0).map(sec => (
              <div key={sec.code} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                <div className="font-bold text-sky-800 dark:text-sky-300 border-b border-neutral-200 dark:border-neutral-700 pb-1">
                  Bölüm {sec.romanCode} — {sec.title} ({sec.selectedCount} problem)
                </div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  {sec.selectedItems.map(item => (
                    <li key={item.globalIndex}>
                      <span className="font-mono font-bold text-neutral-500">[{item.questionNumber}]</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 text-center italic">
            Bu uygulamada işaretlenmiş herhangi bir problem bulunmamaktadır.
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="pt-8 flex justify-between text-xs text-center border-t border-neutral-200 dark:border-neutral-800">
        <div>
          <p className="font-bold">Öğrenci</p>
          <div className="mt-8 text-neutral-400">İmza</div>
        </div>
        <div>
          <p className="font-bold">Psikolojik Danışman / Rehber Öğretmen</p>
          <div className="mt-8 text-neutral-400">İmza</div>
        </div>
      </div>
    </div>
  );
};
