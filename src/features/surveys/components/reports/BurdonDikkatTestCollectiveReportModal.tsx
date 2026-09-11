import React, { useMemo, useState } from 'react';
import { evaluateBurdonTest } from '../../../../../shared/burdonDikkatEvaluation';
import { X, Printer, Filter, Search, Layers } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';

interface BurdonDikkatTestCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
}

export const BurdonDikkatTestCollectiveReportModal: React.FC<BurdonDikkatTestCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'correctDesc' | 'correctAsc' | 'accuracyDesc' | 'accuracyAsc'>('correctDesc');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [students]);

  const rawRows = useMemo(() => {
    return applications
      .filter((app) => 
        !app.surveySlug ||
        app.surveyId === 'srv-burdon-dikkat-testi' || 
        app.surveySlug === 'burdon-dikkat-testi' ||
        (app as any).code === 'BURDON' ||
        (app.surveyTitle && app.surveyTitle.toLowerCase().includes('burdon'))
      )
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || '—';
        const cls = student?.class || student?.className || app.className || '—';
        
        const evalResult = evaluateBurdonTest(app);

        return {
          applicationId: app.id,
          studentId: app.studentId,
          name,
          studentNumber: num,
          className: cls,
          elapsedSeconds: evalResult.elapsedSeconds,
          correctMarkings: evalResult.correctMarkings,
          omittedTargets: evalResult.omittedTargets,
          incorrectMarkings: evalResult.incorrectMarkings,
          totalMarkings: evalResult.totalMarkings,
          accuracyPercentage: evalResult.accuracyPercentage,
          patternTitle: evalResult.pattern.title,
          patternCode: evalResult.pattern.code,
          completedAt: app.completedAt || app.createdAt
        };
      });
  }, [applications, studentMap]);

  const rows = useMemo(() => {
    if (scope === 'all') return rawRows;
    const latestMap = new Map<string, typeof rawRows[0]>();
    rawRows.forEach((r) => {
      const key = r.studentId || r.studentNumber || r.name;
      const existing = latestMap.get(key);
      if (!existing || new Date(r.completedAt) > new Date(existing.completedAt)) {
        latestMap.set(key, r);
      }
    });
    return Array.from(latestMap.values());
  }, [rawRows, scope]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    rows.forEach((r) => {
      if (r.className && r.className !== '—') classes.add(r.className);
    });
    return Array.from(classes).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => {
        if (selectedClass !== 'ALL' && r.className !== selectedClass) return false;
        if (searchTerm) {
          const matchName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchNo = r.studentNumber.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchName && !matchNo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'tr-TR');
        if (sortBy === 'correctAsc') return a.correctMarkings - b.correctMarkings;
        if (sortBy === 'correctDesc') return b.correctMarkings - a.correctMarkings;
        if (sortBy === 'accuracyAsc') return a.accuracyPercentage - b.accuracyPercentage;
        return b.accuracyPercentage - a.accuracyPercentage;
      });
  }, [rows, selectedClass, searchTerm, sortBy]);

  const stats = useMemo(() => {
    if (filteredRows.length === 0) return { count: 0, avgCorrect: 0, avgError: 0, avgAccuracy: 0 };
    const totalCorrect = filteredRows.reduce((acc, r) => acc + r.correctMarkings, 0);
    const totalError = filteredRows.reduce((acc, r) => acc + r.incorrectMarkings, 0);
    const totalAccuracy = filteredRows.reduce((acc, r) => acc + r.accuracyPercentage, 0);
    return {
      count: filteredRows.length,
      avgCorrect: Math.round((totalCorrect / filteredRows.length) * 10) / 10,
      avgError: Math.round((totalError / filteredRows.length) * 10) / 10,
      avgAccuracy: Math.round((totalAccuracy / filteredRows.length) * 10) / 10
    };
  }, [filteredRows]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">
                  Burdon Dikkat Testi — Toplu Sonuçlar Çizelgesi
                </h3>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Toplu Analiz
                </span>
              </div>
              <p className="text-xs text-slate-500">
                10-20 yaş grubu harf işaretleme dikkat performans testi toplu sonuçları (Toplam 114 hedef harf)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı veya no ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs text-slate-700 font-bold bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Sınıflar</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Scope Filter */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setScope('latest')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'latest' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Son Uygulama
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tüm Uygulamalar
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-medium">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs text-slate-700 font-bold bg-transparent outline-none cursor-pointer"
              >
                <option value="correctDesc">Doğru Sayısı (Yüksek &rarr; Düşük)</option>
                <option value="correctAsc">Doğru Sayısı (Düşük &rarr; Yüksek)</option>
                <option value="accuracyDesc">Doğruluk Oranı (Yüksek &rarr; Düşük)</option>
                <option value="accuracyAsc">Doğruluk Oranı (Düşük &rarr; Yüksek)</option>
                <option value="name">Öğrenci Adı (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
              Öğrenci: <strong className="text-indigo-700">{stats.count}</strong>
            </div>
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs">
              Ort. Doğru: <strong>{stats.avgCorrect} / 114</strong>
            </div>
            <div className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shadow-2xs">
              Ort. Hata: <strong>{stats.avgError}</strong>
            </div>
            <div className="px-3 py-1 bg-sky-50 border border-sky-200 rounded-xl text-xs font-bold text-sky-800 shadow-2xs">
              Ort. Başarı: <strong>%{stats.avgAccuracy}</strong>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredRows.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Seçilen kriterlere uygun Burdon Dikkat Testi kaydı bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-3">Öğrenci Adı Soyadı</th>
                  <th className="py-2.5 px-3 text-center w-24">Okul No</th>
                  <th className="py-2.5 px-3 text-center w-24">Sınıf</th>
                  <th className="py-2.5 px-3 text-center w-28">Uygulama Tarihi</th>
                  <th className="py-2.5 px-3 text-center w-20">Süre</th>
                  <th className="py-2.5 px-3 text-center w-24 text-emerald-700">Doğru (114)</th>
                  <th className="py-2.5 px-3 text-center w-20 text-amber-700">Atlanan</th>
                  <th className="py-2.5 px-3 text-center w-20 text-rose-700">Hatalı</th>
                  <th className="py-2.5 px-3 text-center w-20">Toplam</th>
                  <th className="py-2.5 px-3 text-center w-24 text-indigo-700">Doğruluk</th>
                  <th className="py-2.5 px-3">Performans Örüntüsü</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRows.map((row, idx) => (
                  <tr key={row.applicationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{row.studentNumber}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{row.className}</td>
                    <td className="py-2.5 px-3 text-center text-[11px] text-slate-500">
                      {new Date(row.completedAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                      {formatTime(row.elapsedSeconds)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                      {row.correctMarkings}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700 bg-amber-50/30">
                      {row.omittedTargets}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-rose-700 bg-rose-50/30">
                      {row.incorrectMarkings}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-800">
                      {row.totalMarkings}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-extrabold text-indigo-700 bg-indigo-50/40">
                      %{row.accuracyPercentage}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 font-medium">
                      {row.patternTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500 text-[11px]">
            * Burdon Dikkat Testi objektif bir performans testidir. Klinik tanı ve yapay kesme puanları içermez.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
