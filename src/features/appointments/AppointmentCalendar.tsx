import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { AppointmentDto } from '@shared/ipc-types';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { AppointmentStatusModal } from './AppointmentStatusModal';
import { AppointmentFormModal } from './AppointmentFormModal';
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Info,
  Clock,
  AlertCircle,
  HelpCircle,
  XCircle
} from 'lucide-react';

export const AppointmentCalendar: React.FC = () => {
  const { 
    appointments, 
    fetchAppointments, 
    setIsAppointmentModalOpen,
    students 
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<AppointmentDto | null>(null);
  const [selectedAppointmentForStatus, setSelectedAppointmentForStatus] = useState<AppointmentDto | null>(null);

  // Calculate remaining time relative to current date
  const getRemainingTimeStr = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Geçti';
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    return `${diffDays} Gün`;
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'scheduled' && a.status !== 'scheduled' && a.status !== 'pending') return false;
        if (statusFilter === 'completed' && a.status !== 'completed') return false;
        if (statusFilter === 'student_absent' && a.status !== 'student_absent' && a.status !== 'no_show') return false;
        if (statusFilter === 'other' && a.status !== 'other') return false;
        if (statusFilter === 'cancelled' && a.status !== 'cancelled') return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const student = students.find(s => s.id === a.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
      const studentNumber = student?.studentNumber || '';
      return (
        a.title.toLowerCase().includes(term) ||
        studentName.includes(term) ||
        studentNumber.includes(term) ||
        (a.location && a.location.toLowerCase().includes(term))
      );
    });
  }, [appointments, students, searchTerm, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api) {
        await window.api.appointments.softDelete(id);
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to delete appointment:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>TAMAMLANDI</span>
          </span>
        );
      case 'student_absent':
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>ÖĞRENCİ GELMEDİ</span>
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3 h-3 text-purple-600" />
            <span>DİĞER</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>İPTAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>BEKLİYOR</span>
          </span>
        );
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* Header & Action Bar (Gereksiz sekmeler kaldırıldı) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Randevular</h2>
            <p className="text-xs text-slate-400">Danışan görüşme ve randevu takvimi</p>
          </div>
        </div>

        <button
          onClick={() => setIsAppointmentModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Randevu Ekle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Öğrenci adı, numara veya randevu konusu ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Durum:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Tümü</option>
            <option value="scheduled">Bekliyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="student_absent">Öğrenci Gelmedi</option>
            <option value="other">Diğer</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="pdr-table">
            <thead>
              <tr>
                <th className="w-12 text-center">SIRA</th>
                <th>AD SOYAD</th>
                <th className="w-24">NUMARA</th>
                <th className="w-20">SINIF</th>
                <th className="w-28">TARİH</th>
                <th className="w-20">SAAT</th>
                <th>RANDEVU KONUSU</th>
                <th className="w-24 text-center">KALAN SÜRE</th>
                <th className="w-32 text-center">DURUM</th>
                <th className="w-28 text-center">İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400 text-xs">
                    Kayıtlı randevu bulunamadı. "+ Randevu Ekle" butonuna basarak yeni randevu oluşturabilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app, idx) => {
                  const isGroup = app.appointmentType === 'Grup Rehberliği' || (app.participants && app.participants.length > 1) || (app.studentIds && app.studentIds.length > 1);
                  const student = students.find(s => s.id === app.studentId);
                  const remaining = getRemainingTimeStr(app.date);

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        {isGroup ? (
                          <div>
                            <div className="font-extrabold text-blue-900 text-xs">
                              Grup Rehberliği ({app.participants?.length || (app.studentIds ? app.studentIds.length : 0)} Öğrenci)
                            </div>
                            {app.participants && app.participants.length > 0 && (
                              <div className="text-[10px] text-slate-500 truncate max-w-xs">
                                {app.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-bold text-slate-800 text-xs">
                            {student ? `${student.firstName} ${student.lastName}` : (app.studentName || 'Danışan')}
                          </div>
                        )}
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {isGroup ? 'Çoklu' : (student?.studentNumber || '—')}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          {isGroup ? 'Çoklu Sınıf' : (student ? (student as any).className || '—' : '—')}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-700">
                        {new Date(app.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="font-mono text-xs text-slate-700 font-semibold">{app.startTime}</td>
                      <td className="text-slate-600 text-xs max-w-xs truncate" title={app.title}>
                        {app.title}
                      </td>
                      <td className="text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          remaining === 'Geçti' 
                            ? 'bg-slate-100 text-slate-500' 
                            : remaining === 'Bugün' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {remaining}
                        </span>
                      </td>
                      <td className="text-center">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ⓘ Detay Butonu */}
                          <button
                            onClick={() => setSelectedAppointmentForDetail(app)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Randevu Detayını Görüntüle"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* ✓ Sonuç Güncelleme Butonu */}
                          <button
                            onClick={() => setSelectedAppointmentForStatus(app)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Randevu Sonucunu Güncelle (Tamamlandı / Öğrenci Gelmedi / Diğer)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 🗑 Sil Butonu */}
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Randevuyu Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointmentForDetail}
        isOpen={Boolean(selectedAppointmentForDetail)}
        onClose={() => setSelectedAppointmentForDetail(null)}
      />

      {/* Appointment Status Modal */}
      <AppointmentStatusModal
        appointment={selectedAppointmentForStatus}
        isOpen={Boolean(selectedAppointmentForStatus)}
        onClose={() => setSelectedAppointmentForStatus(null)}
        onSuccess={fetchAppointments}
      />

      {/* Appointment Creation Modal */}
      <AppointmentFormModal />
    </div>
  );
};
