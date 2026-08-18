import React from 'react';
import { MeetingDto } from '@shared/ipc-types';
import { 
  X, 
  CheckCircle2, 
  Printer,
  Users
} from 'lucide-react';
import { formatIsoToTr } from '../../utils/dateUtils';
import { ModalPortal } from '../../components/ModalPortal';

interface MeetingDetailModalProps {
  meeting: MeetingDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  isOpen,
  onClose
}) => {
  if (!isOpen || !meeting) return null;

  const handlePrint = () => {
    window.print();
  };

  const isGroup = meeting.participantType === 'Grup' || meeting.participantType === 'group' || meeting.meetingType === 'group' || meeting.meetingType === 'group_guidance';

  const participantLabel = (() => {
    if (isGroup) return 'Grup Rehberliği';
    if (meeting.participantType === 'parent' || meeting.meetingType === 'parent') return 'Veli';
    if (meeting.participantType === 'teacher' || meeting.meetingType === 'teacher') return 'Öğretmen';
    return 'Öğrenci';
  })();

  const topicDisplay = meeting.meetingTopic === 'Diğer' && meeting.meetingTopicOther
    ? `Diğer (${meeting.meetingTopicOther})`
    : (meeting.meetingTopic || meeting.subject || '—');

  const activityDisplay = meeting.activityType === 'Diğer' && meeting.activityTypeOther
    ? `Diğer (${meeting.activityTypeOther})`
    : (meeting.activityType || (isGroup ? 'Grup Rehberliği' : meeting.meetingType === 'parent' ? 'Veli Görüşmesi' : meeting.meetingType === 'teacher' ? 'Öğretmen Görüşmesi' : 'Bireysel Öğrenci Görüşmesi'));

  const timeDisplay = meeting.endTime
    ? `${meeting.startTime} – ${meeting.endTime}`
    : meeting.startTime;

  const institutionsDisplay = meeting.referralInstitutions && meeting.referralInstitutions.length > 0
    ? meeting.referralInstitutions.map(inst => inst === 'DİĞER' && meeting.referralOther ? `DİĞER (${meeting.referralOther})` : inst).join(', ')
    : '—';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white print:border-b-2 print:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-lg shrink-0 print:hidden">
              #{meeting.sessionNumber || 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Görüşme Raporu ve Detayları
                </h3>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {isGroup ? `Oturum #${meeting.sessionNumber || 1}` : `Görüşme #${meeting.sessionNumber || 1}`}
                </span>
                {meeting.mebbisProcessed && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>MEBBİS'e İşlendi</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rehberlik ve Psikolojik Danışma Hizmetleri Resmi Görüşme Kaydı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 1. Danışan / Katılımcı Bilgisi */}
          {!isGroup ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Öğrenci Adı Soyadı
                </div>
                <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                  {meeting.studentName || '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Sınıf / Okul No
                </div>
                <div className="font-bold text-slate-700 mt-0.5">
                  {meeting.className || '—'} • No: {meeting.studentNumber || '—'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Görüşme Yapılan Kişi
                </div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {participantLabel}
                  {meeting.parentRelation && ` (${meeting.parentRelation})`}
                </div>
              </div>

              {meeting.teacherName && (
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Öğretmen Bilgisi
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {meeting.teacherName} {meeting.teacherBranch ? `(${meeting.teacherBranch})` : ''}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Grup Rehberliği Katılımcılar Kartı (Req 10) */
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Grup Rehberliği Oturum ve Katılımcı Bilgileri</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px]">
                  Oturum: #{meeting.sessionNumber || 1} {meeting.plannedSessions ? `/ Planlanan: ${meeting.plannedSessions}` : ''}
                </span>
              </div>

              {/* Katılan Öğrenciler Tablosu */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="pdr-table">
                  <thead>
                    <tr>
                      <th className="w-10 text-center">SIRA</th>
                      <th>KATILAN ÖĞRENCİ</th>
                      <th className="w-24">SINIF</th>
                      <th className="w-28">OKUL NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.participants && meeting.participants.length > 0 ? (
                      meeting.participants.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="font-bold text-slate-800">{p.firstName} {p.lastName}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {p.className || '—'}
                            </span>
                          </td>
                          <td className="font-mono text-slate-600">{p.studentNumber}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                          Katılımcı listesi bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Core Meeting Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Görüşme Konusu
              </div>
              <div className="font-bold text-slate-800 mt-1">
                {topicDisplay}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Yapılan Çalışma
              </div>
              <div className="font-bold text-slate-800 mt-1">
                {activityDisplay}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Tarih & Saat
              </div>
              <div className="font-mono text-slate-800 font-bold mt-1">
                {formatIsoToTr(meeting.date)} • {timeDisplay}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Varsa Yönlendirileceği Kurum
              </div>
              <div className="font-bold text-slate-800 mt-1">
                {institutionsDisplay}
              </div>
            </div>
          </div>

          {/* 3. Meeting Summary & Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Görüşme Özeti & Notlar
            </div>
            <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">
              {meeting.summary || meeting.notes || 'Görüşme notu girilmemiş.'}
            </div>
          </div>

          {/* 4. Decisions / Follow Up if any */}
          {meeting.decisions && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Alınan Kararlar / Eylem Planı
              </div>
              <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {meeting.decisions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Raporu Yazdır</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
