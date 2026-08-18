import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Target, 
  BookOpen
} from 'lucide-react';
import { 
  ExamDto, 
  ExamResultDto, 
  SubjectDto, 
  StudentTargetDto, 
  StudyPlanDto, 
  QuestionTrackingDto 
} from '@shared/ipc-types';
import { useAppStore } from '../../stores/appStore';

export const AcademicView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'targets' | 'plans' | 'questions'>('exams');
  const { students } = useAppStore();

  // Exams State
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [results, setResults] = useState<ExamResultDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [isNewExamOpen, setIsNewExamOpen] = useState(false);
  const [isRecordResultOpen, setIsRecordResultOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // Form State for New Exam
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'LGS' | 'CUSTOM'>('TYT');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State for Record Result
  const [resultStudentId, setResultStudentId] = useState('');
  const [resultItems, setResultItems] = useState<Record<string, { correct: number; wrong: number; empty: number }>>({});

  // Targets State
  const [targets, setTargets] = useState<StudentTargetDto[]>([]);
  const [isNewTargetOpen, setIsNewTargetOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [targetType, setTargetType] = useState<'net' | 'score' | 'rank' | 'school' | 'habit'>('net');
  const [targetTitle, setTargetTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');

  // Study Plans State
  const [studyPlans, setStudyPlans] = useState<StudyPlanDto[]>([]);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [planStudentId, setPlanStudentId] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [planEndDate, setPlanEndDate] = useState('');
  const [planItems] = useState<Array<{ date: string; subject: string; topic: string; plannedQuestions: number }>>([
    { date: new Date().toISOString().split('T')[0], subject: 'Matematik', topic: 'Temel Kavramlar', plannedQuestions: 50 }
  ]);

  // Question Logs State
  const [questionLogs, setQuestionLogs] = useState<QuestionTrackingDto[]>([]);
  const [isLogQuestionsOpen, setIsLogQuestionsOpen] = useState(false);
  const [logStudentId, setLogStudentId] = useState('');
  const [logSubjectId, setLogSubjectId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logCount, setLogCount] = useState(40);
  const [logCorrect, setLogCorrect] = useState(34);
  const [logWrong, setLogWrong] = useState(6);
  const [logEmpty, setLogEmpty] = useState(0);

  const fetchAllAcademic = async () => {
    try {
      const [examsData, resultsData, targetsData, plansData, qLogsData, subsData] = await Promise.all([
        window.api.exams.list(),
        window.api.exams.listResults(),
        window.api.exams.getTargets(),
        window.api.exams.getStudyPlans(),
        window.api.exams.getQuestionLogs(),
        window.api.exams.getSubjects()
      ]);
      setExams(examsData);
      setResults(resultsData);
      setTargets(targetsData);
      setStudyPlans(plansData);
      setQuestionLogs(qLogsData);
      setSubjects(subsData);
      if (examsData.length > 0 && !selectedExamId) {
        setSelectedExamId(examsData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllAcademic();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.exams.create({
        schoolYearId: 'year-2026',
        name: examName,
        examType,
        date: examDate
      });
      setIsNewExamOpen(false);
      setExamName('');
      fetchAllAcademic();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !resultStudentId) return;

    try {
      const itemsPayload = Object.entries(resultItems).map(([subId, counts]) => ({
        subjectId: subId,
        correct: Number(counts.correct || 0),
        wrong: Number(counts.wrong || 0),
        empty: Number(counts.empty || 0)
      }));

      await window.api.exams.recordResult({
        examId: selectedExamId,
        studentId: resultStudentId,
        items: itemsPayload
      });

      setIsRecordResultOpen(false);
      setResultItems({});
      fetchAllAcademic();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.exams.createTarget({
        studentId: targetStudentId,
        targetType,
        title: targetTitle,
        targetValue
      });
      setIsNewTargetOpen(false);
      setTargetTitle('');
      setTargetValue('');
      fetchAllAcademic();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  const handleCreateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.exams.createStudyPlan({
        studentId: planStudentId,
        title: planTitle,
        startDate: planStartDate,
        endDate: planEndDate || planStartDate,
        items: planItems
      });
      setIsNewPlanOpen(false);
      setPlanTitle('');
      fetchAllAcademic();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  const handleLogQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.exams.logQuestions({
        studentId: logStudentId,
        subjectId: logSubjectId || subjects[0]?.id,
        date: logDate,
        questionCount: Number(logCount),
        correctCount: Number(logCorrect),
        wrongCount: Number(logWrong),
        emptyCount: Number(logEmpty)
      });
      setIsLogQuestionsOpen(false);
      fetchAllAcademic();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-brand-400" />
            Akademik Gelişim, Sınav Netleri & Hedef Takibi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            ÖSYM/MEB deneme sınavları, otomatik net hesaplama, hedef takibi ve haftalık çalışma planları.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'exams' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deneme Sınavları
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'targets' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hedefler
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'plans' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Çalışma Programı
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'questions' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Soru Takibi
          </button>
        </div>
      </div>

      {/* TAB 1: EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Kayıtlı Sınavlar ({exams.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsNewExamOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                Yeni Deneme Sınavı
              </button>
              <button
                onClick={() => setIsRecordResultOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Öğrenci Sonucu Gir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map(e => (
              <div 
                key={e.id}
                onClick={() => setSelectedExamId(e.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedExamId === e.id
                    ? 'bg-slate-900 border-brand-500 shadow-md shadow-brand-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {e.examType}
                  </span>
                  <span className="text-xs text-slate-400">{e.date}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{e.name}</h3>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Katılımcı: <b className="text-slate-200">{e.participantCount}</b></span>
                  <span className="text-slate-400">Ortalama Net: <b className="text-emerald-400">{e.averageNet}</b></span>
                </div>
              </div>
            ))}
          </div>

          {/* Results Table for Selected Exam */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200">
              Sınav Sonuç Listesi ({results.filter(r => r.examId === selectedExamId).length} Öğrenci)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 font-semibold">Öğrenci No</th>
                    <th className="py-2.5 font-semibold">Adı Soyadı</th>
                    <th className="py-2.5 font-semibold">Doğru</th>
                    <th className="py-2.5 font-semibold">Yanlış</th>
                    <th className="py-2.5 font-semibold">Boş</th>
                    <th className="py-2.5 font-semibold text-emerald-400">Toplam Net</th>
                    <th className="py-2.5 font-semibold">Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {results
                    .filter(r => !selectedExamId || r.examId === selectedExamId)
                    .map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-mono text-slate-400">{r.studentNumber}</td>
                        <td className="py-2.5 font-bold text-slate-200">{r.studentName}</td>
                        <td className="py-2.5 text-emerald-400 font-bold">{r.totalCorrect}</td>
                        <td className="py-2.5 text-red-400 font-bold">{r.totalWrong}</td>
                        <td className="py-2.5 text-slate-400">{r.totalEmpty}</td>
                        <td className="py-2.5 font-bold text-emerald-400">{r.totalNet}</td>
                        <td className="py-2.5 font-bold text-brand-400">{r.totalScore}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TARGETS */}
      {activeTab === 'targets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-400" />
              Öğrenci Hedefleri ({targets.length})
            </h2>
            <button
              onClick={() => setIsNewTargetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Yeni Hedef Belirle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {targets.map(t => (
              <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{t.studentName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.status === 'achieved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    t.status === 'missed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  }`}>
                    {t.status === 'achieved' ? 'Ulaşıldı' : t.status === 'missed' ? 'Ulaşılamadı' : 'Devam Ediyor'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{t.title}</h3>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">Hedeflenen Değer</span>
                  <span className="text-lg font-bold text-brand-400">{t.targetValue} {t.unit || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDY PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              Haftalık Çalışma Programları ({studyPlans.length})
            </h2>
            <button
              onClick={() => setIsNewPlanOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Yeni Çalışma Programı
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyPlans.map(p => (
              <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{p.title}</h3>
                    <span className="text-xs text-slate-400">{p.studentName} • {p.startDate} - {p.endDate}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">%{p.completionRate} Tamamlandı</span>
                </div>

                <div className="space-y-2">
                  {(p.items || []).map(item => (
                    <div key={item.id} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200">{item.subject}</span>
                        <span className="text-slate-400 ml-2">({item.topic})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.completedQuestions}/{item.plannedQuestions} Soru</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.status === 'completed' ? 'Bitti' : 'Bekliyor'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUESTION LOGS */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              Günlük Soru Çözüm Takibi ({questionLogs.length})
            </h2>
            <button
              onClick={() => setIsLogQuestionsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Soru Çözümü Kaydet
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 font-semibold">Tarih</th>
                  <th className="py-2 font-semibold">Öğrenci</th>
                  <th className="py-2 font-semibold">Ders</th>
                  <th className="py-2 font-semibold">Toplam</th>
                  <th className="py-2 font-semibold text-emerald-400">Doğru</th>
                  <th className="py-2 font-semibold text-red-400">Yanlış</th>
                  <th className="py-2 font-semibold text-emerald-400">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {questionLogs.map(q => (
                  <tr key={q.id}>
                    <td className="py-2.5 text-slate-400">{q.date}</td>
                    <td className="py-2.5 font-bold text-slate-200">{q.studentName}</td>
                    <td className="py-2.5 text-brand-300 font-medium">{q.subjectName}</td>
                    <td className="py-2.5 text-slate-300">{q.questionCount}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{q.correctCount}</td>
                    <td className="py-2.5 font-bold text-red-400">{q.wrongCount}</td>
                    <td className="py-2.5 font-bold text-emerald-400">{q.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW EXAM */}
      {isNewExamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-800">Yeni Deneme Sınavı Tanımla</h3>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınav Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 3D TYT Türkiye Geneli 1"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sınav Türü</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="TYT">TYT (4 Yanlış 1 Doğru)</option>
                    <option value="AYT">AYT (4 Yanlış 1 Doğru)</option>
                    <option value="LGS">LGS (3 Yanlış 1 Doğru)</option>
                    <option value="CUSTOM">Özel Sınav</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExamOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD RESULT */}
      {isRecordResultOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-800">Öğrenci Sınav Sonucu Girişi</h3>
            <form onSubmit={handleRecordResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci Seçin</label>
                <select
                  required
                  value={resultStudentId}
                  onChange={e => setResultStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci seçiniz...</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.studentNumber} - {st.firstName} {st.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Ders Bazlı Doğru / Yanlış / Boş</span>
                {subjects.slice(0, 4).map(sub => (
                  <div key={sub.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700 w-32">{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="D"
                        onChange={e => {
                          const val = Number(e.target.value);
                          setResultItems(prev => ({
                            ...prev,
                            [sub.id]: { ...(prev[sub.id] || { correct: 0, wrong: 0, empty: 0 }), correct: val }
                          }));
                        }}
                        className="w-14 bg-white border border-slate-200 rounded px-2 py-1 text-center text-emerald-600 font-bold"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Y"
                        onChange={e => {
                          const val = Number(e.target.value);
                          setResultItems(prev => ({
                            ...prev,
                            [sub.id]: { ...(prev[sub.id] || { correct: 0, wrong: 0, empty: 0 }), wrong: val }
                          }));
                        }}
                        className="w-14 bg-white border border-slate-200 rounded px-2 py-1 text-center text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordResultOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Netleri Hesapla & Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TARGET */}
      {isNewTargetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-800">Yeni Hedef Belirle</h3>
            <form onSubmit={handleCreateTarget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci</label>
                <select
                  required
                  value={targetStudentId}
                  onChange={e => setTargetStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci seçiniz...</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.studentNumber} - {st.firstName} {st.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: TYT 85+ Net Hedefi"
                  value={targetTitle}
                  onChange={e => setTargetTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Türü</label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="net">Net Sayısı</option>
                    <option value="score">Puan</option>
                    <option value="rank">Sıralama</option>
                    <option value="school">Okul / Bölüm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Değer</label>
                  <input
                    type="text"
                    required
                    placeholder="85 Net / Hacettepe Tıp"
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTargetOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW STUDY PLAN */}
      {isNewPlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-800">Yeni Haftalık Çalışma Programı</h3>
            <form onSubmit={handleCreateStudyPlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci</label>
                <select
                  required
                  value={planStudentId}
                  onChange={e => setPlanStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci seçiniz...</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.studentNumber} - {st.firstName} {st.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1. Hafta TYT Matematik & Fen Programı"
                  value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    value={planStartDate}
                    onChange={e => setPlanStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={e => setPlanEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPlanOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Programı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG QUESTIONS */}
      {isLogQuestionsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-slate-800">Günlük Soru Çözümü Kaydet</h3>
            <form onSubmit={handleLogQuestions} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci</label>
                <select
                  required
                  value={logStudentId}
                  onChange={e => setLogStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Öğrenci seçiniz...</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.studentNumber} - {st.firstName} {st.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ders</label>
                  <select
                    value={logSubjectId}
                    onChange={e => setLogSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Toplam</label>
                  <input
                    type="number"
                    value={logCount}
                    onChange={e => setLogCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-xs text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 mb-1">Doğru</label>
                  <input
                    type="number"
                    value={logCorrect}
                    onChange={e => setLogCorrect(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-xs text-emerald-600 font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 mb-1">Yanlış</label>
                  <input
                    type="number"
                    value={logWrong}
                    onChange={e => setLogWrong(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-xs text-rose-600 font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Boş</label>
                  <input
                    type="number"
                    value={logEmpty}
                    onChange={e => setLogEmpty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-xs text-slate-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogQuestionsOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
