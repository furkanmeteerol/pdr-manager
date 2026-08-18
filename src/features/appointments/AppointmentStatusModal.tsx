import React, { useState, useEffect } from 'react';
import { AppointmentDto } from '@shared/ipc-types';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Save, 
  CalendarCheck 
} from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface AppointmentStatusModalProps {
  appointment: AppointmentDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AppointmentStatusModal: React.FC<AppointmentStatusModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [status, setStatus] = useState<'completed' | 'student_absent' | 'other'>('completed');
  const [resultNote, setResultNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointment) {
      setError(null);
      if (appointment.status === 'student_absent' || appointment.status === 'no_show') {
        setStatus('student_absent');
      } else if (appointment.status === 'other') {
        setStatus('other');
      } else {
        setStatus('completed');
      }
      setResultNote(appointment.resultNote || '');
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'other' && !resultNote.trim()) {
      setError('"Diğer" durumunu seçtiğinizde Sonuç Notu alanını doldurmanız gerekmektedir.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (window.api && window.api.appointments) {
        await window.api.appointments.updateStatus(
          appointment.id,
          status,
          status === 'other' ? resultNote.trim() : (resultNote.trim() || undefined)
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Randevu sonucu kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Randevu Sonucunu Güncelle</h3>
              <p className="text-[11px] text-slate-400">{appointment.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Randevu Durumu Seçin *</label>

            {/* Option 1: Tamamlandı */}
            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === 'completed' 
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <input 
                type="radio" 
                name="appointmentStatus" 
                value="completed" 
                checked={status === 'completed'}
                onChange={() => setStatus('completed')}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tamamlandı</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Randevu planlandığı şekilde gerçekleştirildi.</div>
              </div>
            </label>

            {/* Option 2: Öğrenci Gelmedi */}
            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === 'student_absent' 
                  ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <input 
                type="radio" 
                name="appointmentStatus" 
                value="student_absent" 
                checked={status === 'student_absent'}
                onChange={() => setStatus('student_absent')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Öğrenci Gelmedi</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Randevu saatinde danışan / öğrenci görüşmeye katılmadı.</div>
              </div>
            </label>

            {/* Option 3: Diğer */}
            <label 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                status === 'other' 
                  ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <input 
                type="radio" 
                name="appointmentStatus" 
                value="other" 
                checked={status === 'other'}
                onChange={() => setStatus('other')}
                className="mt-0.5 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span>Diğer</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Randevu sonucu yukarıdakilerden farklı (erteleme, veli talebi vb.).</div>
              </div>
            </label>
          </div>

          {/* Sonuç Notu TextArea (Always enabled, highlighted if Diğer) */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              Sonuç Notu {status === 'other' ? <span className="text-rose-600">*</span> : <span className="text-slate-400 font-normal">(İsteğe bağlı)</span>}
            </label>
            <textarea
              rows={3}
              required={status === 'other'}
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              placeholder="Örn: Veli telefonla aradı, öğrenci başka bir görüşmeye yönlendirildi."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Sonucu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
