import React, { useState, useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { SurveyDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../components/ModalPortal';

interface SurveyPrintModalProps {
  survey: SurveyDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyPrintModal: React.FC<SurveyPrintModalProps> = ({
  survey,
  isOpen,
  onClose
}) => {
  const [surveyDetail, setSurveyDetail] = useState<SurveyDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && survey) {
      setIsLoading(true);
      if (window.api && window.api.surveys) {
        window.api.surveys.getBySlug(survey.slug || survey.id).then(res => {
          setSurveyDetail(res || survey);
          setIsLoading(false);
        }).catch(() => {
          setSurveyDetail(survey);
          setIsLoading(false);
        });
      } else {
        setSurveyDetail(survey);
        setIsLoading(false);
      }
    }
  }, [isOpen, survey]);

  if (!isOpen || !survey) return null;

  const questions = surveyDetail?.questions || surveyDetail?.currentVersion?.questions || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none">
        
        {/* Modal Topbar (Hidden when printing) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kağıt Anket Formu Yazdır / Önizle</h3>
              <p className="text-xs text-slate-500">{survey.title} (A4 Kağıt Dağıtım Formatı)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır (A4 / PDF)</span>
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

        {/* Printable Paper Survey Body */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible text-slate-900 bg-white font-sans">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Anket formu yükleniyor...</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 print:space-y-4">
              
              {/* Document Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                  T.C. MİLLÎ EĞİTİM BAKANLIĞI • REHBERLİK VE PSİKOLOJİK DANIŞMA SERVİSİ
                </div>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {survey.title}
                </h1>
                {survey.description && (
                  <p className="text-xs text-slate-600 italic">
                    {survey.description}
                  </p>
                )}
              </div>

              {/* Student Identification Info Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs print:border-slate-800 print:bg-transparent">
                <div>
                  <span className="font-bold text-slate-700">Adı Soyadı:</span>
                  <div className="border-b border-dotted border-slate-400 mt-4"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Okul No:</span>
                  <div className="border-b border-dotted border-slate-400 mt-4"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Sınıfı / Şubesi:</span>
                  <div className="border-b border-dotted border-slate-400 mt-4"></div>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Uygulama Tarihi:</span>
                  <div className="border-b border-dotted border-slate-400 mt-4"></div>
                </div>
              </div>

              {/* Survey Instructions */}
              <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent">
                <strong>Yönerge:</strong> Aşağıdaki maddeleri dikkatle okuyunuz. Her bir durumun sizin için ne derece geçerli olduğunu karşılarındaki seçeneklerden yalnızca birini işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur, içten yanıt vermeniz değerlendirme için önemlidir.
              </div>

              {/* Questions List */}
              <div className="space-y-3 pt-2">
                {questions.map((q, idx) => {
                  const isText = (q.questionType || '').toLowerCase() === 'text' || (q.options || []).length === 0;

                  return (
                    <div 
                      key={q.id} 
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs print:border-slate-300 print:p-2 print:break-inside-avoid space-y-2"
                    >
                      <div className="font-bold text-slate-900 leading-snug flex items-start gap-1.5">
                        <span className="text-slate-500 font-mono">{idx + 1}.</span>
                        <span>{q.questionText}</span>
                        {isText && <span className="text-[10px] text-slate-500 font-normal italic">(İsteğe bağlı)</span>}
                      </div>

                      {isText ? (
                        <div className="mt-2 pt-1 border border-slate-200 rounded-lg p-2 min-h-[70px] print:min-h-[90px] print:border-slate-400 bg-slate-50/50 print:bg-transparent text-[11px] text-slate-400">
                          (Varsa belirtmek istediğiniz ek görüş veya açıklamalarınızı buraya yazınız...)
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4 pt-1 pl-4">
                          {(q.options || []).map((opt) => (
                            <div key={opt.id} className="flex items-center gap-1.5 cursor-default">
                              <div className="w-3.5 h-3.5 border border-slate-400 rounded-xs print:border-slate-800"></div>
                              <span className="text-slate-700 font-medium">{opt.optionLabel || opt.optionText}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Document Footer */}
              <div className="text-center pt-6 pb-2 text-[10px] text-slate-400 border-t border-slate-200 print:border-slate-400">
                PDR Manager • Rehberlik ve Psikolojik Danışma Hizmetleri Bilgi Sistemi
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
