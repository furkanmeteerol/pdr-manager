import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Search, 
  GraduationCap,
  Filter,
  Eye,
  Compass
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../../components/ModalPortal';
import { SurveyResultDetailModal } from '../SurveyResultDetailModal';
import { calculateMeslekDegeriEvaluation } from '../../../../../shared/meslekDegeriEvaluation';

interface MeslekDegeriCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ApplicationScopeFilter = 'latest_per_student' | 'all';

export function filterApplicationsByScope(
  applications: SurveyApplicationDto[],
  scope: ApplicationScopeFilter
): SurveyApplicationDto[] {
  const valid = applications.filter(a => !!a.completedAt || a.status === 'COMPLETED');

  if (scope === 'all') {
    return valid;
  }

  const studentMap = new Map<string, SurveyApplicationDto>();
  for (const app of valid) {
    const studentKey = app.studentId || app.studentNumber || app.id;
    const existing = studentMap.get(studentKey);
    if (!existing) {
      studentMap.set(studentKey, app);
    } else {
      const existingTime = existing.completedAt ? new Date(existing.completedAt).getTime() : 0;
      const currTime = app.completedAt ? new Date(app.completedAt).getTime() : 0;
      if (currTime > existingTime) {
        studentMap.set(studentKey, app);
      } else if (currTime === existingTime) {
        if ((app.attemptNumber || 1) > (existing.attemptNumber || 1)) {
          studentMap.set(studentKey, app);
        }
      }
    }
  }

  return Array.from(studentMap.values());
}

export const MeslekDegeriCollectiveReportModal: React.FC<MeslekDegeriCollectiveReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [applications, setApplications] = useState<SurveyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<ApplicationScopeFilter>('latest_per_student');
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<SurveyApplicationDto | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.listApplications({ surveyId: 'srv-meslek-degeri-envanteri' });
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load meslek degeri applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchTerm('');
      setSelectedClass('all');
      setScopeFilter('latest_per_student');
    }
  }, [isOpen]);

  const classList = useMemo(() => {
    const classes = new Set<string>();
    applications.forEach(a => {
      if (a.className && a.className.trim()) {
        classes.add(a.className.trim());
      }
    });
    return Array.from(classes).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const scoped = filterApplicationsByScope(applications, scopeFilter);

    return scoped.filter(app => {
      if (selectedClass !== 'all' && (app.className || '').trim() !== selectedClass) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const name = (app.studentName || '').toLowerCase();
        const num = (app.studentNumber || '').toLowerCase();
        const cls = (app.className || '').toLowerCase();
        if (!name.includes(term) && !num.includes(term) && !cls.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, selectedClass, searchTerm, scopeFilter]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>MESLEK DEĞERİ ENVANTERİ TOPLU SONUÇLAR ÇİZELGESİ</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {filteredApplications.length} Öğrenci / Uygulama
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrencilerin 9 meslek değerine ait puanları ve öncelik sıralamaları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-600">Sınıf:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Tüm Sınıflar</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Scope Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-600">Uygulama Kapsamı:</span>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as ApplicationScopeFilter)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="latest_per_student">Öğrenci Başına Son Uygulama (Varsayılan)</option>
                  <option value="all">Tüm Uygulamalar (Tüm Denemeler)</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Yükleniyor...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-semibold">
                Kayıt bulunamadı.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">SIRA</th>
                      <th className="py-2.5 px-3 w-24 border-r border-slate-200">OKUL NO</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">ÖĞRENCİ ADI SOYADI</th>
                      <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">SINIF</th>
                      <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">UYGULAMA #</th>
                      <th className="py-2.5 px-3 w-24 border-r border-slate-200">TARİH</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">1. ÖNCELİK</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">2. ÖNCELİK</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">3. ÖNCELİK</th>
                      <th className="py-2.5 px-3 w-24 text-center">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredApplications.map((app, idx) => {
                      const evaluation = calculateMeslekDegeriEvaluation(
                        (app.answers || []).map((a, aIdx) => ({
                          questionOrder: a.questionOrder || aIdx + 1,
                          selectedOptionValue: a.answerValue || a.selectedOptionLabel || '1'
                        }))
                      );

                      const top1 = evaluation.top3Values[0];
                      const top2 = evaluation.top3Values[1];
                      const top3 = evaluation.top3Values[2];

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 font-medium border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700 border-r border-slate-200">
                            {app.studentNumber}
                          </td>
                          <td className="py-2 px-3 font-extrabold text-slate-900 border-r border-slate-200">
                            {app.studentName}
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-slate-600 border-r border-slate-200">
                            {app.className || '—'}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-600 border-r border-slate-200">
                            #{app.attemptNumber || 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-200">
                            {new Date(app.completedAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            {top1 ? (
                              <span className="inline-flex items-center gap-1 text-indigo-900 font-extrabold">
                                <span>{top1.title}</span>
                                <span className="font-mono text-indigo-600 font-bold">({top1.averageScore.toFixed(2)})</span>
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            {top2 ? (
                              <span className="inline-flex items-center gap-1 text-slate-800 font-bold">
                                <span>{top2.title}</span>
                                <span className="font-mono text-slate-600 font-bold">({top2.averageScore.toFixed(2)})</span>
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            {top3 ? (
                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                <span>{top3.title}</span>
                                <span className="font-mono text-slate-500 font-bold">({top3.averageScore.toFixed(2)})</span>
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedAppForDetail(app)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Sonucu Gör</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[11px] text-slate-400">
              Toplu Çizelge, öğrenci meslek değerlerinin öncelik sıralamasını karşılaştırmalı olarak listeler.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

        {/* Detail Sub-modal */}
        <SurveyResultDetailModal
          application={selectedAppForDetail}
          isOpen={Boolean(selectedAppForDetail)}
          onClose={() => setSelectedAppForDetail(null)}
        />
      </div>
    </ModalPortal>
  );
};
