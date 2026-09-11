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
import { calculateHollandEvaluation } from '../../../../../shared/hollandEvaluation';
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

interface HollandMeslekiTercihCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HollandMeslekiTercihCollectiveReportModal: React.FC<HollandMeslekiTercihCollectiveReportModalProps> = ({
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
        const res = await window.api.surveys.listApplications({ surveyId: 'srv-holland-mesleki-tercih-envanteri' });
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load holland inventory applications:', err);
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

  const scopedApps = useMemo(() => {
    return filterApplicationsByScope(applications, scopeFilter);
  }, [applications, scopeFilter]);

  const displayedApps = useMemo(() => {
    return scopedApps.filter(app => {
      const cls = (app.className || 'Belirtilmemiş').trim();
      if (selectedClass !== 'all' && cls !== selectedClass) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = app.studentName.toLowerCase();
      const num = app.studentNumber.toLowerCase();
      const classNameStr = (app.className || '').toLowerCase();
      return name.includes(term) || num.includes(term) || classNameStr.includes(term);
    });
  }, [scopedApps, selectedClass, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDetail = async (app: SurveyApplicationDto) => {
    try {
      if (window.api && window.api.surveys) {
        const fullDetail = await window.api.surveys.getApplicationDetail(app.id);
        setSelectedAppForDetail(fullDetail || app);
      } else {
        setSelectedAppForDetail(app);
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
      setSelectedAppForDetail(app);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-7xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-extrabold shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    Holland Mesleki Tercih Envanteri — Toplu Sonuçlar Çizelgesi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs">
                    HOLLAND-90
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  6 Holland Kişilik Tipi Dağılımı ve Bireysel Mesleki Tercih Sonuçları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır / PDF Kaydet</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Öğrenci adı veya okul no ile ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500">Sınıf:</span>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tüm Sınıflar ({scopedApps.length} öğrenci)</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} Sınıfı ({scopedApps.filter(a => (a.className || '').trim() === cls).length} öğrenci)
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500">Kapsam:</span>
                <select
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value as ApplicationScopeFilter)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="latest_per_student">Öğrenci Başına Son Uygulama (Tavsiye Edilen)</option>
                  <option value="all">Tüm Uygulamalar ({applications.length} Kayıt)</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-600">
              Listelenen: <span className="text-sky-600 font-extrabold">{displayedApps.length}</span> kayıt
            </div>
          </div>

          {/* Printable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 print:p-0 print:overflow-visible">
            {/* Formal Header in Print Only */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-3 mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Rehberlik ve Psikolojik Danışma Servisi
              </div>
              <h1 className="text-base font-extrabold text-slate-900 uppercase mt-1">
                HOLLAND MESLEKİ TERCİH ENVANTERİ — TOPLU SONUÇLAR ÇİZELGESİ
              </h1>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                {selectedClass !== 'all' ? `${selectedClass} Sınıfı Değerlendirme Raporu` : 'Genel Okul Değerlendirme Raporu'} &bull; Kapsam: {scopeFilter === 'latest_per_student' ? 'Öğrenci Başına Son Uygulama' : 'Tüm Uygulamalar'} &bull; Tarih: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>

            {/* Main Table */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-xs">
                Veriler yükleniyor...
              </div>
            ) : displayedApps.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
                Kayıtlı uygulama bulunamadı.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold text-[11px]">
                      <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">SIRA</th>
                      <th className="py-2.5 px-3 w-20 border-r border-slate-200">OKUL NO</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">ÖĞRENCİ ADI SOYADI</th>
                      <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">SINIF</th>
                      <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">UYGULAMA #</th>
                      <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">TARİH</th>
                      <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">BASKIN TİP</th>
                      <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">EN UZAK TİP</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">GERÇEKÇİ</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">ARAŞTIRICI</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">ARTİSTİK</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">SOSYAL</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">GİRİŞİMCİ</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-slate-200">GELENEKSEL</th>
                      <th className="py-2.5 px-3 w-20 text-center print:hidden">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {displayedApps.map((app, idx) => {
                      const evaluation = calculateHollandEvaluation(
                        (app.answers || []).map((a, aIdx) => ({
                          questionOrder: a.questionOrder || aIdx + 1,
                          selectedOptionValue: a.answerValue || a.selectedOptionLabel || ''
                        }))
                      );
                      const dateStr = new Date(app.completedAt).toLocaleDateString('tr-TR');

                      const getTypeScore = (key: string) => {
                        const item = evaluation.typeResults.find(t => t.typeKey === key);
                        return item?.hoslanirimCount ?? 0;
                      };

                      return (
                        <tr key={app.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-center text-slate-500 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700 border-r border-slate-200">
                            {app.studentNumber || '—'}
                          </td>
                          <td className="py-2 px-3 font-extrabold text-slate-900 border-r border-slate-200">
                            {app.studentName}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                            {app.className || '—'}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                              Uygulama #{app.attemptNumber || 1}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-center text-slate-600 text-[11px] border-r border-slate-200">
                            {dateStr}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {evaluation.dominantTypeLabel} ({evaluation.maxHoslanirimScore})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              {evaluation.distantTypeLabel} ({evaluation.maxHoslanmamScore})
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('REALISTIC')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('INVESTIGATIVE')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('ARTISTIC')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('SOCIAL')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('ENTERPRISING')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {getTypeScore('CONVENTIONAL')} <span className="text-[9px] text-slate-400 font-normal">/15</span>
                          </td>
                          <td className="py-2 px-3 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(app)}
                              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                              title="Detaylı sonuç raporunu aç"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Gör</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Print Signatures */}
            <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs mt-10 pt-4 border-t border-slate-300">
              <div>
                <div className="font-bold text-slate-800">Uygulayan / Değerlendiren</div>
                <div className="text-slate-500 mt-0.5">Psikolojik Danışman / Rehber Öğretmen</div>
                <div className="h-12 border-b border-dashed border-slate-300 mx-auto w-48 mt-2"></div>
                <div className="text-[10px] text-slate-400 mt-1">İmza / Mühür</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">Onaylayan</div>
                <div className="text-slate-500 mt-0.5">Okul Müdürü</div>
                <div className="h-12 border-b border-dashed border-slate-300 mx-auto w-48 mt-2"></div>
                <div className="text-[10px] text-slate-400 mt-1">İmza / Mühür</div>
              </div>
            </div>

          </div>
        </div>

        {/* Result Detail Sub-Modal */}
        <SurveyResultDetailModal
          application={selectedAppForDetail}
          isOpen={Boolean(selectedAppForDetail)}
          onClose={() => setSelectedAppForDetail(null)}
        />
      </div>
    </ModalPortal>
  );
};
