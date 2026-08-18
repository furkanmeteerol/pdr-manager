import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { StudyPlanTemplateDto, PreparedStudyPlanDto, StudentDto } from '@shared/ipc-types';
import { RichTextDayEditor } from './components/RichTextDayEditor';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Layers,
  User,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  X,
  Printer
} from 'lucide-react';

export const StudyProgramsView: React.FC = () => {
  const { students } = useAppStore();
  const [activeTab, setActiveTab] = useState<'prepared' | 'create' | 'templates'>('prepared');

  const [preparedPlans, setPreparedPlans] = useState<PreparedStudyPlanDto[]>([]);
  const [templates, setTemplates] = useState<StudyPlanTemplateDto[]>([]);

  // Search in Prepared Plans
  const [planSearchInput, setPlanSearchInput] = useState('');

  // Plan Create State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDto | null>(null);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [planTemplateName, setPlanTemplateName] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  // 7 Days Weekly Schedule State for Plan Creation
  const [planSchedule, setPlanSchedule] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  });

  // Template Create State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateFeatures, setNewTemplateFeatures] = useState('');
  const [newTemplateSchedule, setNewTemplateSchedule] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  });

  // Modal / Detail States
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<PreparedStudyPlanDto | null>(null);
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);
  const [deleteConfirmTemplateId, setDeleteConfirmTemplateId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Load plans & templates from DB
  const loadData = async () => {
    if (window.api && window.api.studyPrograms) {
      try {
        const [plansList, templatesList] = await Promise.all([
          window.api.studyPrograms.listPlans(),
          window.api.studyPrograms.listTemplates()
        ]);
        setPreparedPlans(plansList);
        setTemplates(templatesList);
      } catch (err) {
        console.error('Failed to load study programs data:', err);
      }
    }
  };

  useEffect(() => {
    loadData();
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('pdr:data-refreshed', handleGlobalRefresh);
    return () => window.removeEventListener('pdr:data-refreshed', handleGlobalRefresh);
  }, []);

  // Filter students for Student Search in "Plan Oluştur"
  const matchedStudents = useMemo(() => {
    if (!studentSearchInput.trim()) return [];
    const term = studentSearchInput.toLowerCase();
    return students
      .filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
          s.studentNumber.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [students, studentSearchInput]);

  // Filter Prepared Plans by student number or student name (Case-insensitive)
  const filteredPreparedPlans = useMemo(() => {
    let list = [...preparedPlans];
    if (planSearchInput.trim()) {
      const term = planSearchInput.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.studentName.toLowerCase().includes(term) ||
          p.studentNumber.toLowerCase().includes(term) ||
          p.templateNameSnapshot.toLowerCase().includes(term) ||
          p.className.toLowerCase().includes(term)
      );
    }
    // Sorted newest first by createdAt DESC
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [preparedPlans, planSearchInput]);

  // Handle Template Selection in "Plan Oluştur"
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setPlanTemplateName(tpl.name || tpl.title || '');
      setPlanFeatures(tpl.features || '');
      // Deep copy 7 days content so template remains strictly isolated!
      setPlanSchedule({
        monday: tpl.monday || '',
        tuesday: tpl.tuesday || '',
        wednesday: tpl.wednesday || '',
        thursday: tpl.thursday || '',
        friday: tpl.friday || '',
        saturday: tpl.saturday || '',
        sunday: tpl.sunday || ''
      });
    } else {
      setPlanTemplateName('');
      setPlanFeatures('');
      setPlanSchedule({
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      });
    }
  };

  // Save New Immutable Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      setNotification({ type: 'error', message: 'Lütfen bir taslak plan adı girin.' });
      return;
    }

    try {
      if (window.api && window.api.studyPrograms) {
        await window.api.studyPrograms.saveTemplate({
          name: newTemplateName.trim(),
          features: newTemplateFeatures.trim(),
          monday: newTemplateSchedule.monday,
          tuesday: newTemplateSchedule.tuesday,
          wednesday: newTemplateSchedule.wednesday,
          thursday: newTemplateSchedule.thursday,
          friday: newTemplateSchedule.friday,
          saturday: newTemplateSchedule.saturday,
          sunday: newTemplateSchedule.sunday
        });

        // Reset form
        setNewTemplateName('');
        setNewTemplateFeatures('');
        setNewTemplateSchedule({
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: ''
        });

        await loadData();
        setNotification({
          type: 'success',
          message: 'Taslak plan başarıyla kaydedildi. Standart şablon olarak saklanmaktadır.'
        });
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setNotification({ type: 'error', message: 'Taslak kaydedilirken bir hata oluştu.' });
    }
  };

  // Delete Template (Does NOT affect previously created student plans!)
  const handleDeleteTemplate = async (id: string) => {
    try {
      if (window.api && window.api.studyPrograms) {
        await window.api.studyPrograms.deleteTemplate(id);
        await loadData();
        setDeleteConfirmTemplateId(null);
        setNotification({
          type: 'success',
          message: 'Taslak silindi. Daha önce oluşturulan öğrenci planları korunmaktadır.'
        });
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setNotification({ type: 'error', message: 'Taslak silinirken bir hata oluştu.' });
    }
  };

  // Create Student Study Plan (Deep copy snapshot)
  const handleCreateStudentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setNotification({ type: 'error', message: 'Lütfen bir öğrenci seçin.' });
      return;
    }
    if (!planTemplateName.trim()) {
      setNotification({ type: 'error', message: 'Lütfen bir taslak seçin veya plan adı belirtin.' });
      return;
    }

    try {
      if (window.api && window.api.studyPrograms) {
        await window.api.studyPrograms.createPlan({
          studentId: selectedStudent.id,
          templateId: selectedTemplateId || null,
          templateNameSnapshot: planTemplateName.trim(),
          featuresSnapshot: planFeatures.trim(),
          monday: planSchedule.monday,
          tuesday: planSchedule.tuesday,
          wednesday: planSchedule.wednesday,
          thursday: planSchedule.thursday,
          friday: planSchedule.friday,
          saturday: planSchedule.saturday,
          sunday: planSchedule.sunday
        });

        // Reset creation state
        setSelectedStudent(null);
        setStudentSearchInput('');
        setSelectedTemplateId('');
        setPlanTemplateName('');
        setPlanFeatures('');
        setPlanSchedule({
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: ''
        });

        await loadData();
        setActiveTab('prepared');
        setNotification({
          type: 'success',
          message: `${selectedStudent.firstName} ${selectedStudent.lastName} için ders çalışma planı başarıyla oluşturuldu.`
        });
      }
    } catch (err) {
      console.error('Error creating study plan:', err);
      setNotification({ type: 'error', message: 'Öğrenci planı oluşturulurken hata meydana geldi.' });
    }
  };

  // Delete Student Study Plan
  const handleDeletePlan = async (id: string) => {
    try {
      if (window.api && window.api.studyPrograms) {
        await window.api.studyPrograms.deletePlan(id);
        await loadData();
        setDeleteConfirmPlanId(null);
        setNotification({ type: 'success', message: 'Öğrenci ders çalışma planı silindi.' });
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setNotification({ type: 'error', message: 'Plan silinirken bir hata oluştu.' });
    }
  };

  const DAYS_LIST: Array<{ key: keyof typeof planSchedule; label: string; color: string }> = [
    { key: 'monday', label: 'PAZARTESİ', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { key: 'tuesday', label: 'SALI', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { key: 'wednesday', label: 'ÇARŞAMBA', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    { key: 'thursday', label: 'PERŞEMBE', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { key: 'friday', label: 'CUMA', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { key: 'saturday', label: 'CUMARTESİ', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { key: 'sunday', label: 'PAZAR', color: 'bg-rose-50 text-rose-800 border-rose-200' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="text-xs font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Ders Çalışma Programı</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200">
                Haftalık Planlayıcı
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Şablon taslaklardan öğrenciye özel bağımsız kopyalarla haftalık zengin metin ders programı oluşturun
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('prepared')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prepared'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Hazırlanan Planlar ({preparedPlans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan Oluştur</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Taslak Planlar ({templates.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HAZIRLANAN PLANLAR                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'prepared' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={planSearchInput}
                onChange={(e) => setPlanSearchInput(e.target.value)}
                placeholder="Öğrenci no veya öğrenci adı ara..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
              {planSearchInput && (
                <button
                  type="button"
                  onClick={() => setPlanSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{filteredPreparedPlans.length}</span> plan listeleniyor
              <span className="text-slate-300">•</span>
              <span>En yeni en üstte</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredPreparedPlans.length === 0 ? (
              <div className="text-center py-16 px-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Kayıtlı Plan Bulunamadı</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {planSearchInput
                    ? 'Arama kriterlerinize uygun öğrenci planı bulunamadı.'
                    : 'Henüz öğrenciye özel bir ders çalışma planı oluşturulmamış. "Plan Oluştur" sekmesinden yeni plan ekleyebilirsiniz.'}
                </p>
                {!planSearchInput && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hemen Plan Oluştur</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="pdr-table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">SIRA</th>
                      <th className="w-24">ÖĞRENCİ NO</th>
                      <th>ADI SOYADI</th>
                      <th className="w-24">SINIF</th>
                      <th>PLAN ADI</th>
                      <th className="w-28">TARİH</th>
                      <th>ÖZELLİKLER</th>
                      <th className="w-28 text-right">İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreparedPlans.map((plan, idx) => (
                      <tr key={plan.id}>
                        <td className="text-center font-semibold text-slate-400 text-xs">{idx + 1}</td>
                        <td className="font-mono font-bold text-slate-700 text-xs">
                          {plan.studentNumber || '—'}
                        </td>
                        <td className="font-bold text-slate-800 text-xs">
                          {plan.studentName}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                            {plan.className}
                          </span>
                        </td>
                        <td className="text-slate-800 font-medium text-xs truncate max-w-[180px]">
                          {plan.templateNameSnapshot || plan.title}
                        </td>
                        <td className="text-slate-500 text-xs whitespace-nowrap">
                          {new Date(plan.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="max-w-[220px]">
                          {plan.featuresSnapshot ? (
                            <span
                              className="text-xs text-slate-600 truncate block bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                              title={plan.featuresSnapshot}
                            >
                              {plan.featuresSnapshot}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs italic">—</span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPlanDetail(plan)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Plan Detayı"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Detay</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmPlanId(plan.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Planı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLAN OLUŞTUR                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateStudentPlan} className="space-y-6">
          {/* Top Bar: Template Selector & Student Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Template Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Taslak Plan Seçimi</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Şablon içerik aktarılır</span>
              </div>

              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
              >
                <option value="">-- Taslak Seçin (veya sıfırdan oluşturun) --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name || tpl.title} {tpl.features ? `(${tpl.features})` : ''}
                  </option>
                ))}
              </select>

              {/* Template Name & Features Preview / Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Plan Adı</label>
                  <input
                    type="text"
                    value={planTemplateName}
                    onChange={(e) => setPlanTemplateName(e.target.value)}
                    placeholder="Örn: TYT Yoğun Kamp"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Özellikler</label>
                  <input
                    type="text"
                    value={planFeatures}
                    onChange={(e) => setPlanFeatures(e.target.value)}
                    placeholder="Örn: Pomodoro · Tekrar · Kitap"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Student Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Öğrenci Seçimi</span>
                </label>
                {selectedStudent && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Öğrenci Seçildi
                  </span>
                )}
              </div>

              {selectedStudent ? (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedStudent.firstName[0]}
                      {selectedStudent.lastName[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </div>
                      <div className="text-[11px] text-blue-700">
                        No: {selectedStudent.studentNumber} • Sınıf: {selectedStudent.className || '—'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearchInput('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 bg-white rounded-lg border border-blue-200"
                  >
                    Değiştir
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchInput}
                    onChange={(e) => setStudentSearchInput(e.target.value)}
                    placeholder="Öğrenci adı, soyadı veya numarası yazın..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />

                  {matchedStudents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                      {matchedStudents.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(st);
                            setStudentSearchInput('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between text-xs border-b border-slate-100 last:border-0"
                        >
                          <span className="font-semibold text-slate-800">
                            {st.firstName} {st.lastName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            No: {st.studentNumber} | {st.className || '—'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 7 Days Weekly Rich Text Editors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Öğrenciye Özel 7 Günlük Haftalık Program</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Burada yapılan değişiklikler sadece bu öğrencinin bağımsız kopyasına kaydedilir. Orijinal taslak asla değişmez.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DAYS_LIST.map((day) => (
                <div key={day.key} className={day.key === 'sunday' ? 'md:col-span-2 lg:col-span-1' : ''}>
                  <RichTextDayEditor
                    dayLabel={day.label}
                    dayBadgeColor={day.color}
                    value={planSchedule[day.key]}
                    onChange={(val) => setPlanSchedule((prev) => ({ ...prev, [day.key]: val }))}
                    placeholder={`${day.label} planı girin...`}
                    minHeight="140px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('prepared')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!selectedStudent || !planTemplateName.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Planı Oluştur ve Kaydet</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TASLAK PLANLAR                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          {/* New Template Form */}
          <form onSubmit={handleSaveTemplate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Yeni Taslak Ekle
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Standart bir ders çalışma şablonu oluşturun. Taslaklar kaydedildikten sonra değiştirilemez, sabit kalır.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Taslak Kaydet</span>
              </button>
            </div>

            {/* Inputs: Title & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Taslak Plan Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Örn: TYT Genel Tekrar Programı"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  2. Taslak Plan Özellikleri (Serbest Metin)
                </label>
                <input
                  type="text"
                  value={newTemplateFeatures}
                  onChange={(e) => setNewTemplateFeatures(e.target.value)}
                  placeholder="Örn: Pomodoro · Tekrar · Kitap Okuma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* 7 Days Rich Text Area */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                3. Haftalık Program (7 Gün)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {DAYS_LIST.map((day) => (
                  <div key={day.key} className={day.key === 'sunday' ? 'md:col-span-2 lg:col-span-1' : ''}>
                    <RichTextDayEditor
                      dayLabel={day.label}
                      dayBadgeColor={day.color}
                      value={newTemplateSchedule[day.key]}
                      onChange={(val) => setNewTemplateSchedule((prev) => ({ ...prev, [day.key]: val }))}
                      placeholder={`${day.label} için standart ders/konu girin...`}
                      minHeight="140px"
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* List of Saved Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Kayıtlı Taslaklar ({templates.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Taslaklar değiştirilemez, standart şablondur</span>
            </div>

            {templates.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">Henüz kayıtlı taslak bulunmuyor.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Yukarıdaki formdan ilk taslağınızı ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {tpl.name || tpl.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                          7 Gün
                        </span>
                      </div>

                      {tpl.features ? (
                        <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {tpl.features}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Özellik belirtilmemiş</p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(tpl.createdAt).toLocaleDateString('tr-TR')}</span>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTemplateId(tpl.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                        title="Taslağı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PLAN DETAY MODALI                                                */}
      {/* ========================================================================= */}
      {selectedPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {selectedPlanDetail.templateNameSnapshot || selectedPlanDetail.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{selectedPlanDetail.studentName}</span>
                    <span>•</span>
                    <span>No: {selectedPlanDetail.studentNumber || '—'}</span>
                    <span>•</span>
                    <span>Sınıf: {selectedPlanDetail.className}</span>
                    <span>•</span>
                    <span>{new Date(selectedPlanDetail.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Yazdır"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Features Summary */}
              {selectedPlanDetail.featuresSnapshot && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-bold">Plan Özellikleri:</span>
                  <span>{selectedPlanDetail.featuresSnapshot}</span>
                </div>
              )}

              {/* 7 Days Read-Only Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {DAYS_LIST.map((day) => (
                  <div key={day.key} className={day.key === 'sunday' ? 'md:col-span-2 lg:col-span-1' : ''}>
                    <RichTextDayEditor
                      dayLabel={day.label}
                      dayBadgeColor={day.color}
                      value={selectedPlanDetail[day.key] || ''}
                      readOnly={true}
                      minHeight="120px"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedPlanDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PLAN SİLME ONAY MODALI                                           */}
      {/* ========================================================================= */}
      {deleteConfirmPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Planı Silmek İstiyor Musunuz?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bu öğrenciye ait ders çalışma planı kalıcı olarak silinecektir.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmPlanId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleDeletePlan(deleteConfirmPlanId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TASLAK SİLME ONAY MODALI                                         */}
      {/* ========================================================================= */}
      {deleteConfirmTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Taslağı Silmek İstiyor Musunuz?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bu taslak silinecektir. Daha önce bu taslaktan oluşturulmuş öğrenci planları kesinlikle etkilenmeyecek ve korunacaktır.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmTemplateId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(deleteConfirmTemplateId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyProgramsView;
