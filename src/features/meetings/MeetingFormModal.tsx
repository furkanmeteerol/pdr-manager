import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { StudentDto } from '@shared/ipc-types';
import { 
  X, 
  MessagesSquare, 
  Save, 
  AlertCircle,
  Check,
  CalendarCheck,
  Users
} from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';
import { getLocalDateIso, addDaysToIso } from '../../utils/dateUtils';

interface MeetingFormModalProps {
  initialStudentId?: string;
  onSuccess?: () => void;
}

export const MeetingFormModal: React.FC<MeetingFormModalProps> = ({
  initialStudentId,
  onSuccess
}) => {
  const { 
    isMeetingModalOpen, 
    setIsMeetingModalOpen, 
    classes,
    students, 
    meetings,
    status, 
    fetchMeetings,
    fetchAppointments,
    selectedStudentId 
  } = useAppStore();

  // Participant Type: 'student' | 'parent' | 'teacher' | 'group'
  const [participantType, setParticipantType] = useState<'student' | 'parent' | 'teacher' | 'group'>('student');

  // Class & Student Selection
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIdState, setSelectedStudentIdState] = useState<string>(initialStudentId || selectedStudentId || '');
  
  // Persistent Multi-Class Group Selection (Req 4 & 5)
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<StudentDto[]>([]);

  // Veli / Öğretmen Specific Fields
  const [parentRelation, setParentRelation] = useState<string>('Anne');
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherBranch, setTeacherBranch] = useState<string>('');

  // Group Guidance Specific Fields (Req 6 & 7)
  const [groupSessionNumber, setGroupSessionNumber] = useState<number>(1);
  const [groupPlannedSessions, setGroupPlannedSessions] = useState<number>(6);

  // Görüşme Konusu (Dropdown + Diğer) (Req 1)
  const [meetingTopic, setMeetingTopic] = useState<string>('Akademik Konular');
  const [meetingTopicOther, setMeetingTopicOther] = useState<string>('');

  // Yapılan Çalışma (Görüşme Türü) (Dropdown + Diğer) (Req 3)
  const [activityType, setActivityType] = useState<string>('Bireysel Öğrenci Görüşmesi');
  const [activityTypeOther, setActivityTypeOther] = useState<string>('');

  // Date & Times (Req 4)
  const [date, setDate] = useState<string>(getLocalDateIso());
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('14:40');

  // Varsa Yönlendirileceği Kurum (Multi-select + Diğer) (Req 5)
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [referralOther, setReferralOther] = useState<string>('');

  // Meeting Notes & Summary
  const [summary, setSummary] = useState<string>('');
  const [decisions, setDecisions] = useState<string>('');

  // Follow-Up Appointment Fields (Req 3)
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpTitle, setFollowUpTitle] = useState<string>('Takip Görüşmesi');
  const [followUpDate, setFollowUpDate] = useState<string>(() => addDaysToIso(getLocalDateIso(), 7));
  const [followUpStartTime, setFollowUpStartTime] = useState<string>('10:00');
  const [followUpEndTime, setFollowUpEndTime] = useState<string>('10:40');
  const [followUpLocation, setFollowUpLocation] = useState<string>('Rehberlik Servisi');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [followUpReminderMinutes, setFollowUpReminderMinutes] = useState<number>(15);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial student selection and reset fields on modal open
  useEffect(() => {
    if (isMeetingModalOpen) {
      setParticipantType('student');
      const targetStudentId = initialStudentId || selectedStudentId || '';
      setSelectedStudentIdState(targetStudentId);
      const st = students.find(s => s.id === targetStudentId);
      setSelectedClassId(st?.classId || '');
      setSelectedGroupStudents([]);
      setParentRelation('Anne');
      setTeacherName('');
      setTeacherBranch('');
      setGroupSessionNumber(1);
      setGroupPlannedSessions(6);
      setMeetingTopic('Akademik Konular');
      setMeetingTopicOther('');
      setActivityType('Bireysel Öğrenci Görüşmesi');
      setActivityTypeOther('');
      setDate(getLocalDateIso());
      setStartTime('14:00');
      setEndTime('14:40');
      setSelectedInstitutions([]);
      setReferralOther('');
      setSummary('');
      setDecisions('');
      setFollowUpRequired(false);
      setFollowUpTitle('Takip Görüşmesi');
      setFollowUpDate(addDaysToIso(getLocalDateIso(), 7));
      setFollowUpStartTime('10:00');
      setFollowUpEndTime('10:40');
      setFollowUpLocation('Rehberlik Servisi');
      setFollowUpNotes('');
      setFollowUpReminderMinutes(15);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isMeetingModalOpen, initialStudentId, selectedStudentId]);

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return students;
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Selected student object
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentIdState);
  }, [students, selectedStudentIdState]);

  // Calculate past individual meetings count for the selected student (Isolated from group guidance)
  const pastMeetingCount = useMemo(() => {
    if (!selectedStudentIdState) return 0;
    return meetings.filter(m => {
      if (m.studentId !== selectedStudentIdState) return false;
      const pType = m.participantType;
      const mType = m.meetingType;
      return pType !== 'Grup' && pType !== 'group' && mType !== 'group' && mType !== 'group_guidance';
    }).length;
  }, [meetings, selectedStudentIdState]);

  const nextIndividualSessionNumber = pastMeetingCount + 1;

  if (!isMeetingModalOpen) return null;

  // Institution choices
  const institutionOptions = ['RAM', 'HASTANE', 'ASPİM', 'STK', 'ÇİM', 'DİĞER'];

  const toggleInstitution = (inst: string) => {
    setSelectedInstitutions(prev => 
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  // Toggle student in multi-class group selection
  const handleToggleGroupStudent = (student: StudentDto) => {
    setSelectedGroupStudents(prev => {
      const exists = prev.some(s => s.id === student.id);
      if (exists) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleRemoveGroupStudent = (studentId: string) => {
    setSelectedGroupStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (participantType === 'group') {
      if (selectedGroupStudents.length === 0) {
        setError('Lütfen grup rehberliği için en az bir öğrenci seçiniz.');
        return;
      }
    } else {
      if (!selectedStudentIdState) {
        setError('Lütfen bir öğrenci seçiniz.');
        return;
      }
    }

    if (!date) {
      setError('Lütfen görüşme tarihini seçiniz.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Lütfen başlangıç ve bitiş saatlerini giriniz.');
      return;
    }

    if (endTime <= startTime) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }

    if (!meetingTopic) {
      setError('Lütfen bir görüşme konusu seçiniz.');
      return;
    }

    if (meetingTopic === 'Diğer' && !meetingTopicOther.trim()) {
      setError('Lütfen görüşme konusu açıklamasını giriniz.');
      return;
    }

    if (activityType === 'Diğer' && !activityTypeOther.trim()) {
      setError('Lütfen yapılan çalışma açıklamasını giriniz.');
      return;
    }

    if (selectedInstitutions.includes('DİĞER') && !referralOther.trim()) {
      setError('Lütfen yönlendirileceği diğer kurumun adını giriniz.');
      return;
    }

    // Follow-up appointment validation if selected
    if (followUpRequired) {
      if (!followUpDate || !followUpStartTime || !followUpEndTime) {
        setError('Lütfen takip randevusu tarih ve saat bilgilerini eksiksiz giriniz.');
        return;
      }
      if (followUpEndTime <= followUpStartTime) {
        setError('Takip randevusu bitiş saati başlangıç saatinden sonra olmalıdır.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (window.api && window.api.meetings) {
        const studentIdsPayload = participantType === 'group' 
          ? selectedGroupStudents.map(s => s.id) 
          : [selectedStudentIdState];
        const primaryStudentId = participantType === 'group' ? null : selectedStudentIdState;

        const calculatedDuration = (() => {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          return Math.max(10, (eh * 60 + em) - (sh * 60 + sm));
        })();

        const sessionNumberToSave = participantType === 'group' 
          ? groupSessionNumber 
          : nextIndividualSessionNumber;

        const followUpAppointmentPayload = followUpRequired ? {
          title: followUpTitle.trim() || 'Görüşme Takip Randevusu',
          date: followUpDate,
          startTime: followUpStartTime,
          endTime: followUpEndTime,
          location: followUpLocation.trim() || 'Rehberlik Servisi',
          notes: followUpNotes.trim() || undefined,
          reminderMinutes: followUpReminderMinutes
        } : undefined;

        await window.api.meetings.create({
          schoolYearId: status?.activeSchoolYearId || 'default-year',
          studentId: primaryStudentId,
          studentIds: studentIdsPayload,
          meetingType: participantType === 'group' ? 'group_guidance' : participantType,
          guidanceServiceType: 'Psikolojik Danışma',
          date,
          startTime,
          endTime,
          duration: calculatedDuration,
          subject: meetingTopic === 'Diğer' ? meetingTopicOther.trim() : meetingTopic,
          summary: summary.trim() || `${meetingTopic} konusunda görüşme gerçekleştirildi.`,
          notes: summary.trim(),
          decisions: decisions.trim() || undefined,
          followUpRequired,
          followUpDate: followUpRequired ? followUpDate : undefined,
          meetingTopic,
          meetingTopicOther: meetingTopic === 'Diğer' ? meetingTopicOther.trim() : undefined,
          activityType,
          activityTypeOther: activityType === 'Diğer' ? activityTypeOther.trim() : undefined,
          referralInstitutions: selectedInstitutions,
          referralOther: selectedInstitutions.includes('DİĞER') ? referralOther.trim() : undefined,
          participantType: participantType === 'student' ? 'Öğrenci' : participantType === 'parent' ? 'Veli' : participantType === 'teacher' ? 'Öğretmen' : 'Grup',
          parentRelation: participantType === 'parent' ? parentRelation.trim() : undefined,
          teacherName: participantType === 'teacher' ? teacherName.trim() : undefined,
          teacherBranch: participantType === 'teacher' ? teacherBranch.trim() : undefined,
          sessionNumber: sessionNumberToSave,
          plannedSessions: participantType === 'group' ? groupPlannedSessions : undefined,
          followUpAppointment: followUpAppointmentPayload
        });

        await fetchMeetings();
        if (followUpRequired) {
          await fetchAppointments();
        }
        setIsMeetingModalOpen(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Görüşme kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">
                Yeni Görüşme Kaydı
              </h3>
              <p className="text-[11px] text-slate-400">
                Öğrenci, veli, öğretmen veya grup rehberliği detaylarını kaydedin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMeetingModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Görüşme Yapılan Kişi Seçici (Req 1 Türkçeleştirme & Seçim) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Görüşme Yapılan Kişi *</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setParticipantType('student');
                  setActivityType('Bireysel Öğrenci Görüşmesi');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  participantType === 'student'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Öğrenci
              </button>
              <button
                type="button"
                onClick={() => {
                  setParticipantType('parent');
                  setActivityType('Veli Görüşmesi');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  participantType === 'parent'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Veli
              </button>
              <button
                type="button"
                onClick={() => {
                  setParticipantType('teacher');
                  setActivityType('Öğretmen Görüşmesi');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  participantType === 'teacher'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Öğretmen
              </button>
              <button
                type="button"
                onClick={() => {
                  setParticipantType('group');
                  setActivityType('Grup Rehberliği');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  participantType === 'group'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Grup Rehberliği
              </button>
            </div>
          </div>

          {/* 2. Sınıf ve Öğrenci Seçimi (Bireysel / Veli / Öğretmen için) */}
          {participantType !== 'group' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sınıf Seçiniz *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentIdState('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Tüm Sınıflar</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade}. Sınıf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {participantType === 'parent' ? 'İlgili Öğrenciyi Seçiniz *' : 'Öğrenci Seçiniz *'}
                </label>
                <select
                  required
                  value={selectedStudentIdState}
                  onChange={(e) => setSelectedStudentIdState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci Seçiniz...</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentNumber}) - {(s as any).className || '—'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* 3. GRUP REHBERLİĞİ: Çoklu Sınıf & Kalıcı Seçim Paneli (Req 4 & 5) */
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Katılımcı Öğrencileri Seçiniz (Farklı sınıflardan eklenebilir)</span>
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  {selectedGroupStudents.length} Öğrenci Seçildi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Sol Taraf: Sınıf Filtresi & Öğrenci Listesi */}
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Sınıf Filtresi</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="">Tüm Sınıflar</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.grade}. Sınıf)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                    {filteredStudents.map((s) => {
                      const isSelected = selectedGroupStudents.some(g => g.id === s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleGroupStudent(s)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span>{s.firstName} {s.lastName}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-1.5">({s.studentNumber})</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {(s as any).className || '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sağ Taraf: Kalıcı Seçilen Öğrenciler Listesi (Req 5) */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-600">Seçilen Öğrenciler</label>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200 min-h-[140px]">
                    {selectedGroupStudents.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        Henüz öğrenci seçilmedi. Soldaki listeden öğrencileri ekleyebilirsiniz.
                      </div>
                    ) : (
                      selectedGroupStudents.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold"
                        >
                          <div className="truncate">
                            <span>{s.firstName} {s.lastName}</span>
                            <span className="text-[10px] text-blue-600 font-mono ml-1">({(s as any).className || '—'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroupStudent(s.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Listeden Çıkar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Grup Rehberliği: Oturum No & Planlanan Oturum Sayısı (Req 6 & 7) */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Oturum No *</label>
                  <input
                    type="number"
                    min={1}
                    value={groupSessionNumber}
                    onChange={(e) => setGroupSessionNumber(Number(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Planlanan Oturum Sayısı *</label>
                  <input
                    type="number"
                    min={1}
                    value={groupPlannedSessions}
                    onChange={(e) => setGroupPlannedSessions(Number(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Görüşme Sayacı Bilgi Kartı (Bireysel Öğrenci için) (Req 8 İzolasyon) */}
          {selectedStudentIdState && currentStudent && participantType !== 'group' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  #{nextIndividualSessionNumber}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    Görüşme Bilgisi: {currentStudent.firstName} {currentStudent.lastName}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Bu öğrenciyle daha önce <strong>{pastMeetingCount}</strong> bireysel görüşme yapılmıştır. Bu kayıt: <strong className="text-blue-700">#{nextIndividualSessionNumber} Görüşme</strong>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-extrabold text-xs">
                #{nextIndividualSessionNumber} Oturum
              </span>
            </div>
          )}

          {/* 5. Veliye Özel: Öğrenciye Yakınlığı */}
          {participantType === 'parent' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block font-bold text-slate-700 mb-1">
                Öğrenciye Yakınlığı * (Anne, Baba, Vasi, Abi vb.)
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Anne, Baba, Teyze, Vasi..."
                value={parentRelation}
                onChange={(e) => setParentRelation(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* 6. Öğretmene Özel: Öğretmen Adı Soyadı ve Branş */}
          {participantType === 'teacher' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Öğretmen Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branş *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Matematik, Edebiyat..."
                  value={teacherBranch}
                  onChange={(e) => setTeacherBranch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* 7. Görüşme Konusu (Dropdown + Diğer) & Yapılan Çalışma (Dropdown + Diğer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Görüşme Konusu *</label>
              <select
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Sağlıkla İlgili Konular">Sağlıkla İlgili Konular</option>
                <option value="Sosyoekonomik Konular">Sosyoekonomik Konular</option>
                <option value="Yöneltme ve Yerleştirme">Yöneltme ve Yerleştirme</option>
                <option value="Akademik Konular">Akademik Konular</option>
                <option value="Sosyal Uyum">Sosyal Uyum</option>
                <option value="Davranış Sorunu">Davranış Sorunu</option>
                <option value="Okula ve Çevreye Uyum">Okula ve Çevreye Uyum</option>
                <option value="Ailevi Konular">Ailevi Konular</option>
                <option value="Psikolojik Uyum">Psikolojik Uyum</option>
                <option value="Diğer">Diğer</option>
              </select>

              {meetingTopic === 'Diğer' && (
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Görüşme konusu açıklaması..."
                  value={meetingTopicOther}
                  onChange={(e) => setMeetingTopicOther(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 mt-2"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Yapılan Çalışma *</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Bireysel Öğrenci Görüşmesi">Bireysel Öğrenci Görüşmesi</option>
                <option value="Veli Görüşmesi">Veli Görüşmesi</option>
                <option value="Öğretmen Görüşmesi">Öğretmen Görüşmesi</option>
                <option value="Disiplin / Yönlendirme">Disiplin / Yönlendirme</option>
                <option value="Grup Rehberliği">Grup Rehberliği</option>
                <option value="Diğer">Diğer</option>
              </select>

              {activityType === 'Diğer' && (
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Yapılan çalışma açıklaması..."
                  value={activityTypeOther}
                  onChange={(e) => setActivityTypeOther(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 mt-2"
                />
              )}
            </div>
          </div>

          {/* 8. Tarih & Saat Aralığı */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tarih *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Başlangıç Saati *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bitiş Saati *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 9. Varsa Yönlendirileceği Kurum */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-700">
              Varsa Yönlendirileceği Kurum (Çoklu Seçim)
            </label>
            <div className="flex flex-wrap gap-2">
              {institutionOptions.map(inst => {
                const isSelected = selectedInstitutions.includes(inst);
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => toggleInstitution(inst)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{inst}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {selectedInstitutions.includes('DİĞER') && (
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Yönlendirileceği Diğer Kurum Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kurum adını yazınız..."
                  value={referralOther}
                  onChange={(e) => setReferralOther(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 10. Görüşme Özeti & Notlar */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Görüşme Özeti / Notlar *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Görüşmede konuşulan konular, gözlemler, genel durum değerlendirmesi..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 11. Alınan Kararlar / Takip */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Alınan Kararlar / Eylem Planı (İsteğe Bağlı)
            </label>
            <textarea
              rows={2}
              placeholder="Öğrenci veya veli ile varılan mutabakat, eylem adımları..."
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 12. TAKİP RANDEVUSU ENTEGRASYONU (Req 3) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <span>Bu görüşme için takip randevusu oluştur</span>
              </span>
            </label>

            {followUpRequired && (
              <div className="pt-3 border-t border-slate-200 space-y-3 bg-white p-3.5 rounded-xl border">
                <div className="text-[11px] font-bold text-blue-700">
                  Takip Randevusu Bilgileri (Doğrudan Randevular modülüne ve takvime kaydedilir)
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Randevu Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {participantType === 'group' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Grup Rehberliği Takip Randevusu Katılımcıları ({selectedGroupStudents.length})</span>
                      <span className="text-[10px] text-slate-500 font-normal">Görüşmedeki tüm öğrenciler aktarıldı</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGroupStudents.map(s => (
                        <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs">
                          <span>{s.firstName} {s.lastName} ({(s as any).className || '—'} - {s.studentNumber})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGroupStudent(s.id)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                            title="Takip randevusundan çıkar"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Randevu Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Başlangıç Saati *</label>
                    <input
                      type="time"
                      required
                      value={followUpStartTime}
                      onChange={(e) => setFollowUpStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bitiş Saati *</label>
                    <input
                      type="time"
                      required
                      value={followUpEndTime}
                      onChange={(e) => setFollowUpEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Görüşme Yeri</label>
                    <input
                      type="text"
                      value={followUpLocation}
                      onChange={(e) => setFollowUpLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hatırlatıcı (Bildirim)</label>
                    <select
                      value={followUpReminderMinutes}
                      onChange={(e) => setFollowUpReminderMinutes(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value={5}>5 dakika önce</option>
                      <option value={15}>15 dakika önce</option>
                      <option value={30}>30 dakika önce</option>
                      <option value={60}>1 saat önce</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Takip Randevusu Hazırlık Notları</label>
                  <textarea
                    rows={2}
                    placeholder="Bir sonraki randevuda ele alınacak maddeler..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMeetingModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Görüşmeyi Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
