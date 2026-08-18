import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
  Trash2,
  Edit2,
  X,
  AlertCircle
} from 'lucide-react';
import { AgendaItemDto, AnnualPlanItemDto, AnnualPlanDto } from '@shared/ipc-types';
import { 
  getLocalDateIso, 
  formatIsoToTr
} from '../../utils/dateUtils';

export const AnnualPlanView: React.FC = () => {
  const { status } = useAppStore();

  // Active module sub-tab: 'agenda' | 'annual_plan'
  const [activeSubTab, setActiveSubTab] = useState<'agenda' | 'annual_plan'>('agenda');

  // Month navigation date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  // Data states
  const [agendaList, setAgendaList] = useState<AgendaItemDto[]>([]);
  const [annualPlan, setAnnualPlan] = useState<AnnualPlanDto | null>(null);

  // Agenda Modals state
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgendaItem, setEditingAgendaItem] = useState<AgendaItemDto | null>(null);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDate, setAgendaDate] = useState(getLocalDateIso());
  const [agendaTime, setAgendaTime] = useState('10:00');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [agendaCompleted, setAgendaCompleted] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [isSavingAgenda, setIsSavingAgenda] = useState(false);

  // Day Agenda Detail Popup state (When a calendar day is clicked)
  const [selectedDayForAgenda, setSelectedDayForAgenda] = useState<string | null>(null);

  // Annual Plan Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanItem, setEditingPlanItem] = useState<AnnualPlanItemDto | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planActivityType, setPlanActivityType] = useState('');
  const [planTargetAudience, setPlanTargetAudience] = useState('');
  const [planStartDate, setPlanStartDate] = useState(getLocalDateIso());
  const [planEndDate, setPlanEndDate] = useState(getLocalDateIso());
  const [planDescription, setPlanDescription] = useState('');
  const [planCategory, setPlanCategory] = useState('Gelişimsel');
  const [planError, setPlanError] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Annual Plan Item Detail / View Modal
  const [selectedPlanItemForDetail, setSelectedPlanItemForDetail] = useState<AnnualPlanItemDto | null>(null);

  // Load Agenda Items
  const loadAgenda = useCallback(async () => {
    if (window.api && window.api.agenda) {
      try {
        const items = await window.api.agenda.list();
        setAgendaList(items || []);
      } catch (err) {
        console.error('Failed to load agenda items:', err);
      }
    }
  }, []);

  // Load Annual Plan Items
  const loadAnnualPlan = useCallback(async () => {
    if (window.api && window.api.annualPlans) {
      try {
        const plan = await window.api.annualPlans.get(status?.activeSchoolYearId || 'default-year');
        setAnnualPlan(plan);
      } catch (err) {
        console.error('Failed to load annual plan:', err);
      }
    }
  }, [status]);

  useEffect(() => {
    loadAgenda();
    loadAnnualPlan();
  }, [loadAgenda, loadAnnualPlan]);

  // Month navigation
  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const todayIso = getLocalDateIso();

  // Generate 7-column calendar matrix
  const calendarMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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
  }, [currentDate]);

  // Agenda Action Handlers
  const handleOpenNewAgenda = (defaultDate?: string) => {
    setEditingAgendaItem(null);
    setAgendaTitle('');
    setAgendaDate(defaultDate || todayIso);
    setAgendaTime('10:00');
    setAgendaNotes('');
    setAgendaCompleted(false);
    setAgendaError(null);
    setIsAgendaModalOpen(true);
  };

  const handleOpenEditAgenda = (item: AgendaItemDto) => {
    setEditingAgendaItem(item);
    setAgendaTitle(item.title);
    setAgendaDate(item.agendaDate);
    setAgendaTime(item.startTime || '10:00');
    setAgendaNotes(item.notes || '');
    setAgendaCompleted(item.completed);
    setAgendaError(null);
    setIsAgendaModalOpen(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitle.trim()) {
      setAgendaError('Ajanda başlığı boş bırakılamaz.');
      return;
    }

    setIsSavingAgenda(true);
    setAgendaError(null);

    try {
      if (window.api && window.api.agenda) {
        if (editingAgendaItem) {
          await window.api.agenda.update(editingAgendaItem.id, {
            title: agendaTitle.trim(),
            agendaDate,
            startTime: agendaTime,
            notes: agendaNotes.trim() || undefined,
            completed: agendaCompleted
          });
        } else {
          await window.api.agenda.create({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            title: agendaTitle.trim(),
            agendaDate,
            startTime: agendaTime,
            notes: agendaNotes.trim() || undefined
          });
        }
        await loadAgenda();
        setIsAgendaModalOpen(false);
      }
    } catch (err: any) {
      setAgendaError(err.message || 'Ajanda kaydedilirken hata oluştu');
    } finally {
      setIsSavingAgenda(false);
    }
  };

  const handleToggleAgendaComplete = async (item: AgendaItemDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (window.api && window.api.agenda) {
        await window.api.agenda.toggleComplete(item.id, !item.completed);
        await loadAgenda();
      }
    } catch (err) {
      console.error('Failed to toggle agenda complete:', err);
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!window.confirm('Bu ajanda kaydını silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api && window.api.agenda) {
        await window.api.agenda.delete(id);
        await loadAgenda();
        setIsAgendaModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete agenda item:', err);
    }
  };

  // Annual Plan Action Handlers
  const handleOpenNewPlan = (defaultDate?: string) => {
    setEditingPlanItem(null);
    setPlanTitle('');
    setPlanActivityType('Seminer');
    setPlanTargetAudience('');
    setPlanStartDate(defaultDate || todayIso);
    setPlanEndDate(defaultDate || todayIso);
    setPlanDescription('');
    setPlanCategory('Gelişimsel');
    setPlanError(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (item: AnnualPlanItemDto) => {
    setEditingPlanItem(item);
    setPlanTitle(item.title);
    setPlanActivityType(item.activityType || 'Seminer');
    setPlanTargetAudience(item.targetAudience || '');
    setPlanStartDate(item.startDate || item.plannedDate);
    setPlanEndDate(item.endDate || item.startDate || item.plannedDate);
    setPlanDescription(item.description || '');
    setPlanCategory(item.category || 'Gelişimsel');
    setPlanError(null);
    setSelectedPlanItemForDetail(null);
    setIsPlanModalOpen(true);
  };

  const handleSavePlanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) {
      setPlanError('Faaliyet / Kazanım Adı boş bırakılamaz.');
      return;
    }

    // Validation (Req 7): Bitiş tarihi başlangıç tarihinden önce olamaz
    if (planEndDate < planStartDate) {
      setPlanError('Bitiş tarihi başlangıç tarihinden önce olamaz. Lütfen geçerli bir tarih aralığı seçiniz.');
      return;
    }

    setIsSavingPlan(true);
    setPlanError(null);

    try {
      if (window.api && window.api.annualPlans) {
        if (editingPlanItem) {
          await window.api.annualPlans.updateItem(editingPlanItem.id, {
            title: planTitle.trim(),
            activityType: planActivityType.trim() || undefined,
            targetAudience: planTargetAudience.trim() || undefined,
            startDate: planStartDate,
            endDate: planEndDate,
            plannedDate: planStartDate,
            description: planDescription.trim() || undefined,
            category: planCategory
          });
        } else {
          await window.api.annualPlans.addItem({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            title: planTitle.trim(),
            activityType: planActivityType.trim() || undefined,
            targetAudience: planTargetAudience.trim() || undefined,
            startDate: planStartDate,
            endDate: planEndDate,
            plannedDate: planStartDate,
            description: planDescription.trim() || undefined,
            category: planCategory
          });
        }
        await loadAnnualPlan();
        setIsPlanModalOpen(false);
      }
    } catch (err: any) {
      setPlanError(err.message || 'Yıllık plan kaydedilirken hata oluştu');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlanItem = async (id: string) => {
    if (!window.confirm('Bu yıllık plan faaliyetini silmek istediğinize emin misiniz?')) return;
    try {
      if (window.api && window.api.annualPlans) {
        await window.api.annualPlans.deleteItem(id);
        await loadAnnualPlan();
        setSelectedPlanItemForDetail(null);
        setIsPlanModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to delete annual plan item:', err);
    }
  };

  // Helper to match annual plan items for a specific date in date range
  const getPlanItemsForDate = (dateIso: string): AnnualPlanItemDto[] => {
    if (!annualPlan?.items) return [];
    return annualPlan.items.filter(item => {
      const start = item.startDate || item.plannedDate;
      const end = item.endDate || start;
      return dateIso >= start && dateIso <= end;
    });
  };

  const planItemsList = annualPlan?.items || [];

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* 1. Main Navigation: Two Distinct Sub-Tabs (Req 2) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('agenda')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'agenda'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Ajanda Takvimi</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-mono">
              {agendaList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('annual_plan')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'annual_plan'
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Yıllık Plan Takvimi</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-mono">
              {planItemsList.length}
            </span>
          </button>
        </div>

        {/* Action Button for Active Tab */}
        <div>
          {activeSubTab === 'agenda' ? (
            <button
              onClick={() => handleOpenNewAgenda()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajanda Ekle</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenNewPlan()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yıllık Plan Faaliyeti Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Control Bar (Month Navigation & View Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            {activeSubTab === 'agenda' ? (
              <>
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>Ajanda & Toplantılar</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Yıllık Rehberlik Planı Faaliyetleri</span>
              </>
            )}
          </h2>
        </div>

        {/* Month Navigation & View Toggle */}
        <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR BODY */}
      {viewMode === 'month' ? (
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

              // If Tab is 'agenda', filter agenda items for this day
              const dayAgendaItems = agendaList.filter(a => a.agendaDate === item.dateIso);

              // If Tab is 'annual_plan', filter annual plan items matching date range
              const dayPlanItems = getPlanItemsForDate(item.dateIso);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (activeSubTab === 'agenda') {
                      setSelectedDayForAgenda(item.dateIso);
                    }
                  }}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    activeSubTab === 'agenda' ? 'cursor-pointer' : ''
                  } ${
                    item.isCurrentMonth ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/40 text-slate-300'
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

                    {/* Quick Count Badge */}
                    {activeSubTab === 'agenda' && dayAgendaItems.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-100">
                        {dayAgendaItems.length}
                      </span>
                    )}
                    {activeSubTab === 'annual_plan' && dayPlanItems.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-100">
                        {dayPlanItems.length}
                      </span>
                    )}
                  </div>

                  {/* Cell Items */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {/* A. AJANDA ITEMS (Req 3.1 & 3.2) */}
                    {activeSubTab === 'agenda' && (
                      <>
                        {dayAgendaItems.slice(0, 3).map(ag => (
                          <div
                            key={ag.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAgenda(ag);
                            }}
                            className={`px-1.5 py-1 rounded-lg border text-[11px] font-semibold truncate transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              ag.completed
                                ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                : 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-100'
                            }`}
                            title={`${ag.title} (${ag.startTime || '10:00'})`}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleAgendaComplete(ag, e)}
                              className="shrink-0 text-slate-500 hover:text-blue-600 focus:outline-none cursor-pointer"
                            >
                              {ag.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </button>
                            <span className="truncate">{ag.title}</span>
                          </div>
                        ))}
                        {dayAgendaItems.length > 3 && (
                          <div className="text-[9px] text-blue-600 font-bold pl-1">
                            +{dayAgendaItems.length - 3} daha...
                          </div>
                        )}
                      </>
                    )}

                    {/* B. YILLIK PLAN ITEMS (Req 5, 6, 7, 8) */}
                    {activeSubTab === 'annual_plan' && (
                      <>
                        {dayPlanItems.slice(0, 2).map(planItem => (
                          <div
                            key={planItem.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlanItemForDetail(planItem);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold truncate hover:bg-emerald-100 cursor-pointer shadow-xs"
                            title={`${planItem.title}\nTür: ${planItem.activityType || 'Seminer'}\nHedef: ${planItem.targetAudience || '—'}`}
                          >
                            <div className="truncate">{planItem.title}</div>
                            {planItem.activityType && (
                              <div className="text-[9px] text-emerald-700 font-normal truncate">
                                [{planItem.activityType}]
                              </div>
                            )}
                          </div>
                        ))}
                        {dayPlanItems.length > 2 && (
                          <div className="text-[9px] text-emerald-600 font-bold pl-1">
                            +{dayPlanItems.length - 2} faaliyet...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 4. LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center justify-between">
            <span>
              {capitalizedMonthName} {activeSubTab === 'agenda' ? 'Ajanda Kayıtları' : 'Yıllık Plan Faaliyetleri'}
            </span>
          </div>

          {activeSubTab === 'agenda' ? (
            <table className="pdr-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">DURUM</th>
                  <th className="w-28">TARİH</th>
                  <th className="w-20">SAAT</th>
                  <th>AJANDA KONUSU / BAŞLIK</th>
                  <th>NOTLAR</th>
                  <th className="w-20 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {agendaList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs italic">
                      Kayıtlı ajanda notu bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  agendaList.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-center">
                        <button
                          onClick={() => handleToggleAgendaComplete(ag)}
                          className="cursor-pointer focus:outline-none"
                        >
                          {ag.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="font-mono text-xs text-slate-700 font-semibold">
                        {formatIsoToTr(ag.agendaDate)}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{ag.startTime || '—'}</td>
                      <td className={`font-semibold text-xs ${ag.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {ag.title}
                      </td>
                      <td className="text-slate-500 text-xs truncate max-w-xs">{ag.notes || '—'}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditAgenda(ag)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgenda(ag.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="pdr-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">SIRA</th>
                  <th className="w-44">TARİH ARALIĞI</th>
                  <th className="w-32">FAALİYET TÜRÜ</th>
                  <th className="w-32">HEDEF KİTLE</th>
                  <th>FAALİYET / KAZANIM ADI</th>
                  <th className="w-20 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {planItemsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs italic">
                      Kayıtlı yıllık plan faaliyeti bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  planItemsList.map((plan, idx) => {
                    const startStr = formatIsoToTr(plan.startDate || plan.plannedDate);
                    const endStr = formatIsoToTr(plan.endDate || plan.startDate || plan.plannedDate);
                    return (
                      <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                        <td className="font-mono text-xs text-slate-700 font-semibold">
                          {startStr} — {endStr}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            {plan.activityType || 'Seminer'}
                          </span>
                        </td>
                        <td className="text-slate-600 text-xs font-medium">{plan.targetAudience || '—'}</td>
                        <td className="font-bold text-slate-800 text-xs">{plan.title}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditPlan(plan)}
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlanItem(plan.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Day Detail Popup for Agenda (Req 3.2) */}
      {selectedDayForAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {formatIsoToTr(selectedDayForAgenda)} — Ajanda & Görevler
                  </h3>
                  <p className="text-[11px] text-slate-400">Günün planlanan tüm toplantı ve notları</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDayForAgenda(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of day's items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {agendaList.filter(a => a.agendaDate === selectedDayForAgenda).length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  Bu tarihte henüz ajanda kaydı bulunmuyor.
                </div>
              ) : (
                agendaList
                  .filter(a => a.agendaDate === selectedDayForAgenda)
                  .map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        item.completed ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                      }`}
                    >
                      <div 
                        onClick={() => handleToggleAgendaComplete(item)}
                        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                      >
                        <button type="button" className="cursor-pointer focus:outline-none">
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div>
                          <div className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.title}
                          </div>
                          {item.startTime && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Saat: {item.startTime}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedDayForAgenda(null);
                            handleOpenEditAgenda(item);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const day = selectedDayForAgenda;
                  setSelectedDayForAgenda(null);
                  handleOpenNewAgenda(day);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Bu Güne Ajanda Ekle</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDayForAgenda(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ajanda Ekle / Düzenle Modal (Req 3.2) */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">
                {editingAgendaItem ? 'Ajanda Kaydını Düzenle' : 'Yeni Ajanda Notu / Toplantı Ekle'}
              </h3>
              <button 
                onClick={() => setIsAgendaModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} className="space-y-3 text-xs">
              {agendaError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {agendaError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ajanda Konusu / Başlık *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: BEP Geliştirme Birimi Toplantısı"
                  value={agendaTitle}
                  onChange={(e) => setAgendaTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={agendaDate}
                    onChange={(e) => setAgendaDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saat</label>
                  <input
                    type="time"
                    value={agendaTime}
                    onChange={(e) => setAgendaTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  placeholder="İlgili detaylar veya toplantı gündemi..."
                  value={agendaNotes}
                  onChange={(e) => setAgendaNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Toggle Checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agendaCompleted}
                  onChange={(e) => setAgendaCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-bold text-slate-700 text-xs">Bu ajanda görevi tamamlandı</span>
              </label>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingAgendaItem ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteAgenda(editingAgendaItem.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Sil
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAgendaModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAgenda}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isSavingAgenda ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Yıllık Plan Faaliyeti Ekle / Düzenle Modal (Req 6, 7, 8) */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">
                {editingPlanItem ? 'Yıllık Plan Faaliyetini Düzenle' : 'Yıllık Plan Faaliyeti Ekle'}
              </h3>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlanItem} className="space-y-3.5 text-xs">
              {planError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{planError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faaliyet / Kazanım Adı *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Örn: Sınav Kaygısı ve Baş Etme Yolları Semineri"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Free-text Faaliyet Türü (Req 6) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faaliyet Türü</label>
                  <input
                    type="text"
                    placeholder="Örn: Seminer, Konferans, Atölye, Grup çalışması..."
                    value={planActivityType}
                    onChange={(e) => setPlanActivityType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hedef Kitle / Sınıf</label>
                  <input
                    type="text"
                    placeholder="Örn: 12. Sınıflar, Veliler..."
                    value={planTargetAudience}
                    onChange={(e) => setPlanTargetAudience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Date Range: Başlangıç Tarihi & Bitiş Tarihi (Req 7) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={planStartDate}
                    onChange={(e) => {
                      setPlanStartDate(e.target.value);
                      if (planEndDate < e.target.value) {
                        setPlanEndDate(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    min={planStartDate}
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Hedef ve Yöntemler</label>
                <textarea
                  rows={2}
                  placeholder="Faaliyetin içeriği, materyaller, uygulanacak teknikler..."
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingPlanItem ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePlanItem(editingPlanItem.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Sil
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPlan}
                    className="px-5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isSavingPlan ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Yıllık Plan Faaliyet Detay Görüntüleme Modalı (Req 8) */}
      {selectedPlanItemForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Yıllık Plan Faaliyet Detayı
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedPlanItemForDetail.activityType || 'Seminer'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlanItemForDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Faaliyet / Kazanım Adı
                </div>
                <div className="font-extrabold text-slate-800 text-sm">
                  {selectedPlanItemForDetail.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Tarih Aralığı
                  </div>
                  <div className="font-mono text-slate-700 font-semibold">
                    {formatIsoToTr(selectedPlanItemForDetail.startDate || selectedPlanItemForDetail.plannedDate)} — {formatIsoToTr(selectedPlanItemForDetail.endDate || selectedPlanItemForDetail.startDate || selectedPlanItemForDetail.plannedDate)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Hedef Kitle / Sınıf
                  </div>
                  <div className="font-bold text-slate-800">
                    {selectedPlanItemForDetail.targetAudience || 'Genel'}
                  </div>
                </div>
              </div>

              {selectedPlanItemForDetail.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Açıklama / Detaylar
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedPlanItemForDetail.description}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeletePlanItem(selectedPlanItemForDetail.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Sil
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditPlan(selectedPlanItemForDetail)}
                  className="px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlanItemForDetail(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
