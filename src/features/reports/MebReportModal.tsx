import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  GraduationCap, 
  ShieldAlert, 
  Send
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { BepPlanDto, BipPlanDto, RamReferralDto } from '@shared/ipc-types';
import { ModalPortal } from '../../components/ModalPortal';

export const MebReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { students } = useAppStore();
  const [reportType, setReportType] = useState<'student' | 'bep' | 'bip' | 'referral'>('student');
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [bepPlans, setBepPlans] = useState<BepPlanDto[]>([]);
  const [bipPlans, setBipPlans] = useState<BipPlanDto[]>([]);
  const [referrals, setReferrals] = useState<RamReferralDto[]>([]);
  
  const [selectedBepId, setSelectedBepId] = useState<string>('');
  const [selectedBipId, setSelectedBipId] = useState<string>('');
  const [selectedReferralId, setSelectedReferralId] = useState<string>('');

  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
      }
      loadPlans();
    }
  }, [isOpen, students]);

  const loadPlans = async () => {
    try {
      const [beps, bips, refs] = await Promise.all([
        window.api.specialEducation.listAllBepPlans(),
        window.api.specialEducation.listAllBipPlans(),
        window.api.specialEducation.listAllReferrals()
      ]);
      setBepPlans(beps);
      setBipPlans(bips);
      setReferrals(refs);
      if (beps.length > 0) setSelectedBepId(beps[0].id || '');
      if (bips.length > 0) setSelectedBipId(bips[0].id || '');
      if (refs.length > 0) setSelectedReferralId(refs[0].id || '');
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let html = '';
      if (reportType === 'student' && selectedStudentId) {
        html = await window.api.reports.getStudentGuidanceReportHtml(selectedStudentId);
      } else if (reportType === 'bep' && selectedBepId) {
        html = await window.api.reports.getBepPlanReportHtml(selectedBepId);
      } else if (reportType === 'bip' && selectedBipId) {
        html = await window.api.reports.getBipPlanReportHtml(selectedBipId);
      } else if (reportType === 'referral' && selectedReferralId) {
        html = await window.api.reports.getRamReferralReportHtml(selectedReferralId);
      }
      setGeneratedHtml(html);
    } catch (err: any) {
      alert(`Rapor oluşturma hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [reportType, selectedStudentId, selectedBepId, selectedBipId, selectedReferralId, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!generatedHtml) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const handleExportPdf = async () => {
    if (!generatedHtml) return;
    setExporting(true);
    try {
      const res = await window.api.reports.exportHtmlToPdf(generatedHtml);
      if (res.success && res.base64) {
        const blob = new Blob([Buffer.from(res.base64, 'base64')], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `MEB_PDR_Rapor_${reportType}_${Date.now()}.pdf`;
        link.click();
      } else {
        alert(`PDF üretilemedi: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl my-6 flex flex-col h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Resmî MEB Çıktıları & PDF / Matbu Form Raporlama Motoru
                </h2>
                <p className="text-xs text-slate-400">
                  MEB ve RAM standart formlarına uygun, %100 yerel ve Türkçe karakter destekli yazdırılabilir raporlar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={!generatedHtml || loading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                Yazdır (Print)
              </button>
              <button
                onClick={handleExportPdf}
                disabled={!generatedHtml || exporting || loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Oluşturuluyor...' : 'PDF Olarak Kaydet'}
              </button>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors ml-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportType('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  reportType === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Öğrenci Rehberlik Dosyası
              </button>

              <button
                onClick={() => setReportType('bep')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  reportType === 'bep'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                BEP Formu & Kazanımlar
              </button>

              <button
                onClick={() => setReportType('bip')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  reportType === 'bip'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                BİP Davranış Planı
              </button>

              <button
                onClick={() => setReportType('referral')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  reportType === 'referral'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                RAM Eğitsel Değerlendirme (Sevk)
              </button>
            </div>

            {/* Context Selector */}
            <div className="flex items-center gap-2">
              {reportType === 'student' && (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} (#{s.studentNumber})</option>
                  ))}
                </select>
              )}

              {reportType === 'bep' && (
                <select
                  value={selectedBepId}
                  onChange={(e) => setSelectedBepId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {bepPlans.map(b => (
                    <option key={b.id} value={b.id}>{b.studentName || 'Öğrenci'} — {b.title}</option>
                  ))}
                </select>
              )}

              {reportType === 'bip' && (
                <select
                  value={selectedBipId}
                  onChange={(e) => setSelectedBipId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {bipPlans.map(b => (
                    <option key={b.id} value={b.id}>{b.studentName || 'Öğrenci'} — {b.targetBehavior.substring(0, 30)}...</option>
                  ))}
                </select>
              )}

              {reportType === 'referral' && (
                <select
                  value={selectedReferralId}
                  onChange={(e) => setSelectedReferralId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {referrals.map(r => (
                    <option key={r.id} value={r.id}>{r.studentName || 'Öğrenci'} — {r.referralReason.substring(0, 30)}...</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Live A4 Print Preview Body */}
          <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center">
            {loading ? (
              <div className="text-center text-slate-400 my-auto font-medium">Rapor hazırlanıyor...</div>
            ) : generatedHtml ? (
              <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-[210mm] w-full min-h-[297mm] p-8 text-slate-900 border border-slate-200">
                <iframe
                  title="MEB Report Preview"
                  srcDoc={generatedHtml}
                  className="w-full h-full min-h-[750px] border-none"
                />
              </div>
            ) : (
              <div className="text-center text-slate-400 my-auto font-medium">Seçili kritere ait rapor bulunamadı.</div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
