import React from 'react';
import {
  evaluateCalismaDavranisi,
  CDDE_SCALE_METADATA
} from '../../../../../shared/calismaDavranisiEvaluation';
import { Info } from 'lucide-react';

interface CalismaDavranisiReportProps {
  application: any;
  student?: any;
  onPrint?: () => void;
  onClose?: () => void;
}

export const CalismaDavranisiReport: React.FC<CalismaDavranisiReportProps> = ({
  application,
  student,
  onPrint,
  onClose
}) => {
  const result = evaluateCalismaDavranisi(application);

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
        <h1 className="text-xl font-bold">Çalışma Davranışını Değerlendirme Ölçeği Raporu</h1>
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
        <h1 className="text-lg font-bold uppercase">{CDDE_SCALE_METADATA.title} ({CDDE_SCALE_METADATA.code})</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">Bireysel Değerlendirme ve Rehberlik Sonuç Raporu</p>
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

      {/* 7 Category Evaluation Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          📊 Alt Alan Puanları ve Değerlendirmeleri (A–G)
        </h3>
        <div className="space-y-3">
          {result.categoryResults.map((cat) => {
            let badgeBg = 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300';
            const lower = cat.level.toLowerCase();
            if (lower.includes('ciddi') || lower.includes('eksik') || lower.includes('olumsuz')) {
              badgeBg = 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
            } else if (lower.includes('bazı') || lower.includes('hata')) {
              badgeBg = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
            } else if (lower.includes('yok') || lower.includes('olumlu') || lower.includes('yeterli')) {
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
            }

            return (
              <div
                key={cat.categoryKey}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      Alan {cat.categoryKey}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Güçlük Puanı: <strong className="text-sky-600 dark:text-sky-400 font-bold">{cat.score}</strong> / {cat.itemCount}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg}`}>
                      {cat.levelText}
                    </span>
                  </div>
                </div>
                <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed pt-1">
                  {cat.interpretation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance Note */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
        <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
        <div>
          <strong>Yorum Anahtarı ve Rehberlik Esasları:</strong> Bu ölçekte genel toplam puan bulunmaz. Öğrencinin "Ciddi güçlük" veya "Bazı güçlükler" düzeyinde puan aldığı alanlar, psikolojik danışman tarafından bireysel veya grup rehberliği kapsamında çalışma becerileri ve verimli ders çalışma programı ile desteklenmelidir.
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
