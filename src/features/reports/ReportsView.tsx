import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  BarChart3, 
  Users, 
  MessageSquare, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { MebReportModal } from './MebReportModal';

export const ReportsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isMebModalOpen, setIsMebModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await window.api.reports.getSchoolAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await window.api.reports.exportStudentsExcel();
      if (res.success && res.dataBase64) {
        // Trigger browser file download
        const blob = new Blob([Buffer.from(res.dataBase64, 'base64')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = res.fileName || 'ogrenciler.csv';
        link.click();
      }
    } catch (err: any) {
      alert(`Dışa aktarma hatası: ${err.message}`);
    }
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      try {
        const res = await window.api.reports.importStudentsExcel(base64);
        if (res.success) {
          setImportStatus({
            success: true,
            message: `Başarıyla ${res.importedCount} öğrenci sisteme aktarıldı!`
          });
          fetchAnalytics();
        } else {
          setImportStatus({
            success: false,
            message: `İçe aktarma hatası: ${res.errors?.join(', ')}`
          });
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `Hata: ${err.message}`
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-400" />
            Okul Rehberlik İstatistikleri & Excel/CSV Raporlama
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Rehberlik servisi genel dağılım analizleri, MEB resmi matbu formları ve toplu öğrenci içe/dışa aktarımı.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsMebModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 rounded-xl text-xs font-bold transition-all border border-brand-500/30 shadow-sm"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            MEB Resmî Form & PDF Çıktıları
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all border border-slate-700">
            <Upload className="w-4 h-4 text-brand-400" />
            CSV İçe Aktar
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
          >
            <Download className="w-4 h-4" />
            Öğrenci Listesi (CSV)
          </button>
        </div>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
          importStatus.success
            ? 'bg-emerald-950/40 border-emerald-900 text-emerald-300'
            : 'bg-red-950/40 border-red-900 text-red-300'
        }`}>
          {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Toplam Kayıtlı Öğrenci</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <span className="text-2xl font-bold text-slate-100">{analytics?.totalStudents || 0}</span>
          <span className="text-[11px] text-slate-500 block">
            {analytics?.genderDistribution?.male || 0} Erkek • {analytics?.genderDistribution?.female || 0} Kız
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Toplam Seans & Görüşme</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-slate-100">{analytics?.totalMeetings || 0}</span>
          <span className="text-[11px] text-slate-500 block">Bireysel, veli ve öğretmen görüşmeleri</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Uygulanan Deneme Sınavları</span>
            <GraduationCap className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-bold text-slate-100">{analytics?.totalExams || 0}</span>
          <span className="text-[11px] text-slate-500 block">TYT, AYT, LGS denemeleri</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Anket Tamamlama Oranı</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-slate-100">%{analytics?.surveyStats?.completionRate || 0}</span>
          <span className="text-[11px] text-slate-500 block">
            {analytics?.surveyStats?.completed || 0} / {analytics?.surveyStats?.assigned || 0} anket tamamlandı
          </span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Görüşme Nedenleri / Etiketleri */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Görüşme Nedenleri & Konu Dağılımı</h3>
          {analytics?.tagDistribution && analytics.tagDistribution.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.tagDistribution.map((t: any) => (
                <div key={t.name} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-300 font-medium">{t.name}</span>
                  <span className="px-2.5 py-0.5 rounded font-bold bg-brand-500/15 text-brand-400">{t.count} Görüşme</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">Görüşme etiket verisi bulunamadı.</p>
          )}
        </div>

        {/* Görüşme Türleri */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Görüşme Türü Dağılımı</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-300">Bireysel Öğrenci Görüşmesi</span>
              <span className="font-bold text-emerald-400">{analytics?.meetingTypesCount?.student || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-300">Veli Görüşmesi</span>
              <span className="font-bold text-brand-400">{analytics?.meetingTypesCount?.parent || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-slate-300">Öğretmen Müşavirliği</span>
              <span className="font-bold text-purple-400">{analytics?.meetingTypesCount?.teacher || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <MebReportModal 
        isOpen={isMebModalOpen} 
        onClose={() => setIsMebModalOpen(false)} 
      />
    </div>
  );
};
