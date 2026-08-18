import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { X, Calendar, Save, Bell, Users } from 'lucide-react';
import { getLocalDateIso } from '../../utils/dateUtils';
import { ModalPortal } from '../../components/ModalPortal';

export const AppointmentFormModal: React.FC = () => {
  const { 
    isAppointmentModalOpen, 
    setIsAppointmentModalOpen, 
    classes,
    students, 
    status, 
    fetchAppointments,
    selectedStudentId 
  } = useAppStore();

  // Class & Student Selection
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIdState, setSelectedStudentIdState] = useState<string>(selectedStudentId || '');
  const [groupStudents, setGroupStudents] = useState<Array<{ id: string; name: string; number: string; className?: string }>>([]);

  // Appointment Fields
  const [appointmentType, setAppointmentType] = useState<string>('Bireysel Öğrenci Görüşmesi');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(() => getLocalDateIso());
  const [startTime, setStartTime] = useState<string>('11:00');
  const [endTime, setEndTime] = useState<string>('11:40');
  const [location, setLocation] = useState<string>('Rehberlik Servisi');
  const [notes, setNotes] = useState<string>('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return students;
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  React.useEffect(() => {
    if (isAppointmentModalOpen) {
      setTitle('');
      setDate(getLocalDateIso());
      setStartTime('11:00');
      setEndTime('11:40');
      setLocation('Rehberlik Servisi');
      setNotes('');
      setAppointmentType('Bireysel Öğrenci Görüşmesi');
      setSelectedClassId('');
      setSelectedStudentIdState(selectedStudentId || '');
      setGroupStudents([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isAppointmentModalOpen, selectedStudentId]);

  if (!isAppointmentModalOpen) return null;

  // Add student to Group Guidance list (Persists across class switches)
  const handleAddGroupStudent = (studentIdVal: string) => {
    if (!studentIdVal) return;
    const st = students.find(s => s.id === studentIdVal);
    if (st && !groupStudents.some(g => g.id === st.id)) {
      setGroupStudents([
        ...groupStudents, 
        { 
          id: st.id, 
          name: `${st.firstName} ${st.lastName}`, 
          number: st.studentNumber,
          className: (st as any).className || '—'
        }
      ]);
    }
  };

  const handleRemoveGroupStudent = (id: string) => {
    setGroupStudents(groupStudents.filter(g => g.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Randevu başlığı, tarih, başlangıç ve bitiş saatleri zorunludur.');
      return;
    }

    if (endTime <= startTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }

    if (appointmentType === 'Grup Rehberliği' && groupStudents.length === 0) {
      setError('Grup rehberliği için en az bir öğrenci seçmelisiniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (window.api && window.api.appointments) {
        const studentIds = appointmentType === 'Grup Rehberliği'
          ? groupStudents.map(g => g.id)
          : (selectedStudentIdState ? [selectedStudentIdState] : []);

        await window.api.appointments.create({
          schoolYearId: status?.activeSchoolYearId || 'default-year',
          studentId: appointmentType === 'Grup Rehberliği' ? null : (selectedStudentIdState || null),
          studentIds,
          appointmentType,
          title: title.trim(),
          date,
          startTime,
          endTime,
          location: location.trim(),
          notes: notes.trim() || undefined,
          reminderMinutes: Number(reminderMinutes)
        });

        await fetchAppointments();
        setIsAppointmentModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Randevu kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">Yeni Randevu Kaydı</h3>
              <p className="text-[11px] text-slate-400">Danışan görüşmesi veya grup rehberliği için randevu planlayın</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAppointmentModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Randevu Başlığı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Randevu Başlığı *</label>
            <input
              type="text"
              required
              placeholder="Örn: 10-A Sınav Kaygısı Görüşmesi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Randevu Türü */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Randevu Türü *</label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Bireysel Öğrenci Görüşmesi">Bireysel Öğrenci Görüşmesi</option>
              <option value="Veli Görüşmesi">Veli Görüşmesi</option>
              <option value="Öğretmen Görüşmesi">Öğretmen Görüşmesi</option>
              <option value="Grup Rehberliği">Grup Rehberliği</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Sınıf & Öğrenci Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sınıf Seçiniz</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentIdState('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">Tüm Sınıflar</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.grade}. Sınıf)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {appointmentType === 'Grup Rehberliği' ? 'Öğrenci Ekle (Grup İçin)' : 'Öğrenci Seçiniz'}
              </label>
              {appointmentType === 'Grup Rehberliği' ? (
                <select
                  value=""
                  onChange={(e) => handleAddGroupStudent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci Seçip Ekleyin...</option>
                  {filteredStudents.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.studentNumber})</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedStudentIdState}
                  onChange={(e) => setSelectedStudentIdState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci Seçiniz (Opsiyonel)</option>
                  {filteredStudents.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.studentNumber})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Grup Rehberliği Seçilen Öğrenciler Çipleri (Req 4 & 5) */}
          {appointmentType === 'Grup Rehberliği' && (
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Grup Rehberliği Randevu Öğrenci Listesi ({groupStudents.length})</span>
                </span>
                <span className="text-[10px] text-blue-600 font-normal">Farklı sınıflardan eklenebilir</span>
              </div>
              {groupStudents.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Henüz öğrenci eklenmedi. Yukarıdaki listeden öğrenci seçiniz.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {groupStudents.map(st => (
                    <span 
                      key={st.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-950 font-semibold text-xs shadow-xs"
                    >
                      <span>{st.name} ({st.number}) — {st.className}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroupStudent(st.id)}
                        className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                        title="Listeden çıkar"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tarih & Saatler */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tarih *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Saati *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bitiş Saati *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Görüşme Yeri & Hatırlatıcı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Görüşme Yeri</label>
              <input
                type="text"
                placeholder="Örn: Rehberlik Servisi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Bildirim Hatırlatıcısı</span>
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value={5}>5 dakika önce</option>
                <option value={15}>15 dakika önce</option>
                <option value={30}>30 dakika önce</option>
                <option value={60}>1 saat önce</option>
                <option value={1440}>1 gün önce</option>
              </select>
            </div>
          </div>

          {/* Açıklama / Hazırlık Notları */}
          <div>
            <label htmlFor="appointment-notes-field" className="block text-xs font-bold text-slate-700 mb-1">Açıklama / Hazırlık Notları</label>
            <textarea
              id="appointment-notes-field"
              name="notes"
              rows={3}
              placeholder="Randevu öncesi hazırlık notları, danışan detayları veya görüşme gündemi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-colors resize-y cursor-text pointer-events-auto"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAppointmentModalOpen(false)}
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
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
