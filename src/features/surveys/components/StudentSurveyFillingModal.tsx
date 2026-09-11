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
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { SurveyDto, SurveyApplicationDto, StudentDto } from '@shared/ipc-types';
import { BurdonTestExecutionModal } from './BurdonTestExecutionModal';
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
  const [subjectText, setSubjectText] = useState<string>('');
  const [kgbnCustomItems, setKgbnCustomItems] = useState<Array<{
    id: string;
    itemNumber: number;
    text: string;
    selections: Record<'teachers' | 'mother' | 'father' | 'siblings' | 'friends' | 'self', boolean>;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedApplication, setCompletedApplication] = useState<SurveyApplicationDto | null>(null);
  const [isBurdonRunning, setIsBurdonRunning] = useState(false);
  const prevOpenedKeyRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && survey) {
      const currentKey = `${survey.id}`;
      // Only reset when first opened or when opening a different survey
      if (prevOpenedKeyRef.current !== currentKey) {
        prevOpenedKeyRef.current = currentKey;
        setStep('student_input');
        setStudentNumber('');
        setStudentSearch('');
        setValidatedStudent(null);
        setValidationError(null);
        setAnswers({});
        setSubjectText('');
        setKgbnCustomItems([]);
        setKgbnOtherText('');
        setSubmitError(null);
        setCompletedApplication(null);
        setIsBurdonRunning(false);

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
    } else {
      prevOpenedKeyRef.current = null;
    }
  }, [isOpen, survey?.id]);

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
          if (survey.slug === 'burdon-dikkat-testi' || survey.id === 'srv-burdon-dikkat-testi') {
            setIsBurdonRunning(true);
          } else {
            setStep('answering');
          }
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

  const isBNA = survey?.slug === 'basarisizlik-nedenleri-anketi' || survey?.id === 'srv-basarisizlik-nedenleri-anketi';
  const isPTL = survey?.slug === 'problem-tarama-listesi' || survey?.id === 'srv-problem-tarama-listesi' || (survey as any)?.code === 'PTL-176';
  const isKGBN = survey?.slug === 'kime-gore-ben-neyim' || survey?.id === 'srv-kime-gore-ben-neyim' || (survey as any)?.code === 'KGBN-40';
  const [kgbnOtherText, setKgbnOtherText] = useState('');
  const questions = surveyDetail?.questions || surveyDetail?.currentVersion?.questions || [];
  const requiredQuestions = questions.filter(q => !isTextQuestion(q) && (isBNA || isPTL || isKGBN ? false : (q as any).required !== false));
  const answeredCount = questions.filter(q => answers[q.id]?.optionId || answers[q.id]?.value).length;
  const answeredRequiredCount = requiredQuestions.filter(q => answers[q.id]?.optionId).length;
  const isReadyToSubmit = isBNA || isPTL || isKGBN ? true : (requiredQuestions.length > 0 ? answeredRequiredCount === requiredQuestions.length : answeredCount > 0);
  const progressPercent = isBNA
    ? (questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 100)
    : isPTL
    ? (questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 100)
    : isKGBN
    ? 100
    : (requiredQuestions.length > 0 ? Math.round((answeredRequiredCount / requiredQuestions.length) * 100) : 100);

  const bnaMarkedCount = isBNA
    ? questions.filter(q => {
        const a = answers[q.id];
        return (
          a?.value === '1' ||
          a?.value === 'İşaretledim' ||
          a?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionLabel === 'İşaretledim')?.id
        );
      }).length
    : 0;

  const ptlMarkedCount = isPTL
    ? questions.filter(q => {
        const a = answers[q.id];
        return (
          a?.value === '1' ||
          a?.value === 'İşaretledim' ||
          a?.value === 'true' ||
          a?.value === 'Var' ||
          a?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionValue === 'true' || o.optionLabel === 'İşaretledim' || o.optionLabel === 'Var')?.id
        );
      }).length
    : 0;

  const kgbnSelectedCellCount = isKGBN
    ? (() => {
        let count = 0;
        questions.forEach(q => {
          const valStr = answers[q.id]?.value;
          if (valStr) {
            try {
              const parsed = typeof valStr === 'object' ? valStr : JSON.parse(valStr);
              (['teachers', 'mother', 'father', 'siblings', 'friends', 'self'] as const).forEach(pk => {
                if (parsed[pk]) count++;
              });
            } catch {}
          }
        });
        kgbnCustomItems.forEach(ci => {
          (['teachers', 'mother', 'father', 'siblings', 'friends', 'self'] as const).forEach(pk => {
            if (ci.selections[pk]) count++;
          });
        });
        return count;
      })()
    : 0;

  const kgbnTotalPossibleCells = (40 + kgbnCustomItems.length) * 6;

  const handleToggleBNAItem = (q: any) => {
    const isCurrentlyMarked =
      answers[q.id]?.value === '1' ||
      answers[q.id]?.value === 'İşaretledim' ||
      answers[q.id]?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionLabel === 'İşaretledim')?.id;

    const isaretledimOpt = q.options?.find((o: any) => o.optionValue === '1' || o.optionLabel === 'İşaretledim');
    const isaretlemedimOpt = q.options?.find((o: any) => o.optionValue === '0' || o.optionLabel === 'İşaretlemedim');

    if (isCurrentlyMarked) {
      setAnswers(prev => ({
        ...prev,
        [q.id]: { optionId: isaretlemedimOpt?.id, value: '0' }
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [q.id]: { optionId: isaretledimOpt?.id, value: '1' }
      }));
    }
  };


  const handleToggleKGBNCell = (q: any, perspectiveKey: string) => {
    const currentValStr = answers[q.id]?.value;
    let parsed: Record<string, any> = {
      teachers: false,
      mother: false,
      father: false,
      siblings: false,
      friends: false,
      self: false
    };
    if (typeof currentValStr === 'string' && currentValStr.trim().startsWith('{')) {
      try { parsed = { ...parsed, ...JSON.parse(currentValStr) }; } catch {}
    } else if (typeof currentValStr === 'object' && currentValStr !== null) {
      const objVal = currentValStr as Record<string, any>;
      parsed = { ...parsed, ...objVal };
    }
    parsed[perspectiveKey] = !parsed[perspectiveKey];
    if (q.questionOrder === 40 || q.isOther) {
      parsed.otherText = kgbnOtherText;
    }
    setAnswers(prev => ({
      ...prev,
      [q.id]: { value: JSON.stringify(parsed) }
    }));
  };

  const handleUpdateKGBNOtherText = (q: any, text: string) => {
    setKgbnOtherText(text);
    const currentValStr = answers[q.id]?.value;
    let parsed: Record<string, any> = {
      teachers: false,
      mother: false,
      father: false,
      siblings: false,
      friends: false,
      self: false
    };
    if (typeof currentValStr === 'string' && currentValStr.trim().startsWith('{')) {
      try { parsed = { ...parsed, ...JSON.parse(currentValStr) }; } catch {}
    } else if (typeof currentValStr === 'object' && currentValStr !== null) {
      const objVal = currentValStr as Record<string, any>;
      parsed = { ...parsed, ...objVal };
    }
    parsed.otherText = text;
    setAnswers(prev => ({
      ...prev,
      [q.id]: { value: JSON.stringify(parsed) }
    }));
  };

  const handleAddKgbnCustomItem = () => {
    setKgbnCustomItems(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}_${prev.length}`,
        itemNumber: 41 + prev.length,
        text: '',
        selections: {
          teachers: false,
          mother: false,
          father: false,
          siblings: false,
          friends: false,
          self: false
        }
      }
    ]);
  };

  const handleRemoveKgbnCustomItem = (id: string) => {
    setKgbnCustomItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, idx) => ({
        ...item,
        itemNumber: 41 + idx
      }));
    });
  };

  const handleUpdateKgbnCustomItemText = (id: string, text: string) => {
    setKgbnCustomItems(prev =>
      prev.map(item => (item.id === id ? { ...item, text } : item))
    );
  };

  const handleToggleKgbnCustomItemSelection = (
    id: string,
    perspectiveKey: 'teachers' | 'mother' | 'father' | 'siblings' | 'friends' | 'self'
  ) => {
    setKgbnCustomItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              selections: {
                ...item.selections,
                [perspectiveKey]: !item.selections[perspectiveKey]
              }
            }
          : item
      )
    );
  };

  const handleTogglePTLItem = (q: any) => {
    const isCurrentlyMarked =
      answers[q.id]?.value === '1' ||
      answers[q.id]?.value === 'İşaretledim' ||
      answers[q.id]?.value === 'true' ||
      answers[q.id]?.value === 'Var' ||
      answers[q.id]?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionValue === 'true' || o.optionLabel === 'İşaretledim' || o.optionLabel === 'Var')?.id;

    const varOpt = q.options?.find((o: any) => o.optionValue === '1' || o.optionValue === 'true' || o.optionLabel === 'İşaretledim' || o.optionLabel === 'Var');
    const yokOpt = q.options?.find((o: any) => o.optionValue === '0' || o.optionValue === 'false' || o.optionLabel === 'İşaretlemedim' || o.optionLabel === 'Yok');

    if (isCurrentlyMarked) {
      setAnswers(prev => ({
        ...prev,
        [q.id]: { optionId: yokOpt?.id, value: '0' }
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [q.id]: { optionId: varOpt?.id, value: '1' }
      }));
    }
  };

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

      if (isBNA && subjectText.trim()) {
        rawAnswers.push({
          questionId: 'subjectText',
          selectedOptionId: undefined,
          answerValue: subjectText.trim()
        });
      }

      if (isKGBN) {
        kgbnCustomItems.forEach((ci, idx) => {
          rawAnswers.push({
            questionId: `custom_${ci.itemNumber || 41 + idx}`,
            selectedOptionId: undefined,
            answerValue: JSON.stringify({
              itemNumber: ci.itemNumber || 41 + idx,
              text: ci.text,
              ...ci.selections
            })
          });
        });
      }

      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.submitApplication({
          surveySlug: survey.slug || survey.id,
          studentNumber: validatedStudent.studentNumber || studentNumber.trim(),
          answers: rawAnswers,
          subjectText: isBNA ? subjectText.trim() : undefined,
          otherText: isKGBN ? kgbnOtherText : undefined,
          customCharacteristics: isKGBN ? kgbnCustomItems : undefined,
          source: 'manual_entry'
        } as any);

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


  const handleBurdonComplete = async (result: { selectedCellIds: string[]; elapsedSeconds: number; configuredDurationSeconds: number }) => {
    if (!survey || !validatedStudent) return;
    try {
      const rawAnswers = [
        {
          questionId: 'burdon_data',
          answerValue: JSON.stringify(result)
        },
        ...result.selectedCellIds.map((cid) => ({
          questionId: cid,
          answerValue: '1'
        }))
      ];

      if (window.api && window.api.surveys) {
        const res = await window.api.surveys.submitApplication({
          surveySlug: survey.slug || survey.id,
          studentNumber: validatedStudent.studentNumber || studentNumber.trim(),
          answers: rawAnswers,
          source: 'manual_entry'
        });

        if (res.success && res.application) {
          setCompletedApplication(res.application);
          setIsBurdonRunning(false);
          setStep('completed');
          onSuccess?.();
        } else {
          throw new Error(res.error || 'Test sonucu kaydedilemedi.');
        }
      }
    } catch (err: any) {
      throw err;
    }
  };

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
                  {isKGBN ? (
                    <>
                      <div className="font-mono text-xs font-bold text-indigo-800">
                        İşaretlenen Algı Hücreleri: {kgbnSelectedCellCount} / {kgbnTotalPossibleCells}
                      </div>
                      <div className="w-40 bg-indigo-200 rounded-full h-2 mt-1 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${Math.min(100, Math.round((kgbnSelectedCellCount / (kgbnTotalPossibleCells || 1)) * 100))}%` }}
                        />
                      </div>
                    </>
                  ) : isPTL ? (
                    <>
                      <div className="font-mono text-xs font-bold text-rose-800">
                        İşaretlenen Problem: {ptlMarkedCount} / 176
                      </div>
                      <div className="w-40 bg-rose-200 rounded-full h-2 mt-1 overflow-hidden">
                        <div 
                          className="bg-rose-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${Math.min(100, Math.round((ptlMarkedCount / 176) * 100))}%` }}
                        />
                      </div>
                    </>
                  ) : isBNA ? (
                    <>
                      <div className="font-mono text-xs font-bold text-sky-800">
                        Belirtilen Neden: {bnaMarkedCount} / 44
                      </div>
                      <div className="w-40 bg-sky-200 rounded-full h-2 mt-1 overflow-hidden">
                        <div 
                          className="bg-sky-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${Math.min(100, Math.round((bnaMarkedCount / 44) * 100))}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-xs font-bold text-blue-800">
                        {answeredRequiredCount} / {requiredQuestions.length} Zorunlu Soru Cevaplandı (%{progressPercent})
                      </div>
                      <div className="w-40 bg-blue-200 rounded-full h-2 mt-1 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

                            {/* KGBN Specific Instruction Card */}
              {isKGBN && (
                <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-indigo-900">
                    Yönerge (B.G.G.6.a):
                  </div>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    İnsanlar zaman zaman birtakım özellikleri ile birlikte anılır. Bize yakıştırılan özelliklerimiz bazen gerçek yönlerimiz olabilir bazen de gerçeği yansıtmayabilir. Kim, hangi özelliklerin size ait olduğunu ifade ediyor ise o bölümün içine tıklayarak işaret koyunuz. Her bir madde için istediğiniz kadar işaret koyabildiğiniz gibi dilerseniz boş bırakabilirsiniz.
                  </p>
                </div>
              )}

              {/* PTL Specific Instruction Card */}
              {isPTL && (
                <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-rose-900">
                    Yönerge:
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Aşağıdaki maddeleri dikkatle okuyunuz. Kendinizde gördüğünüz, sizi rahatsız eden veya problem olarak değerlendirdiğiniz durumların kutucuğunu tıklayarak işaretleyiniz. Problem olarak görmediğiniz durumları boş bırakınız.
                  </p>
                </div>
              )}

              {/* BNA Specific Subject Input & Instruction Card */}
              {isBNA && (
                <div className="p-4 rounded-2xl bg-sky-50/90 border border-sky-200 shadow-2xs space-y-3">
                  <div className="text-xs text-sky-900 leading-relaxed">
                    <strong>Yönerge:</strong> Bu liste; derslerinizden düşük not alma sebeplerinizi tespit ederek sizlere yardımcı olabilmek amacıyla hazırlanmıştır. Sizden aşağıdaki ifadelerden ders notlarınızın düşük olmasına sebep olanları ve ders çalışmanızı engelleyen nedenleri işaretlemeniz istenmektedir.
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-sky-200/80">
                    <input
                      type="text"
                      placeholder="Düşük not alınan ders(ler), örn: Matematik ve Fen Bilimleri"
                      value={subjectText}
                      onChange={(e) => setSubjectText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
                    />
                    <span className="text-xs font-bold text-sky-900 shrink-0">
                      derslerinden notlarım düşük ve başarılı değilim. Çünkü;
                    </span>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, qIdx) => {
                  const isText = isTextQuestion(q);
                  const currentAns = answers[q.id];
                  const options = q.options || [];

                  if (isKGBN) {
                    const valStr = currentAns?.value;
                    let parsedSelections: Record<string, boolean> = {
                      teachers: false,
                      mother: false,
                      father: false,
                      siblings: false,
                      friends: false,
                      self: false
                    };
                    if (typeof valStr === 'string' && valStr.trim().startsWith('{')) {
                      try { parsedSelections = { ...parsedSelections, ...JSON.parse(valStr) }; } catch {}
                    } else if (typeof valStr === 'object' && valStr !== null) {
                      const objVal = valStr as Record<string, any>; parsedSelections = { ...parsedSelections, ...objVal };
                    }

                    const isItem40 = q.questionOrder === 40 || (q.questionText || '').includes('Diğer') || qIdx === 39;
                    const perspectiveKeys: Array<{ key: string; label: string }> = [
                      { key: 'teachers', label: 'Öğretmenlerime' },
                      { key: 'mother', label: 'Anneme' },
                      { key: 'father', label: 'Babama' },
                      { key: 'siblings', label: 'Kardeşlerime' },
                      { key: 'friends', label: 'Arkadaşlarıma' },
                      { key: 'self', label: 'Bana' }
                    ];

                    const anyMarked = Object.values(parsedSelections).some(Boolean);

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          anyMarked
                            ? 'bg-indigo-50/60 border-indigo-300 shadow-2xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-400">
                              {q.questionOrder || qIdx + 1}.
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {q.questionText}
                            </span>
                          </div>

                          {isItem40 && (
                            <input
                              type="text"
                              placeholder="Varsa diğer özelliğinizi buraya yazınız..."
                              value={kgbnOtherText}
                              onChange={(e) => handleUpdateKGBNOtherText(q, e.target.value)}
                              className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium sm:w-64"
                            />
                          )}
                        </div>

                        {/* 6 Perspective Checkboxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                          {perspectiveKeys.map(p => {
                            const isChecked = Boolean(parsedSelections[p.key]);
                            const isSelf = p.key === 'self';
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => handleToggleKGBNCell(q, p.key)}
                                className={`px-2 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                  isChecked
                                    ? (isSelf ? 'bg-blue-600 border-blue-600 text-white shadow-2xs' : 'bg-indigo-600 border-indigo-600 text-white shadow-2xs')
                                    : (isSelf ? 'bg-blue-50/50 border-blue-200 text-blue-900 hover:bg-blue-100/70' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
                                }`}
                              >
                                <span className="truncate text-[11px]">{p.label}</span>
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-white/20' : 'border border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (isPTL && !isText) {
                    const isMarked =
                      currentAns?.value === '1' ||
                      currentAns?.value === 'İşaretledim' ||
                      currentAns?.value === 'true' ||
                      currentAns?.value === 'Var' ||
                      currentAns?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionValue === 'true' || o.optionLabel === 'İşaretledim' || o.optionLabel === 'Var')?.id;

                    return (
                      <div
                        key={q.id}
                        onClick={() => handleTogglePTLItem(q)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isMarked
                            ? 'bg-rose-50/90 border-rose-400 shadow-2xs text-rose-950'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isMarked
                                ? 'bg-rose-600 border-rose-600 text-white'
                                : 'bg-white border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isMarked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 flex-1">
                          <span className="font-mono font-bold text-xs text-slate-500 shrink-0">
                            {q.questionOrder || qIdx + 1}.
                          </span>
                          <span className={`text-xs leading-relaxed ${isMarked ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {q.questionText}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (isBNA && !isText) {
                    const isMarked =
                      currentAns?.value === '1' ||
                      currentAns?.value === 'İşaretledim' ||
                      currentAns?.optionId === q.options?.find((o: any) => o.optionValue === '1' || o.optionLabel === 'İşaretledim')?.id;

                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleBNAItem(q)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isMarked
                            ? 'bg-sky-50/90 border-sky-400 shadow-2xs text-sky-950'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isMarked
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'bg-white border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isMarked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2 flex-1">
                          <span className="font-mono font-bold text-xs text-slate-500 shrink-0">
                            {q.questionOrder || qIdx + 1}.
                          </span>
                          <span className={`text-xs leading-relaxed ${isMarked ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {q.questionText}
                          </span>
                        </div>
                      </div>
                    );
                  }

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

              {/* KGBN Dynamic Custom Items (41+) & Add Button */}
              {isKGBN && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span>Özel / Ek Özellikler (Madde 41+)</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {kgbnCustomItems.length} Ek Özellik
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddKgbnCustomItem}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Diğer Özellik Ekle</span>
                    </button>
                  </div>

                  {kgbnCustomItems.map((item, idx) => {
                    const perspectiveKeys: Array<{ key: 'teachers' | 'mother' | 'father' | 'siblings' | 'friends' | 'self'; label: string }> = [
                      { key: 'teachers', label: 'Öğretmenlerime' },
                      { key: 'mother', label: 'Anneme' },
                      { key: 'father', label: 'Babama' },
                      { key: 'siblings', label: 'Kardeşlerime' },
                      { key: 'friends', label: 'Arkadaşlarıma' },
                      { key: 'self', label: 'Bana' }
                    ];
                    const anyMarked = Object.values(item.selections).some(Boolean);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          anyMarked
                            ? 'bg-indigo-50/60 border-indigo-300 shadow-2xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {item.itemNumber || 41 + idx}.
                            </span>
                            <input
                              type="text"
                              placeholder="Ek özellik adı giriniz (Örn: Sabırlıyım, Heyecanlıyım)..."
                              value={item.text}
                              onChange={(e) => handleUpdateKgbnCustomItemText(item.id, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveKgbnCustomItem(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                            title="Özelliği Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 6 Perspective Checkboxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                          {perspectiveKeys.map(p => {
                            const isChecked = Boolean(item.selections[p.key]);
                            const isSelf = p.key === 'self';
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => handleToggleKgbnCustomItemSelection(item.id, p.key)}
                                className={`px-2 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                                  isChecked
                                    ? (isSelf ? 'bg-blue-600 border-blue-600 text-white shadow-2xs' : 'bg-indigo-600 border-indigo-600 text-white shadow-2xs')
                                    : (isSelf ? 'bg-blue-50/50 border-blue-200 text-blue-900 hover:bg-blue-100/70' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
                                }`}
                              >
                                <span className="truncate text-[11px]">{p.label}</span>
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-white/20' : 'border border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

  
        {/* Burdon Dedicated Execution Modal */}
        {isBurdonRunning && validatedStudent && (
          <BurdonTestExecutionModal
            isOpen={isBurdonRunning}
            onClose={() => setIsBurdonRunning(false)}
            student={validatedStudent}
            onComplete={handleBurdonComplete}
          />
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

                {((completedApplication.resultSnapshot as any)?.burdonEvaluation || (completedApplication.resultSnapshot as any)?.rawMetrics?.burdonEvaluation) && (() => {
                  const bEval = (completedApplication.resultSnapshot as any)?.burdonEvaluation || (completedApplication.resultSnapshot as any)?.rawMetrics?.burdonEvaluation;
                  return (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>Burdon Dikkat Değerlendirmesi:</span>
                        <span className="text-sky-700 font-mono">
                          %{bEval.accuracyPercentage} Doğruluk
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                          Doğru: <strong>{bEval.correctMarkings}</strong> / {bEval.totalTargets}
                        </div>
                        <div className="bg-rose-50 text-rose-800 p-2 rounded-lg border border-rose-200">
                          Yanlış: <strong>{bEval.incorrectMarkings}</strong>
                        </div>
                        <div className="bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                          Atlanan: <strong>{bEval.omittedTargets}</strong>
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-2 rounded-lg border border-blue-200">
                          Toplam İşaret: <strong>{bEval.totalMarkings}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
