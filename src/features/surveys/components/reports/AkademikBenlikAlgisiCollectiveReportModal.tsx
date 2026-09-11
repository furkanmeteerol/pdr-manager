import React, { useState, useMemo } from 'react';
import { X, Printer, Filter, GraduationCap } from 'lucide-react';
import { ModalPortal } from '../../../../components/ModalPortal';
import { 
  evaluateCollectiveAkademikBenlikAlgisi, 
  ABAÖ_SCALE_METADATA, 
  AkademikBenlikFactorCode 
} from '../../../../../shared/akademikBenlikAlgisiEvaluation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
}

export const AkademikBenlikAlgisiCollectiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  applications
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [scope, setScope] = useState<'latest_per_student' | 'all'>('latest_per_student');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const classList = useMemo(() => {
    const set = new Set<string>();
    applications.forEach(a => {
      if (a.className && a.className.trim()) set.add(a.className.trim());
      else if (a.class_name && a.class_name.trim()) set.add(a.class_name.trim());
    });
    return Array.from(set).sort();
  }, [applications]);

  const collectiveData = useMemo(() => {
    return evaluateCollectiveAkademikBenlikAlgisi(
      applications,
      { scope, classFilter: selectedClass }
    );
  }, [applications, scope, selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return collectiveData.studentMatrix;
    const term = searchTerm.toLowerCase().trim();
    return collectiveData.studentMatrix.filter(st =>
      (st.studentName && st.studentName.toLowerCase().includes(term)) ||
      (st.studentNumber && String(st.studentNumber).includes(term)) ||
      (st.className && st.className.toLowerCase().includes(term))
    );
  }, [collectiveData, searchTerm]);

  const factorCodes: AkademikBenlikFactorCode[] = [
    'turk_dili_edebiyati',
    'tarih',
    'matematik',
    'fizik',
    'kimya',
    'biyoloji',
    'cografya',
    'yabanci_dil'
  ];

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
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {ABAÖ_SCALE_METADATA.title} — Toplu Analiz ve Puan Matrisi
                </h3>
                <p className="text-xs text-slate-500">
                  Sınıf ve grup bazında 8 temel ders alanı akademik benlik algısı ortalamaları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Tüm Sınıflar</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Scope */}
              <div className="flex items-center gap-1.5">
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="latest_per_student">Her Öğrencinin En Son Uygulaması</option>
                  <option value="all">Tüm Uygulamalar</option>
                </select>
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Öğrenci veya numara ara..."
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Toplam: <strong className="text-blue-700">{collectiveData.totalStudents}</strong> Öğrenci | Genel Sınıf Ortalaması: <strong className="text-blue-700">{collectiveData.overallClassMean.toFixed(2)}</strong>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Factor Stats Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Ders Alanları İstatistiksel Özeti (1.00 - 8.00 Likert Ortalamaları)
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Ders Alanı</th>
                      <th className="py-2.5 px-3 text-center">Öğrenci Sayısı</th>
                      <th className="py-2.5 px-3 text-center">Ortalama</th>
                      <th className="py-2.5 px-3 text-center">Standart Sapma</th>
                      <th className="py-2.5 px-3 text-center">En Düşük</th>
                      <th className="py-2.5 px-3 text-center">En Yüksek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {collectiveData.factorStats.map(stat => (
                      <tr key={stat.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{stat.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{stat.count}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/50">{stat.mean.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{stat.sd.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{stat.min.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{stat.max.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students Matrix Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Öğrenci Bazlı Ders Alanı Puan Matrisi
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Öğrenci</th>
                      <th className="py-2.5 px-3 text-center">Sınıf</th>
                      <th className="py-2.5 px-3 text-center bg-blue-50 text-blue-900">Genel Ort.</th>
                      <th className="py-2.5 px-3 text-center">T. Dili Ed.</th>
                      <th className="py-2.5 px-3 text-center">Tarih</th>
                      <th className="py-2.5 px-3 text-center">Matematik</th>
                      <th className="py-2.5 px-3 text-center">Fizik</th>
                      <th className="py-2.5 px-3 text-center">Kimya</th>
                      <th className="py-2.5 px-3 text-center">Biyoloji</th>
                      <th className="py-2.5 px-3 text-center">Coğrafya</th>
                      <th className="py-2.5 px-3 text-center">Yabancı Dil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st, idx) => (
                      <tr key={st.applicationId || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {st.studentName}
                          {st.studentNumber && <span className="text-[10px] text-slate-400 ml-1">({st.studentNumber})</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{st.className}</td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-700 bg-blue-50/40">
                          {st.overallMean.toFixed(2)}
                        </td>
                        {factorCodes.map(f => (
                          <td key={f} className="py-2.5 px-3 text-center font-medium text-slate-700">
                            {st.factorMeans[f] !== undefined ? st.factorMeans[f].toFixed(2) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={12} className="py-6 text-center text-slate-400">
                          Kayıt bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
