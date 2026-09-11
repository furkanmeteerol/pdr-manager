import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Search, 
  Table, 
  GraduationCap,
  Filter,
  Info,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../../components/ModalPortal';
import { SurveyResultDetailModal } from '../SurveyResultDetailModal';
import { 
  getWestsideEvaluation, 
  calculateClassGroupStats, 
  getWestsideSdPosition,
  ClassGroupStatistics 
} from '../../../../../shared/westsideEvaluation';

interface WestsideExamAnxietyCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ApplicationScopeFilter = 'latest_per_student' | 'all';

export function filterApplicationsByScope(
  applications: SurveyApplicationDto[],
  scope: ApplicationScopeFilter
): SurveyApplicationDto[] {
  // Only complete applications with timestamp and scores
  const completed = applications.filter(a => 
    a.completedAt && (a.totalScore !== undefined || a.resultSnapshot?.totalScore !== undefined)
  );

  if (scope === 'all') {
    return completed;
  }

  // Group by student identifier and pick latest completed application
  const studentMap = new Map<string, SurveyApplicationDto>();

  for (const app of completed) {
    const studentKey = app.studentId || app.studentNumber || app.id;
    const existing = studentMap.get(studentKey);
    if (!existing) {
      studentMap.set(studentKey, app);
    } else {
      const existingTime = new Date(existing.completedAt).getTime();
      const currTime = new Date(app.completedAt).getTime();
      if (currTime > existingTime) {
        studentMap.set(studentKey, app);
      } else if (currTime === existingTime) {
        const existingAttempt = existing.attemptNumber || 0;
        const currAttempt = app.attemptNumber || 0;
        if (currAttempt > existingAttempt || (currAttempt === existingAttempt && app.id > existing.id)) {
          studentMap.set(studentKey, app);
        }
      }
    }
  }

  return Array.from(studentMap.values());
}

export const WestsideExamAnxietyCollectiveReportModal: React.FC<WestsideExamAnxietyCollectiveReportModalProps> = ({
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
        const res = await window.api.surveys.listApplications({ surveyId: 'srv-westside-sinav-kaygisi-olcegi' });
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load westside exam anxiety applications:', err);
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

  // Distinct classes derived from the application dataset (using snapshot class)
  const classList = useMemo(() => {
    const classes = new Set<string>();
    applications.forEach(a => {
      if (a.className && a.className.trim()) {
        classes.add(a.className.trim());
      }
    });
    return Array.from(classes).sort();
  }, [applications]);

  // 1. Filter by application scope (latest per student vs all)
  const scopedApps = useMemo(() => {
    return filterApplicationsByScope(applications, scopeFilter);
  }, [applications, scopeFilter]);

  // 2. Compute Class-Specific Statistics for EACH class independently
  // Each class has its own isolated mean (mu) and stdDev (sigma)
  const classStatsMap = useMemo(() => {
    const map = new Map<string, ClassGroupStatistics>();
    
    // Group scoped apps by class
    const appsByClass = new Map<string, number[]>();
    scopedApps.forEach(app => {
      const cls = (app.className || 'Belirtilmemiş').trim();
      const raw = app.totalScore ?? (app.resultSnapshot?.totalScore || 0);
      const evalResult = getWestsideEvaluation(raw);
      if (!appsByClass.has(cls)) {
        appsByClass.set(cls, []);
      }
      appsByClass.get(cls)!.push(evalResult.averageScore);
    });

    appsByClass.forEach((scores, cls) => {
      map.set(cls, calculateClassGroupStats(scores));
    });

    return map;
  }, [scopedApps]);

  // 3. Filter scoped apps by selected class and search term
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

  // Summary statistics for the top cards:
  // If a specific class is selected, show that class's exact isolated statistics.
  // If 'all' is selected, report the active class count and total sample size.
  const selectedClassStats = useMemo(() => {
    if (selectedClass !== 'all') {
      return classStatsMap.get(selectedClass) || null;
    }
    return null;
  }, [selectedClass, classStatsMap]);

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
        <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shadow-xs">
                <Table className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    The Westside Sınav Kaygısı Ölçeği — Toplu Sonuçlar Çizelgesi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs">
                    WST-11
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  1.00 – 5.00 Ortalama Puan, 6 Seviyeli Değerlendirme ve Sınıf Bazlı Bağıl Grup İstatistikleri (+1 SD / -1 SD)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
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

          {/* Filter Bar (Hidden on print) */}
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
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
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

              {/* Application Scope Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
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
              Listelenen: <span className="text-indigo-600 font-extrabold">{displayedApps.length}</span> kayıt
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
                THE WESTSIDE SINAV KAYGISI ÖLÇEĞİ — TOPLU SONUÇLAR ÇİZELGESİ
              </h1>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                {selectedClass !== 'all' ? `${selectedClass} Sınıfı Değerlendirme Raporu` : 'Genel Okul Değerlendirme Raporu (Sınıf Bazlı İstatistikler)'} &bull; Kapsam: {scopeFilter === 'latest_per_student' ? 'Öğrenci Başına Son Uygulama' : 'Tüm Uygulamalar'} &bull; Tarih: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>

            {/* Statistics Cards */}
            {selectedClass !== 'all' && selectedClassStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sınıf ({selectedClass}) N</span>
                  <span className="font-mono text-lg font-black text-slate-800">{selectedClassStats.count}</span>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Sınıf Ortalaması (&mu;)</span>
                  <span className="font-mono text-lg font-black text-indigo-900">
                    {selectedClassStats.mean.toFixed(2)} <span className="text-xs text-indigo-500 font-normal">/ 5.00</span>
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Standart Sapma (&sigma;)</span>
                  <span className="font-mono text-lg font-black text-slate-800">
                    {selectedClassStats.hasEnoughData ? selectedClassStats.stdDev.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">+1 SD Eşiği (&ge; &mu;+&sigma;)</span>
                  <span className="font-mono text-lg font-black text-rose-700">
                    {selectedClassStats.hasEnoughData ? `≥ ${selectedClassStats.highThreshold.toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">-1 SD Eşiği (&le; &mu;-&sigma;)</span>
                  <span className="font-mono text-lg font-black text-emerald-700">
                    {selectedClassStats.hasEnoughData ? `≤ ${selectedClassStats.lowThreshold.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Sınıf Bazlı İstatistik Modu:</strong> Tablodaki her öğrencinin grup karşılaştırması (+1 SD / -1 SD) yalnızca <strong>kendi sınıfının bağıl ortalama ve standart sapmasına</strong> göre hesaplanmaktadır. Farklı sınıflar aynı istatistiksel havuzda birleştirilmemektedir.
                  </span>
                </div>
                <span className="font-mono font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0">
                  {classList.length} Sınıf &bull; {displayedApps.length} Öğrenci
                </span>
              </div>
            )}

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
                      <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">UYGULAMA #</th>
                      <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">TARİH</th>
                      <th className="py-2.5 px-3 w-28 text-center border-r border-slate-200">ORTALAMA PUAN</th>
                      <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">HAM PUAN</th>
                      <th className="py-2.5 px-3 w-36 text-center border-r border-slate-200">DEĞERLENDİRME</th>
                      <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">RİSK GRUBU</th>
                      <th className="py-2.5 px-3 w-40 text-center border-r border-slate-200">GRUP KARŞILAŞTIRMASI</th>
                      <th className="py-2.5 px-3 w-20 text-center print:hidden">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {displayedApps.map((app, idx) => {
                      const raw = app.totalScore ?? (app.resultSnapshot?.totalScore || 0);
                      const evaluation = getWestsideEvaluation(raw);
                      const clsKey = (app.className || 'Belirtilmemiş').trim();
                      const classStats = classStatsMap.get(clsKey);
                      const sdInfo = getWestsideSdPosition(evaluation.averageScore, classStats);
                      const dateStr = new Date(app.completedAt).toLocaleDateString('tr-TR');

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
                          <td className="py-2 px-3 font-mono font-black text-center text-indigo-950 bg-indigo-50/30 border-r border-slate-200">
                            {evaluation.averageScoreFormatted} <span className="text-[10px] text-slate-400 font-normal">/ 5.00</span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-center text-slate-600 border-r border-slate-200">
                            {raw} <span className="text-[10px] text-slate-400 font-normal">/ 55</span>
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${evaluation.category.colorClasses.badge}`}>
                              {evaluation.category.categoryLabel}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            {evaluation.isRiskGroup ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                EVET
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                HAYIR
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-200">
                            {sdInfo.position === 'high' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <TrendingUp className="w-3 h-3 text-rose-600" />
                                {sdInfo.label}
                              </span>
                            ) : sdInfo.position === 'low' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <TrendingDown className="w-3 h-3 text-emerald-600" />
                                {sdInfo.label}
                              </span>
                            ) : sdInfo.position === 'within_sd' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200">
                                <Activity className="w-3 h-3 text-slate-500" />
                                {sdInfo.label}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-medium">{sdInfo.label}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(app)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
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
