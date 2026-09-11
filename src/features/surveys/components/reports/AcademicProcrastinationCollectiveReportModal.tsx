import React, { useMemo, useState } from 'react';
import { evaluateAcademicProcrastination } from '../../../../../shared/academicProcrastinationEvaluation';
import { X, Printer, Filter, Search, Clock } from 'lucide-react';

interface AcademicProcrastinationCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
}

export const AcademicProcrastinationCollectiveReportModal: React.FC<AcademicProcrastinationCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'scoreAsc' | 'scoreDesc'>('scoreDesc');

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [students]);

  const rows = useMemo(() => {
    return applications
      .filter((app) => app.surveyId === 'srv-akademik-erteleme-olcegi')
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || '—';
        const cls = student?.class || student?.className || app.className || '—';
        const answersRec: Record<string, number> = {};
        (app.answers || []).forEach((a: any, idx: number) => {
          const qNum = a.questionOrder || idx + 1;
          answersRec[`q${qNum}`] = parseInt(a.answerValue || a.selectedOptionLabel || '0', 10);
        });
        const evalResult = evaluateAcademicProcrastination(answersRec);

        return {
          applicationId: app.id,
          studentId: app.studentId,
          name,
          studentNumber: num,
          className: cls,
          totalScore: evalResult.totalScore,
          percentage: evalResult.procrastinationPercentage,
          completedAt: app.completedAt || app.createdAt
        };
      });
  }, [applications, studentMap]);

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
        if (sortBy === 'scoreAsc') return a.totalScore - b.totalScore;
        return b.totalScore - a.totalScore;
      });
  }, [rows, selectedClass, searchTerm, sortBy]);

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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Akademik Erteleme Ölçeği — Toplu Sonuçlar Çizelgesi
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Toplam {filteredRows.length} öğrencinin erteleme puanları ve düzey dağılımı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              title="Yazdır"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Statistics Summary */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Öğrenci veya No ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-4 h-4 text-neutral-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-500">Sırala:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="scoreDesc">Puana Göre (Azalan)</option>
                  <option value="scoreAsc">Puana Göre (Artan)</option>
                  <option value="name">İsme Göre (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              <div>
                Öğrenci: <span className="font-bold text-neutral-900 dark:text-white">{stats.count}</span>
              </div>
              <div>
                Ortalama: <span className="font-bold text-sky-600 dark:text-sky-400">{stats.avg}</span>
              </div>
              <div>
                Min / Max: <span className="font-bold">{stats.min}</span> / <span className="font-bold">{stats.max}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 font-semibold w-12 text-center">Sıra</th>
                <th className="px-3 py-2.5 font-semibold">Öğrenci Adı Soyadı</th>
                <th className="px-3 py-2.5 font-semibold w-24 text-center">Okul No</th>
                <th className="px-3 py-2.5 font-semibold w-24 text-center">Sınıf</th>
                <th className="px-3 py-2.5 font-semibold w-28 text-center">Toplam Puan (19-95)</th>
                <th className="px-3 py-2.5 font-semibold w-40 text-center">Erteleme Dağılımı</th>
                <th className="px-3 py-2.5 font-semibold w-28 text-center">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredRows.map((row, idx) => (
                <tr key={row.applicationId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition">
                  <td className="px-3 py-2.5 text-center font-bold text-neutral-400">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-neutral-900 dark:text-white">{row.name}</td>
                  <td className="px-3 py-2.5 text-center text-neutral-600 dark:text-neutral-400">{row.studentNumber}</td>
                  <td className="px-3 py-2.5 text-center">{row.className}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-neutral-900 dark:text-white">
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {row.totalScore}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 w-7 text-right">
                        %{row.percentage}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-neutral-500">
                    {row.completedAt ? new Date(row.completedAt).toLocaleDateString('tr-TR') : '—'}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-500">
          <span>* Puanlar 19 (en düşük erteleme) ile 95 (en yüksek erteleme) arasındadır.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg transition font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
