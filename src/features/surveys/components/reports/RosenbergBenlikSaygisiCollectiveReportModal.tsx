import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Search, 
  Filter, 
  Table, 
  Eye
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../../components/ModalPortal';
import { 
  evaluateCollectiveRosenberg,
  RosenbergSubscaleCode
} from '../../../../../shared/rosenbergBenlikSaygisiEvaluation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  applications: SurveyApplicationDto[];
  students?: any[];
  surveyTitle?: string;
  onViewResult?: (application: SurveyApplicationDto) => void;
}

export const RosenbergBenlikSaygisiCollectiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  applications,
  surveyTitle = 'Rosenberg Benlik Saygısı Envanteri',
  onViewResult
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract unique classes
  const classList = useMemo(() => {
    const classes = new Set<string>();
    applications.forEach(a => {
      if (a.className) classes.add(a.className);
    });
    return Array.from(classes).sort();
  }, [applications]);

  // Collective Evaluation
  const collectiveData = useMemo(() => {
    return evaluateCollectiveRosenberg(applications as any, {
      scope,
      classFilter: selectedClass === 'ALL' ? undefined : selectedClass
    });
  }, [applications, scope, selectedClass]);

  // Filtered rows for search term
  const filteredMatrix = useMemo(() => {
    if (!searchTerm.trim()) return collectiveData.studentMatrix;
    const term = searchTerm.toLowerCase().trim();
    return collectiveData.studentMatrix.filter(row => 
      row.studentName.toLowerCase().includes(term) ||
      row.studentNumber.toLowerCase().includes(term) ||
      row.className.toLowerCase().includes(term)
    );
  }, [collectiveData.studentMatrix, searchTerm]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {surveyTitle} Toplu Sonuçlar Çizelgesi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  12 Alt Ölçek Karşılaştırmalı Sınıf / Kurum Matrisi ({collectiveData.totalEvaluated} Öğrenci)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır / PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Sınıf:</span>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">Tüm Sınıflar ({applications.length})</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setScope('latest')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    scope === 'latest' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Son Uygulama
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    scope === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tüm Kayıtlar
                </button>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı veya okul no ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
              >
              </input>
            </div>
          </div>

          {/* Subscales Summary Cards */}
          <div className="p-4 bg-white border-b border-slate-100 overflow-x-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              12 Alt Boyut Genel Ortalamaları
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 min-w-[900px]">
              {collectiveData.subscaleSummaries.map(sub => {
                const avgStr = sub.code === 'D1' ? sub.averageScore.toFixed(2) : String(sub.averageScore);
                return (
                  <div key={sub.code} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                    <div className="font-mono text-[9px] font-bold text-slate-500">{sub.displayCode}</div>
                    <div className="text-[10px] font-bold text-slate-800 truncate" title={sub.name}>{sub.name}</div>
                    <div className="text-xs font-black text-blue-600 mt-1">
                      {avgStr} <span className="text-[9px] text-slate-400 font-semibold">/ {sub.maxScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Matrix Table */}
          <div className="flex-1 overflow-auto p-4">
            {filteredMatrix.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Kriterlere uygun öğrenci kaydı bulunamadı.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="p-2.5 font-bold sticky left-0 bg-slate-100/90 min-w-[140px] z-10">Öğrenci Adı Soyadı</th>
                    <th className="p-2.5 font-bold text-center w-20">Okul No</th>
                    <th className="p-2.5 font-bold text-center w-16">Sınıf</th>
                    <th className="p-2 font-bold text-center w-20" title="D-1: Benlik Saygısı">D-1<br/><span className="text-[9px] font-normal text-slate-500">Benlik</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-2: Kendilik Kavramının Sürekliliği">D-2<br/><span className="text-[9px] font-normal text-slate-500">Süreklilik</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-3: İnsanlara Güven Duyma">D-3<br/><span className="text-[9px] font-normal text-slate-500">Güven</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-4: Eleştiriye Duyarlılık">D-4<br/><span className="text-[9px] font-normal text-slate-500">Eleştiri</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-5: Depresif Duygulanım">D-5<br/><span className="text-[9px] font-normal text-slate-500">Depresif</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-6: Hayalperestlik">D-6<br/><span className="text-[9px] font-normal text-slate-500">Hayal</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-7: Psikosomatik Belirtiler">D-7<br/><span className="text-[9px] font-normal text-slate-500">Psikosom.</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-8: Kişilerarası İlişkilerde Tehdit Hissetme">D-8<br/><span className="text-[9px] font-normal text-slate-500">Tehdit</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-9: Tartışmalara Katılabilme Derecesi">D-9<br/><span className="text-[9px] font-normal text-slate-500">Tartışma</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-10: Ana-Baba İlgisi">D-10<br/><span className="text-[9px] font-normal text-slate-500">Ebeveyn</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-11: Babayla İlişki">D-11<br/><span className="text-[9px] font-normal text-slate-500">Baba</span></th>
                    <th className="p-2 font-bold text-center w-20" title="D-12: Psişik İzolasyon">D-12<br/><span className="text-[9px] font-normal text-slate-500">İzolasyon</span></th>
                    <th className="p-2.5 font-bold text-center w-12">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrix.map((row) => {
                    const originalApp = applications.find(a => a.studentId === row.studentId);
                    return (
                      <tr key={`${row.studentId}-${row.attemptNumber}`} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-2.5 font-semibold text-slate-800 sticky left-0 bg-white hover:bg-blue-50/40 z-10 whitespace-nowrap">
                          {row.studentName}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.studentNumber}</td>
                        <td className="p-2.5 text-center text-slate-600">{row.className}</td>
                        
                        {(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'] as RosenbergSubscaleCode[]).map(code => {
                          const score = row.subscaleScores[code] ?? 0;
                          const scoreStr = code === 'D1' ? score.toFixed(1) : String(score);
                          const level = row.subscaleLevels[code] || 'Tanımsız';
                          return (
                            <td key={code} className="p-1.5 text-center">
                              <div className="font-bold text-slate-800 text-[11px]">{scoreStr}</div>
                              <div className="text-[9px] text-slate-500 truncate max-w-[70px] mx-auto" title={level}>
                                {level}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-2 text-center">
                          {originalApp && onViewResult && (
                            <button
                              type="button"
                              onClick={() => onViewResult(originalApp)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Bireysel Sonucu İncele"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
