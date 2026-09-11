import React, { useMemo, useState } from 'react';
import {
  evaluateCollectiveBNA,
  BNA_SCALE_METADATA,
  BNA_QUESTIONS
} from '../../../../../shared/basarisizlikNedenleriEvaluation';
import { X, Printer, Filter, Search, BookOpen } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';

interface BasarisizlikNedenleriCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
  onViewResult?: (app: any) => void;
}

export const BasarisizlikNedenleriCollectiveReportModal: React.FC<BasarisizlikNedenleriCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students,
  surveyTitle = 'Başarısızlık Nedenleri Anketi (BNA-44)'
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'table' | 'matrix'>('table');
  const [sortBy, setSortBy] = useState<'order' | 'percentDesc'>('order');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [students]);

  // Transform raw applications to standard BNAApplicationData
  const bnaApplications = useMemo(() => {
    return applications
      .filter(
        (app) =>
          !app.surveySlug ||
          app.surveyId === 'srv-basarisizlik-nedenleri-anketi' ||
          app.surveySlug === 'basarisizlik-nedenleri-anketi' ||
          (app as any).code === 'BNA-44' ||
          (app.surveyTitle && app.surveyTitle.toLowerCase().includes('başarısızlık nedenleri'))
      )
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || '—';
        const cls = student?.class || student?.className || app.className || '—';

        let rawAnswers: Record<string, any> = {};
        if (app.answers) {
          if (Array.isArray(app.answers)) {
            app.answers.forEach((a: any, idx: number) => {
              const qNum = a.questionOrder || idx + 1;
              rawAnswers[`q${qNum}`] = a.answerValue ?? a.selectedOptionLabel;
            });
          } else if (typeof app.answers === 'object') {
            rawAnswers = app.answers;
          }
        }

        return {
          ...app,
          id: app.id,
          studentId: app.studentId,
          studentName: name,
          studentNumber: num,
          className: cls,
          attemptNumber: app.attemptNumber || 1,
          completedAt: app.completedAt || app.createdAt,
          answers: Object.keys(rawAnswers).length > 0 ? rawAnswers : app.answers,
          resultSnapshot: app.resultSnapshot
        };
      });
  }, [applications, studentMap]);

  // Find unique classes
  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    bnaApplications.forEach((r) => {
      if (r.className && r.className !== '—') classes.add(r.className);
    });
    return Array.from(classes).sort();
  }, [bnaApplications]);

  // Run collective evaluation
  const collectiveResult = useMemo(() => {
    const classFilter = selectedClass === 'ALL' ? undefined : selectedClass;
    return evaluateCollectiveBNA(bnaApplications, scope, classFilter);
  }, [bnaApplications, selectedClass, scope]);

  // Filter student matrix by search term if active
  const filteredStudentMatrix = useMemo(() => {
    if (!searchTerm.trim()) return collectiveResult.studentMatrix;
    const term = searchTerm.toLowerCase();
    return collectiveResult.studentMatrix.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        s.studentNumber.toLowerCase().includes(term)
    );
  }, [collectiveResult.studentMatrix, searchTerm]);

  // Sorted item stats for Table tab
  const displayItemStats = useMemo(() => {
    const list = [...collectiveResult.itemStats];
    if (sortBy === 'percentDesc') {
      list.sort((a, b) => {
        const pa = a.percentage ?? -1;
        const pb = b.percentage ?? -1;
        return pb - pa || a.itemNumber - b.itemNumber;
      });
    } else {
      list.sort((a, b) => a.itemNumber - b.itemNumber);
    }
    return list;
  }, [collectiveResult.itemStats, sortBy]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-800">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {surveyTitle} Toplu Değerlendirme Çizelgesi
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    {BNA_SCALE_METADATA.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {selectedClass === 'ALL' ? 'Okul Geneli / Tüm Sınıflar' : `${selectedClass} Sınıfı`} • Toplam {collectiveResult.totalStudents} Öğrenci
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                Yazdır / PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-slate-700 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="ALL">Tüm Sınıflar (Okul Geneli)</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setScope('latest')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    scope === 'latest'
                      ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  Son Uygulamalar
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  Tüm Uygulamalar
                </button>
              </div>
            </div>

            {/* View Tabs & Sorting */}
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'table' && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">Sıralama:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs text-slate-700 dark:text-neutral-200"
                  >
                    <option value="order">Kaynak Sırası (1–44)</option>
                    <option value="percentDesc">İşaretleme Oranına Göre (Yüksek → Düşük)</option>
                  </select>
                </div>
              )}

              {activeTab === 'matrix' && (
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs text-slate-700 dark:text-neutral-200"
                  />
                </div>
              )}

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === 'table'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  44 Madde Yüzdeleri
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTab === 'matrix'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  Öğrenci × Neden Matrisi
                </button>
              </div>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50">
                <div className="text-xs font-semibold text-sky-700 dark:text-sky-300">Değerlendirilen Öğrenci</div>
                <div className="text-2xl font-black text-sky-900 dark:text-sky-100 mt-1">
                  {collectiveResult.totalStudents} <span className="text-xs font-normal text-sky-600">Öğrenci</span>
                </div>
                <div className="text-[11px] text-sky-700 dark:text-sky-400 mt-1">
                  {selectedClass === 'ALL' ? 'Tüm sınıflar havuzu' : `${selectedClass} sınıfı`}
                </div>
              </div>

              <div className="md:col-span-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">En Çok İşaretlenen Nedenler</div>
                {collectiveResult.topReasons.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {collectiveResult.topReasons.slice(0, 3).map((tr) => (
                      <div key={tr.itemNumber} className="text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                        <span><strong>{tr.itemNumber}.</strong> {tr.itemText}</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 ml-2 shrink-0">
                          {tr.percentageFormatted} ({tr.markedCount}/{tr.totalStudents})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 italic">
                    {collectiveResult.mostMarkedSummary}
                  </div>
                )}
              </div>
            </div>

            {/* Tab 1: 44 Items Percentages Table */}
            {activeTab === 'table' && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 font-bold">
                      <tr>
                        <th className="p-3 w-14 text-center">No</th>
                        <th className="p-3">Başarısızlık Nedeni / İfade</th>
                        <th className="p-3 w-28 text-center">İşaretleyen</th>
                        <th className="p-3 w-28 text-center">Toplam Öğrenci</th>
                        <th className="p-3 w-32 text-center">İşaretleme Yüzdesi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                      {displayItemStats.map((stat) => (
                        <tr
                          key={stat.itemNumber}
                          className="hover:bg-slate-50/70 dark:hover:bg-neutral-750 transition"
                        >
                          <td className="p-3 text-center font-bold text-slate-500 font-mono">
                            {stat.itemNumber}
                          </td>
                          <td className="p-3 text-slate-800 dark:text-neutral-200 font-medium">
                            {stat.itemText}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800 dark:text-white">
                            {stat.markedCount}
                          </td>
                          <td className="p-3 text-center text-slate-500">
                            {stat.totalStudents}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-sky-700 dark:text-sky-300">
                            {stat.percentageFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Student x 44 Reasons Matrix */}
            {activeTab === 'matrix' && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5 w-36 whitespace-nowrap">Öğrenci Adı</th>
                        <th className="p-2.5 w-16 text-center">No</th>
                        <th className="p-2.5 w-16 text-center">Sınıf</th>
                        {Array.from({ length: 44 }, (_, i) => (
                          <th key={i + 1} className="p-1 w-7 text-center font-mono text-[10px]" title={BNA_QUESTIONS[i]}>
                            {i + 1}
                          </th>
                        ))}
                        <th className="p-2.5 w-24 text-center text-sky-700 dark:text-sky-300 font-bold whitespace-nowrap">
                          Toplam Neden
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                      {filteredStudentMatrix.length === 0 ? (
                        <tr>
                          <td colSpan={48} className="p-8 text-center text-slate-400 italic">
                            Aramaya uygun öğrenci bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentMatrix.map((row) => (
                          <tr
                            key={`${row.studentId}_${row.attemptNumber}`}
                            className="hover:bg-slate-50/70 dark:hover:bg-neutral-750 transition"
                          >
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-neutral-200 whitespace-nowrap">
                              {row.studentName}
                            </td>
                            <td className="p-2.5 text-center text-slate-500 font-mono">
                              {row.studentNumber}
                            </td>
                            <td className="p-2.5 text-center text-slate-500">
                              {row.className}
                            </td>
                            {Array.from({ length: 44 }, (_, i) => {
                              const isMarked = row.marks[i + 1];
                              return (
                                <td
                                  key={i + 1}
                                  className={`p-1 text-center font-bold text-xs ${
                                    isMarked ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300' : 'text-transparent'
                                  }`}
                                  title={`Madde ${i + 1}: ${BNA_QUESTIONS[i]}`}
                                >
                                  {isMarked ? '✓' : '·'}
                                </td>
                              );
                            })}
                            <td className="p-2.5 text-center font-bold font-mono text-sky-800 dark:text-sky-300">
                              {row.totalMarked} / 44
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
