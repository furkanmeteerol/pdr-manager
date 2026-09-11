import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { 
  Bell, 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCheck,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'appointment' | 'meeting' | 'system';
  title: string;
  subtitle: string;
  timeStr: string;
  dateStr: string;
  isToday: boolean;
  isUpcomingSoon: boolean; // within next 2-3 hours
  targetTab?: string;
  rawItem?: any;
}

export const NotificationCenterPopover: React.FC = () => {
  const { 
    appointments, 
    activities, 
    meetings,
    setActiveTab
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pdr_read_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Compute notifications from upcoming appointments and meetings
  const notificationItems = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMillis = now.getTime();

    // 1. Upcoming Appointments
    for (const appt of appointments) {
      if (appt.status !== 'scheduled' && appt.status !== 'pending') continue;

      const [y, m, d] = appt.date.split('-').map(Number);
      const [h, min] = (appt.startTime || '00:00').split(':').map(Number);
      if (!y || !m || !d) continue;

      const apptDate = new Date(y, m - 1, d, h || 0, min || 0);
      const diffHours = (apptDate.getTime() - currentMillis) / (1000 * 60 * 60);

      // Show appointments that are today or in the future within the next 48 hours, or earlier today
      if (diffHours >= -2 && diffHours <= 48) {
        const isToday = appt.date === todayStr;
        const isUpcomingSoon = diffHours > 0 && diffHours <= 3;

        items.push({
          id: `appt_${appt.id}`,
          type: 'appointment',
          title: appt.title,
          subtitle: appt.studentName ? `Öğrenci: ${appt.studentName}` : `Yer: ${appt.location || 'Rehberlik Servisi'}`,
          timeStr: appt.startTime || '',
          dateStr: isToday ? 'Bugün' : appt.date,
          isToday,
          isUpcomingSoon,
          targetTab: 'appointments',
          rawItem: appt
        });
      }
    }

    // 2. Upcoming Meetings (Activities where type = 'meeting')
    for (const act of activities) {
      if (act.type !== 'meeting') continue;

      const [y, m, d] = act.activityDate.split('-').map(Number);
      const [h, min] = (act.activityTime || '09:00').split(':').map(Number);
      if (!y || !m || !d) continue;

      const actDate = new Date(y, m - 1, d, h || 0, min || 0);
      const diffHours = (actDate.getTime() - currentMillis) / (1000 * 60 * 60);

      if (diffHours >= -2 && diffHours <= 48) {
        const isToday = act.activityDate === todayStr;
        const isUpcomingSoon = diffHours > 0 && diffHours <= 3;

        items.push({
          id: `meet_${act.id}`,
          type: 'meeting',
          title: `Toplantı: ${act.title}`,
          subtitle: act.classNames ? `Katılımcılar: ${act.classNames}` : (act.description || 'PDR Toplantısı'),
          timeStr: act.activityTime || '09:00',
          dateStr: isToday ? 'Bugün' : act.activityDate,
          isToday,
          isUpcomingSoon,
          targetTab: 'activities',
          rawItem: act
        });
      }
    }

    // Sort: upcoming soon first, then by today, then title
    return items.sort((a, b) => {
      if (a.isUpcomingSoon && !b.isUpcomingSoon) return -1;
      if (!a.isUpcomingSoon && b.isUpcomingSoon) return 1;
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.timeStr.localeCompare(b.timeStr);
    });
  }, [appointments, activities, meetings]);

  // Unprocessed MEBBİS meetings count
  const unprocessedMebbisMeetings = useMemo(() => {
    return meetings.filter(m => !m.mebbisProcessed);
  }, [meetings]);

  const unprocessedMebbisCount = unprocessedMebbisMeetings.length;

  const unreadCount = useMemo(() => {
    const regularUnread = notificationItems.filter(item => !readIds.has(item.id)).length;
    return regularUnread + (unprocessedMebbisCount > 0 ? 1 : 0);
  }, [notificationItems, readIds, unprocessedMebbisCount]);

  const markAllAsRead = () => {
    const newSet = new Set(readIds);
    for (const item of notificationItems) {
      newSet.add(item.id);
    }
    setReadIds(newSet);
    try {
      localStorage.setItem('pdr_read_notifications', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  const handleMebbisAlertClick = () => {
    setActiveTab('meetings');
    setIsOpen(false);
  };

  const handleItemClick = (item: NotificationItem) => {
    const newSet = new Set(readIds);
    newSet.add(item.id);
    setReadIds(newSet);
    try {
      localStorage.setItem('pdr_read_notifications', JSON.stringify(Array.from(newSet)));
    } catch {}

    if (item.targetTab) {
      setActiveTab(item.targetTab);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors relative"
        title="Bildirimler & Yaklaşan Etkinlikler"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9px] font-extrabold rounded-full absolute -top-1 -right-1 shadow-xs ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Bildirim Merkezi</h3>
                <p className="text-[10px] text-slate-400">MEBBİS uyarıları, randevular ve toplantılar</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Tümünü Okundu Say</span>
              </button>
            )}
          </div>

          {/* List of Notification Items */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {/* PINNED MEBBİS PRIORITY ALERT (Always on top if > 0) */}
            {unprocessedMebbisCount > 0 && (
              <div
                onClick={handleMebbisAlertClick}
                className="p-3 bg-amber-50 hover:bg-amber-100/80 border-b-2 border-amber-200 transition-colors cursor-pointer flex items-start gap-2.5"
              >
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1">
                      <span>MEBBİS'e İşlenmemiş Görüşmeler</span>
                    </h4>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                      Öncelikli Uyarı
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-amber-800 mt-0.5">
                    {unprocessedMebbisCount} görüşme MEBBİS'e henüz işlenmedi.
                  </p>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-700 font-medium">
                    <span>Görüşmeleri açmak ve işlemek için tıklayın →</span>
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-amber-500 self-center shrink-0" />
              </div>
            )}

            {notificationItems.length === 0 && unprocessedMebbisCount === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1.5">
                <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-medium text-slate-600">Yaklaşan bildirim bulunmuyor</p>
                <p className="text-[10px] text-slate-400">Planlanmış randevu ve toplantılarınız burada listelenir.</p>
              </div>
            ) : (
              notificationItems.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                      !isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'appointment' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {item.type === 'appointment' ? (
                        <CalendarCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Users className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs truncate ${!isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {item.title}
                        </h4>
                        {item.isUpcomingSoon && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            Yaklaşıyor
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          {item.dateStr} saat {item.timeStr}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 self-center shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setActiveTab('appointments');
                setIsOpen(false);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Randevular Takvimine Git →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
