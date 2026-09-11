import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  ClipboardList, 
  Eye, 
  Sparkles,
  RefreshCw,
  Table
} from 'lucide-react';
import { SurveyDto, SurveyApplicationDto } from '@shared/ipc-types';
import { getWestsideEvaluation } from '../../../../shared/westsideEvaluation';
import { useAppStore } from '../../../stores/appStore';
import { SurveyResultDetailModal } from './SurveyResultDetailModal';
import { ExamAnxietyCollectiveReportModal } from './reports/ExamAnxietyCollectiveReportModal';
import { WestsideExamAnxietyCollectiveReportModal } from './reports/WestsideExamAnxietyCollectiveReportModal';
import { HollandMeslekiTercihCollectiveReportModal } from './reports/HollandMeslekiTercihCollectiveReportModal';
import { HollandKisaMeslekiTaramaCollectiveReportModal } from './reports/HollandKisaMeslekiTaramaCollectiveReportModal';
import { MeslekDegeriCollectiveReportModal } from './reports/MeslekDegeriCollectiveReportModal';
import { AcademicProcrastinationCollectiveReportModal } from './reports/AcademicProcrastinationCollectiveReportModal';
import { BurdonDikkatTestCollectiveReportModal } from './reports/BurdonDikkatTestCollectiveReportModal';
import { AutomaticThoughtsCollectiveReportModal } from './reports/AutomaticThoughtsCollectiveReportModal';
import { BasarisizlikNedenleriCollectiveReportModal } from './reports/BasarisizlikNedenleriCollectiveReportModal';
import { CalismaDavranisiCollectiveReportModal } from './reports/CalismaDavranisiCollectiveReportModal';
import { ProblemTaramaListesiCollectiveReportModal } from './reports/ProblemTaramaListesiCollectiveReportModal';
import { RosenbergBenlikSaygisiCollectiveReportModal } from './reports/RosenbergBenlikSaygisiCollectiveReportModal';
import { KimeGoreBenNeyimCollectiveReportModal } from './reports/KimeGoreBenNeyimCollectiveReportModal';
import { AkademikBenlikAlgisiCollectiveReportModal } from './reports/AkademikBenlikAlgisiCollectiveReportModal';
import { calculateMeslekDegeriEvaluation } from '../../../../shared/meslekDegeriEvaluation';
import { calculateHollandKisaEvaluation } from '../../../../shared/hollandKisaEvaluation';
import { calculateHollandEvaluation } from '../../../../shared/hollandEvaluation';
import { evaluateAcademicProcrastination } from '../../../../shared/academicProcrastinationEvaluation';
import { evaluateAutomaticThoughts } from '../../../../shared/automaticThoughtsEvaluation';
import { evaluateKimeGoreBenNeyim } from '../../../../shared/kimeGoreBenNeyimEvaluation';
import { evaluateAkademikBenlikAlgisi } from '../../../../shared/akademikBenlikAlgisiEvaluation';
import { evaluateCalismaDavranisi } from '../../../../shared/calismaDavranisiEvaluation';
import { evaluateIndividualBNA } from '../../../../shared/basarisizlikNedenleriEvaluation';
import { evaluateBurdonTest } from '../../../../shared/burdonDikkatEvaluation';
import { ModalPortal } from '../../../components/ModalPortal';

interface SurveyApplicationsModalProps {
  survey: SurveyDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SurveyApplicationsModal: React.FC<SurveyApplicationsModalProps> = ({
  survey,
  isOpen,
  onClose
}) => {
  const { setSelectedStudentId } = useAppStore();
  const [applications, setApplications] = useState<SurveyApplicationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplicationForDetail, setSelectedApplicationForDetail] = useState<SurveyApplicationDto | null>(null);
  const [isCollectiveReportOpen, setIsCollectiveReportOpen] = useState(false);
  const [isWestsideCollectiveReportOpen, setIsWestsideCollectiveReportOpen] = useState(false);
  const [isHollandCollectiveOpen, setIsHollandCollectiveOpen] = useState(false);
  const [isHollandKisaCollectiveOpen, setIsHollandKisaCollectiveOpen] = useState(false);
  const [isMeslekDegeriCollectiveOpen, setIsMeslekDegeriCollectiveOpen] = useState(false);
  const [isAcademicProcrastinationCollectiveOpen, setIsAcademicProcrastinationCollectiveOpen] = useState(false);
  const [isBurdonCollectiveOpen, setIsBurdonCollectiveOpen] = useState(false);
  const [isAutomaticThoughtsCollectiveOpen, setIsAutomaticThoughtsCollectiveOpen] = useState(false);
  const [isBasarisizlikNedenleriCollectiveOpen, setIsBasarisizlikNedenleriCollectiveOpen] = useState(false);
  const [isCalismaDavranisiCollectiveOpen, setIsCalismaDavranisiCollectiveOpen] = useState(false);
  const [isProblemTaramaCollectiveOpen, setIsProblemTaramaCollectiveOpen] = useState(false);
  const [isRosenbergCollectiveOpen, setIsRosenbergCollectiveOpen] = useState(false);
  const [isKGBNCollectiveOpen, setIsKGBNCollectiveOpen] = useState(false);
  const [isAkademikBenlikCollectiveOpen, setIsAkademikBenlikCollectiveOpen] = useState(false);

  const isExamAnxiety = Boolean(
    survey && (survey.slug === 'sinav-kaygisi-olcegi' || survey.id === 'srv-sinav-kaygisi-olcegi')
  );

  const isWestside = Boolean(
    survey && (survey.slug === 'westside-sinav-kaygisi-olcegi' || survey.id === 'srv-westside-sinav-kaygisi-olcegi')
  );

  const isHolland = Boolean(
    survey && (survey.slug === 'holland-mesleki-tercih-envanteri' || survey.id === 'srv-holland-mesleki-tercih-envanteri')
  );

  const isMeslekDegeri = Boolean(
    survey && (survey.slug === 'meslek-degeri-envanteri' || survey.id === 'srv-meslek-degeri-envanteri')
  );

  const isHollandKisa = Boolean(
    survey && (survey.slug === 'holland-kisa-bicim-mesleki-tarama-envanteri' || survey.id === 'srv-holland-kisa-bicim-mesleki-tarama-envanteri')
  );

  const isAcademicProcrastination = Boolean(
    survey && (survey.slug === 'akademik-erteleme-olcegi' || survey.id === 'srv-akademik-erteleme-olcegi')
  );

  const isBurdon = Boolean(
    survey && (
      survey.slug === 'burdon-dikkat-testi' ||
      survey.id === 'srv-burdon-dikkat-testi' ||
      (survey as any).code === 'BURDON' ||
      (survey.title && survey.title.toLowerCase().includes('burdon'))
    )
  );

  const isAutomaticThoughts = Boolean(
    survey && (
      survey.slug === 'otomatik-dusunceler-olcegi' ||
      survey.id === 'srv-otomatik-dusunceler-olcegi' ||
      (survey as any).code === 'ATQ-30' ||
      (survey.title && survey.title.toLowerCase().includes('otomatik düşünceler'))
    )
  );

  const isBasarisizlikNedenleri = Boolean(
    survey && (
      survey.slug === 'basarisizlik-nedenleri-anketi' ||
      survey.id === 'srv-basarisizlik-nedenleri-anketi' ||
      (survey as any).code === 'BNA-44' ||
      (survey.title && survey.title.toLowerCase().includes('başarısızlık nedenleri'))
    )
  );

  const isCalismaDavranisi = Boolean(
    survey && (
      survey.slug === 'calisma-davranisini-degerlendirme-olcegi' ||
      survey.slug === 'calisma-davranisi-olcegi' ||
      survey.id === 'srv-calisma-davranisini-degerlendirme-olcegi' ||
      survey.id === 'srv-calisma-davranisi-olcegi' ||
      (survey as any).code === 'CDDE-73' ||
      (survey.title && survey.title.toLowerCase().includes('çalışma davranışı'))
    )
  );

  const isProblemTarama = Boolean(
    survey && (survey.slug === 'problem-tarama-listesi' || survey.id === 'srv-problem-tarama-listesi' || (survey as any).code === 'PTL-176')
  );

  const isRosenberg = Boolean(
    survey && (survey.slug === 'rosenberg-benlik-saygisi' || survey.id === 'srv-rosenberg-benlik-saygisi' || (survey as any).code === 'ROSENBERG-63')
  );

  const isKGBN = Boolean(
    survey && (survey.slug === 'kime-gore-ben-neyim' || survey.id === 'srv-kime-gore-ben-neyim' || (survey as any).code === 'KGBN-40')
  );

  const isAkademikBenlik = Boolean(
    survey && (survey.slug === 'akademik-benlik-algisi' || survey.id === 'srv-akademik-benlik-algisi' || (survey as any).code === 'ABAÖ-II-56' || (survey as any).code === 'ABAO-II-56')
  );

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.surveys) {
        const filter = survey ? { surveyId: survey.id } : undefined;
        const res = await window.api.surveys.listApplications(filter);
        setApplications(res || []);
      }
    } catch (err) {
      console.error('Failed to load survey applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApplications();
      setSearchTerm('');
    }
  }, [isOpen, survey]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications;
    const term = searchTerm.toLowerCase().trim();
    return applications.filter(a => {
      const name = a.studentName.toLowerCase();
      const num = a.studentNumber.toLowerCase();
      const cls = (a.className || '').toLowerCase();
      const srv = (a.surveyTitle || '').toLowerCase();
      return name.includes(term) || num.includes(term) || cls.includes(term) || srv.includes(term);
    });
  }, [applications, searchTerm]);

  const handleOpenDetail = async (app: SurveyApplicationDto) => {
    try {
      if (window.api && window.api.surveys) {
        const fullDetail = await window.api.surveys.getApplicationDetail(app.id);
        setSelectedApplicationForDetail(fullDetail || app);
      } else {
        setSelectedApplicationForDetail(app);
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
      setSelectedApplicationForDetail(app);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-extrabold shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {survey ? survey.title : 'Tüm Anket / Envanter Uygulamaları'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                    {applications.length} Uygulama
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {survey 
                    ? 'Bu teste ait öğrenci doldurma geçmişi, denemeler ve hesaplanan sonuçlar'
                    : 'Sistemdeki tüm öğrenci anket ve ölçek doldurma geçmişi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isExamAnxiety && (
                <button
                  type="button"
                  onClick={() => setIsCollectiveReportOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isWestside && (
                <button
                  type="button"
                  onClick={() => setIsWestsideCollectiveReportOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isHolland && (
                <button
                  type="button"
                  onClick={() => setIsHollandCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isMeslekDegeri && (
                <button
                  type="button"
                  onClick={() => setIsMeslekDegeriCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isHollandKisa && (
                <button
                  type="button"
                  onClick={() => setIsHollandKisaCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isAcademicProcrastination && (
                <button
                  type="button"
                  onClick={() => setIsAcademicProcrastinationCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isBurdon && (
                <button
                  type="button"
                  onClick={() => setIsBurdonCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isAutomaticThoughts && (
                <button
                  type="button"
                  onClick={() => setIsAutomaticThoughtsCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isBasarisizlikNedenleri && (
                <button
                  type="button"
                  onClick={() => setIsBasarisizlikNedenleriCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isCalismaDavranisi && (
                <button
                  type="button"
                  onClick={() => setIsCalismaDavranisiCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isProblemTarama && (
                <button
                  type="button"
                  onClick={() => setIsProblemTaramaCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isRosenberg && (
                <button
                  type="button"
                  onClick={() => setIsRosenbergCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isKGBN && (
                <button
                  type="button"
                  onClick={() => setIsKGBNCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              {isAkademikBenlik && (
                <button
                  type="button"
                  onClick={() => setIsAkademikBenlikCollectiveOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Toplu Sonuçlar Çizelgesi</span>
                </button>
              )}
              <button
                type="button"
                onClick={loadApplications}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı, okul no veya sınıf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Toplam <strong>{filteredApplications.length}</strong> kayıt listeleniyor
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">Uygulamalar yükleniyor...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-700 font-bold text-xs">Uygulama Kaydı Bulunamadı</div>
                <div className="text-slate-400 text-xs italic">
                  {searchTerm.trim() 
                    ? `"${searchTerm}" ile eşleşen sonuç bulunamadı.` 
                    : 'Bu teste ait henüz tamamlanmış bir öğrenci uygulaması bulunmuyor.'}
                </div>
              </div>
            ) : (
              <table className="pdr-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">SIRA</th>
                    <th className="w-28">OKUL NO</th>
                    <th>ÖĞRENCİ ADI SOYADI</th>
                    <th className="w-20">SINIF</th>
                    {!survey && <th>TEST ADI</th>}
                    <th className="w-28 text-center">UYGULAMA #</th>
                    <th className="w-28">TARİH</th>
                    <th className="w-32 text-center">
                      {isMeslekDegeri ? "1. ÖNCELİK" : 
                       isHollandKisa ? "İLK 3 TİP (KOD)" : 
                       isHolland ? "BASKIN TİP" : 
                       isAcademicProcrastination ? "ERTELEME PUANI" : 
                       isWestside ? "ORTALAMA PUAN" : 
                       isAkademikBenlik ? "GENEL ORTALAMA" : 
                       isAutomaticThoughts ? "TOPLAM PUAN" :
                       isBurdon ? "DOĞRU SAYISI" :
                       isBasarisizlikNedenleri ? "İŞARETLENEN" :
                       isCalismaDavranisi ? "UYGUNSUZ SAYI" :
                       "PUAN"}
                    </th>
                    <th>DEĞERLENDİRME</th>
                    <th className="w-28 text-center">İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app, idx) => {
                    const interpLabel = app.resultSnapshot?.interpretation?.label;
                    const interpDesc = app.resultSnapshot?.interpretation?.description;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="text-center font-mono font-medium text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="font-mono text-xs font-semibold text-slate-700">
                          {app.studentNumber}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(app.studentId);
                            }}
                            className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-xs tracking-tight text-left cursor-pointer transition-colors"
                            title="Öğrenci profilini aç"
                          >
                            {app.studentName}
                          </button>
                        </td>
                        <td className="text-xs font-semibold text-slate-600">
                          {app.className || '—'}
                        </td>
                        {!survey && (
                          <td className="text-xs font-bold text-slate-800 max-w-xs truncate">
                            {app.surveyTitle}
                          </td>
                        )}
                        <td className="text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                            Deneme #{app.attemptNumber}
                          </span>
                        </td>
                        <td className="font-mono text-xs text-slate-600 font-medium">
                          {new Date(app.completedAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="text-center font-mono font-extrabold text-xs text-indigo-700">
                          {isMeslekDegeri ? (
                            (() => {
                              const ev = calculateMeslekDegeriEvaluation((app.answers || []).map((a, idx) => ({ questionOrder: a.questionOrder || idx + 1, answerValue: a.answerValue || a.selectedOptionLabel || '' })));
                              const top1 = ev.top3Values[0];
                              return top1 ? (
                                <span className="text-indigo-900 font-extrabold text-xs">
                                  {top1.title} <span className="text-[10px] text-slate-500 font-normal">({top1.averageScore.toFixed(2)})</span>
                                </span>
                              ) : '—';
                            })()
                          ) : isHollandKisa ? (
                            (() => {
                              const ev = calculateHollandKisaEvaluation((app.answers || []).map((a, idx) => ({ questionOrder: a.questionOrder || idx + 1, answerValue: a.answerValue || a.selectedOptionLabel || '' })));
                              return (
                                <span className="text-emerald-800 font-extrabold text-xs">
                                  {ev.hollandCode} <span className="text-[10px] text-slate-500 font-normal">({ev.top3Label})</span>
                                </span>
                              );
                            })()
                          ) : isAcademicProcrastination ? (
                            (() => {
                              const ev = evaluateAcademicProcrastination(app as any);
                              const score = ev.totalScore > 0 ? ev.totalScore : (app.totalScore || 0);
                              return <span className="text-sky-800 font-extrabold text-xs">{score} / 95 (%{ev.procrastinationPercentage})</span>;
                            })()
                          ) : (isAutomaticThoughts || app.surveyId === 'srv-otomatik-dusunceler-olcegi' || app.surveySlug === 'otomatik-dusunceler-olcegi' || (app.surveyTitle && app.surveyTitle.includes('Otomatik Düşünceler'))) ? (
                            (() => {
                              const snapAny = app.resultSnapshot as any;
                              const evalRes = snapAny?.automaticThoughtsEvaluation || snapAny?.rawMetrics?.automaticThoughtsEvaluation;
                              if (evalRes && typeof evalRes.totalScore === 'number' && evalRes.totalScore > 0) {
                                return <span className="text-indigo-800 font-extrabold text-xs">{evalRes.totalScore} / 150</span>;
                              }
                              if (app.totalScore !== undefined && app.totalScore !== null && app.totalScore > 0) {
                                return <span className="text-indigo-800 font-extrabold text-xs">{app.totalScore} / 150</span>;
                              }
                              const ev = evaluateAutomaticThoughts(app);
                              return <span className="text-indigo-800 font-extrabold text-xs">{ev.totalScore} / 150</span>;
                            })()
                          ) : (isCalismaDavranisi || app.surveyId === 'srv-calisma-davranisi-olcegi' || app.surveyId === 'srv-calisma-davranisini-degerlendirme-olcegi' || app.surveySlug === 'calisma-davranisi-olcegi' || app.surveySlug === 'calisma-davranisini-degerlendirme-olcegi' || (app.surveyTitle && app.surveyTitle.includes('Çalışma Davranışı'))) ? (
                            (() => {
                              const snapAny = app.resultSnapshot as any;
                              const evalRes = snapAny?.calismaDavranisiEvaluation || snapAny?.rawMetrics?.calismaDavranisiEvaluation;
                              if (evalRes && typeof evalRes.totalMismatches === 'number') {
                                return <span className="text-amber-800 font-extrabold text-xs">{evalRes.totalMismatches} Uygunsuz</span>;
                              }
                              if (app.totalScore !== undefined && app.totalScore !== null) {
                                return <span className="text-amber-800 font-extrabold text-xs">{app.totalScore} Uygunsuz</span>;
                              }
                              const ev = evaluateCalismaDavranisi(app);
                              return <span className="text-amber-800 font-extrabold text-xs">{ev.totalMismatches} Uygunsuz</span>;
                            })()
                          ) : (isBasarisizlikNedenleri || app.surveyId === 'srv-basarisizlik-nedenleri-anketi' || app.surveySlug === 'basarisizlik-nedenleri-anketi' || (app.surveyTitle && app.surveyTitle.includes('Başarısızlık Nedenleri'))) ? (
                            (() => {
                              const snapAny = app.resultSnapshot as any;
                              const evalRes = snapAny?.bnaEvaluation || snapAny?.rawMetrics?.bnaEvaluation;
                              if (evalRes && typeof evalRes.selectedReasonCount === 'number') {
                                return <span className="text-purple-800 font-extrabold text-xs">{evalRes.selectedReasonCount} Neden</span>;
                              }
                              if (app.totalScore !== undefined && app.totalScore !== null) {
                                return <span className="text-purple-800 font-extrabold text-xs">{app.totalScore} Neden</span>;
                              }
                              const ev = evaluateIndividualBNA(app);
                              return <span className="text-purple-800 font-extrabold text-xs">{ev.selectedReasonCount} Neden</span>;
                            })()
                          ) : (isBurdon || app.surveyId === 'srv-burdon-dikkat-testi' || app.surveySlug === 'burdon-dikkat-testi' || (app.surveyTitle && app.surveyTitle.includes('Burdon'))) ? (
                            (() => {
                              const snapAny = app.resultSnapshot as any;
                              const evalRes = snapAny?.burdonEvaluation || snapAny?.rawMetrics?.burdonEvaluation;
                              if (evalRes && typeof evalRes.correctMarkings === 'number') {
                                return <span className="text-emerald-800 font-extrabold text-xs">Doğru: {evalRes.correctMarkings}</span>;
                              }
                              if (app.totalScore !== undefined && app.totalScore !== null) {
                                return <span className="text-emerald-800 font-extrabold text-xs">Skor: {app.totalScore}</span>;
                              }
                              const ev = evaluateBurdonTest(app);
                              return <span className="text-emerald-800 font-extrabold text-xs">Doğru: {ev.correctMarkings}</span>;
                            })()
                          ) : isHolland ? (
                            (() => {
                              const ev = calculateHollandEvaluation((app.answers || []).map((a, idx) => ({ questionOrder: a.questionOrder || idx + 1, selectedOptionValue: a.answerValue || a.selectedOptionLabel || '' })));
                              return <span className="text-sky-800 font-extrabold text-xs">{ev.dominantTypeLabel}</span>;
                            })()
                          ) : (isKGBN || app.surveyId === 'srv-kime-gore-ben-neyim' || app.surveySlug === 'kime-gore-ben-neyim' || (app.surveyTitle && app.surveyTitle.includes('Kime Göre Ben Neyim'))) ? (
                            (() => {
                              const snapAny = app.resultSnapshot as any;
                              const evalRes = snapAny?.kgbnEvaluation || snapAny?.rawMetrics?.kgbnEvaluation;
                              if (evalRes && typeof evalRes.selectedCellCount === 'number') {
                                return (
                                  <span className="text-indigo-800 font-extrabold text-xs">
                                    {evalRes.selectedCellCount} / {evalRes.totalPossibleCells || 240}
                                  </span>
                                );
                              }
                              let rawAns: any = snapAny?.rawMetrics?.answers || (app as any).answers_json || app.answers || {};
                              if (typeof rawAns === 'string') {
                                try { rawAns = JSON.parse(rawAns); } catch {}
                              }
                              const ev = evaluateKimeGoreBenNeyim(
                                rawAns,
                                snapAny?.rawMetrics?.otherText || snapAny?.otherText || '',
                                snapAny?.rawMetrics?.customCharacteristics || snapAny?.customCharacteristics || []
                              );
                              return (
                                <span className="text-indigo-800 font-extrabold text-xs">
                                  {ev.selectedCellCount} / {ev.totalPossibleCells || 240}
                                </span>
                              );
                            })()
                          ) : (isAkademikBenlik || app.surveyId === 'srv-akademik-benlik-algisi' || app.surveySlug === 'akademik-benlik-algisi' || (app.surveyTitle && app.surveyTitle.includes('Akademik Benlik'))) ? (
                            (() => {
                              const appAny = app as any;
                              const snapAny = app.resultSnapshot as any;

                              // 1. Direct canonical evaluation from resultSnapshot
                              if (snapAny?.akademikBenlikEvaluation?.overallMean !== undefined && Number(snapAny.akademikBenlikEvaluation.overallMean) > 0) {
                                return <span className="text-blue-800 font-extrabold text-xs">{Number(snapAny.akademikBenlikEvaluation.overallMean).toFixed(2)} / 8.00</span>;
                              }
                              if (snapAny?.rawMetrics?.akademikBenlikEvaluation?.overallMean !== undefined && Number(snapAny.rawMetrics.akademikBenlikEvaluation.overallMean) > 0) {
                                return <span className="text-blue-800 font-extrabold text-xs">{Number(snapAny.rawMetrics.akademikBenlikEvaluation.overallMean).toFixed(2)} / 8.00</span>;
                              }
                              if (appAny.evaluation_result?.overallMean !== undefined && Number(appAny.evaluation_result.overallMean) > 0) {
                                return <span className="text-blue-800 font-extrabold text-xs">{Number(appAny.evaluation_result.overallMean).toFixed(2)} / 8.00</span>;
                              }

                              // 2. Resolve from subscales if present
                              if (app.resultSnapshot?.subscales && Array.isArray(app.resultSnapshot.subscales) && app.resultSnapshot.subscales.length > 0) {
                                const subs = app.resultSnapshot.subscales;
                                const hasAverages = subs.every((s: any) => (s.averageScore !== undefined) || (s.score !== undefined && s.score <= 8));
                                if (hasAverages) {
                                  const avgSum = subs.reduce((acc: number, s: any) => acc + (s.averageScore !== undefined ? Number(s.averageScore) : Number(s.score || 0)), 0);
                                  const mean = subs.length > 0 ? (avgSum / subs.length) : 0;
                                  if (mean > 0) {
                                    return <span className="text-blue-800 font-extrabold text-xs">{mean.toFixed(2)} / 8.00</span>;
                                  }
                                } else {
                                  const rawSum = subs.reduce((acc: number, s: any) => acc + (s.totalScore !== undefined ? Number(s.totalScore) : Number(s.score || 0)), 0);
                                  const count = subs.reduce((acc: number, s: any) => acc + (s.questionCount || 7), 0);
                                  const mean = count > 0 ? (rawSum / count) : 0;
                                  if (mean > 0) {
                                    return <span className="text-blue-800 font-extrabold text-xs">{mean.toFixed(2)} / 8.00</span>;
                                  }
                                }
                              }

                              // 3. Resolve from raw answers
                              let rawObj = appAny.raw_answers || appAny.rawAnswers || appAny.answers_json || appAny.answersJson || snapAny?.rawMetrics?.answers;
                              if (typeof rawObj === 'string') {
                                try { rawObj = JSON.parse(rawObj); } catch { rawObj = null; }
                              } else if (!rawObj && app.answers && Array.isArray(app.answers) && app.answers.length > 0) {
                                rawObj = {};
                                app.answers.forEach((a: any, aIdx: number) => {
                                  const qNum = a.questionOrder || aIdx + 1;
                                  rawObj[`q${qNum}`] = a.selectedOptionValue || a.answerValue || a.selectedOptionLabel || '';
                                });
                              }
                              if (rawObj && typeof rawObj === 'object' && Object.keys(rawObj).length > 0) {
                                const ev = evaluateAkademikBenlikAlgisi(rawObj);
                                if (ev.overallMean > 0) {
                                  return <span className="text-blue-800 font-extrabold text-xs">{ev.overallMean.toFixed(2)} / 8.00</span>;
                                }
                              }

                              // 4. Resolve from totalScore if available
                              if (app.totalScore !== undefined && app.totalScore > 0) {
                                const val = app.totalScore > 8 ? (app.totalScore / 56) : app.totalScore;
                                return <span className="text-blue-800 font-extrabold text-xs">{val.toFixed(2)} / 8.00</span>;
                              }

                              // 5. Final fallback
                              if (snapAny?.akademikBenlikEvaluation?.overallMean !== undefined) {
                                return <span className="text-blue-800 font-extrabold text-xs">{Number(snapAny.akademikBenlikEvaluation.overallMean).toFixed(2)} / 8.00</span>;
                              }
                              return '—';
                            })()
                          ) : isWestside && app.totalScore !== undefined ? (
                            `${(app.totalScore / 11).toFixed(2)} / 5.00`
                          ) : (
                            app.totalScore !== undefined ? app.totalScore : '—'
                          )}
                        </td>
                        <td className="max-w-xs truncate">
                          {isWestside && app.totalScore !== undefined ? (
                            (() => {
                              const ev = getWestsideEvaluation(app.totalScore);
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${ev.category.colorClasses.badge}`}>
                                  {ev.category.categoryLabel}
                                </span>
                              );
                            })()
                          ) : (isAutomaticThoughts || app.surveyId === 'srv-otomatik-dusunceler-olcegi' || app.surveySlug === 'otomatik-dusunceler-olcegi' || (app.surveyTitle && app.surveyTitle.includes('Otomatik Düşünceler'))) ? (
                            (() => {
                              const ev = evaluateAutomaticThoughts(app);
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${ev.totalScore >= 70 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  <Sparkles className="w-3 h-3" />
                                  <span>{ev.totalScore >= 70 ? 'Yüksek Otomatik Düşünce Düzeyi' : 'Normal Düzey'}</span>
                                </span>
                              );
                            })()
                          ) : (isCalismaDavranisi || app.surveyId === 'srv-calisma-davranisi-olcegi' || app.surveyId === 'srv-calisma-davranisini-degerlendirme-olcegi' || app.surveySlug === 'calisma-davranisi-olcegi' || app.surveySlug === 'calisma-davranisini-degerlendirme-olcegi' || (app.surveyTitle && app.surveyTitle.includes('Çalışma Davranışı'))) ? (
                            (() => {
                              const ev = evaluateCalismaDavranisi(app);
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${ev.totalMismatches > 20 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  <Sparkles className="w-3 h-3" />
                                  <span>{ev.totalMismatches > 20 ? 'Önemli Güçlük Var' : 'Önemli Güçlük Yok'}</span>
                                </span>
                              );
                            })()
                          ) : (isBasarisizlikNedenleri || app.surveyId === 'srv-basarisizlik-nedenleri-anketi' || app.surveySlug === 'basarisizlik-nedenleri-anketi' || (app.surveyTitle && app.surveyTitle.includes('Başarısızlık Nedenleri'))) ? (
                            (() => {
                              const ev = evaluateIndividualBNA(app);
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  <span>{`${ev.selectedReasonCount} Neden İşaretlendi`}</span>
                                </span>
                              );
                            })()
                          ) : (isBurdon || app.surveyId === 'srv-burdon-dikkat-testi' || app.surveySlug === 'burdon-dikkat-testi' || (app.surveyTitle && app.surveyTitle.includes('Burdon'))) ? (
                            (() => {
                              const ev = evaluateBurdonTest(app);
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                  <span>Doğru: {ev.correctMarkings} | Yanlış: {ev.incorrectMarkings} | Atlanan: {ev.omittedTargets}</span>
                                </span>
                              );
                            })()
                          ) : interpLabel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{interpLabel}</span>
                            </span>
                          ) : interpDesc ? (
                            <span className="text-[11px] text-slate-600 truncate">{interpDesc}</span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Puanlandı</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Sonucu Gör</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[11px] text-slate-400">
              Öğrenci adına tıklayarak öğrenci profilini, <strong>"Sonucu Gör"</strong> butonuna basarak detaylı sonuç raporunu inceleyebilirsiniz.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

        {/* Result Detail Sub-Modal */}
        <SurveyResultDetailModal
          application={selectedApplicationForDetail}
          isOpen={Boolean(selectedApplicationForDetail)}
          onClose={() => setSelectedApplicationForDetail(null)}
        />

        {/* Collective Report Modals */}
        <ExamAnxietyCollectiveReportModal
          isOpen={isCollectiveReportOpen}
          onClose={() => setIsCollectiveReportOpen(false)}
        />

        <WestsideExamAnxietyCollectiveReportModal
          isOpen={isWestsideCollectiveReportOpen}
          onClose={() => setIsWestsideCollectiveReportOpen(false)}
        />

        <HollandMeslekiTercihCollectiveReportModal
        isOpen={isHollandCollectiveOpen}
        onClose={() => setIsHollandCollectiveOpen(false)}
      />
      <MeslekDegeriCollectiveReportModal
        isOpen={isMeslekDegeriCollectiveOpen}
        onClose={() => setIsMeslekDegeriCollectiveOpen(false)}
      />
      <HollandKisaMeslekiTaramaCollectiveReportModal
        isOpen={isHollandKisaCollectiveOpen}
        onClose={() => setIsHollandKisaCollectiveOpen(false)}
      />
      <AcademicProcrastinationCollectiveReportModal
        isOpen={isAcademicProcrastinationCollectiveOpen}
        onClose={() => setIsAcademicProcrastinationCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Akademik Erteleme Ölçeği'}
      />
      <BurdonDikkatTestCollectiveReportModal
        isOpen={isBurdonCollectiveOpen}
        onClose={() => setIsBurdonCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Burdon Dikkat Testi'}
      />
      <AutomaticThoughtsCollectiveReportModal
        isOpen={isAutomaticThoughtsCollectiveOpen}
        onClose={() => setIsAutomaticThoughtsCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Otomatik Düşünceler Ölçeği'}
        onViewResult={(app) => setSelectedApplicationForDetail(app)}
      />
      <BasarisizlikNedenleriCollectiveReportModal
        isOpen={isBasarisizlikNedenleriCollectiveOpen}
        onClose={() => setIsBasarisizlikNedenleriCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Başarısızlık Nedenleri Anketi'}
        onViewResult={(app) => setSelectedApplicationForDetail(app)}
      />
      <CalismaDavranisiCollectiveReportModal
        isOpen={isCalismaDavranisiCollectiveOpen}
        onClose={() => setIsCalismaDavranisiCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Çalışma Davranışını Değerlendirme Ölçeği'}
        onViewResult={(app) => setSelectedApplicationForDetail(app)}
      />
      <ProblemTaramaListesiCollectiveReportModal
        isOpen={isProblemTaramaCollectiveOpen}
        onClose={() => setIsProblemTaramaCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Problem Tarama Listesi'}
        onViewResult={(app) => setSelectedApplicationForDetail(app)}
      />
      <RosenbergBenlikSaygisiCollectiveReportModal
        isOpen={isRosenbergCollectiveOpen}
        onClose={() => setIsRosenbergCollectiveOpen(false)}
        applications={applications}
        students={[]}
        surveyTitle={survey?.title || 'Rosenberg Benlik Saygısı Envanteri'}
        onViewResult={(app) => setSelectedApplicationForDetail(app)}
      />
      <KimeGoreBenNeyimCollectiveReportModal
        isOpen={isKGBNCollectiveOpen}
        onClose={() => setIsKGBNCollectiveOpen(false)}
        applications={applications}
      />
      <AkademikBenlikAlgisiCollectiveReportModal
        isOpen={isAkademikBenlikCollectiveOpen}
        onClose={() => setIsAkademikBenlikCollectiveOpen(false)}
        applications={applications}
      />
      </div>
    </ModalPortal>
  );
};
