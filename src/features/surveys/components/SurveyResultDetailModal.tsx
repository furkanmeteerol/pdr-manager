import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Download,
  Calendar, 
  User,
  CheckCircle2
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { getSurveyResultRenderer } from './renderers/SurveyResultRendererRegistry';
import { getSurveyReportComponent } from './reports/SurveyReportRegistry';
import { ModalPortal } from '../../../components/ModalPortal';

interface SurveyResultDetailModalProps {
  application: SurveyApplicationDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyResultDetailModal: React.FC<SurveyResultDetailModalProps> = ({
  application,
  isOpen,
  onClose
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  if (!isOpen || !application) return null;

  // Extract immutable resultPresentation config from snapshot or fallback to survey slug
  const resultSnapshot = application.resultSnapshot;
  const presentationConfig = resultSnapshot?.resultPresentation;
  const rendererType = presentationConfig?.rendererType || application.surveySlug || 'generic';

  // Resolve the appropriate interactive presentation renderer
  const RendererComponent = getSurveyResultRenderer(rendererType);

  // Resolve the specialized A4 print/PDF report component
  const ReportComponent = getSurveyReportComponent(application.surveySlug || application.surveyId);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportFeedback(null);
      if (window.api && window.api.surveys && window.api.surveys.exportPdfReport) {
        const res = await window.api.surveys.exportPdfReport(application.id);
        if (res.success && res.filePath) {
          setExportFeedback('PDF Raporu başarıyla kaydedildi!');
          setTimeout(() => setExportFeedback(null), 4000);
        } else if (res.error) {
          alert(`PDF oluşturma hatası: ${res.error}`);
        }
      } else {
        window.print();
      }
    } catch (err: any) {
      alert(`PDF aktarma hatası: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      {/* Interactive Modal (Visible on Screen, Hidden on Print) */}
      <ModalPortal>
        <div className="fixed inset-0 z-[1200] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 print:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      {application.surveyTitle}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                      Uygulama #{application.attemptNumber}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-800 font-bold">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{application.studentName}</span>
                    </span>
                    <span>•</span>
                    <span>No: <strong className="font-mono text-slate-700">{application.studentNumber}</strong></span>
                    {application.className && (
                      <>
                        <span>•</span>
                        <span>Sınıf: <strong className="text-slate-700">{application.className}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(application.completedAt).toLocaleDateString('tr-TR')} {new Date(application.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {exportFeedback && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{exportFeedback}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="Resmî PDF Raporu Oluştur ve Kaydet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'PDF Hazırlanıyor...' : 'PDF İndir'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body - Handled by Selected Presentation Renderer */}
            <div className="flex-1 overflow-y-auto p-5">
              <RendererComponent
                application={application}
                presentationConfig={presentationConfig}
              />
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-[11px] text-slate-400 font-medium">
                {application.surveySlug === 'sinav-kaygisi-olcegi' || application.surveyId === 'srv-sinav-kaygisi-olcegi'
                  ? '* Sınav Kaygısı Ölçeği 50 maddeden oluşur. Sonuç ve alt boyut dağılımı resmî değerlendirme esaslarına göre hesaplanmıştır.'
                  : (application.surveySlug === 'basarisizlik-nedenleri-anketi' || application.surveyId === 'srv-basarisizlik-nedenleri-anketi')
                  ? '* Başarısızlık Nedenleri Anketi 44 maddeden oluşur. Belirtilen nedenler öğrencinin kendi beyanına dayanmaktadır.'
                  : (application.surveySlug === 'otomatik-dusunceler-olcegi' || application.surveyId === 'srv-otomatik-dusunceler-olcegi')
                  ? '* Otomatik Düşünceler Ölçeği 30 maddeden oluşur. Puan aralığı 30-150 arasındadır.'
                  : (application.surveySlug === 'burdon-dikkat-testi' || application.surveyId === 'srv-burdon-dikkat-testi')
                  ? '* Burdon Dikkat Testi sonuçları otomatik olarak hesaplanmıştır.'
                  : ''}
              </div>
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

      {/* Dedicated A4 Print Report (Hidden on Screen, Rendered Purely for Print / PDF) */}
      <div className="survey-print-container hidden print:block">
        <ReportComponent application={application} />
      </div>
    </>
  );
};
