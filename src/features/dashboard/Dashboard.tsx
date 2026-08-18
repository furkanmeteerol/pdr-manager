import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MessagesSquare, 
  CalendarCheck,
  CheckCircle2,
  Check,
  HelpCircle,
  ClipboardList,
  Square,
  CheckSquare,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { MeetingDto, DailyNoteDto, AppointmentDto } from '@shared/ipc-types';
import { AppointmentDetailModal } from '../appointments/AppointmentDetailModal';
import { MeetingDetailModal } from '../meetings/MeetingDetailModal';
import { 
  getLocalDateIso, 
  formatIsoToTr, 
  addDaysToIso, 
  getMondayOfWeek 
} from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { 
    meetings, 
    appointments, 
    students, 
    status,
    fetchMeetings
  } = useAppStore();

  // Selected date for "Yapılan Görüşmeler" (Local timezone, strictly YYYY-MM-DD)
  const [selectedMeetingDate, setSelectedMeetingDate] = useState<string>(() => getLocalDateIso());

  // Selected start of week for "Randevular & Ajanda & Yıllık Plan"
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getMondayOfWeek());

  // Selected date for "Günlük Notlar" (Local timezone, strictly YYYY-MM-DD)
  const [selectedNoteDate, setSelectedNoteDate] = useState<string>(() => getLocalDateIso());
  const [dailyNotesList, setDailyNotesList] = useState<DailyNoteDto[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);

  // Daily Note Modal state (Add / Edit)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<DailyNoteDto | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // MEBBİS Confirmation Modal State
  const [mebbisModalMeeting, setMebbisModalMeeting] = useState<MeetingDto | null>(null);
  const [isUpdatingMebbis, setIsUpdatingMebbis] = useState<boolean>(false);

  // Meeting Detail / Report Modal State (From Table Row Click)
  const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<MeetingDto | null>(null);

  // Appointment Detail Modal State (From Calendar Click)
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<AppointmentDto | null>(null);

  // Load Daily Notes for selected date
  const loadDailyNotes = useCallback(async (dateStr: string) => {
    if (window.api && window.api.dailyNotes) {
      setIsLoadingNotes(true);
      try {
        const notes = await window.api.dailyNotes.listByDate(dateStr);
        setDailyNotesList(notes);
      } catch (err) {
        console.error('Failed to load daily notes:', err);
      } finally {
        setIsLoadingNotes(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDailyNotes(selectedNoteDate);
  }, [selectedNoteDate, loadDailyNotes]);

  // Date Navigation for Meetings
  const handleMeetingDateNav = (offsetDays: number) => {
    setSelectedMeetingDate(prev => addDaysToIso(prev, offsetDays));
  };

  const handleMeetingDateToday = () => {
    setSelectedMeetingDate(getLocalDateIso());
  };

  // Week Navigation for Timeline
  const handleWeekNav = (offsetWeeks: number) => {
    const nextMonday = new Date(weekStartDate);
    nextMonday.setDate(nextMonday.getDate() + (offsetWeeks * 7));
    setWeekStartDate(nextMonday);
  };

  const handleWeekToday = () => {
    setWeekStartDate(getMondayOfWeek());
  };

  // Date Navigation for Daily Notes
  const handleNoteDateNav = (offsetDays: number) => {
    setSelectedNoteDate(prev => addDaysToIso(prev, offsetDays));
  };

  const handleNoteDateToday = () => {
    setSelectedNoteDate(getLocalDateIso());
  };

  // 7 Days of the current week (calculated strictly from local date components)
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const iso = getLocalDateIso(d);
      days.push({
        name: dayNames[i],
        dayNumber: d.getDate(),
        dateIso: iso,
        fullDate: d
      });
    }
    return days;
  }, [weekStartDate]);

  const weekDateRangeStr = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = formatIsoToTr(weekDays[0].dateIso);
    const end = formatIsoToTr(weekDays[6].dateIso);
    return `${start} - ${end}`;
  }, [weekDays]);

  // Filter meetings for the selected single date
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => m.date === selectedMeetingDate);
  }, [meetings, selectedMeetingDate]);

  // 10 Time slots from 07:00 to 16:00 (Req 3: 07:00'da başlamalı, 16:00'da bitmeli)
  const timeSlots = [
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00'
  ];

  // Handle MEBBİS Confirm
  const handleConfirmMebbis = async () => {
    if (!mebbisModalMeeting) return;
    setIsUpdatingMebbis(true);
    try {
      if (window.api && window.api.meetings) {
        await window.api.meetings.setMebbisStatus(mebbisModalMeeting.id, true);
        await fetchMeetings();
      }
      setMebbisModalMeeting(null);
    } catch (err) {
      console.error('Failed to update MEBBİS status:', err);
    } finally {
      setIsUpdatingMebbis(false);
    }
  };

  // Toggle Note Completed
  const handleToggleNoteComplete = async (note: DailyNoteDto) => {
    if (!window.api || !window.api.dailyNotes) return;
    try {
      await window.api.dailyNotes.toggleComplete(note.id, !note.completed);
      await loadDailyNotes(selectedNoteDate);
    } catch (err) {
      console.error('Failed to toggle note:', err);
    }
  };

  // Open Create Note Modal
  const handleOpenAddNote = () => {
    setEditingNote(null);
    setNoteContent('');
    setNoteError(null);
    setIsNoteModalOpen(true);
  };

  // Open Edit Note Modal
  const handleOpenEditNote = (note: DailyNoteDto) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteError(null);
    setIsNoteModalOpen(true);
  };

  // Save Note (Create or Update)
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      setNoteError('Not / görev içeriği boş bırakılamaz.');
      return;
    }

    setIsSavingNote(true);
    setNoteError(null);

    try {
      if (window.api && window.api.dailyNotes) {
        if (editingNote) {
          await window.api.dailyNotes.update(editingNote.id, noteContent.trim());
        } else {
          await window.api.dailyNotes.create({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            noteDate: selectedNoteDate,
            content: noteContent.trim()
          });
        }
        await loadDailyNotes(selectedNoteDate);
        setIsNoteModalOpen(false);
      }
    } catch (err: any) {
      setNoteError(err.message || 'Not kaydedilirken bir hata oluştu');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Bu günlük notu silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api && window.api.dailyNotes) {
        await window.api.dailyNotes.delete(id);
        await loadDailyNotes(selectedNoteDate);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="p-5 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Section: Yapılan Görüşmeler */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header with Date Navigation */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-blue-600" />
              <span>Yapılan Görüşmeler</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMeetingDateNav(-1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Önceki Gün"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 min-w-[90px] text-center">
              {formatIsoToTr(selectedMeetingDate)}
            </span>
            <button
              onClick={() => handleMeetingDateNav(1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sonraki Gün"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleMeetingDateToday}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors ml-1 cursor-pointer"
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Table of Meetings */}
        <div className="overflow-x-auto">
          <table className="pdr-table">
            <thead>
              <tr>
                <th className="w-12 text-center">SIRA</th>
                <th className="w-24">SINIF</th>
                <th className="w-24">NUMARA</th>
                <th>ADI SOYADI</th>
                <th>GÖRÜŞME KONUSU</th>
                <th className="w-24">SAAT</th>
                <th className="w-32 text-center">MEBBİS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Bu tarihe ({formatIsoToTr(selectedMeetingDate)}) ait görüşme kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((m, idx) => {
                  const isGroup = m.participantType === 'Grup' || m.participantType === 'group' || m.meetingType === 'group' || m.meetingType === 'group_guidance' || (m.participants && m.participants.length > 1);
                  const student = students.find(s => s.id === m.studentId);
                  const isProcessed = m.mebbisProcessed === true;

                  // 1. SINIF
                  let classDisplay = '—';
                  if (isGroup) {
                    if (m.participants && m.participants.length > 0) {
                      const classes = Array.from(new Set(m.participants.map(p => p.className).filter(Boolean)));
                      classDisplay = classes.length === 1 ? classes[0]! : 'Çoklu Sınıf';
                    } else {
                      classDisplay = 'Çoklu Sınıf';
                    }
                  } else {
                    classDisplay = (student as any)?.className || m.className || '—';
                  }

                  // 2. NUMARA
                  let numberDisplay = '—';
                  if (isGroup) {
                    numberDisplay = 'Çoklu';
                  } else {
                    numberDisplay = student?.studentNumber || m.studentNumber || '—';
                  }

                  // 3. ADI SOYADI
                  let nameDisplay = 'Danışan';
                  if (isGroup) {
                    const count = m.participants?.length || (m.studentIds ? m.studentIds.length : 0);
                    nameDisplay = count > 0 ? `Grup Rehberliği (${count} Öğrenci)` : 'Grup Rehberliği';
                  } else {
                    if (m.meetingType === 'parent' || m.participantType === 'parent') {
                      nameDisplay = student 
                        ? `${student.firstName} ${student.lastName} Velisi${m.parentRelation ? ` (${m.parentRelation})` : ''}` 
                        : 'Veli Görüşmesi';
                    } else if (m.meetingType === 'teacher' || m.participantType === 'teacher') {
                      nameDisplay = m.teacherName ? `Öğretmen: ${m.teacherName}` : 'Öğretmen';
                    } else {
                      nameDisplay = student ? `${student.firstName} ${student.lastName}` : (m.studentName || 'Danışan');
                    }
                  }

                  // 4. GÖRÜŞME KONUSU
                  const topicDisplay = m.meetingTopic === 'Diğer' && m.meetingTopicOther 
                    ? `Diğer (${m.meetingTopicOther})` 
                    : (m.meetingTopic || m.subject || '—');

                  // 5. SAAT
                  const timeDisplay = m.startTime || '—';

                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMeetingForDetail(m)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      title="Görüşme detayını ve raporunu görüntülemek için tıklayın"
                    >
                      <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          {classDisplay}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{numberDisplay}</td>
                      <td>
                        <div className="font-semibold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                          {nameDisplay}
                        </div>
                      </td>
                      <td className="text-slate-600 text-xs max-w-md truncate">
                        {topicDisplay}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{timeDisplay}</td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isProcessed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>✓ İşlendi</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMebbisModalMeeting(m);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            MEBBİS'e Onayla
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Middle Section: Randevular (07:00 - 16:00) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header with Week Range and Navigation */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Randevular</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWeekNav(-1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 min-w-[170px] text-center">
              {weekDateRangeStr}
            </span>
            <button
              onClick={() => handleWeekNav(1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleWeekToday}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors ml-1 cursor-pointer"
            >
              Bugün
            </button>
          </div>
        </div>

        {/* Weekly Timeline Grid (07:00 to 16:00) */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header Columns */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-center font-bold text-xs text-slate-600">
              <div className="p-2.5 border-r border-slate-200 text-slate-400 font-medium">SAAT</div>
              {weekDays.map(day => (
                <div key={day.dateIso} className="p-2.5 border-r border-slate-200 last:border-r-0">
                  <span className="text-slate-500 font-medium mr-1.5">{day.name}</span>
                  <span className="text-slate-800 font-extrabold text-xs">{day.dayNumber}</span>
                </div>
              ))}
            </div>

            {/* Time Slot Rows (07:00 to 16:00) */}
            <div className="divide-y divide-slate-100 text-xs">
              {timeSlots.map(time => {
                const hourPrefix = time.split(':')[0];
                return (
                  <div key={time} className="grid grid-cols-8 min-h-[52px]">
                    {/* Time column */}
                    <div className="p-2 border-r border-slate-200 bg-slate-50/30 text-slate-400 font-mono text-[11px] flex items-center justify-center">
                      {time}
                    </div>

                    {/* Day cells */}
                    {weekDays.map(day => {
                      // Match real appointments for this day & hour
                      const matchingAppointments = appointments.filter(a => 
                        a.date === day.dateIso && 
                        a.startTime && 
                        a.startTime.startsWith(hourPrefix)
                      );

                      return (
                        <div key={day.dateIso} className="p-1 border-r border-slate-100 last:border-r-0 relative hover:bg-slate-50/50 transition-colors flex flex-col gap-1 justify-center">
                          {/* Real Appointments */}
                          {matchingAppointments.map(app => {
                            const isGroup = app.appointmentType === 'Grup Rehberliği' || (app.participants && app.participants.length > 1) || (app.studentIds && app.studentIds.length > 1);
                            const student = students.find(s => s.id === app.studentId);
                            const studentName = isGroup 
                              ? `Grup Rehberliği (${app.participants?.length || (app.studentIds ? app.studentIds.length : 0)} Öğrenci)`
                              : (student ? `${student.firstName} ${student.lastName}` : (app.studentName || 'Danışan'));
                            const className = isGroup ? 'Çoklu Sınıf' : ((student as any)?.className || '—');
                            const studentNumber = isGroup ? 'Çoklu' : (student?.studentNumber || app.studentNumber || '—');
                            
                            const statusMap: Record<string, string> = {
                              completed: 'Tamamlandı',
                              student_absent: 'Öğrenci Gelmedi',
                              no_show: 'Öğrenci Gelmedi',
                              other: 'Diğer',
                              cancelled: 'İptal',
                              scheduled: 'Bekliyor',
                              pending: 'Bekliyor'
                            };
                            const statusText = statusMap[app.status] || 'Bekliyor';
                            const participantsListStr = isGroup && app.participants && app.participants.length > 0 
                              ? `\nKatılımcılar:\n` + app.participants.map(p => `• ${p.firstName} ${p.lastName} (${p.className || '—'})`).join('\n')
                              : '';
                            const tooltip = `${studentName}\n${className} • ${studentNumber}\n${app.appointmentType || 'Bireysel Öğrenci Görüşmesi'}\n${app.startTime} - ${app.endTime}\nDurum: ${statusText}${participantsListStr}`;

                            const getChipClasses = () => {
                              switch (app.status) {
                                case 'completed':
                                  return 'bg-emerald-100/70 border-emerald-300 text-emerald-900 line-through opacity-85';
                                case 'student_absent':
                                case 'no_show':
                                  return 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100';
                                case 'other':
                                  return 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100';
                                case 'cancelled':
                                  return 'bg-slate-100 border-slate-200 text-slate-500 opacity-60';
                                default:
                                  return 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
                              }
                            };

                            return (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => setSelectedAppointmentForDetail(app)}
                                title={tooltip}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-semibold truncate shadow-xs text-left cursor-pointer transition-all w-full ${getChipClasses()}`}
                              >
                                <span className="font-mono mr-1 font-bold">{app.startTime}</span>
                                <span>{app.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Günlük Notlar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header with Date Navigation & + Not Ekle Button */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Günlük Notlar</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gün içinde yapmanız gereken işleri ve önemli notları takip edin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNoteDateNav(-1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Önceki Gün"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 min-w-[90px] text-center">
              {formatIsoToTr(selectedNoteDate)}
            </span>
            <button
              onClick={() => handleNoteDateNav(1)}
              className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sonraki Gün"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNoteDateToday}
              className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors ml-1 cursor-pointer"
            >
              Bugün
            </button>
            <button
              onClick={handleOpenAddNote}
              className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1 ml-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Not Ekle</span>
            </button>
          </div>
        </div>

        {/* Daily Notes List Body */}
        <div className="p-5">
          {isLoadingNotes ? (
            <div className="py-8 text-center text-slate-400 text-xs">Yükleniyor...</div>
          ) : dailyNotesList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Henüz bu gün ({formatIsoToTr(selectedNoteDate)}) için bir not bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dailyNotesList.map((note) => (
                <div 
                  key={note.id} 
                  className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors group"
                >
                  <div 
                    onClick={() => handleToggleNoteComplete(note)}
                    className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                  >
                    <button 
                      type="button" 
                      className="text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                    >
                      {note.completed ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className={`text-xs font-medium transition-all ${
                      note.completed 
                        ? 'line-through text-slate-400' 
                        : 'text-slate-700'
                    }`}>
                      {note.content}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditNote(note)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Günlük Not Ekleme / Düzenleme Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {editingNote ? 'Günlük Notu Düzenle' : 'Yeni Günlük Not / Görev'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tarih: {formatIsoToTr(selectedNoteDate)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              {noteError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {noteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Not / Görev *
                </label>
                <textarea
                  rows={3}
                  required
                  autoFocus
                  placeholder="Örn: Müdür beyle görüşme, RAM evraklarını kontrol et..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEBBİS Confirmation Modal */}
      {mebbisModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">MEBBİS'e yüklediniz mi?</h3>
                <p className="text-[11px] text-slate-400">Rehberlik modülü veri işleme onayı</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"{mebbisModalMeeting.subject}"</strong> konulu görüşme kaydının MEBBİS sistemine işlendiğini onaylıyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMebbisModalMeeting(null)}
                disabled={isUpdatingMebbis}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmMebbis}
                disabled={isUpdatingMebbis}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Evet, Yüklendi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal (From Table row click) */}
      <MeetingDetailModal
        meeting={selectedMeetingForDetail}
        isOpen={Boolean(selectedMeetingForDetail)}
        onClose={() => setSelectedMeetingForDetail(null)}
      />

      {/* Appointment Detail Modal (For Calendar clicks) */}
      <AppointmentDetailModal
        appointment={selectedAppointmentForDetail}
        isOpen={Boolean(selectedAppointmentForDetail)}
        onClose={() => setSelectedAppointmentForDetail(null)}
      />
    </div>
  );
};
