import React, { useState, useMemo } from 'react';
import { X, Printer, Table, Filter, Users, ListFilter } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';
import { 
  evaluateCollectiveKimeGoreBenNeyim, 
  KGBN_SCALE_METADATA, 
  KGBN_PERSPECTIVES
} from '../../../../../shared/kimeGoreBenNeyimEvaluation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
}

export const KimeGoreBenNeyimCollectiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  applications
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [scope, setScope] = useState<'latest' | 'all'>('latest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'students' | 'items'>('students');

  const classList = useMemo(() => {
    const set = new Set<string>();
    applications.forEach(a => {
      if (a.className && a.className.trim()) set.add(a.className.trim());
    });
    return Array.from(set).sort();
  }, [applications]);

  const collectiveData = useMemo(() => {
    return evaluateCollectiveKimeGoreBenNeyim(
      applications,
      { scope, classFilter: selectedClass }
    );
  }, [applications, scope, selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return collectiveData.studentMatrix;
    const term = searchTerm.toLowerCase().trim();
    return collectiveData.studentMatrix.filter(st =>
      st.studentName.toLowerCase().includes(term) ||
      st.studentNumber.toLowerCase().includes(term) ||
      st.className.toLowerCase().includes(term)
    );
  }, [collectiveData, searchTerm]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return collectiveData.itemSummaries;
    const term = searchTerm.toLowerCase().trim();
    return collectiveData.itemSummaries.filter(it => 
      it.text.toLowerCase().includes(term) || String(it.itemNumber).includes(term)
    );
  }, [collectiveData, searchTerm]);

  const handleExportPdf = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80 rounded-t-3xl print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {KGBN_SCALE_METADATA.title} — Toplu Sonuçlar Çizelgesi
                </h3>
                <p className="text-xs text-slate-500">
                  Öğrenci bazlı algı dağılımı, en az perspektif analizi ve 40+ özellik işaretlenme frekansları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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

          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'students'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Öğrenci Matrisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'items'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Madde Frekansları</span>
                </button>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Sınıf:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Scope */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Kapsam:</span>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="latest">Her Öğrencinin En Son Uygulaması</option>
                  <option value="all">Tüm Uygulamalar</option>
                </select>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder={activeTab === 'students' ? 'Öğrenci veya sınıf ara...' : 'Özellik ara...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>

            <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-xl">
              Toplam Değerlendirilen: <span className="text-indigo-600">{collectiveData.totalEvaluated}</span> Öğrenci
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible text-slate-900 bg-white">
            
            {/* Clean Print Header */}
            <div className="hidden print:block text-center pb-4 border-b border-slate-800 space-y-1 mb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase">
                {KGBN_SCALE_METADATA.title} — TOPLU SONUÇLAR ÇİZELGESİ
              </h2>
              <div className="text-xs text-slate-600">
                Sınıf: <strong>{selectedClass === 'ALL' ? 'Tüm Sınıflar' : selectedClass}</strong> • Toplam Öğrenci: <strong>{collectiveData.totalEvaluated}</strong> • Tarih: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>

            {/* Summary Perspective Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {KGBN_PERSPECTIVES.map(p => {
                const tot = collectiveData.perspectiveTotals[p.key];
                const isSelf = p.key === 'self';
                return (
                  <div key={p.key} className={`p-3 rounded-2xl border ${isSelf ? 'bg-blue-50/80 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[11px] font-bold text-slate-500 block truncate">{p.orderIndex}. {p.label}</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {tot.totalMarksCount} <span className="text-[10px] text-slate-400 font-normal">işaret</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      Ort: {tot.averageMarksPerStudent} / öğr.
                    </span>
                  </div>
                );
              })}
            </div>

            {/* TAB 1: Student Matrix Table */}
            {activeTab === 'students' && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 w-12 text-center">SIRA</th>
                        <th className="py-2.5 px-3 w-24">OKUL NO</th>
                        <th className="py-2.5 px-3">ÖĞRENCİ ADI SOYADI</th>
                        <th className="py-2.5 px-2 text-center w-20">SINIF</th>
                        <th className="py-2.5 px-2 text-center w-24">Öğretmenlerime</th>
                        <th className="py-2.5 px-2 text-center w-20">Anneme</th>
                        <th className="py-2.5 px-2 text-center w-20">Babama</th>
                        <th className="py-2.5 px-2 text-center w-24">Kardeşlerime</th>
                        <th className="py-2.5 px-2 text-center w-24">Arkadaşlarıma</th>
                        <th className="py-2.5 px-2 text-center w-20 bg-blue-100/70 text-blue-950 font-bold">Bana</th>
                        <th className="py-2.5 px-3 text-center w-24 bg-slate-200/70 font-bold">TOPLAM</th>
                        <th className="py-2.5 px-3 w-36">EN AZ PERSPEKTİF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((st, idx) => (
                          <tr key={st.studentId || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                              {st.studentNumber}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              <div>{st.studentName}</div>
                              {st.customCharacteristicsSummary && (
                                <div className="text-[10px] text-indigo-600 font-normal mt-0.5 truncate max-w-xs" title={st.customCharacteristicsSummary}>
                                  Ek: {st.customCharacteristicsSummary}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-600 font-medium">
                              {st.className || '—'}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-slate-800">
                              {st.perspectiveMarkCounts.teachers}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-slate-800">
                              {st.perspectiveMarkCounts.mother}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-slate-800">
                              {st.perspectiveMarkCounts.father}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-slate-800">
                              {st.perspectiveMarkCounts.siblings}
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-slate-800">
                              {st.perspectiveMarkCounts.friends}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-blue-900 bg-blue-50/40">
                              {st.perspectiveMarkCounts.self}
                            </td>
                            <td className="py-2 px-3 text-center font-extrabold text-indigo-900 bg-slate-50/80">
                              {st.selectedCellCount} / {st.totalPossibleCells}
                            </td>
                            <td className="py-2 px-3 text-xs font-semibold text-amber-900">
                              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px]">
                                {st.leastPerspectiveLabel}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-slate-400 italic">
                            Kayıtlı öğrenci uygulaması bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Item Frequency Table */}
            {activeTab === 'items' && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3">Özellik (Nesiniz - Nasılsınız?)</th>
                        <th className="py-2.5 px-2 text-center w-28">1. Öğretmenlerime</th>
                        <th className="py-2.5 px-2 text-center w-24">2. Anneme</th>
                        <th className="py-2.5 px-2 text-center w-24">3. Babama</th>
                        <th className="py-2.5 px-2 text-center w-28">4. Kardeşlerime</th>
                        <th className="py-2.5 px-2 text-center w-28">5. Arkadaşlarıma</th>
                        <th className="py-2.5 px-2 text-center w-28 bg-blue-100/70 text-blue-950">6. Bana (Benlik)</th>
                        <th className="py-2.5 px-3 text-center w-28 bg-slate-200/70">En Az 1 Perspektif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.length > 0 ? (
                        filteredItems.map(item => {
                          const hasAny = item.totalMarkedAnyPerspectiveCount > 0;
                          return (
                            <tr key={item.itemNumber} className={`hover:bg-slate-50/80 transition-colors ${hasAny ? 'bg-white' : 'bg-slate-50/40'}`}>
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                                {item.itemNumber}
                              </td>
                              <td className={`py-2 px-3 ${hasAny ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                                {item.text}
                              </td>
                              {KGBN_PERSPECTIVES.map(p => {
                                const stat = item.perspectiveStats[p.key];
                                const isSelf = p.key === 'self';
                                return (
                                  <td key={p.key} className={`py-2 px-2 text-center ${isSelf ? 'bg-blue-50/40 font-bold' : ''}`}>
                                    {stat.count > 0 ? (
                                      <div className="flex flex-col items-center">
                                        <span className={`font-bold ${isSelf ? 'text-blue-900' : 'text-slate-800'}`}>
                                          {stat.count}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          ({stat.percentageFormatted})
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-3 text-center font-bold text-indigo-900 bg-slate-50/80">
                                {hasAny ? (
                                  <div className="flex flex-col items-center">
                                    <span>{item.totalMarkedAnyPerspectiveCount}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ({item.percentageAnyPerspectiveFormatted})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                            Kriterlere uygun özellik bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Note */}
            <p className="text-[11px] text-slate-400 italic text-center">
              * Bu çizelgedeki oranlar norm veya risk seviyesi teşkil etmez; sadece ilgili grubun işaretleme frekansıdır.
            </p>

          </div>

        </div>
      </div>
    </ModalPortal>
  );
};
