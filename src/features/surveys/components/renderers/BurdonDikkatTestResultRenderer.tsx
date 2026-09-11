import React, { useMemo, useState } from 'react';
import { SurveyApplicationDto, SurveyResultPresentationConfig } from '@shared/ipc-types';
import { 
  evaluateBurdonTest, 
  getBurdonMatrixCells 
} from '../../../../../shared/burdonDikkatEvaluation';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  BarChart3 
} from 'lucide-react';

export interface BurdonDikkatTestResultRendererProps {
  application: SurveyApplicationDto;
  presentationConfig?: SurveyResultPresentationConfig;
}

export const BurdonDikkatTestResultRenderer: React.FC<BurdonDikkatTestResultRendererProps> = ({
  application
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'sections' | 'rows' | 'matrix'>('summary');

  const evaluation = useMemo(() => {
    return evaluateBurdonTest(application);
  }, [application]);

  const allCells = useMemo(() => getBurdonMatrixCells(), []);
  const markedSet = useMemo(() => new Set(evaluation.markedCellIds), [evaluation.markedCellIds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/30">
                BURDON
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Dikkat Gücü ve Yoğunlaşması Performans Testi
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Burdon Dikkat Testi Değerlendirme Sonucu
            </h2>
            {application.studentName && (
              <p className="text-xs text-slate-300 mt-1">
                Öğrenci: <strong className="text-white">{application.studentName}</strong> 
                {application.studentNumber && ` (${application.studentNumber})`}
                {application.className && ` • Sınıf: ${application.className}`}
                {application.attemptNumber && ` • Uygulama: Deneme #${application.attemptNumber}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <Clock className="w-8 h-8 text-sky-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-300">Uygulama Süresi</div>
              <div className="text-xl font-mono font-black text-white">
                {formatTime(evaluation.elapsedSeconds)} <span className="text-xs font-normal text-slate-400">/ 05:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Targets */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
            Toplam Hedef
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {evaluation.totalTargets}
          </div>
          <span className="text-[10px] text-slate-400">a, b, d, g harfleri</span>
        </div>

        {/* Correct Markings */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Doğru</span>
          </span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {evaluation.correctMarkings}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
            %{evaluation.accuracyPercentage} Başarı
          </span>
        </div>

        {/* Omitted Targets */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Atlanan</span>
          </span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {evaluation.omittedTargets}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">Gözden kaçan hedef</span>
        </div>

        {/* Incorrect Markings */}
        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Yanlış</span>
          </span>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {evaluation.incorrectMarkings}
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">Hedef dışı işaret</span>
        </div>

        {/* Total Markings */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
            Toplam İşaret
          </span>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
            {evaluation.totalMarkings}
          </div>
          <span className="text-[10px] text-slate-400">Doğru + Yanlış</span>
        </div>

        {/* Total Matrix Cells */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
            Toplam Hücre
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {evaluation.totalCells}
          </div>
          <span className="text-[10px] text-slate-400">30 Satır</span>
        </div>
      </div>

      {/* Performance Pattern Card */}
      <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                Performans Örüntüsü Analizi:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-neutral-800 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                {evaluation.pattern.title}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {evaluation.pattern.description}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {evaluation.pattern.neutralGuidance}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-sky-200/60 dark:border-sky-800/40">
              * Bu değerlendirme yalnızca test formu üzerindeki işaretleme dağılımını nesnel olarak özetler. Kaynak dokümanda yapay puan sınırları (cutoff), risk grupları veya klinik tanı ölçütleri tanımlanmamıştır.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Bölüm Analizi (3 Blok)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rows')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rows'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Satır Bazlı Performans (30 Satır)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Test Sayfası İşaretleme Haritası
        </button>
      </div>

      {/* Tab 1: Section Performance (3 Blocks) */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evaluation.sectionStats.map((sec) => (
            <div
              key={sec.sectionNumber}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-700 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {sec.sectionLabel}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {sec.rowsRange}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  %{sec.accuracyRate}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Hedef Yakalama:</span>
                  <span>{sec.correctCount} / {sec.targetCount}</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${sec.accuracyRate}%` }}
                  />
                </div>
              </div>

              {/* Section Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-700/60">
                  <span className="text-[10px] text-slate-500 block">Doğru İşaret</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {sec.correctCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-700/60">
                  <span className="text-[10px] text-slate-500 block">Atlanan Hedef</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {sec.omittedCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-700/60">
                  <span className="text-[10px] text-slate-500 block">Yanlış İşaret</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {sec.incorrectCount}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-700/60">
                  <span className="text-[10px] text-slate-500 block">Toplam İşaret</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {sec.totalMarked}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Row Performance Table (30 Rows) */}
      {activeTab === 'rows' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 dark:border-neutral-700 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Satır Bazında Detaylı Performans Tablosu (30 Satır)
            </h4>
            <span className="text-[11px] text-slate-500">Hedef Harfler: a, b, d, g</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-neutral-700">
                <tr>
                  <th className="px-3 py-2.5 w-16 text-center font-bold">Satır</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold">Bölüm</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold">Toplam Hedef</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold text-emerald-700 dark:text-emerald-400">Doğru</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold text-amber-700 dark:text-amber-400">Atlanan</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold text-rose-700 dark:text-rose-400">Yanlış</th>
                  <th className="px-3 py-2.5 w-24 text-center font-bold">Toplam İşaret</th>
                  <th className="px-3 py-2.5 text-center font-bold">Başarı Dağılımı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-700/60">
                {evaluation.rowStats.map((row) => (
                  <tr 
                    key={row.rowNumber}
                    className={`hover:bg-slate-50/80 dark:hover:bg-neutral-750 transition-colors ${
                      row.rowNumber % 10 === 0 ? 'border-b-2 border-slate-300 dark:border-neutral-600' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500">
                      {row.sectionNumber}. Bölüm
                    </td>
                    <td className="px-3 py-2 text-center font-bold">
                      {row.targetCount}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {row.correctCount}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-600 dark:text-amber-400">
                      {row.omittedCount}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-rose-600 dark:text-rose-400">
                      {row.incorrectCount}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-medium">
                      {row.totalMarked}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${row.accuracyRate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8 text-right">
                          %{row.accuracyRate}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Visual Matrix Map */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-700 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Test Sayfası İşaretleme Görsel Haritası
              </h4>
              <p className="text-[11px] text-slate-500">
                Öğrencinin işaretlediği ve atladığı harflerin 30 satırlık form üzerindeki görsel konumu
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">a</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Doğru İşaret</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-50 text-amber-900 text-[10px] font-bold flex items-center justify-center">b</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Atlanan Hedef</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">x</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Yanlış İşaret</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">e</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">Hedef Olmayan</span>
              </div>
            </div>
          </div>

          {/* 30 Rows Matrix Grid */}
          <div className="space-y-1.5 font-mono text-xs overflow-x-auto py-2">
            {Array.from({ length: 30 }, (_, rIdx) => {
              const rowNum = rIdx + 1;
              const rowCells = allCells.filter(c => c.rowNumber === rowNum);
              const isBlockDivider = rowNum % 10 === 0 && rowNum < 30;

              return (
                <div key={rowNum} className={`flex items-center gap-1 ${isBlockDivider ? 'pb-3 mb-3 border-b-2 border-slate-200 dark:border-neutral-700' : ''}`}>
                  <span className="w-6 text-[10px] text-slate-400 font-bold text-right shrink-0">
                    {rowNum}
                  </span>
                  <div className="flex items-center gap-1">
                    {rowCells.map((cell) => {
                      const isMarked = markedSet.has(cell.cellId);
                      let styleClasses = "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-neutral-700";

                      if (cell.isTarget && isMarked) {
                        styleClasses = "bg-emerald-500 text-white font-black border border-emerald-600 shadow-2xs scale-105";
                      } else if (cell.isTarget && !isMarked) {
                        styleClasses = "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-2 border-amber-500 font-bold";
                      } else if (!cell.isTarget && isMarked) {
                        styleClasses = "bg-rose-500 text-white font-bold border border-rose-600 shadow-2xs";
                      }

                      return (
                        <div
                          key={cell.cellId}
                          title={`Satır ${cell.rowNumber}, Sütun ${cell.colNumber}: '${cell.char}' (${cell.isTarget ? 'Hedef' : 'Hedef Değil'}) - ${isMarked ? 'İşaretlendi' : 'İşaretlenmedi'}`}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs select-none ${styleClasses}`}
                        >
                          {cell.char}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
