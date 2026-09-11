import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle2, FileText } from 'lucide-react';
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

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
  const isBNA = survey?.slug === 'basarisizlik-nedenleri-anketi' || survey?.id === 'srv-basarisizlik-nedenleri-anketi';
  const isPTL = survey?.slug === 'problem-tarama-listesi' || survey?.id === 'srv-problem-tarama-listesi' || (survey as any)?.code === 'PTL-176';
  const isRosenberg = survey?.slug === 'rosenberg-benlik-saygisi' || survey?.id === 'srv-rosenberg-benlik-saygisi' || (survey as any)?.code === 'ROSENBERG-63';
  const isKGBN = survey?.slug === 'kime-gore-ben-neyim' || survey?.id === 'srv-kime-gore-ben-neyim' || (survey as any)?.code === 'KGBN-40';
  const isAkademikBenlik = survey?.slug === 'akademik-benlik-algisi' || survey?.id === 'srv-akademik-benlik-algisi' || (survey as any)?.code === 'ABAÖ-II-56' || (survey as any)?.code === 'ABAO-II-56';
  const isBurdon = survey?.slug === 'burdon-dikkat-testi' || survey?.id === 'srv-burdon-dikkat-testi' || (survey as any)?.code === 'BURDON' || (survey as any)?.code === 'BDT-30';

  const handleExportPdf = async () => {
    if (!survey) return;
    setIsExportingPdf(true);
    try {
      if (window.api && window.api.surveys && window.api.surveys.exportPaperFormPdf) {
        const res = await window.api.surveys.exportPaperFormPdf(survey.slug || survey.id);
        if (res.success) {
          setExportFeedback('Kağıt anket formu PDF olarak kaydedildi!');
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
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full print:max-w-none">
        
        {/* Modal Topbar (Hidden when printing) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kağıt Anket Formu Önizleme</h3>
              <p className="text-xs text-slate-500">{survey.title} (A4 Kağıt Dağıtım Formatı)</p>
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
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Kağıt Anket Formunu PDF Olarak İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'PDF Hazırlanıyor...' : 'PDF İndir'}</span>
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
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {survey.title}
                </h1>
              </div>

              {/* Student Info Fields */}
              {isBurdon ? (
                <div className="py-1 text-xs font-bold text-slate-800 space-y-1.5 max-w-xs">
                  <div className="flex items-baseline gap-1">
                    <span className="w-28 shrink-0">Adı ve Soyadı:</span>
                    <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="w-28 shrink-0">Numarası:</span>
                    <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="w-28 shrink-0">Sınıfı:</span>
                    <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 print:bg-transparent print:border-slate-400 text-xs space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="font-semibold text-slate-600">Adı Soyadı:</span>
                      <span className="inline-block border-b border-dotted border-slate-500 w-full mt-1"></span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Sınıfı / Şubesi:</span>
                      <span className="inline-block border-b border-dotted border-slate-500 w-full mt-1"></span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Okul Numarası:</span>
                      <span className="inline-block border-b border-dotted border-slate-500 w-full mt-1"></span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Tarih:</span>
                      <span className="inline-block border-b border-dotted border-slate-500 w-full mt-1"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Survey Instructions */}
              {isBurdon ? null : isKGBN ? (
                <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent space-y-1">
                  <div>
                    <strong>Yönerge:</strong> Bu envanter, kendinizi nasıl algıladığınızı ve başkalarının (öğretmenleriniz, anneniz, babanız, kardeşleriniz, arkadaşlarınız) gözünde nasıl algılandığınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki her bir satırdaki özelliğin kime göre geçerli olduğunu düşünüyorsanız, ilgili sütundaki kutucuğa (☐) işaret koyunuz. Kendinize ait görüşünüzü en sondaki <strong>“Bana”</strong> sütununa işaretleyiniz.
                  </div>
                </div>
              ) : isPTL ? (
                <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent space-y-1">
                  <div>
                    <strong>Yönerge:</strong> Bu liste; sağlık, okul, aile, arkadaşlık, karşı cins, mesleki gelecek ve kişiliğinize ilişkin problemlerinizi belirlemek amacıyla hazırlanmıştır. Aşağıdaki maddeleri dikkatle okuyunuz ve kendinizde gördüğünüz problemleri maddenin başındaki kutucuğu (☐) işaretleyerek belirtiniz. Problem olarak görmediğiniz maddeleri boş bırakınız.
                  </div>
                </div>
              ) : isBNA ? (
                <div className="p-3 bg-sky-50/50 border border-sky-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent space-y-2">
                  <div>
                    <strong>Yönerge:</strong> Bu liste; derslerinizden düşük not alma sebeplerinizi tespit ederek sizlere yardımcı olabilmek amacıyla hazırlanmıştır. Sizden aşağıdaki ifadelerden ders notlarınızın düşük olmasına sebep olanları ve ders çalışmanızı engelleyen nedenleri işaretlemeniz istenmektedir.
                  </div>
                  <div className="pt-2 border-t border-slate-300 print:border-slate-400 font-semibold text-slate-800">
                    Düşük not alınan ders(ler): <span className="inline-block border-b border-dotted border-slate-500 w-48 align-bottom"></span> derslerinden notlarım düşük ve başarılı değilim. Çünkü;
                  </div>
                </div>
              ) : isRosenberg ? (
                <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent space-y-1">
                  <div>
                    <strong>Yönerge:</strong> Bu envanter kendinizle ve ilişkilerinizle ilgili çeşitli konulardaki duygu ve tutumlarınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki maddeleri dikkatle okuyunuz ve her bir maddenin karşısındaki seçeneklerden size en uygun olan tek bir seçeneği (☐) işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur.
                  </div>
                </div>
              ) : isAkademikBenlik ? (
                <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent space-y-1">
                  <div>
                    <strong>Yönerge:</strong> Bu ölçek, farklı akademik ders alanlarındaki yetenek inançlarınızı, başarı ve benlik algılarınızı belirlemek amacıyla hazırlanmıştır. Aşağıdaki 56 maddeyi dikkatle okuyunuz ve her bir ifadenin sizin için ne derece doğru veya yanlış olduğunu 1'den (Tamamen yanlış) 8'e (Tamamen doğru) kadar olan seçeneklerden size en uygun olan tek bir seçeneği (☐) işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs text-slate-700 leading-relaxed print:border-slate-400 print:bg-transparent">
                  <strong>Yönerge:</strong> Aşağıdaki maddeleri dikkatle okuyunuz. Her bir durumun sizin için ne derece geçerli olduğunu karşılarındaki seçeneklerden yalnızca birini işaretleyerek belirtiniz. Doğru veya yanlış cevap yoktur, içten yanıt vermeniz değerlendirme için önemlidir.
                </div>
              )}

              {/* Questions List */}
              {isBurdon ? (
                <div className="space-y-6 pt-2 font-mono text-[13px] leading-relaxed text-slate-900 tracking-[0.25em] select-text">
                  {[
                    questions.slice(0, 10),
                    questions.slice(10, 20),
                    questions.slice(20, 30)
                  ].map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5">
                      {group.map((q, idx) => {
                        const rawText = (q.questionText || (q as any).text || '').replace(/^Satır\s*\d+\s*:\s*/i, '');
                        return (
                          <div key={q.id || idx} className="whitespace-nowrap">
                            {rawText}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : isKGBN ? (
                <div className="pt-2">
                  <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-transparent text-slate-800 font-bold border-b border-slate-400">
                        <th className="p-2 border-r border-slate-400 w-10 text-center">No</th>
                        <th className="p-2 border-r border-slate-400">Nesiniz - Nasılsınız? (Özellik)</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-center">Öğretmenlerime</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-center">Anneme</th>
                        <th className="p-2 border-r border-slate-400 w-20 text-center">Babama</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-center">Kardeşlerime</th>
                        <th className="p-2 border-r border-slate-400 w-24 text-center">Arkadaşlarıma</th>
                        <th className="p-2 text-center w-20">Bana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, idx) => {
                        const isItem40 = idx === 39 || (q.questionText || '').includes('Diğer');
                        return (
                          <tr key={q.id || idx} className="border-b border-slate-300 print:break-inside-avoid">
                            <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 font-semibold text-slate-900">
                              {isItem40 ? (
                                <span>40. ..................................................... (Diğer)</span>
                              ) : (
                                q.questionText
                              )}
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                            <td className="p-1.5 border-r border-slate-300 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                            <td className="p-1.5 text-center">
                              <div className="w-4 h-4 border border-slate-500 rounded-xs mx-auto"></div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3 text-[11px] text-slate-500 italic print:text-slate-700">
                    * Varsa eklemek istediğiniz diğer özellikleri 40. satırdaki boşluğa yazıp işaretleyebilirsiniz.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                {questions.map((q, idx) => {
                  const isText = (q.questionType || '').toLowerCase() === 'text' || (q.options || []).length === 0;

                  if (isPTL && !isText) {
                    return (
                      <div 
                        key={q.id} 
                        className="p-2 bg-white border border-slate-200 rounded-xl text-xs print:border-slate-300 print:p-1.5 print:break-inside-avoid flex items-start gap-2.5"
                      >
                        <span className="text-slate-500 font-mono font-bold shrink-0 w-8">{idx + 1}.</span>
                        <div className="w-4 h-4 border-2 border-slate-400 rounded-xs print:border-slate-800 shrink-0 mt-0.5"></div>
                        <span className="font-semibold text-slate-900 leading-snug flex-1">{q.questionText}</span>
                      </div>
                    );
                  }

                  if (isBNA && !isText) {
                    return (
                      <div 
                        key={q.id} 
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs print:border-slate-300 print:p-2 print:break-inside-avoid flex items-start gap-2.5"
                      >
                        <span className="text-slate-500 font-mono font-bold shrink-0 w-6">{idx + 1}.</span>
                        <div className="w-4 h-4 border-2 border-slate-400 rounded-xs print:border-slate-800 shrink-0 mt-0.5"></div>
                        <span className="font-semibold text-slate-900 leading-snug flex-1">{q.questionText}</span>
                      </div>
                    );
                  }

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
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
