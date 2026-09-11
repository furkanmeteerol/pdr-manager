import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Printer, 
  Search, 
  Table, 
  GraduationCap
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../../components/ModalPortal';

interface ExamAnxietyCollectiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExamAnxietyCollectiveReportModal: React.FC<ExamAnxietyCollectiveReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [applications, setApplications] = useState<SurveyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const printContainerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.listApplications({ surveyId: 'srv-sinav-kaygisi-olcegi' });
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load exam anxiety applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchTerm('');
      setSelectedClass('all');
    }
  }, [isOpen]);

  const classList = useMemo(() => {
    const classes = new Set<string>();
    applications.forEach(a => {
      if (a.className) classes.add(a.className);
    });
    return Array.from(classes).sort();
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (selectedClass !== 'all' && app.className !== selectedClass) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = app.studentName.toLowerCase();
      const num = app.studentNumber.toLowerCase();
      const cls = (app.className || '').toLowerCase();
      return name.includes(term) || num.includes(term) || cls.includes(term);
    });
  }, [applications, selectedClass, searchTerm]);

  const getSubscaleScore = (app: SurveyApplicationDto, subscaleKey: string): number => {
    const subscales = app.resultSnapshot?.subscales || [];
    const found = subscales.find((s: any) => 
      s.code === subscaleKey || 
      s.title?.toLowerCase().includes(subscaleKey.toLowerCase())
    );
    return found ? found.score : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold shadow-xs">
                <Table className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    Sınav Kaygısı Ölçeği — Toplu Sonuçlar Çizelgesi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                    {filteredApps.length} Kayıt
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrencilerin 7 alt boyut ve toplam sınav kaygısı puanlarının toplu karşılaştırma ve değerlendirme çizelgesi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Çizelgeyi Yazdır</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Öğrenci adı veya okul no ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">Tüm Sınıflar ({applications.length})</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Gösterilen: <strong>{filteredApps.length}</strong> / Toplam: <strong>{applications.length}</strong>
            </div>
          </div>

          {/* Printable Report Content */}
          <div ref={printContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 print:p-0 print:overflow-visible">
            
            {/* Printable Header (visible on paper/print only) */}
            <div className="hidden print:block text-center border-b-2 border-slate-800 pb-3 mb-4">
              <div className="text-xs font-bold tracking-widest text-slate-600 uppercase">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1 uppercase">
                SINAV KAYGISI ÖLÇEĞİ TOPLU SONUÇLAR ÇİZELGESİ
              </h2>
              <div className="flex justify-between items-center text-[10px] text-slate-600 mt-2">
                <span><strong>Sınıf/Grup:</strong> {selectedClass === 'all' ? 'Tüm Sınıflar' : selectedClass}</span>
                <span><strong>Öğrenci Sayısı:</strong> {filteredApps.length}</span>
                <span><strong>Tarih:</strong> {new Date().toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs">Uygulama sonuçları yükleniyor...</div>
            ) : filteredApps.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Table className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-700 font-bold text-xs">Kayıt Bulunamadı</div>
                <div className="text-slate-400 text-xs italic">
                  Sınav Kaygısı Ölçeği için henüz tamamlanmış uygulama kaydı bulunmuyor.
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 w-10 text-center border-r border-slate-200">NO</th>
                      <th className="p-2.5 w-24 border-r border-slate-200">OKUL NO</th>
                      <th className="p-2.5 border-r border-slate-200">ÖĞRENCİ ADI SOYADI</th>
                      <th className="p-2.5 w-16 border-r border-slate-200 text-center">SINIF</th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-amber-50/50">
                        1. Başk. Görüşü <span className="block text-[9px] text-slate-400 font-normal">(Max 8)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-blue-50/50">
                        2. Kendi Görüşü <span className="block text-[9px] text-slate-400 font-normal">(Max 7)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-rose-50/50">
                        3. Gelecek <span className="block text-[9px] text-slate-400 font-normal">(Max 6)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-orange-50/50">
                        4. Hazırlık <span className="block text-[9px] text-slate-400 font-normal">(Max 6)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-red-50/50">
                        5. Bedensel <span className="block text-[9px] text-slate-400 font-normal">(Max 7)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-indigo-50/50">
                        6. Zihinsel <span className="block text-[9px] text-slate-400 font-normal">(Max 10)</span>
                      </th>
                      <th className="p-2 w-16 text-center border-r border-slate-200 bg-purple-50/50">
                        7. Genel <span className="block text-[9px] text-slate-400 font-normal">(Max 6)</span>
                      </th>
                      <th className="p-2.5 w-20 text-center border-r border-slate-200 bg-slate-200/60 font-extrabold text-blue-900">
                        TOPLAM <span className="block text-[9px] font-normal">(Max 50)</span>
                      </th>
                      <th className="p-2.5 w-36 border-r border-slate-200">DEĞERLENDİRME</th>
                      <th className="p-2.5 w-24 text-center">TARİH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredApps.map((app, idx) => {
                      const s1 = getSubscaleScore(app, 'BASKALARININ_GORUSU');
                      const s2 = getSubscaleScore(app, 'KENDI_GORUSUNUZ');
                      const s3 = getSubscaleScore(app, 'GELECEK_ENDISELERI');
                      const s4 = getSubscaleScore(app, 'HAZIRLANMAKLA_ILGILI');
                      const s5 = getSubscaleScore(app, 'BEDENSEL_TEPKILER');
                      const s6 = getSubscaleScore(app, 'ZIHINSEL_TEPKILER');
                      const s7 = getSubscaleScore(app, 'GENEL_KAYGI');
                      const total = app.resultSnapshot?.totalScore ?? app.totalScore ?? 0;

                      const isHigh1 = s1 >= 4;
                      const isHigh2 = s2 >= 4;
                      const isHigh3 = s3 >= 3;
                      const isHigh4 = s4 >= 3;
                      const isHigh5 = s5 >= 4;
                      const isHigh6 = s6 >= 4;
                      const isHigh7 = s7 >= 3;
                      const rowHighCount = [isHigh1, isHigh2, isHigh3, isHigh4, isHigh5, isHigh6, isHigh7].filter(Boolean).length;
                      const rowLowCount = 7 - rowHighCount;

                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 text-center font-mono text-slate-400 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-200">{app.studentNumber}</td>
                          <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{app.studentName}</td>
                          <td className="p-2 text-center text-slate-600 border-r border-slate-200">{app.className || '—'}</td>
                          
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s1}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s2}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s3}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s4}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s5}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s6}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200 text-slate-700">
                            {s7}
                          </td>

                          <td className="p-2 text-center font-mono font-extrabold text-blue-800 bg-slate-50 border-r border-slate-200 text-sm">
                            {total}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {rowHighCount > 0 && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                  {rowHighCount} Yüksek
                                </span>
                              )}
                              {rowLowCount > 0 && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                  {rowLowCount} Düşük
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                            {new Date(app.completedAt).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Printout Signature Area */}
            <div className="hidden print:flex justify-between items-end pt-12 text-xs text-slate-800">
              <div className="text-center">
                <div className="font-bold">Düzenleyen</div>
                <div className="mt-8 text-slate-500">Psikolojik Danışman / Rehber Öğretmen</div>
              </div>
              <div className="text-center">
                <div className="font-bold">Onaylayan</div>
                <div className="mt-8 text-slate-500">Okul Müdürü</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
            <span className="text-[11px] text-slate-400">
              Puanlar: 1. Başk. Görüşü (Max 8), 2. Kendi Görüşü (Max 7), 3. Gelecek (Max 6), 4. Hazırlık (Max 6), 5. Bedensel (Max 7), 6. Zihinsel (Max 10), 7. Genel (Max 6). Toplam: Max 50.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
