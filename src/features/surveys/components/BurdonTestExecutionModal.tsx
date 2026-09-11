import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Clock, 
  AlertCircle, 
  Play, 
  HelpCircle 
} from 'lucide-react';
import { 
  getBurdonMatrixCells, 
  BurdonCellInfo
} from '../../../../shared/burdonDikkatEvaluation';
import { ModalPortal } from '../../../components/ModalPortal';

interface BurdonTestExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { id: string; name: string; studentNumber: string; className?: string };
  onComplete: (result: { selectedCellIds: string[]; elapsedSeconds: number; configuredDurationSeconds: number }) => Promise<void>;
}

export const BurdonTestExecutionModal: React.FC<BurdonTestExecutionModalProps> = ({
  isOpen,
  onClose,
  student,
  onComplete
}) => {
  const [phase, setPhase] = useState<'instructions' | 'running' | 'submitting' | 'confirm_finish'>('instructions');
  const [markedCellIds, setMarkedCellIds] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes (300 seconds)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isSubmittingRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);
  const matrixCells = useMemo(() => getBurdonMatrixCells(), []);

  // Group cells by row
  const rowsData = useMemo(() => {
    const map = new Map<number, BurdonCellInfo[]>();
    for (let r = 1; r <= 30; r++) map.set(r, []);
    matrixCells.forEach((c) => {
      map.get(c.rowNumber)?.push(c);
    });
    return Array.from(map.entries()).map(([rowNum, cells]) => ({
      rowNum,
      section: rowNum <= 10 ? 1 : rowNum <= 20 ? 2 : 3,
      cells
    }));
  }, [matrixCells]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setPhase('instructions');
      setMarkedCellIds(new Set());
      setRemainingSeconds(300);
      setSubmitError(null);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      hasCompletedRef.current = false;
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStartTest = () => {
    startTimeRef.current = Date.now();
    setPhase('running');
    setRemainingSeconds(300);
  };

  const handleToggleCell = (cellId: string) => {
    if (phase !== 'running') return;
    setMarkedCellIds((prev) => {
      const next = new Set(prev);
      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }
      return next;
    });
  };

  const handleFinishEarlyClick = () => {
    setPhase('confirm_finish');
  };

  const handleConfirmFinish = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const actualElapsedByClock = Math.min(300, Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
    const elapsedByTimer = 300 - remainingSeconds;
    const elapsed = Math.min(300, Math.max(1, elapsedByTimer > 0 ? elapsedByTimer : actualElapsedByClock));
    await doSubmit(elapsed);
  };

  const handleCancelFinish = () => {
    if (isSubmittingRef.current || hasCompletedRef.current) return;
    setPhase('running');
  };

  const handleAutoSubmit = async () => {
    await doSubmit(300);
  };

  const doSubmit = async (elapsed: number) => {
    if (isSubmittingRef.current || hasCompletedRef.current) {
      console.warn('Burdon submission already in progress or completed, ignoring duplicate request.');
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onComplete({
        selectedCellIds: Array.from(markedCellIds),
        elapsedSeconds: elapsed,
        configuredDurationSeconds: 300
      });
      hasCompletedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      onClose(); // Explicitly close the modal on successful submit
    } catch (err: any) {
      console.error('Burdon test submission failed:', err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Sonuç kaydedilirken bir hata oluştu.');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 select-none">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] border border-slate-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center font-black text-sky-400 text-sm">
                B
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">Burdon Dikkat Testi</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    10-20 Yaş
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Öğrenci: <strong className="text-white">{student.name}</strong> (No: {student.studentNumber})
                </p>
              </div>
            </div>

            {/* Live Timer & Finish Button (during running) */}
            {phase === 'running' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] text-slate-400">İşaretlenen:</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">{markedCellIds.size}</span>
                </div>

                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm transition-all ${
                  remainingSeconds <= 30
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : remainingSeconds <= 60
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(remainingSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleFinishEarlyClick}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Testi Bitir
                </button>
              </div>
            )}

            {phase === 'instructions' && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Phase 1: Instructions */}
          {phase === 'instructions' && (
            <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
                <HelpCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-800">Burdon Dikkat Testi Yönergesi</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Lütfen testi başlatmadan önce aşağıdaki kuralları dikkatle okuyunuz.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Hedef Harfler:</strong>
                    Bu testte toplam 30 satır harf yer almaktadır. Göreviniz yalnızca <strong className="text-sky-700 font-mono text-sm bg-sky-100 px-1.5 py-0.5 rounded">a</strong>, <strong className="text-sky-700 font-mono text-sm bg-sky-100 px-1.5 py-0.5 rounded">b</strong>, <strong className="text-sky-700 font-mono text-sm bg-sky-100 px-1.5 py-0.5 rounded">d</strong> ve <strong className="text-sky-700 font-mono text-sm bg-sky-100 px-1.5 py-0.5 rounded">g</strong> harflerini bulup üzerlerine tıklayarak işaretlemektir.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Hedef Dışı Harfler:</strong>
                    Diğer harfleri (e, p, z, n, s, u, h, v, k, l, f, o, m, i, r, t, y, ü, ş, ğ, ı vb.) kesinlikle işaretlemeyiniz.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Uygulama Süresi:</strong>
                    Test süresi tam <strong>5 dakika (05:00)</strong>'dır. Süre başladığında geri sayım çalışacak ve süre dolduğunda test otomatik olarak sonlandırılacaktır.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">4</div>
                  <div>
                    <strong className="text-slate-900 block mb-0.5">İşaretlemeyi Düzeltme:</strong>
                    Yanlışlıkla işaretlediğiniz bir harfin üzerine tekrar tıklayarak işaretini kaldırabilirsiniz.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartTest}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Testi Başlat (05:00)</span>
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Active Test Grid */}
          {phase === 'running' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {/* Target letters helper bar */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">İşaretlenecek Hedef Harfler:</span>
                  <div className="flex items-center gap-1.5">
                    {['a', 'b', 'd', 'g'].map((l) => (
                      <span key={l} className="w-7 h-7 rounded-lg bg-sky-600 text-white font-mono font-black text-sm flex items-center justify-center shadow-2xs">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-slate-500 text-[11px]">
                  Hedef harflerin üzerine tıklayarak işaretleyiniz.
                </span>
              </div>

              {/* 30 Rows Matrix Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 divide-y divide-slate-100">
                {rowsData.map(({ rowNum, cells }) => (
                  <div 
                    key={rowNum} 
                    className={`pt-2 flex items-center gap-2 ${
                      rowNum === 11 || rowNum === 21 ? 'border-t-2 border-indigo-200 pt-3' : ''
                    }`}
                  >
                    <div className="w-8 text-[11px] font-mono font-bold text-slate-400 text-right shrink-0">
                      {rowNum}.
                    </div>

                    <div className="flex-1 flex flex-wrap items-center gap-1.5">
                      {cells.map((cell) => {
                        const isMarked = markedCellIds.has(cell.cellId);
                        return (
                          <button
                            key={cell.cellId}
                            type="button"
                            onClick={() => handleToggleCell(cell.cellId)}
                            className={`w-8 h-8 rounded-lg font-mono text-sm font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                              isMarked
                                ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-400 ring-offset-1 font-black'
                                : 'bg-slate-50 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {cell.char}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 3: Early Finish Confirmation Modal */}
          {phase === 'confirm_finish' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">Testi Sonlandırmak İstediğinizden Emin misiniz?</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Kalan süreniz bulunmaktadır: <strong className="font-mono text-amber-700">{formatTime(remainingSeconds)}</strong>. Testi şimdi bitirirseniz mevcut işaretlemeleriniz kaydedilecektir.
                  </p>
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-left flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelFinish}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    İptal (Devam Et)
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFinish}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Kaydediliyor...' : 'Evet, Testi Bitir'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </ModalPortal>
  );
};
