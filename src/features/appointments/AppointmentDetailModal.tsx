import React from 'react';
import { AppointmentDto } from '@shared/ipc-types';
import { useAppStore } from '../../stores/appStore';
import { 
  X, 
  CalendarCheck, 
  User, 
  Clock, 
  MapPin, 
  Bell, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import { formatIsoToTr } from '../../utils/dateUtils';
import { ModalPortal } from '../../components/ModalPortal';

interface AppointmentDetailModalProps {
  appointment: AppointmentDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose
}) => {
  const { students } = useAppStore();

  if (!isOpen || !appointment) return null;

  const isGroup = appointment.appointmentType === 'Grup Rehberliği' 
    || appointment.appointmentType === 'Grup Rehberliği Takip Randevusu'
    || Boolean(appointment.appointmentType?.toLowerCase().includes('grup'))
    || Boolean(appointment.participants && appointment.participants.length > 1) 
    || Boolean(appointment.studentIds && appointment.studentIds.length > 1);

  const student = students.find(s => s.id === appointment.studentId);
  const studentName = student 
    ? `${student.firstName} ${student.lastName}` 
    : (appointment.studentName || 'Danışan');
  const studentNumber = student?.studentNumber || appointment.studentNumber || '—';
  const className = (student as any)?.className || '—';

  // Format status badge
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tamamlandı</span>
          </span>
        );
      case 'student_absent':
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Öğrenci Gelmedi</span>
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Diğer</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>İptal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Bekliyor</span>
          </span>
        );
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Randevu Detayı</h3>
              <p className="text-[11px] text-slate-400">Görüşme ve randevu kayıt bilgileri</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Main Title & Status Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                {appointment.appointmentType || 'Bireysel Öğrenci Görüşmesi'}
              </span>
              <h4 className="text-base font-extrabold text-slate-800 mt-0.5">
                {appointment.title}
              </h4>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>

          {/* Details Grid (Bireysel / Grup Ayrımı) */}
          {!isGroup ? (
            <div className="grid grid-cols-2 gap-3 bg-white rounded-xl border border-slate-100 p-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Öğrenci</span>
                </span>
                <div className="font-bold text-slate-800 text-xs">{studentName}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Sınıf / Numara</span>
                <div className="font-semibold text-slate-700 text-xs">
                  {className} • {studentNumber}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tarih & Saat</span>
                </span>
                <div className="font-semibold text-slate-700 text-xs font-mono">
                  {formatIsoToTr(appointment.date)} • {appointment.startTime} - {appointment.endTime}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Görüşme Yeri</span>
                </span>
                <div className="font-semibold text-slate-700 text-xs">
                  {appointment.location || 'Rehberlik Servisi'}
                </div>
              </div>
            </div>
          ) : (
            /* Grup Rehberliği Çoklu Öğrenci Tablosu (Req 6) */
            <div className="space-y-3 bg-white rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Katılan Öğrenciler ({appointment.participants?.length || 0})</span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-600">
                  {formatIsoToTr(appointment.date)} • {appointment.startTime} - {appointment.endTime}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
                <table className="pdr-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">#</th>
                      <th>ÖĞRENCİ</th>
                      <th className="w-24">SINIF</th>
                      <th className="w-24">OKUL NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointment.participants && appointment.participants.length > 0 ? (
                      appointment.participants.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-100/70">
                          <td className="text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                          <td className="font-bold text-slate-800">{p.firstName} {p.lastName}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-semibold text-[10px] border border-slate-200">
                              {p.className || '—'}
                            </span>
                          </td>
                          <td className="font-mono text-slate-600">{p.studentNumber}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                          Öğrenci detayları bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 pt-1 text-slate-600 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Görüşme Yeri: <strong>{appointment.location || 'Rehberlik Servisi'}</strong></span>
              </div>
            </div>
          )}

          {/* Windows Bildirim Hatırlatıcısı */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800 text-[11px]">
            <Bell className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Windows bildirim hatırlatıcısı randevudan <strong>{appointment.reminderMinutes || 15} dakika</strong> önce tetiklenir.</span>
          </div>

          {/* Açıklama / Hazırlık Notları */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Açıklama / Hazırlık Notları</span>
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
              {appointment.notes && appointment.notes.trim() ? (
                appointment.notes
              ) : (
                <span className="text-slate-400 italic">Herhangi bir açıklama veya hazırlık notu kaydedilmemiş.</span>
              )}
            </div>
          </div>

          {/* Sonuç Notu */}
          {(appointment.status === 'other' || appointment.resultNote) && (
            <div className="space-y-1.5">
              <span className="font-bold text-purple-700 text-xs flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Sonuç Notu</span>
              </span>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs leading-relaxed whitespace-pre-wrap">
                {appointment.resultNote && appointment.resultNote.trim() ? (
                  appointment.resultNote
                ) : (
                  <span className="text-purple-400 italic">Sonuç notu belirtilmemiş.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
