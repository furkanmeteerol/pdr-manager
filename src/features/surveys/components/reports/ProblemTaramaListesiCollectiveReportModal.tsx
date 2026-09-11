import React, { useMemo, useState } from 'react';
import {
  evaluateCollectivePTL,
  PTL_ALL_QUESTIONS
} from '../../../../../shared/problemTaramaListesiEvaluation';
import { X, Printer, Search, Table, Filter } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';

interface ProblemTaramaListesiCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  students: any[];
  surveyTitle?: string;
  onViewResult?: (app: any) => void;
}

export const ProblemTaramaListesiCollectiveReportModal: React.FC<ProblemTaramaListesiCollectiveReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  students,
  surveyTitle = 'Problem Tarama Listesi (PTL-176)'
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ranking' | 'matrix'>('ranking');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');

  const studentMap = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [students]);

  const ptlApplications = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.surveyId === 'srv-problem-tarama-listesi' ||
          app.surveySlug === 'problem-tarama-listesi' ||
          app.surveyCode === 'PTL-176' ||
          app.surveyTitle?.toLowerCase().includes('problem tarama') ||
          (app as any).code === 'PTL-176'
      )
      .map((app) => {
        const student = studentMap.get(app.studentId);
        const name = student?.fullName || student?.name || app.studentName || (app as any).student_name || 'Bilinmeyen Öğrenci';
        const num = student?.studentNumber || student?.schoolNumber || app.studentNumber || (app as any).student_number || '—';
        const cls = student?.class || student?.className || app.className || (app as any).class_name || '—';

        let rawAnswers: Record<string, any> = {};
        if (app.resultSnapshot?.rawMetrics?.answers) {
          const snapAns = app.resultSnapshot.rawMetrics.answers;
          if (Array.isArray(snapAns)) {
            snapAns.forEach((a: any, idx: number) => {
              const qNum = a.questionOrder || idx + 1;
              rawAnswers[`q${qNum}`] = a.selectedOptionValue || a.answerValue || a.selectedOptionLabel || a.value;
              if (a.questionId) rawAnswers[a.questionId] = rawAnswers[`q${qNum}`];
            });
          } else if (typeof snapAns === 'object') {
            rawAnswers = snapAns;
          }
        } else if (app.answers) {
          if (Array.isArray(app.answers)) {
            app.answers.forEach((a: any, idx: number) => {
              const qNum = a.questionOrder || idx + 1;
              rawAnswers[`q${qNum}`] = a.selectedOptionValue || a.answerValue || a.selectedOptionLabel || a.value;
              if (a.questionId) rawAnswers[a.questionId] = rawAnswers[`q${qNum}`];
            });
          } else if (typeof app.answers === 'object') {
            rawAnswers = app.answers;
          }
        } else if ((app as any).answers_json || (app as any).answersJson) {
          try {
            const parsed = JSON.parse((app as any).answers_json || (app as any).answersJson);
            if (Array.isArray(parsed)) {
              parsed.forEach((a: any, idx: number) => {
                const qNum = a.questionOrder || idx + 1;
                rawAnswers[`q${qNum}`] = a.selectedOptionValue || a.answerValue || a.selectedOptionLabel || a.value;
                if (a.questionId) rawAnswers[a.questionId] = rawAnswers[`q${qNum}`];
              });
            } else if (typeof parsed === 'object') {
              rawAnswers = parsed;
            }
          } catch {}
        }

        return {
          id: app.id,
          studentId: app.studentId || (app as any).student_id || app.id || 'st',
          studentName: name,
          studentNumber: num,
          className: cls,
          attemptNumber: app.attemptNumber || 1,
          completedAt: app.completedAt || app.createdAt,
          answers: rawAnswers,
          resultSnapshot: app.resultSnapshot
        };
      });
  }, [applications, studentMap]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    ptlApplications.forEach((r) => {
      if (r.className && r.className !== '—') classes.add(r.className);
    });
    return Array.from(classes).sort();
  }, [ptlApplications]);

  const collectiveResult = useMemo(() => {
    const classFilter = selectedClass === 'ALL' ? undefined : selectedClass;
    return evaluateCollectivePTL(ptlApplications, scope, classFilter);
  }, [ptlApplications, selectedClass, scope]);

  const filteredStudentMatrix = useMemo(() => {
    if (!searchTerm.trim()) return collectiveResult.studentMatrix;
    const term = searchTerm.toLowerCase();
    return collectiveResult.studentMatrix.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        s.studentNumber.toLowerCase().includes(term)
    );
  }, [collectiveResult.studentMatrix, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Bar */}
          <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 font-extrabold shadow-xs">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {surveyTitle} Toplu Sonuçlar
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {collectiveResult.totalEvaluated} uygulama incelendi • 7 Alt Alan ve 176 Madde Analizi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır / PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-neutral-800/60 border-b border-slate-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 dark:text-neutral-400 font-medium">Sınıf:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-white dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-lg px-2.5 py-1 text-slate-800 dark:text-neutral-200 font-semibold cursor-pointer"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {uniqueClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Switch */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-700 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-600">
                <button
                  type="button"
                  onClick={() => setScope('latest')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    scope === 'latest'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-600'
                  }`}
                >
                  Son Uygulama
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-600'
                  }`}
                >
                  Tüm Uygulamalar
                </button>
              </div>

              {/* View Switch */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-700 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    activeTab === 'ranking'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-600'
                  }`}
                >
                  Özet & Sıralama
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    activeTab === 'matrix'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-600'
                  }`}
                >
                  Öğrenci x 176 Matrisi
                </button>
              </div>
            </div>

            {/* Search */}
            {activeTab === 'matrix' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-lg text-slate-800 dark:text-neutral-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === 'ranking' ? (
              <div className="space-y-6">
                {/* 7 Section Summary Cards */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                    📊 7 Alt Alan Grup Ortalamaları
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {collectiveResult.sectionSummaries.map((s) => (
                      <div
                        key={s.code}
                        className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono font-bold text-xs flex items-center justify-center">
                            {s.romanCode}
                          </span>
                          <span className="text-[10px] text-slate-400">{s.totalPossiblePerStudent} Madde</span>
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white pt-1 font-mono">
                          {s.averageSelected} <span className="text-[10px] font-normal text-slate-400">ort.</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 dark:text-neutral-400 line-clamp-2 leading-tight">
                          {s.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Marked Problems Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                    🔥 En Çok İşaretlenen Problemler
                  </h3>
                  <div className="border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-neutral-700/60 text-slate-600 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-700">
                          <th className="p-2.5 text-center w-12 border-r border-slate-200 dark:border-neutral-700">Sıra</th>
                          <th className="p-2.5 text-center w-20 border-r border-slate-200 dark:border-neutral-700">Kod</th>
                          <th className="p-2.5 border-r border-slate-200 dark:border-neutral-700">Problem İfadesi</th>
                          <th className="p-2.5 text-center w-28 border-r border-slate-200 dark:border-neutral-700">Öğrenci Sayısı</th>
                          <th className="p-2.5 text-center w-28">İşaretlenme Oranı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                        {collectiveResult.mostMarkedItems.length > 0 ? (
                          collectiveResult.mostMarkedItems.map((item, idx) => (
                            <tr key={item.globalIndex} className="hover:bg-slate-50 dark:hover:bg-neutral-700/40">
                              <td className="p-2.5 text-center font-mono text-slate-400 border-r border-slate-100 dark:border-neutral-700">
                                {idx + 1}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-sky-700 dark:text-sky-400 border-r border-slate-100 dark:border-neutral-700">
                                {item.sectionCode}-{item.questionNumber}
                              </td>
                              <td className="p-2.5 font-medium text-slate-800 dark:text-neutral-200 border-r border-slate-100 dark:border-neutral-700">
                                {item.text}
                              </td>
                              <td className="p-2.5 text-center font-bold text-sky-700 dark:text-sky-400 border-r border-slate-100 dark:border-neutral-700">
                                {item.selectedCount} / {item.validStudents}
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white">
                                {item.percentageDisplay}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                              İşaretlenen problem bulunmamaktadır.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Student x 176 Items Matrix Table with Horizontal Scroll */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Yatay kaydırarak 176 maddenin tamamını inceleyebilirsiniz.</span>
                  <span>{filteredStudentMatrix.length} öğrenci listeleniyor</span>
                </div>

                <div className="border border-slate-200 dark:border-neutral-700 rounded-xl overflow-x-auto bg-white dark:bg-neutral-800">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold border-b border-slate-200 dark:border-neutral-600">
                        <th className="p-2 sticky left-0 bg-slate-100 dark:bg-neutral-700 z-10 w-10 text-center border-r border-slate-200 dark:border-neutral-600">No</th>
                        <th className="p-2 sticky left-10 bg-slate-100 dark:bg-neutral-700 z-10 w-20 border-r border-slate-200 dark:border-neutral-600">Okul No</th>
                        <th className="p-2 sticky left-30 bg-slate-100 dark:bg-neutral-700 z-10 w-36 border-r border-slate-200 dark:border-neutral-600">Adı Soyadı</th>
                        <th className="p-2 w-16 text-center border-r border-slate-200 dark:border-neutral-600">Sınıf</th>
                        <th className="p-2 w-20 text-center border-r border-slate-200 dark:border-neutral-600 bg-sky-50 dark:bg-sky-950/60 font-mono">Toplam</th>
                        <th className="p-2 w-28 text-center border-r border-slate-200 dark:border-neutral-600">Kaynak Normu</th>
                        {/* 176 Question Headers */}
                        {PTL_ALL_QUESTIONS.map(q => (
                          <th
                            key={q.globalIndex}
                            title={`${q.sectionRoman} (${q.sectionCode}-${q.questionNumber}): ${q.text}`}
                            className="p-1.5 text-center w-8 border-r border-slate-200 dark:border-neutral-700 text-[10px] font-mono hover:bg-sky-100 dark:hover:bg-sky-900 cursor-help"
                          >
                            {q.globalIndex}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                      {filteredStudentMatrix.map((row, idx) => (
                        <tr key={row.studentId + idx} className="hover:bg-slate-50 dark:hover:bg-neutral-700/40">
                          <td className="p-2 sticky left-0 bg-white dark:bg-neutral-800 z-10 text-center font-mono text-slate-400 border-r border-slate-100 dark:border-neutral-700">{idx + 1}</td>
                          <td className="p-2 sticky left-10 bg-white dark:bg-neutral-800 z-10 font-mono font-bold text-slate-800 dark:text-neutral-200 border-r border-slate-100 dark:border-neutral-700">{row.studentNumber}</td>
                          <td className="p-2 sticky left-30 bg-white dark:bg-neutral-800 z-10 font-medium text-slate-900 dark:text-white border-r border-slate-100 dark:border-neutral-700">{row.studentName}</td>
                          <td className="p-2 text-center text-slate-600 dark:text-neutral-400 border-r border-slate-100 dark:border-neutral-700">{row.className}</td>
                          <td className="p-2 text-center font-bold text-sky-700 dark:text-sky-400 border-r border-slate-100 dark:border-neutral-700 bg-sky-50/50 dark:bg-sky-950/30 font-mono">{row.totalSelected}</td>
                          <td className="p-2 text-center text-[11px] font-medium text-slate-600 dark:text-neutral-400 border-r border-slate-100 dark:border-neutral-700">{row.classificationLabel}</td>
                          {PTL_ALL_QUESTIONS.map(q => {
                            const isMarked = row.markedItems[q.globalIndex];
                            return (
                              <td
                                key={q.globalIndex}
                                title={`${row.studentName} - [${q.globalIndex}] ${q.text}: ${isMarked ? 'İşaretlendi' : 'İşaretlenmedi'}`}
                                className={`p-1 text-center font-bold border-r border-slate-100 dark:border-neutral-700 text-xs ${
                                  isMarked
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'
                                    : 'text-slate-300 dark:text-neutral-600'
                                }`}
                              >
                                {isMarked ? '✓' : '·'}
                              </td>
                            );
                          })}
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
