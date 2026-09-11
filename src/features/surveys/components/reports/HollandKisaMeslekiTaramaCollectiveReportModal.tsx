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
import { getHollandKisaEvaluation } from '../../../../../shared/hollandKisaEvaluation';

interface HollandKisaMeslekiTaramaCollectiveReportModalProps {
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

export const HollandKisaMeslekiTaramaCollectiveReportModal: React.FC<HollandKisaMeslekiTaramaCollectiveReportModalProps> = ({
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
        const res = await window.api.surveys.listApplications({ surveyId: 'srv-holland-kisa-bicim-mesleki-tarama-envanteri' });
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load holland kisa applications:', err);
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
      const matchesSearch = 
        (app.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (app.studentNumber || '').includes(searchTerm);
      
      const matchesClass = selectedClass === 'all' || app.className === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [applications, scopeFilter, searchTerm, selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Holland Kısa Biçim Mesleki Tarama Envanteri — Toplu Sonuçlar
                </h2>
                <p className="text-xs text-slate-500">
                  30 Maddelik 9'lu Likert Mesleki Tarama Envanteri Sınıf ve Öğrenci Sonuç Listesi (HOLLAND-KISA-30)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Öğrenci adı veya numarası ile ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">Tüm Sınıflar</option>
                {classList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Scope Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value as ApplicationScopeFilter)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="latest_per_student">Her Öğrencinin Son Uygulaması</option>
                <option value="all">Tüm Uygulamalar (Tekrarlar Dahil)</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-xs text-slate-400">
                Veriler yükleniyor...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-1">
                <p className="text-xs">Uygulama kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-20">Okul No</th>
                      <th className="py-2.5 px-4">Öğrenci Adı Soyadı</th>
                      <th className="py-2.5 px-3 w-20">Sınıf</th>
                      <th className="py-2.5 px-3 w-16 text-center">Uyg.</th>
                      <th className="py-2.5 px-4 w-44">İlk 3 Tip</th>
                      <th className="py-2.5 px-3 w-20 text-center">Kod</th>
                      <th className="py-2.5 px-2 text-center text-rose-700 font-bold">R</th>
                      <th className="py-2.5 px-2 text-center text-cyan-700 font-bold">I</th>
                      <th className="py-2.5 px-2 text-center text-purple-700 font-bold">A</th>
                      <th className="py-2.5 px-2 text-center text-emerald-700 font-bold">S</th>
                      <th className="py-2.5 px-2 text-center text-amber-700 font-bold">E</th>
                      <th className="py-2.5 px-2 text-center text-blue-700 font-bold">C</th>
                      <th className="py-2.5 px-3 w-16 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredApplications.map((app, index) => {
                      const evalResult = getHollandKisaEvaluation(app);

                      const scoreMap: Record<string, number> = {};
                      evalResult.typeResults.forEach(r => {
                        scoreMap[r.code] = r.score;
                      });

                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{app.studentNumber}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{app.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{app.className || '—'}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">#{app.attemptNumber}</td>
                          <td className="py-2.5 px-4 font-semibold text-emerald-900">
                            {evalResult.top3Label}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-black text-[11px] rounded">
                              {evalResult.hollandCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['R'] ?? '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['I'] ?? '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['A'] ?? '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['S'] ?? '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['E'] ?? '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{scoreMap['C'] ?? '—'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => setSelectedAppForDetail(app)}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Detaylı Sonuç"
                            >
                              <Eye className="w-4 h-4" />
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
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500 shrink-0">
            <div>
              Toplam <strong>{filteredApplications.length}</strong> uygulama kaydı listeleniyor.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAppForDetail && (
        <SurveyResultDetailModal
          isOpen={!!selectedAppForDetail}
          onClose={() => setSelectedAppForDetail(null)}
          application={selectedAppForDetail}
        />
      )}
    </ModalPortal>
  );
};
