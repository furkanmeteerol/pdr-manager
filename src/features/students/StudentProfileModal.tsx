import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  X, 
  User, 
  Users, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  XCircle, 
  MessagesSquare, 
  CalendarCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  Printer,
  ClipboardList
} from 'lucide-react';
import { 
  StudentDto, 
  MeetingDto, 
  AppointmentDto, 
  PreparedStudyPlanDto,
  SurveyApplicationDto 
} from '@shared/ipc-types';
import { MeetingDetailModal } from '../meetings/MeetingDetailModal';
import { RichTextDayEditor } from '../study_programs/components/RichTextDayEditor';
import { SurveyResultDetailModal } from '../surveys/components/SurveyResultDetailModal';
import { formatIsoToTr } from '../../utils/dateUtils';
import { ModalPortal } from '../../components/ModalPortal';

export const StudentProfileModal: React.FC = () => {
  const { 
    selectedStudentId, 
    setSelectedStudentId 
  } = useAppStore();

  const [student, setStudent] = useState<StudentDto | null>(null);
  const [meetings, setMeetings] = useState<MeetingDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [studyPlans, setStudyPlans] = useState<PreparedStudyPlanDto[]>([]);
  const [surveyApplications, setSurveyApplications] = useState<SurveyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'meetings' | 'appointments' | 'study_plans' | 'surveys'>('all');
  
  // Sub-Modals
  const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<MeetingDto | null>(null);
  const [selectedStudyPlanDetail, setSelectedStudyPlanDetail] = useState<PreparedStudyPlanDto | null>(null);
  const [selectedSurveyAppForDetail, setSelectedSurveyAppForDetail] = useState<SurveyApplicationDto | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedStudentId) return;
      setIsLoading(true);
      try {
        if (window.api) {
          const [st, meets, apps, plans, srvApps] = await Promise.all([
            window.api.students.getById(selectedStudentId),
            window.api.meetings.list({ studentId: selectedStudentId }),
            window.api.appointments.list({ studentId: selectedStudentId }),
            window.api.studyPrograms ? window.api.studyPrograms.listPlans() : Promise.resolve([]),
            window.api.surveys?.listApplications ? window.api.surveys.listApplications({ studentId: selectedStudentId }) : Promise.resolve([])
          ]);
          setStudent(st);
          setMeetings(meets || []);
          setAppointments(apps || []);
          
          // Filter study plans for this student and sort newest first (createdAt DESC)
          const studentPlans = (plans || []).filter((p: PreparedStudyPlanDto) => p.studentId === selectedStudentId);
          studentPlans.sort((a: PreparedStudyPlanDto, b: PreparedStudyPlanDto) => b.createdAt - a.createdAt);
          setStudyPlans(studentPlans);

          setSurveyApplications(srvApps || []);
        }
      } catch (err) {
        console.error('Failed to load student profile details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [selectedStudentId]);

  if (!selectedStudentId) return null;

  const handleOpenSurveyDetail = async (app: SurveyApplicationDto) => {
    try {
      if (window.api && window.api.surveys) {
        const fullDetail = await window.api.surveys.getApplicationDetail(app.id);
        setSelectedSurveyAppForDetail(fullDetail || app);
      } else {
        setSelectedSurveyAppForDetail(app);
      }
    } catch (err) {
      console.error('Failed to load survey application detail:', err);
      setSelectedSurveyAppForDetail(app);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Tamamlandı</span>
          </span>
        );
      case 'student_absent':
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Öğrenci Gelmedi</span>
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3 h-3 text-purple-600" />
            <span>Diğer</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>İptal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Bekliyor</span>
          </span>
        );
    }
  };

  const DAYS_LIST: Array<{ key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'; label: string; color: string }> = [
    { key: 'monday', label: 'PAZARTESİ', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { key: 'tuesday', label: 'SALI', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    { key: 'wednesday', label: 'ÇARŞAMBA', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    { key: 'thursday', label: 'PERŞEMBE', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { key: 'friday', label: 'CUMA', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { key: 'saturday', label: 'CUMARTESİ', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { key: 'sunday', label: 'PAZAR', color: 'bg-rose-50 text-rose-800 border-rose-200' }
  ];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Profile Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl font-extrabold shadow-xs">
              {student ? `${student.firstName[0]}${student.lastName[0]}` : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  {student ? `${student.firstName} ${student.lastName}` : 'Yükleniyor...'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-xs">
                  {student?.className || 'Sınıf Belirtilmemiş'}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                  student?.gender === 'female' 
                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {student?.gender === 'female' ? 'Kız' : 'Erkek'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Okul No: <strong className="font-mono text-slate-800">{student?.studentNumber || '—'}</strong>
                {student?.phone && (
                  <span className="ml-3">
                    Telefon: <strong className="text-slate-700">{student.phone}</strong>
                  </span>
                )}
                {student?.email && (
                  <span className="ml-3">
                    E-posta: <strong className="text-slate-700">{student.email}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedStudentId(null)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tüm Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'meetings' 
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            <span>Geçmiş Görüşmeler ({meetings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appointments' 
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Randevular ({appointments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('study_plans')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'study_plans' 
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Çalışma Programları ({studyPlans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'surveys' 
                ? 'bg-white text-purple-600 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Anket & Ölçekler ({surveyApplications.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Öğrenci detayları yükleniyor...</div>
          ) : (
            <>
              {/* 1. ÖĞRENCİ BİLGİLERİ (Genel Bilgiler & Veli & Not) */}
              {activeTab === 'all' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Veli Bilgileri Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Veli / Aile Bilgileri</span>
                      </div>

                      {student?.parents && student.parents.length > 0 ? (
                        <div className="space-y-2">
                          {student.parents.map((p, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-slate-800 text-xs">
                                  {p.firstName} {p.lastName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  Yakınlık: <strong>{p.relationship || 'Veli'}</strong>
                                </div>
                              </div>
                              {p.phone && (
                                <div className="font-mono text-slate-700 text-xs font-semibold">
                                  {p.phone}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic py-2">
                          Kayıtlı veli bilgisi bulunmuyor.
                        </div>
                      )}
                    </div>

                    {/* Rehberlik Notu Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>İlk Rehberlik Notu / Açıklama</span>
                      </div>

                      {student?.notes && student.notes.trim() ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                          {student.notes}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs italic py-2">
                          Öğrenciye ait özel rehberlik notu eklenmemiş.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ANKET / ENVANTER / ÖLÇEK SONUÇLARI (New Section) */}
              {(activeTab === 'all' || activeTab === 'surveys') && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <ClipboardList className="w-4 h-4 text-purple-600" />
                      <span>Anket / Envanter / Ölçek Sonuçları</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      {surveyApplications.length} Uygulama
                    </span>
                  </div>

                  <div className="p-4">
                    {surveyApplications.length === 0 ? (
                      <div className="p-5 text-center text-slate-400 text-xs italic bg-slate-50/70 rounded-xl border border-slate-100">
                        Bu öğrenciye ait doldurulmuş anket veya ölçek sonucu bulunmuyor.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {surveyApplications.map((app) => {
                          const interpLabel = app.resultSnapshot?.interpretation?.label;

                          return (
                            <div
                              key={app.id}
                              className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 hover:border-purple-300 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-xs text-slate-800 truncate">
                                    {app.surveyTitle}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                    Deneme #{app.attemptNumber}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="text-[11px] font-mono text-blue-700 font-bold">
                                    Puan: {app.totalScore !== undefined ? app.totalScore : (app.resultSnapshot?.totalScore ?? '—')}
                                  </div>
                                  {interpLabel && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {interpLabel}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{new Date(app.completedAt).toLocaleDateString('tr-TR')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSurveyDetail(app)}
                                  className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <span>Sonucu Gör</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. DERS ÇALIŞMA PROGRAMLARI */}
              {(activeTab === 'all' || activeTab === 'study_plans') && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Ders Çalışma Programları</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      {studyPlans.length} Program
                    </span>
                  </div>

                  <div className="p-4">
                    {studyPlans.length === 0 ? (
                      <div className="p-5 text-center text-slate-400 text-xs italic bg-slate-50/70 rounded-xl border border-slate-100">
                        Ders çalışma programı bulunmuyor.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {studyPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-xs text-slate-800 truncate">
                                  {plan.templateNameSnapshot || plan.title}
                                </h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  7 Gün
                                </span>
                              </div>

                              {plan.featuresSnapshot ? (
                                <p className="text-[11px] text-slate-600 line-clamp-1 bg-white px-2 py-0.5 rounded border border-slate-100">
                                  {plan.featuresSnapshot}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">Özellik belirtilmemiş</p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                              <span>{new Date(plan.createdAt).toLocaleDateString('tr-TR')}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedStudyPlanDetail(plan)}
                                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <span>Detayları Gör</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. GEÇMİŞ GÖRÜŞMELER */}
              {(activeTab === 'all' || activeTab === 'meetings') && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <MessagesSquare className="w-4 h-4 text-blue-600" />
                      <span>Geçmiş Görüşmeler</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      {meetings.length} Görüşme
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="pdr-table">
                      <thead>
                        <tr>
                          <th className="w-12 text-center">NO</th>
                          <th className="w-28">TARİH</th>
                          <th className="w-28">SAAT</th>
                          <th className="w-44">YAPILAN ÇALIŞMA</th>
                          <th>GÖRÜŞME KONUSU</th>
                          <th className="w-36">KİŞİ / YÖNLENDİRME</th>
                          <th className="w-24 text-center">İŞLEM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-6 text-slate-400 text-xs italic">
                              Bu öğrenciye ait görüşme kaydı bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          meetings.map((m, idx) => {
                            const timeStr = m.endTime ? `${m.startTime} – ${m.endTime}` : m.startTime;
                            const topicStr = m.meetingTopic === 'Diğer' && m.meetingTopicOther ? `Diğer (${m.meetingTopicOther})` : (m.meetingTopic || m.subject || '—');
                            const actStr = m.activityType === 'Diğer' && m.activityTypeOther ? `Diğer (${m.activityTypeOther})` : (m.activityType || m.meetingType || 'Bireysel Görüşme');
                            const sessionBadge = m.sessionNumber ? `#${m.sessionNumber}` : `#${meetings.length - idx}`;
                            const instStr = m.referralInstitutions && m.referralInstitutions.length > 0 ? m.referralInstitutions.join(', ') : '—';

                            return (
                              <tr 
                                key={m.id} 
                                onClick={() => setSelectedMeetingForDetail(m)}
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <td className="text-center font-mono font-bold text-blue-700 text-xs">{sessionBadge}</td>
                                <td className="font-mono text-xs text-slate-700 font-semibold">
                                  {formatIsoToTr(m.date)}
                                </td>
                                <td className="font-mono text-xs text-slate-600">{timeStr || '—'}</td>
                                <td>
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                                    {actStr}
                                  </span>
                                </td>
                                <td className="text-slate-800 text-xs font-bold max-w-xs truncate">
                                  {topicStr}
                                </td>
                                <td className="text-slate-600 text-xs truncate">
                                  {m.participantType || 'Öğrenci'} {instStr !== '—' && `• ${instStr}`}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMeetingForDetail(m);
                                    }}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Detay
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. RANDEVULAR */}
              {(activeTab === 'all' || activeTab === 'appointments') && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <CalendarCheck className="w-4 h-4 text-blue-600" />
                      <span>Randevular</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {appointments.length} Randevu
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="pdr-table">
                      <thead>
                        <tr>
                          <th className="w-28">TARİH</th>
                          <th className="w-28">SAAT</th>
                          <th>RANDEVU TÜRÜ</th>
                          <th className="w-32 text-center">DURUM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-slate-400 text-xs italic">
                              Bu öğrenciye ait randevu bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          appointments.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="font-mono text-xs text-slate-700 font-semibold">
                                {new Date(app.date).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="font-mono text-xs text-slate-600">
                                {app.startTime} - {app.endTime}
                              </td>
                              <td className="text-slate-800 text-xs font-medium">
                                {app.appointmentType || app.title || 'Bireysel Öğrenci Görüşmesi'}
                              </td>
                              <td className="text-center">
                                {getStatusBadge(app.status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={() => setSelectedStudentId(null)}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>

      {/* Meeting Detail / Report Modal */}
      <MeetingDetailModal
        meeting={selectedMeetingForDetail}
        isOpen={Boolean(selectedMeetingForDetail)}
        onClose={() => setSelectedMeetingForDetail(null)}
      />

      {/* Study Plan 7-Day Rich Text Detail Sub-Modal */}
      {selectedStudyPlanDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {selectedStudyPlanDetail.templateNameSnapshot || selectedStudyPlanDetail.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {student ? `${student.firstName} ${student.lastName}` : selectedStudyPlanDetail.studentName}
                    </span>
                    <span>•</span>
                    <span>No: {student?.studentNumber || selectedStudyPlanDetail.studentNumber || '—'}</span>
                    <span>•</span>
                    <span>Sınıf: {student?.className || selectedStudyPlanDetail.className || '—'}</span>
                    <span>•</span>
                    <span>{new Date(selectedStudyPlanDetail.createdAt).toLocaleDateString('tr-TR')}</span>
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
                  onClick={() => setSelectedStudyPlanDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {selectedStudyPlanDetail.featuresSnapshot && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold">Plan Özellikleri:</span>
                  <span>{selectedStudyPlanDetail.featuresSnapshot}</span>
                </div>
              )}

              {/* 7 Days Read-Only Rich Text Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {DAYS_LIST.map((day) => (
                  <div key={day.key} className={day.key === 'sunday' ? 'md:col-span-2 lg:col-span-1' : ''}>
                    <RichTextDayEditor
                      dayLabel={day.label}
                      dayBadgeColor={day.color}
                      value={selectedStudyPlanDetail[day.key] || ''}
                      readOnly={true}
                      minHeight="120px"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedStudyPlanDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Application Result Detail Sub-Modal */}
      <SurveyResultDetailModal
        application={selectedSurveyAppForDetail}
        isOpen={Boolean(selectedSurveyAppForDetail)}
        onClose={() => setSelectedSurveyAppForDetail(null)}
      />
    </ModalPortal>
  );
};

export default StudentProfileModal;
