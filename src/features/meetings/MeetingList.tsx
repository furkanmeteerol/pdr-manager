import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { MeetingDto } from '@shared/ipc-types';
import { 
  MessagesSquare, 
  BarChart3, 
  Plus, 
  FileText, 
  Trash2, 
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { MeetingDetailModal } from './MeetingDetailModal';
import { MeetingFormModal } from './MeetingFormModal';
import { formatIsoToTr, getLocalDateIso } from '../../utils/dateUtils';

export const MeetingList: React.FC = () => {
  const { 
    meetings, 
    students, 
    fetchMeetings,
    isMeetingModalOpen,
    setIsMeetingModalOpen
  } = useAppStore();

  // Active view tab: 'all' | 'calendar' | 'stats' (Req 2)
  const [activeTab, setActiveTab] = useState<'all' | 'calendar' | 'stats'>('all');

  // Filters for "Tüm Görüşmeler"
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');

  // Calendar View Date Navigation
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Detail / Report Modal State
  const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<MeetingDto | null>(null);

  // MEBBİS Confirmation Modal State
  const [mebbisModalMeeting, setMebbisModalMeeting] = useState<MeetingDto | null>(null);
  const [isUpdatingMebbis, setIsUpdatingMebbis] = useState<boolean>(false);

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

  // Day Meetings Modal State (Req 1: Bölüm 7)
  const [selectedDateForDayModal, setSelectedDateForDayModal] = useState<string | null>(null);

  // Month navigation for Calendar View
  const handlePrevMonth = () => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentCalendarDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentCalendarDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentCalendarDate(d);
  };

  const handleToday = () => {
    setCurrentCalendarDate(new Date());
  };

  const todayIso = getLocalDateIso();
  const monthName = currentCalendarDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Generate 7-column calendar matrix
  const calendarMatrix = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1; // 0 for Monday
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateIso: getLocalDateIso(d)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        dateIso: getLocalDateIso(d)
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateIso: getLocalDateIso(d)
      });
    }

    return days;
  }, [currentCalendarDate]);

  // Filtered meetings for List View
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      // Month filter
      if (monthFilter !== 'all') {
        const mMonth = m.date.split('-')[1];
        if (mMonth !== monthFilter) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const student = students.find(s => s.id === m.studentId);
        const name = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
        const num = student?.studentNumber || '';
        const topic = (m.meetingTopic || m.subject || '').toLowerCase();
        const activity = (m.activityType || m.meetingType || '').toLowerCase();
        const summary = (m.summary || '').toLowerCase();

        return name.includes(term) || num.includes(term) || topic.includes(term) || activity.includes(term) || summary.includes(term);
      }

      return true;
    });
  }, [meetings, students, monthFilter, searchTerm]);

  // Day modal meetings
  const dayModalMeetings = useMemo(() => {
    if (!selectedDateForDayModal) return [];
    return meetings.filter(m => m.date === selectedDateForDayModal);
  }, [meetings, selectedDateForDayModal]);

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Bu görüşme kaydını silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api && window.api.meetings) {
        await window.api.meetings.softDelete(id);
        await fetchMeetings();
      }
    } catch (err) {
      console.error('Delete meeting error:', err);
    }
  };

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = meetings.length;
    let studentCount = 0;
    let parentCount = 0;
    let teacherCount = 0;
    let groupCount = 0;

    const topicCounts: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};

    for (const m of meetings) {
      const isGroup = m.participantType === 'Grup' || m.participantType === 'group' || m.meetingType === 'group' || m.meetingType === 'group_guidance';
      if (isGroup) groupCount++;
      else if (m.participantType === 'parent' || m.meetingType === 'parent') parentCount++;
      else if (m.participantType === 'teacher' || m.meetingType === 'teacher') teacherCount++;
      else studentCount++;

      const topic = m.meetingTopic || m.subject || 'Diğer';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;

      const act = m.activityType || (isGroup ? 'Grup Rehberliği' : 'Bireysel Görüşme');
      activityCounts[act] = (activityCounts[act] || 0) + 1;
    }

    return {
      total,
      studentCount,
      parentCount,
      teacherCount,
      groupCount,
      topicCounts,
      activityCounts
    };
  }, [meetings]);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* 1. Header Navigation Bar (Req 2: List / Calendar / Stats) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessagesSquare className="w-4 h-4" />
            <span>Tüm Görüşmeler</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono">
              {meetings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Görüşme Takvimi</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>İstatistikler</span>
          </button>
        </div>

        {/* New Meeting Button */}
        <button
          onClick={() => setIsMeetingModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni Görüşme Ekle</span>
        </button>
      </div>

      {/* 2. Main Content Views */}
      {activeTab === 'all' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı, no, görüşme konusu veya özet ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Tüm Aylar</option>
                <option value="01">Ocak</option>
                <option value="02">Şubat</option>
                <option value="03">Mart</option>
                <option value="04">Nisan</option>
                <option value="05">Mayıs</option>
                <option value="06">Haziran</option>
                <option value="07">Temmuz</option>
                <option value="08">Ağustos</option>
                <option value="09">Eylül</option>
                <option value="10">Ekim</option>
                <option value="11">Kasım</option>
                <option value="12">Aralık</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="pdr-table">
                <thead>
                  <tr>
                    <th className="w-14 text-center">NO</th>
                    <th>DANIŞAN / ÖĞRENCİ</th>
                    <th className="w-20">SINIF</th>
                    <th className="w-28">TARİH</th>
                    <th className="w-28">SAAT</th>
                    <th className="w-44">YAPILAN ÇALIŞMA</th>
                    <th className="w-44">GÖRÜŞME KONUSU</th>
                    <th className="w-28 text-center">MEBBİS</th>
                    <th className="w-32 text-center">İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 text-xs italic">
                        Kayıtlı görüşme bulunamadı. "+ Yeni Görüşme Ekle" butonuyla yeni görüşme kaydı oluşturabilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    filteredMeetings.map((m, idx) => {
                      const isGroup = m.participantType === 'Grup' || m.participantType === 'group' || m.meetingType === 'group' || m.meetingType === 'group_guidance';
                      const student = students.find(s => s.id === m.studentId);
                      const studentName = isGroup 
                        ? `Grup Rehberliği (${m.participants?.length || (m.studentIds ? m.studentIds.length : 0)} Öğrenci)`
                        : (student ? `${student.firstName} ${student.lastName}` : (m.studentName || m.subject || 'Bireysel Danışan'));
                      const className = isGroup ? 'Çoklu' : (student ? (student as any).className || '—' : (m.className || '—'));
                      const timeStr = m.endTime ? `${m.startTime} – ${m.endTime}` : m.startTime;
                      const sessionBadge = m.sessionNumber ? `#${m.sessionNumber}` : `#${filteredMeetings.length - idx}`;
                      const topicStr = m.meetingTopic === 'Diğer' && m.meetingTopicOther ? `Diğer (${m.meetingTopicOther})` : (m.meetingTopic || m.subject || '—');
                      const actStr = m.activityType === 'Diğer' && m.activityTypeOther 
                        ? `Diğer (${m.activityTypeOther})` 
                        : (m.activityType || (isGroup ? 'Grup Rehberliği' : m.meetingType === 'parent' ? 'Veli Görüşmesi' : m.meetingType === 'teacher' ? 'Öğretmen Görüşmesi' : 'Bireysel Öğrenci Görüşmesi'));

                      const participantLabel = isGroup ? 'Grup Rehberliği' : m.participantType === 'parent' || m.meetingType === 'parent' ? 'Veli' : m.participantType === 'teacher' || m.meetingType === 'teacher' ? 'Öğretmen' : 'Öğrenci';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="text-center font-mono font-bold text-blue-700 text-xs">
                            {sessionBadge}
                          </td>
                          <td>
                            <div className="font-extrabold text-slate-800 text-xs">{studentName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              ({participantLabel}{m.parentRelation ? `: ${m.parentRelation}` : m.teacherName ? `: ${m.teacherName}` : ''})
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="inline-block px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200 leading-snug break-words whitespace-normal max-w-[130px]">
                              {className}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-slate-700 font-semibold">
                            {formatIsoToTr(m.date)}
                          </td>
                          <td className="font-mono text-xs text-slate-600">
                            {timeStr}
                          </td>
                          <td className="py-2.5">
                            <span className="inline-block px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold leading-snug break-words whitespace-normal max-w-[220px]">
                              {actStr}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="inline-block px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold leading-snug break-words whitespace-normal max-w-[220px]">
                              {topicStr}
                            </span>
                          </td>
                          <td className="text-center py-2.5">
                            {m.mebbisProcessed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>İşlendi</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setMebbisModalMeeting(m)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all cursor-pointer shadow-xs active:scale-95"
                                title="MEBBİS'e yüklendi olarak işaretle"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>İşlenmedi</span>
                              </button>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedMeetingForDetail(m)}
                                className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Rapor ve Detayları Görüntüle"
                              >
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>Rapor</span>
                              </button>
                              <button
                                onClick={() => handleDeleteMeeting(m.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Sil"
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
        </div>
      ) : activeTab === 'calendar' ? (
        /* 3. GÖRÜŞME TAKVİMİ GÖRÜNÜMÜ & GÜN TIKLAMA (Req 1 & Req 2) */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Görüşme Takvimi — {capitalizedMonthName}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Önceki Ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-extrabold text-slate-800 min-w-[130px] text-center">
                  {capitalizedMonthName}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Sonraki Ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Bugün
              </button>
            </div>
          </div>

          {/* Calendar Month Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Day Headers (Pzt - Paz) */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center font-bold text-xs text-slate-600">
              <div className="p-3 border-r border-slate-200">Pzt</div>
              <div className="p-3 border-r border-slate-200">Sal</div>
              <div className="p-3 border-r border-slate-200">Çar</div>
              <div className="p-3 border-r border-slate-200">Per</div>
              <div className="p-3 border-r border-slate-200">Cum</div>
              <div className="p-3 border-r border-slate-200">Cmt</div>
              <div className="p-3">Paz</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-xs">
              {calendarMatrix.map((item, idx) => {
                const isToday = item.dateIso === todayIso;
                const dayMeetings = meetings.filter(m => m.date === item.dateIso);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dayMeetings.length > 0) {
                        setSelectedDateForDayModal(item.dateIso);
                      }
                    }}
                    className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                      item.isCurrentMonth ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/40 text-slate-300'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday 
                            ? 'bg-blue-600 text-white font-extrabold shadow-xs' 
                            : item.isCurrentMonth 
                            ? 'text-slate-700' 
                            : 'text-slate-400'
                        }`}
                      >
                        {item.dayNumber}
                      </span>

                      {dayMeetings.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-100">
                          {dayMeetings.length} Görüşme
                        </span>
                      )}
                    </div>

                    {/* Day Meeting Chips */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayMeetings.slice(0, 3).map(m => {
                        const isGroup = m.participantType === 'Grup' || m.participantType === 'group' || m.meetingType === 'group' || m.meetingType === 'group_guidance';
                        const student = students.find(s => s.id === m.studentId);
                        const displayName = isGroup ? `Grup (${m.participants?.length || m.studentIds?.length || 0})` : (student ? `${student.firstName} ${student.lastName}` : (m.studentName || m.subject || 'Danışan'));
                        const timeStr = m.endTime ? `${m.startTime} – ${m.endTime}` : m.startTime;
                        const tooltip = `${displayName}\nSaat: ${timeStr}\nKonu: ${m.meetingTopic || m.subject}\nÇalışma: ${m.activityType || 'Görüşme'}`;

                        return (
                          <div
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMeetingForDetail(m);
                            }}
                            title={tooltip}
                            className="w-full text-left p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[10px] font-bold truncate transition-all shadow-xs cursor-pointer block"
                          >
                            <div className="flex items-center gap-1 font-mono text-[9px] text-blue-600">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>{timeStr}</span>
                            </div>
                            <div className="truncate font-semibold">{displayName}</div>
                          </div>
                        );
                      })}
                      {dayMeetings.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateForDayModal(item.dateIso);
                          }}
                          className="text-[10px] text-blue-700 font-extrabold hover:underline pl-1 cursor-pointer block"
                        >
                          +{dayMeetings.length - 3} görüşme daha... (Tümünü Gör)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Statistics View */
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Görüşme</div>
              <div className="text-2xl font-black text-slate-800">{stats.total}</div>
              <div className="text-[11px] text-blue-600 font-semibold">Tüm oturumlar</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Öğrenci Görüşmeleri</div>
              <div className="text-2xl font-black text-blue-600">{stats.studentCount}</div>
              <div className="text-[11px] text-slate-500 font-semibold">Bireysel danışmanlık</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Veli Görüşmeleri</div>
              <div className="text-2xl font-black text-amber-600">{stats.parentCount}</div>
              <div className="text-[11px] text-slate-500 font-semibold">Aile işbirlikleri</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grup & Öğretmen</div>
              <div className="text-2xl font-black text-purple-600">{stats.groupCount + stats.teacherCount}</div>
              <div className="text-[11px] text-slate-500 font-semibold">Grup ({stats.groupCount}) • Öğretmen ({stats.teacherCount})</div>
            </div>
          </div>

          {/* Topics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Görüşme Konusu Dağılımı</h3>
              <div className="space-y-2">
                {Object.entries(stats.topicCounts).map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">{topic}</span>
                    <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Yapılan Çalışma Türü Dağılımı</h3>
              <div className="space-y-2">
                {Object.entries(stats.activityCounts).map(([act, count]) => (
                  <div key={act} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">{act}</span>
                    <span className="font-mono font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Meetings Modal (Req 1: Gün içindeki tüm görüşmeleri listeleyen modal) */}
      {selectedDateForDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    Görüşmeler — {formatIsoToTr(selectedDateForDayModal)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bu tarihe ait kayıtlı toplam <strong>{dayModalMeetings.length}</strong> görüşme listeleniyor
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDateForDayModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {dayModalMeetings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Bu tarihte kayıtlı görüşme bulunmuyor.
                </div>
              ) : (
                dayModalMeetings.map((m, idx) => {
                  const isGroup = m.participantType === 'Grup' || m.participantType === 'group' || m.meetingType === 'group' || m.meetingType === 'group_guidance';
                  const student = students.find(s => s.id === m.studentId);
                  const studentName = isGroup 
                    ? `Grup Rehberliği (${m.participants?.length || (m.studentIds ? m.studentIds.length : 0)} Öğrenci)`
                    : (student ? `${student.firstName} ${student.lastName}` : (m.studentName || m.subject || 'Bireysel Danışan'));
                  const className = isGroup ? 'Çoklu Sınıf' : (student ? (student as any).className || '—' : (m.className || '—'));
                  const timeStr = m.endTime ? `${m.startTime} – ${m.endTime}` : m.startTime;
                  const sessionBadge = m.sessionNumber ? `#${m.sessionNumber}` : `#${idx + 1}`;
                  const topicStr = m.meetingTopic === 'Diğer' && m.meetingTopicOther ? `Diğer (${m.meetingTopicOther})` : (m.meetingTopic || m.subject || '—');
                  const actStr = m.activityType === 'Diğer' && m.activityTypeOther 
                    ? `Diğer (${m.activityTypeOther})` 
                    : (m.activityType || (isGroup ? 'Grup Rehberliği' : m.meetingType === 'parent' ? 'Veli Görüşmesi' : m.meetingType === 'teacher' ? 'Öğretmen Görüşmesi' : 'Bireysel Öğrenci Görüşmesi'));
                  const participantLabel = isGroup ? 'Grup Rehberliği' : m.participantType === 'parent' || m.meetingType === 'parent' ? 'Veli' : m.participantType === 'teacher' || m.meetingType === 'teacher' ? 'Öğretmen' : 'Öğrenci';
                  const instStr = m.referralInstitutions && m.referralInstitutions.length > 0 ? m.referralInstitutions.join(', ') : null;

                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {sessionBadge}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            🕒 {timeStr}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[11px]">
                            {participantLabel}
                          </span>
                        </div>

                        <div className="font-extrabold text-slate-900 text-sm">
                          {studentName} <span className="text-xs text-slate-500 font-normal">({className})</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                            {actStr}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                            {topicStr}
                          </span>
                          {instStr && (
                            <span className="text-slate-500 text-[11px]">
                              Kurum: {instStr}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateForDayModal(null);
                            setSelectedMeetingForDetail(m);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rapor / Detay</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedDateForDayModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEBBİS Confirmation Modal */}
      {mebbisModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">MEBBİS'e yüklediniz mi?</h3>
                <p className="text-[11px] text-slate-400">Rehberlik modülü veri işleme onayı</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"{mebbisModalMeeting.subject || mebbisModalMeeting.studentName || 'Görüşme'}"</strong> konulu görüşme kaydının MEBBİS sistemine işlendiğini onaylıyor musunuz?
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

      {/* Detail / Report Modal */}
      <MeetingDetailModal
        meeting={selectedMeetingForDetail}
        isOpen={Boolean(selectedMeetingForDetail)}
        onClose={() => setSelectedMeetingForDetail(null)}
      />

      {/* Create Meeting Modal */}
      {isMeetingModalOpen && <MeetingFormModal />}
    </div>
  );
};
