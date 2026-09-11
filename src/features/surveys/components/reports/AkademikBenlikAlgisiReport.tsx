import React from 'react';
import { 
  GraduationCap, 
  Printer, 
  User, 
  Calendar, 
  BookOpen, 
  FileText
} from 'lucide-react';
import { SurveyApplicationDto } from '@shared/ipc-types';
import { AkademikBenlikAlgisiResultRenderer } from '../renderers/AkademikBenlikAlgisiResultRenderer';

interface Props {
  application: SurveyApplicationDto;
  onPrint?: () => void;
}

export const AkademikBenlikAlgisiReport: React.FC<Props> = ({ application, onPrint }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const formattedDate = new Date(application.completedAt || application.createdAt || Date.now()).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Akademik Benlik Algısı Ölçeği Raporu</h2>
            <p className="text-xs text-slate-500">Bireysel Profil ve 8 Temel Ders Alanı Değerlendirmesi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Raporu Yazdır / PDF</span>
        </button>
      </div>

      {/* Student Meta Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Öğrenci Adı</div>
            <div className="text-xs font-bold text-slate-800">{application.studentName || 'İsimsiz Öğrenci'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Sınıf / Şube</div>
            <div className="text-xs font-bold text-slate-800">{application.className || '-'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Uygulama Tarihi</div>
            <div className="text-xs font-bold text-slate-800">{formattedDate}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ölçek Kodu</div>
            <div className="text-xs font-bold text-blue-700">ABAÖ-II-56</div>
          </div>
        </div>
      </div>

      {/* Results View */}
      <AkademikBenlikAlgisiResultRenderer application={application} />
    </div>
  );
};
