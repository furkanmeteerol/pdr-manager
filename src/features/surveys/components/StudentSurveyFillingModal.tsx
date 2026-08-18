import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Save,
  ClipboardList,
  Search,
  Check
} from 'lucide-react';
import { SurveyDto, SurveyApplicationDto, StudentDto } from '@shared/ipc-types';
import { ModalPortal } from '../../../components/ModalPortal';

interface StudentSurveyFillingModalProps {
  survey: SurveyDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudentSurveyFillingModal: React.FC<StudentSurveyFillingModalProps> = ({
  survey,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'student_input' | 'answering' | 'completed'>('student_input');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentsList, setStudentsList] = useState<StudentDto[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [validatedStudent, setValidatedStudent] = useState<{ name: string; id: string; attemptCount: number; studentNumber: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Answering State
  const [surveyDetail, setSurveyDetail] = useState<SurveyDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; value?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedApplication, setCompletedApplication] = useState<SurveyApplicationDto | null>(null);

  useEffect(() => {
    if (isOpen && survey) {
      setStep('student_input');
      setStudentNumber('');
      setStudentSearch('');
      setValidatedStudent(null);
      setValidationError(null);
      setAnswers({});
      setSubmitError(null);
      setCompletedApplication(null);

      // Load full survey detail with questions and options
      if (window.api && window.api.surveys) {
        window.api.surveys.getBySlug(survey.slug || survey.id).then(res => {
          setSurveyDetail(res || survey);
        }).catch(() => {
          setSurveyDetail(survey);
        });
      } else {
        setSurveyDetail(survey);
      }

      // Load local students for fast selection
      if (window.api && window.api.students) {
        window.api.students.list().then(list => {
          setStudentsList(list || []);
        }).catch(() => {
          setStudentsList([]);
        });
      }
    }
  }, [isOpen, survey]);

  const handleValidateStudentNumber = async (numToValidate: string) => {
    const num = numToValidate.trim();
    if (!num || !survey) return;
    setIsValidating(true);
    setValidationError(null);

    try {
      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.validateStudentForSurvey(survey.slug || survey.id, num);
        if (!res.valid) {
          setValidationError(res.error || 'Öğrenci numarası bulunamadı.');
        } else if (!res.canAttempt) {
          setValidationError(res.error || 'Bu ölçek tekrar doldurulamaz.');
        } else {
          setStudentNumber(num);
          setValidatedStudent({
            name: res.studentName || 'Öğrenci',
            id: res.studentId || '',
            studentNumber: num,
            attemptCount: res.currentAttemptCount || 0
          });
          setStep('answering');
        }
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Öğrenci doğrulanırken hata oluştu.');
    } finally {
      setIsValidating(false);
    }
  };

  const isTextQuestion = (q: any) => {
    const type = (q.type || q.questionType || '').toLowerCase();
    return type === 'text' || type === 'textarea' || type === 'open_ended' || (!q.options || q.options.length === 0);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId }
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value: text }
    }));
  };

  const questions = surveyDetail?.questions || surveyDetail?.currentVersion?.questions || [];
  const requiredQuestions = questions.filter(q => !isTextQuestion(q));
  const answeredRequiredCount = requiredQuestions.filter(q => answers[q.id]?.optionId).length;
  const isReadyToSubmit = requiredQuestions.length > 0 && answeredRequiredCount === requiredQuestions.length;
  const progressPercent = requiredQuestions.length > 0 ? Math.round((answeredRequiredCount / requiredQuestions.length) * 100) : 100;

  const handleSubmit = async () => {
    if (!survey || !validatedStudent) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rawAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptionId: ans.optionId,
        answerValue: ans.value
      }));

      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.submitApplication({
          surveySlug: survey.slug || survey.id,
          studentNumber: validatedStudent.studentNumber || studentNumber.trim(),
          answers: rawAnswers,
          source: 'manual_entry'
        });

        if (res.success && res.application) {
          setCompletedApplication(res.application);
          setStep('completed');
          onSuccess?.();
        } else {
          setSubmitError(res.error || 'Uygulama kaydedilemedi.');
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Gönderim sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = studentsList.filter(s => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      (s.studentNumber || '').toLowerCase().includes(term) ||
      (s.className || '').toLowerCase().includes(term)
    );
  });

  if (!isOpen || !survey) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{survey.title}</h3>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Lokal Manuel Giriş</span>
              </div>
              <p className="text-xs text-slate-500">{survey.description || 'Kağıt anket cevaplarının sisteme girilmesi ve otomatik puanlama'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body based on Step */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Student Selection */}
          {step === 'student_input' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-800">Cevapları Girilecek Öğrenciyi Seçiniz</h4>
                <p className="text-xs text-slate-500">
                  Öğrenciyi listeden arayarak seçebilir veya okul numarasını doğrudan yazabilirsiniz.
                </p>
              </div>

              {/* Direct Number Input */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Okul Numarası ile Hızlı Başla:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Örn: 15615"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateStudentNumber(studentNumber)}
                    className="flex-1 text-sm font-mono font-bold px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 outline-none shadow-2xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateStudentNumber(studentNumber)}
                    disabled={isValidating || !studentNumber.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isValidating ? 'Doğrulanıyor...' : 'Seç ve Başla'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Student Directory Table / Fast Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Veya Öğrenci Listesinden Seçiniz:</span>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="İsim, numara veya sınıf ara..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      {studentsList.length === 0 ? 'Kayıtlı öğrenci bulunamadı. Önce öğrenciler menüsünden öğrenci ekleyiniz.' : 'Aramaya uygun öğrenci bulunamadı.'}
                    </div>
                  ) : (
                    filteredStudents.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleValidateStudentNumber(st.studentNumber)}
                        className="p-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 font-bold text-xs flex items-center justify-center">
                            {st.firstName[0]}{st.lastName[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                              {st.firstName} {st.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              No: <strong className="font-mono text-slate-700">{st.studentNumber}</strong> {st.className ? `• ${st.className}` : ''}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1 bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-700 border border-slate-200 group-hover:border-blue-600 rounded-lg text-xs font-bold transition-all shadow-2xs"
                        >
                          Cevapları Gir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Answering Questions */}
          {step === 'answering' && (
            <div className="space-y-5">
              {/* Student Header & Progress Bar */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur-md shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {validatedStudent?.name[0] || 'Ö'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Öğrenci: <strong className="text-blue-800">{validatedStudent?.name}</strong> (No: {validatedStudent?.studentNumber})
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {validatedStudent?.attemptCount ? `${validatedStudent.attemptCount + 1}. Uygulama Kaydı` : '1. Uygulama Kaydı'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-blue-800">
                    {answeredRequiredCount} / {requiredQuestions.length} Zorunlu Soru Cevaplandı (%{progressPercent})
                  </div>
                  <div className="w-40 bg-blue-200 rounded-full h-2 mt-1 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, qIdx) => {
                  const isText = isTextQuestion(q);
                  const currentAns = answers[q.id];
                  const options = q.options || [];

                  return (
                    <div 
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        currentAns?.optionId || currentAns?.value 
                          ? 'bg-white border-blue-200 shadow-2xs' 
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 mb-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {q.questionOrder || qIdx + 1}
                        </span>
                        <div className="text-xs font-bold text-slate-800 leading-relaxed pt-0.5">
                          {q.questionText}
                          {isText && (
                            <span className="ml-2 text-[10px] text-slate-500 font-normal italic">(İsteğe Bağlı Görüş / Açıklama)</span>
                          )}
                        </div>
                      </div>

                      {/* Options or Textarea */}
                      {isText ? (
                        <div className="pl-8">
                          <textarea
                            rows={3}
                            placeholder="Öğrencinin belirttiği diğer neden veya açıklamaları buraya yazabilirsiniz (İsteğe bağlı)..."
                            value={currentAns?.value || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 pl-8">
                          {options.map((opt) => {
                            const isSelected = currentAns?.optionId === opt.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.id)}
                                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                <span>{opt.optionLabel || opt.optionText}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Completed Screen */}
          {step === 'completed' && completedApplication && (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-800">Cevaplar Başarıyla Kaydedildi</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cevaplar SQLite veritabanına kaydedildi ve alt boyut puanlamaları otomatik olarak hesaplandı.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Öğrenci:</span>
                  <strong className="text-slate-800">{completedApplication.studentName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Uygulama:</span>
                  <span className="font-mono font-bold text-purple-700">Deneme #{completedApplication.attemptNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hesaplanan Toplam Puan:</span>
                  <span className="font-mono font-extrabold text-blue-700 text-sm">
                    {completedApplication.resultSnapshot?.totalScore ?? completedApplication.totalScore ?? 0} Puan
                  </span>
                </div>
                {completedApplication.resultSnapshot?.interpretation?.label && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Değerlendirme:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {completedApplication.resultSnapshot.interpretation.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {step === 'student_input' ? (
            <div className="text-[11px] text-slate-400">
              Cevaplar doğrudan yerel SQLite veritabanına işlenir.
            </div>
          ) : step === 'answering' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('student_input')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Öğrenci Değiştir</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !isReadyToSubmit}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Puanlanıyor ve Kaydediliyor...' : 'Kaydet ve Hesapla'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Tamamla ve Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
