import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  ClipboardList, 
  Eye, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { SurveyDto, SurveyApplicationDto } from '@shared/ipc-types';
import { useAppStore } from '../../../stores/appStore';
import { SurveyResultDetailModal } from './SurveyResultDetailModal';
import { ModalPortal } from '../../../components/ModalPortal';

interface SurveyApplicationsModalProps {
  survey: SurveyDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyApplicationsModal: React.FC<SurveyApplicationsModalProps> = ({
  survey,
  isOpen,
  onClose
}) => {
  const { setSelectedStudentId } = useAppStore();
  const [applications, setApplications] = useState<SurveyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<SurveyApplicationDto | null>(null);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.surveys) {
        const filter = survey ? { surveyId: survey.id } : undefined;
        const res = await window.api.surveys.listApplications(filter);
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load survey applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApplications();
      setSearchTerm('');
    }
  }, [isOpen, survey]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications;
    const term = searchTerm.toLowerCase().trim();
    return applications.filter(a => {
      const name = a.studentName.toLowerCase();
      const num = a.studentNumber.toLowerCase();
      const cls = (a.className || '').toLowerCase();
      const srv = (a.surveyTitle || '').toLowerCase();
      return name.includes(term) || num.includes(term) || cls.includes(term) || srv.includes(term);
    });
  }, [applications, searchTerm]);

  const handleOpenDetail = async (app: SurveyApplicationDto) => {
    try {
      if (window.api && window.api.surveys) {
        const fullDetail = await window.api.surveys.getApplicationDetail(app.id);
        setSelectedApplicationForDetail(fullDetail || app);
      } else {
        setSelectedApplicationForDetail(app);
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
      setSelectedApplicationForDetail(app);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-extrabold shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {survey ? survey.title : 'Tüm Anket / Envanter Uygulamaları'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                    {applications.length} Uygulama
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {survey 
                    ? 'Bu teste ait öğrenci doldurma geçmişi, denemeler ve hesaplanan sonuçlar'
                    : 'Sistemdeki tüm öğrenci anket ve ölçek doldurma geçmişi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadApplications}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı, okul no veya sınıf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Toplam <strong>{filteredApplications.length}</strong> kayıt listeleniyor
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Uygulamalar yükleniyor...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-700 font-bold text-xs">Uygulama Kaydı Bulunamadı</div>
                <div className="text-slate-400 text-xs italic">
                  {searchTerm.trim() 
                    ? `"${searchTerm}" ile eşleşen sonuç bulunamadı.` 
                    : 'Bu teste ait henüz tamamlanmış bir öğrenci uygulaması bulunmuyor.'}
                </div>
              </div>
            ) : (
              <table className="pdr-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">SIRA</th>
                    <th className="w-28">OKUL NO</th>
                    <th>ÖĞRENCİ ADI SOYADI</th>
                    <th className="w-20">SINIF</th>
                    {!survey && <th>TEST ADI</th>}
                    <th className="w-28 text-center">UYGULAMA #</th>
                    <th className="w-28">TARİH</th>
                    <th className="w-24 text-center">PUAN</th>
                    <th>DEĞERLENDİRME</th>
                    <th className="w-28 text-center">İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app, idx) => {
                    const interpLabel = app.resultSnapshot?.interpretation?.label;
                    const interpDesc = app.resultSnapshot?.interpretation?.description;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="text-center font-mono font-medium text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="font-mono text-xs font-semibold text-slate-700">
                          {app.studentNumber}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(app.studentId);
                            }}
                            className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-xs tracking-tight text-left cursor-pointer transition-colors"
                            title="Öğrenci profilini aç"
                          >
                            {app.studentName}
                          </button>
                        </td>
                        <td className="text-xs font-semibold text-slate-600">
                          {app.className || '—'}
                        </td>
                        {!survey && (
                          <td className="text-xs font-bold text-slate-800 max-w-xs truncate">
                            {app.surveyTitle}
                          </td>
                        )}
                        <td className="text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                            Deneme #{app.attemptNumber}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-slate-600 font-medium">
                          {new Date(app.completedAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="text-center font-mono font-extrabold text-xs text-blue-700">
                          {app.totalScore !== undefined ? app.totalScore : '—'}
                        </td>
                        <td className="max-w-xs truncate">
                          {interpLabel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{interpLabel}</span>
                            </span>
                          ) : interpDesc ? (
                            <span className="text-[11px] text-slate-600 truncate">{interpDesc}</span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Puanlandı</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
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
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[11px] text-slate-400">
              Öğrenci adına tıklayarak öğrenci profilini, <strong>"Sonucu Gör"</strong> butonuna basarak detaylı sonuç raporunu inceleyebilirsiniz.
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

        {/* Result Detail Sub-Modal */}
        <SurveyResultDetailModal
          application={selectedApplicationForDetail}
          isOpen={Boolean(selectedApplicationForDetail)}
          onClose={() => setSelectedApplicationForDetail(null)}
        />
      </div>
    </ModalPortal>
  );
};
