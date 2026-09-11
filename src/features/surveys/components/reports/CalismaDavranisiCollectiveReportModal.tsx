import React, { useMemo, useState } from 'react';
import {
  evaluateCollectiveCalismaDavranisi,
  CDDE_CATEGORY_LIST,
  CDDE_SOURCE_RANGE_ANOMALY,
  CDDEApplicationData
} from '../../../../../shared/calismaDavranisiEvaluation';
import { X, Printer, Filter, Search, BookOpen, Info, Users, BarChart2, Table } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';

interface CalismaDavranisiCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
  onViewResult?: (app: any) => void;
}

export const CalismaDavranisiCollectiveReportModal: React.FC<CalismaDavranisiCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students,
  surveyTitle = 'Çalışma Davranışını Değerlendirme Ölçeği (CDDE-73)',
  onViewResult
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'categories' | 'students' | 'items'>('categories');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [students]);

  // Transform raw applications to standard CDDEApplicationData
  const cddeApplications = useMemo(() => {
    return applications
      .filter(
        (app) =>
          !app.surveySlug ||
          app.surveyId === 'srv-calisma-davranisini-degerlendirme-olcegi' ||
          app.surveyId === 'srv-calisma-davranisi-olcegi' ||
          app.surveySlug === 'calisma-davranisini-degerlendirme-olcegi' ||
          app.surveySlug === 'calisma-davranisi-olcegi' ||
          (app as any).code === 'CDDE-73' ||
          (app.surveyTitle && app.surveyTitle.toLowerCase().includes('çalışma davranışı'))
      )
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || '—';
        const cls = student?.class || student?.className || app.className || '—';

        let rawAnswers: Record<string, string> = {};
        if (app.answers) {
          if (Array.isArray(app.answers)) {
            app.answers.forEach((a: any, idx: number) => {
              const qNum = a.questionOrder || idx + 1;
              const val = (a.answerValue ?? a.selectedOptionLabel ?? '').trim();
              rawAnswers[`q${qNum}`] = val;
              if (a.questionId) {
                rawAnswers[a.questionId] = val;
              }
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
        } as CDDEApplicationData;
      });
  }, [applications, studentMap]);

  // Find unique classes
  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    cddeApplications.forEach((r) => {
      if (r.className && r.className !== '—') classes.add(r.className);
    });
    return Array.from(classes).sort();
  }, [cddeApplications]);

  // Run collective evaluation
  const collectiveResult = useMemo(() => {
    const classFilter = selectedClass === 'ALL' ? undefined : selectedClass;
    return evaluateCollectiveCalismaDavranisi(cddeApplications, scope, classFilter);
  }, [cddeApplications, selectedClass, scope]);

  // Filter student matrix by search term if active
  const filteredStudentMatrix = useMemo(() => {
    if (!searchTerm.trim()) return collectiveResult.studentMatrix;
    const term = searchTerm.toLowerCase();
    return collectiveResult.studentMatrix.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        s.studentNumber.toLowerCase().includes(term)
    );
  }, [collectiveResult, searchTerm]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-neutral-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {surveyTitle} Toplu Sonuçlar
                </h2>
                <p className="text-xs text-neutral-500">
                  {collectiveResult.totalEvaluated} Değerlendirilen Öğrenci • 7 Alt Alan • 73 Madde
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-neutral-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope (Latest vs All) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setScope('latest')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scope === 'latest'
                      ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Son Uygulama
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Tüm Denemeler
                </button>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Alan Analizleri</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Öğrenci Listesi ({filteredStudentMatrix.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'items'
                    ? 'bg-white dark:bg-neutral-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Madde Dağılımı</span>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {collectiveResult.totalEvaluated === 0 ? (
              <div className="p-12 text-center text-sm text-neutral-400">
                Seçilen kriterlere uygun değerlendirilmiş öğrenci verisi bulunamadı.
              </div>
            ) : activeTab === 'categories' ? (
              /* TAB 1: Category Analytics */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collectiveResult.categorySummaries.map((cat) => {
                    const diffCounts = cat.difficultyCounts || { ciddiGucluk: 0, baziGuclukler: 0, onemliGuclukYok: 0 };
                    const diffPcts = cat.difficultyPercentages || { ciddiGucluk: 0, baziGuclukler: 0, onemliGuclukYok: 0 };

                    return (
                      <div
                        key={cat.categoryKey}
                        className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {cat.categoryKey}
                          </span>
                          <span className="text-xs font-bold text-neutral-500">
                            Ortalama: <strong className="text-neutral-900 dark:text-white">{cat.averageScore}</strong> / {cat.maxScore}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-3 leading-snug">
                          {cat.categoryName}
                        </h4>

                        {/* Level Distribution Bars */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-medium">
                            <span>Ciddi Güçlük:</span>
                            <span>{diffCounts.ciddiGucluk} (%{diffPcts.ciddiGucluk})</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${diffPcts.ciddiGucluk}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-medium pt-1">
                            <span>Bazı Güçlükler:</span>
                            <span>{diffCounts.baziGuclukler} (%{diffPcts.baziGuclukler})</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${diffPcts.baziGuclukler}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                            <span>Önemli Güçlük Yok:</span>
                            <span>{diffCounts.onemliGuclukYok} (%{diffPcts.onemliGuclukYok})</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${diffPcts.onemliGuclukYok}%` }}
                            />
                          </div>
                        </div>

                        {cat.categoryKey === 'D' && (
                          <div className="mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[10px] text-amber-800 dark:text-amber-300">
                            <Info className="w-3 h-3 inline mr-1 text-amber-600" />
                            {CDDE_SOURCE_RANGE_ANOMALY.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'students' ? (
              /* TAB 2: Student Matrix */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Öğrenci ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold">
                        <tr>
                          <th className="p-2.5">Öğrenci Adı Soyadı</th>
                          <th className="p-2.5 w-20 text-center">No</th>
                          <th className="p-2.5 w-20 text-center">Sınıf</th>
                          {CDDE_CATEGORY_LIST.map((cat) => (
                            <th key={cat.code} className="p-2.5 text-center w-20" title={cat.name}>
                              {cat.code} ({cat.maxScore})
                            </th>
                          ))}
                          {onViewResult && <th className="p-2.5 w-20 text-center">Detay</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                        {filteredStudentMatrix.map((student) => (
                          <tr key={student.applicationId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="p-2.5 font-semibold text-neutral-900 dark:text-white">
                              {student.studentName}
                            </td>
                            <td className="p-2.5 text-center text-neutral-500 font-mono">
                              {student.studentNumber}
                            </td>
                            <td className="p-2.5 text-center text-neutral-500">
                              {student.className}
                            </td>
                            {CDDE_CATEGORY_LIST.map((cat) => {
                              const catRes = student.categoryResults ? student.categoryResults[cat.code] : undefined;
                              let badgeColor = 'text-neutral-500';
                              const levelLower = (catRes?.level || '').toLowerCase();
                              if (levelLower.includes('ciddi') || levelLower.includes('eksik') || levelLower.includes('olumsuz')) {
                                badgeColor = 'text-rose-600 font-bold';
                              } else if (levelLower.includes('bazı') || levelLower.includes('hata')) {
                                badgeColor = 'text-amber-600 font-bold';
                              } else if (levelLower.includes('yok') || levelLower.includes('olumlu') || levelLower.includes('yeterli')) {
                                badgeColor = 'text-emerald-600 font-bold';
                              }

                              return (
                                <td key={cat.code} className={`p-2.5 text-center ${badgeColor}`}>
                                  {catRes ? catRes.score : (student.categoryScores[cat.code] ?? '—')}
                                </td>
                              );
                            })}
                            {onViewResult && (
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => onViewResult(applications.find((a) => a.id === student.applicationId))}
                                  className="text-xs text-sky-600 hover:text-sky-800 font-bold cursor-pointer"
                                >
                                  İncele
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 3: Item Distribution */
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5 w-16 text-center">Alan</th>
                        <th className="p-2.5">Madde İfadesi</th>
                        <th className="p-2.5 w-20 text-center">Beklenen</th>
                        <th className="p-2.5 w-24 text-center">Güçlük Sayısı</th>
                        <th className="p-2.5 w-24 text-center">Güçlük Oranı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {collectiveResult.itemStats.map((item) => (
                        <tr key={item.itemNumber} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-2.5 text-center font-bold text-neutral-500 font-mono">
                            {item.itemNumber}
                          </td>
                          <td className="p-2.5 text-center font-bold text-sky-700 dark:text-sky-300">
                            {item.categoryKey}
                          </td>
                          <td className="p-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                            {item.itemText}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-neutral-600 dark:text-neutral-300">
                            {item.expectedAnswer}
                          </td>
                          <td className="p-2.5 text-center font-bold text-rose-600">
                            {item.difficultyCount}
                          </td>
                          <td className="p-2.5 text-center font-bold text-neutral-800 dark:text-white">
                            %{item.difficultyRate}
                          </td>
                        </tr>
                      ))}
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
