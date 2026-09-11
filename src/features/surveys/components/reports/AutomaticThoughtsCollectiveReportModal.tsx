import React, { useMemo, useState } from 'react';
import { evaluateAutomaticThoughts } from '../../../../../shared/automaticThoughtsEvaluation';
import { X, Printer, Filter, Search, Brain, Eye } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';

interface AutomaticThoughtsCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
  onViewResult?: (app: any) => void;
}

export const AutomaticThoughtsCollectiveReportModal: React.FC<AutomaticThoughtsCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students,
  surveyTitle = 'Otomatik Düşünceler Ölçeği (ATQ-30)',
  onViewResult
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'scoreAsc' | 'scoreDesc'>('scoreDesc');
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
        app.surveyId === 'srv-otomatik-dusunceler-olcegi' || 
        app.surveySlug === 'otomatik-dusunceler-olcegi' ||
        (app as any).code === 'ATQ-30' ||
        (app.surveyTitle && app.surveyTitle.toLowerCase().includes('otomatik düşünceler'))
      )
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || '—';
        const cls = student?.class || student?.className || app.className || '—';
        
        const evalResult = evaluateAutomaticThoughts(app);

        return {
          application: app,
          applicationId: app.id,
          studentId: app.studentId,
          name,
          studentNumber: num,
          className: cls,
          attemptNumber: app.attemptNumber || 1,
          totalScore: evalResult.totalScore,
          averageScore: evalResult.averageScore,
          completedAt: app.completedAt || app.createdAt
        };
      });
  }, [applications, studentMap]);

  // Apply scope filter (latest per student vs all)
  const scopedRows = useMemo(() => {
    if (scope === 'all') return rawRows;
    
    // Latest per student (highest attemptNumber or latest completedAt)
    const latestMap = new Map<string, typeof rawRows[0]>();
    rawRows.forEach((r) => {
      const existing = latestMap.get(r.studentId);
      if (!existing || (r.completedAt > existing.completedAt)) {
        latestMap.set(r.studentId, r);
      }
    });
    return Array.from(latestMap.values());
  }, [rawRows, scope]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    rawRows.forEach((r) => {
      if (r.className && r.className !== '—') classes.add(r.className);
    });
    return Array.from(classes).sort();
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    return scopedRows
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
        if (sortBy === 'scoreAsc') return a.totalScore - b.totalScore;
        return b.totalScore - a.totalScore;
      });
  }, [scopedRows, selectedClass, searchTerm, sortBy]);

  const stats = useMemo(() => {
    if (filteredRows.length === 0) return { count: 0, avg: 0, min: 0, max: 0 };
    const total = filteredRows.reduce((acc, r) => acc + r.totalScore, 0);
    const min = Math.min(...filteredRows.map((r) => r.totalScore));
    const max = Math.max(...filteredRows.map((r) => r.totalScore));
    return {
      count: filteredRows.length,
      avg: Math.round((total / filteredRows.length) * 10) / 10,
      min,
      max
    };
  }, [filteredRows]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{surveyTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Toplu Sonuçlar Çizelgesi
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Öğrenci puan dağılımı ve genel değerlendirme dökümü
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Stats Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap gap-4 items-center justify-between text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Öğrenci adı veya no ara..."
                className="pl-8 pr-3 py-1.5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 text-xs text-neutral-900 dark:text-white"
              />
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="py-1.5 px-2.5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-neutral-900 dark:text-white font-medium"
              >
                <option value="ALL">Tüm Sınıflar ({uniqueClasses.length})</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Filter */}
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
              <button
                onClick={() => setScope('latest')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  scope === 'latest'
                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Son Uygulama
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  scope === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Tüm Uygulamalar
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-neutral-900 dark:text-white font-medium"
            >
              <option value="scoreDesc">Puan: Yüksekten Düşüğe</option>
              <option value="scoreAsc">Puan: Düşükten Yükseğe</option>
              <option value="name">İsim: A - Z</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 dark:text-neutral-400">Toplam Kayıt:</span>{' '}
              <strong className="text-neutral-900 dark:text-white">{stats.count}</strong>
            </div>
            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Grup Ortalaması:</span>{' '}
              <strong className="text-indigo-900 dark:text-indigo-200">{stats.avg} / 150</strong>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
              Kriterlere uygun uygulama kaydı bulunamadı.
            </div>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">Sıra</th>
                    <th className="px-3 py-2.5 w-20">Okul No</th>
                    <th className="px-3 py-2.5">Öğrenci</th>
                    <th className="px-3 py-2.5 w-24">Sınıf</th>
                    <th className="px-3 py-2.5 w-20 text-center">Deneme</th>
                    <th className="px-3 py-2.5 w-24 text-center">Tarih</th>
                    <th className="px-3 py-2.5 w-28 text-center">Toplam Puan</th>
                    <th className="px-3 py-2.5 w-28 text-center">Ortalama</th>
                    {onViewResult && <th className="px-3 py-2.5 w-24 text-center">İşlem</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                  {filteredRows.map((row, idx) => {
                    const formattedDate = row.completedAt
                      ? new Date(row.completedAt).toLocaleDateString('tr-TR')
                      : '—';

                    return (
                      <tr
                        key={row.applicationId}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition"
                      >
                        <td className="px-3 py-2.5 text-center font-semibold text-neutral-400">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-neutral-600 dark:text-neutral-300">
                          {row.studentNumber}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-neutral-900 dark:text-white">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 text-neutral-600 dark:text-neutral-300">
                          {row.className}
                        </td>
                        <td className="px-3 py-2.5 text-center text-neutral-500 font-mono">
                          #{row.attemptNumber}
                        </td>
                        <td className="px-3 py-2.5 text-center text-neutral-500">
                          {formattedDate}
                        </td>
                        <td className="px-3 py-2.5 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {row.totalScore} <span className="text-[10px] font-normal text-neutral-400">/ 150</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-neutral-700 dark:text-neutral-300">
                          {row.averageScore.toFixed(2)}
                        </td>
                        {onViewResult && (
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => onViewResult(row.application)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded font-semibold text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Sonuç</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
          <strong>Not:</strong> Yüksek toplam puan daha fazla olumsuz otomatik düşünceyi ifade eder. Grup ortalamaları yalnızca betimsel bilgi amaçlıdır; kaynakta tanımlanmış herhangi bir klinik sınır veya risk grubu bulunmamaktadır.
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
