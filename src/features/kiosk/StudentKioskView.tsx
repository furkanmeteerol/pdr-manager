import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, LogOut } from 'lucide-react';
import { SurveyDto, SurveyQuestionDto } from '@shared/ipc-types';

interface StudentKioskViewProps {
  onExitSuccess: () => void;
}

export const StudentKioskView: React.FC<StudentKioskViewProps> = ({ onExitSuccess }) => {
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Survey Session
  const [sessionData, setSessionData] = useState<{
    assignment: any;
    survey: SurveyDto;
    student: any;
  } | null>(null);

  // Answers map: questionId -> selectedOptionId / textValue
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string }>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Exit Counselor Auth
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [counselorPassword, setCounselorPassword] = useState('');
  const [exitError, setExitError] = useState<string | null>(null);

  const handleEnterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await window.api.studentMode.enter(refCode.trim().toUpperCase());
      if (res.success && res.data) {
        setSessionData(res.data);
      } else {
        setError(res.error || 'Geçersiz anket kodu');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId }
    }));
  };

  const handleSubmitSurvey = async () => {
    if (!sessionData) return;

    const payloadAnswers = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      selectedOptionId: val.optionId,
      textValue: val.text
    }));

    try {
      await window.api.surveys.submitResponse({
        assignmentId: sessionData.assignment.id,
        surveyId: sessionData.survey.id,
        studentId: sessionData.student.id,
        source: 'student_kiosk',
        answers: payloadAnswers
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(`Gönderim hatası: ${err.message}`);
    }
  };

  const handleCounselorExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExitError(null);
    try {
      const res = await window.api.studentMode.exit(counselorPassword);
      if (res.success) {
        onExitSuccess();
      } else {
        setExitError(res.error || 'Parola hatalı');
      }
    } catch (err: any) {
      setExitError(err.message);
    }
  };

  const questions: SurveyQuestionDto[] = sessionData?.survey.questions || [];
  const currentQ = questions[currentQIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Banner (Locked Student Mode) */}
      <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100">PDR Öğrenci Anket Modu</h1>
            <p className="text-[11px] text-slate-400">Güvenli ve gizli anket doldurma ortamı</p>
          </div>
        </div>

        <button
          onClick={() => setIsExitModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-300 font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Danışman Çıkışı
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        {!sessionData ? (
          /* CODE ENTRY SCREEN */
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto text-2xl font-bold">
              #
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">Anket Kodunu Giriniz</h2>
              <p className="text-xs text-slate-400 mt-1.5">
                Rehberlik servisiniz tarafından size verilen 6 haneli <b>PDR-XXXXXX</b> kodunu yazın.
              </p>
            </div>

            <form onSubmit={handleEnterCode} className="space-y-4">
              <input
                type="text"
                required
                maxLength={10}
                placeholder="PDR-123456"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                className="w-full text-center tracking-widest uppercase font-mono font-bold text-xl bg-slate-950 border-2 border-slate-800 focus:border-brand-500 rounded-2xl py-3.5 text-brand-400 focus:outline-none transition-colors"
              />

              {error && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !refCode.trim()}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {loading ? 'Doğrulanıyor...' : 'Ankete Başla'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : submitted ? (
          /* SUCCESS SCREEN */
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-100">Teşekkürler!</h2>
            <p className="text-sm text-slate-400">
              Cevaplarınız başarıyla kaydedildi. Şimdi güvenle ayrılabilirsiniz.
            </p>

            <button
              onClick={() => {
                setSessionData(null);
                setRefCode('');
                setSubmitted(false);
                setAnswers({});
                setCurrentQIndex(0);
              }}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Yeni Öğrenci Girişi
            </button>
          </div>
        ) : (
          /* ACTIVE SURVEY QUESTIONS */
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-8 shadow-2xl">
            {/* Progress */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span>Soru {currentQIndex + 1} / {questions.length}</span>
                <span>%{progressPercent} Tamamlandı</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="min-h-24">
              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-500/10 text-brand-400 mb-3">
                {currentQ.category || 'Genel Değerlendirme'}
              </span>
              <h3 className="text-xl font-bold text-slate-100 leading-relaxed">
                {currentQ.questionText}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map(opt => {
                const isSelected = answers[currentQ.id]?.optionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-brand-300 shadow-md shadow-brand-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <span>{opt.optionText}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Önceki Soru
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  type="button"
                  disabled={!answers[currentQ.id]}
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
                >
                  Sonraki Soru
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!answers[currentQ.id]}
                  onClick={handleSubmitSurvey}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Anketi Tamamla & Gönder
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* COUNSELOR EXIT PASSWORD MODAL */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-400" />
              Danışman Kimlik Doğrulama
            </h3>
            <p className="text-xs text-slate-400">
              Kiosk modundan çıkmak için lütfen danışman anahtar parolanızı giriniz.
            </p>

            <form onSubmit={handleCounselorExit} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={counselorPassword}
                onChange={e => setCounselorPassword(e.target.value)}
                placeholder="Parola..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />

              {exitError && (
                <p className="text-xs text-red-400">{exitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold"
                >
                  Çıkış Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
