import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  QrCode, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { SurveyDto } from '@shared/ipc-types';
import { ModalPortal } from '../../components/ModalPortal';

export const OfflineSurveyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  surveys: SurveyDto[];
  onImportSuccess?: () => void;
}> = ({ isOpen, onClose, surveys, onImportSuccess }) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import'>('export');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(surveys[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [resultCode, setResultCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    studentMatched?: boolean;
    studentName?: string;
    studentNumber?: string;
    totalScore?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveSubTab('export');
      setSelectedSurveyId(surveys[0]?.id || '');
      setIsExporting(false);
      setResultCode('');
      setIsImporting(false);
      setImportResult(null);
    }
  }, [isOpen, surveys]);

  if (!isOpen) return null;

  const handleExportHtml = async () => {
    if (!selectedSurveyId) return;
    setIsExporting(true);
    try {
      const res = await window.api.surveys.generateOfflinePackageHtml(selectedSurveyId);
      if (res.success && res.html) {
        const survey = surveys.find(s => s.id === selectedSurveyId);
        const fileName = `PDR_Anket_${(survey?.title || 'form').replace(/[^a-zA-Z0-9_-]/g, '_')}_offline.html`;
        const blob = new Blob([res.html], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      } else {
        alert(`Dışa aktarma hatası: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPayload = async () => {
    if (!resultCode.trim()) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await window.api.surveys.importOfflineResult(resultCode.trim());
      if (res.success) {
        setImportResult({
          success: true,
          studentMatched: res.studentMatched,
          studentName: res.studentName,
          studentNumber: res.studentNumber,
          totalScore: res.totalScore
        });
        setResultCode('');
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setImportResult({
          success: false,
          error: res.error || 'Geçersiz veya bozuk sonuç kodu'
        });
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        error: err.message || 'İçe aktarma hatası'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Çevrimdışı Mobil/Tablet Anket Paketi & QR İçe Aktarma
                </h2>
                <p className="text-xs text-slate-400">
                  İnternet bağlantısı olmadan tablet ve telefonlarda doldurulabilen AES-256-GCM şifreli anketler.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Controls */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => { setActiveSubTab('export'); setImportResult(null); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'export'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              1. Taşınabilir Anket Paketi İndir (.html)
            </button>
            <button
              onClick={() => setActiveSubTab('import')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'import'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              2. Çevrimdışı Sonuç Kodu İçe Aktar
            </button>
          </div>

          {/* Tab 1: Export */}
          {activeSubTab === 'export' && (
            <div className="p-6 space-y-5">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Tamamen Bağımsız & Çevrimdışı Güvenlik
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Üretilen HTML dosyası hiçbir internet bağlantısına ihtiyaç duymaz. Öğrenci veya katılımcı anketi doldurduğunda cevaplar tarayıcı içinde <b>AES-256-GCM</b> ile şifrelenir ve ekranda bir <b>QR Kod</b> ile <b>Sonuç Kodu</b> oluşturulur.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paketlenecek Anket Formu *</label>
                <select
                  value={selectedSurveyId}
                  onChange={(e) => setSelectedSurveyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                >
                  {surveys.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.targetMode === 'anonymous_aggregated' ? 'Anonim' : 'Öğrenci Eşleştirmeli'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  onClick={handleExportHtml}
                  disabled={isExporting || !selectedSurveyId}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  {isExporting ? 'Paketleniyor...' : 'Taşınabilir Anket HTML Dosyasını İndir'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Import */}
          {activeSubTab === 'import' && (
            <div className="p-6 space-y-5">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  Şifreli Sonuç Kodunu Girin
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Öğrencinin veya katılımcının mobil cihazında anket tamamlandığında üretilen <code>PDRSURV:v1:...</code> kodunu yapıştırınız.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Şifreli Sonuç Kodu / Payload *</label>
                <textarea
                  value={resultCode}
                  onChange={(e) => setResultCode(e.target.value)}
                  placeholder="PDRSURV:v1:..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  importResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {importResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{importResult.success ? 'Anket Cevapları Başarıyla Doğrulandı ve Kaydedildi!' : 'İçe Aktarma Başarısız'}</span>
                  </div>
                  {importResult.success ? (
                    <p className="text-[11px] text-slate-600">
                      {importResult.studentMatched ? (
                        <><b>{importResult.studentName}</b> (#{importResult.studentNumber}) öğrencisiyle eşleşti. (Toplam Puan: {importResult.totalScore})</>
                      ) : (
                        <>Anonim anket olarak başarıyla toplu istatistiklere eklendi. (Puan: {importResult.totalScore})</>
                      )}
                    </p>
                  ) : (
                    <p className="text-[11px]">{importResult.error}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  onClick={handleImportPayload}
                  disabled={isImporting || !resultCode.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isImporting ? 'Doğrulanıyor...' : 'Şifreli Veriyi Doğrula & SQLite\'a Aktar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
