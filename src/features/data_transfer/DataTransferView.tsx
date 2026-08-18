import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Upload, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Database, 
  Calendar, 
  Users, 
  MessagesSquare, 
  CalendarCheck, 
  ClipboardList,
  RefreshCw,
  X,
  KeyRound,
  Trash2
} from 'lucide-react';
import { BackupComparisonResultDto } from '@shared/ipc-types';
import { useAppStore } from '../../stores/appStore';

export const DataTransferView: React.FC = () => {
  const { fetchAllData } = useAppStore();
  const [currentCounts, setCurrentCounts] = useState<Record<string, number>>({});
  const [lastBackupDateStr, setLastBackupDateStr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string; filePath?: string } | null>(null);
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportConfirmPassword, setExportConfirmPassword] = useState('');
  const [exportPasswordError, setExportPasswordError] = useState('');

  // Inspection & Import Modal State
  const [showPasswordPromptForImport, setShowPasswordPromptForImport] = useState(false);
  const [selectedImportFilePath, setSelectedImportFilePath] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [comparisonData, setComparisonData] = useState<BackupComparisonResultDto | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Database Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetCheckboxChecked, setResetCheckboxChecked] = useState(false);
  const [resetMasterPassword, setResetMasterPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);

  const loadLastBackupInfo = async () => {
    try {
      if (window.api && window.api.dataTransfer && window.api.dataTransfer.getLastBackupInfo) {
        const info = await window.api.dataTransfer.getLastBackupInfo();
        setLastBackupDateStr(info.lastBackupDateStr || null);
      }
    } catch (err) {
      console.error('Failed to load last backup info:', err);
    }
  };

  const loadCurrentCounts = async () => {
    try {
      if (window.api && window.api.dataTransfer) {
        const counts = await window.api.dataTransfer.getCurrentCounts();
        setCurrentCounts(counts || {});
      }
    } catch (err) {
      console.error('Failed to load database counts:', err);
    }
    await loadLastBackupInfo();
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
      await loadCurrentCounts();
      setRefreshFeedback('Tüm veriler başarıyla yenilendi.');
      setTimeout(() => setRefreshFeedback(null), 3000);
    } catch (err: any) {
      console.error('Data refresh error:', err);
      setRefreshFeedback('Veriler yenilenirken hata oluştu.');
      setTimeout(() => setRefreshFeedback(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCurrentCounts();
  }, []);

  // --- EXPORT HANDLERS ---
  const handleOpenExportModal = () => {
    setExportPassword('');
    setExportConfirmPassword('');
    setExportPasswordError('');
    setShowExportModal(true);
  };

  const handleExecuteExport = async () => {
    if (exportPassword.trim().length > 0 && exportPassword !== exportConfirmPassword) {
      setExportPasswordError('Girdiğiniz parolalar birbiriyle eşleşmiyor.');
      return;
    }
    setExportPasswordError('');
    setShowExportModal(false);
    setExportStatus(null);
    setLoading(true);

    try {
      if (window.api && window.api.dataTransfer) {
        const res = await window.api.dataTransfer.exportPackage(exportPassword.trim());
        if (res.canceled) {
          setLoading(false);
          return;
        }
        if (res.success) {
          setExportStatus({
            success: true,
            message: 'Veritabanı başarıyla şifrelenip dışa aktarıldı.',
            filePath: res.filePath
          });
          loadCurrentCounts();
        } else {
          setExportStatus({
            success: false,
            message: res.error || 'Dışa aktarma işlemi tamamlanamadı.'
          });
        }
      }
    } catch (err: any) {
      setExportStatus({
        success: false,
        message: err.message || 'Beklenmeyen hata oluştu.'
      });
    } finally {
      setLoading(false);
    }
  };

  // --- IMPORT HANDLERS ---
  const handleStartImportFlow = async () => {
    setImportStatus(null);
    try {
      if (window.api && window.api.dataTransfer) {
        const sel = await window.api.dataTransfer.selectBackupFile();
        if (sel.canceled || !sel.filePath) {
          return;
        }
        setSelectedImportFilePath(sel.filePath);
        setImportPassword('');
        setShowPasswordPromptForImport(true);
      }
    } catch (err: any) {
      alert(`Dosya seçilirken hata: ${err.message}`);
    }
  };

  const handleInspectWithPassword = async () => {
    if (!selectedImportFilePath) return;
    setIsInspecting(true);
    try {
      if (window.api && window.api.dataTransfer) {
        const res = await window.api.dataTransfer.inspectPackage(selectedImportFilePath, importPassword.trim());
        if (res.isValid) {
          setShowPasswordPromptForImport(false);
          setComparisonData(res);
        } else {
          alert(`Yedek doğrulanamadı:\n${res.error || 'Parola hatalı veya dosya bozuk.'}`);
        }
      }
    } catch (err: any) {
      alert(`Dosya incelenirken hata: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!comparisonData || !comparisonData.filePath) return;

    setIsImporting(true);
    try {
      if (window.api && window.api.dataTransfer) {
        const res = await window.api.dataTransfer.importPackage(comparisonData.filePath, importPassword.trim());
        if (res.success) {
          setComparisonData(null);
          setImportStatus({
            success: true,
            message: 'Veritabanı başarıyla içe aktarıldı! Tüm verileriniz anında güncellendi.'
          });
          // Invalidate and refresh React store & views immediately without reload
          await handleRefreshAll();
        } else {
          setImportStatus({
            success: false,
            message: res.error || 'İçe aktarma işlemi başarısız oldu.'
          });
        }
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'İçe aktarma sırasında hata oluştu.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // --- RESET HANDLERS ---
  const handleOpenResetModal = () => {
    setResetConfirmationText('');
    setResetCheckboxChecked(false);
    setResetMasterPassword('');
    setShowResetModal(true);
    setResetStatus(null);
  };

  const handleExecuteReset = async () => {
    if (resetConfirmationText !== 'VERİLERİ SIFIRLA' || !resetCheckboxChecked) {
      return;
    }
    setIsResetting(true);
    try {
      if (window.api && window.api.dataTransfer) {
        const res = await window.api.dataTransfer.resetDatabase(resetMasterPassword);
        if (res.success) {
          setShowResetModal(false);
          setResetStatus({
            success: true,
            message: 'Veritabanı sıfırlandı. Otomatik güvenlik yedeği alındı, evraklar/sunumlar ve yerel parola korundu.'
          });
          await handleRefreshAll();
        } else {
          alert(`Sıfırlama başarısız oldu: ${res.error}`);
        }
      }
    } catch (err: any) {
      alert(`Sıfırlama hatası: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const ENTITY_LABELS: Record<string, { label: string; icon: any }> = {
    students: { label: 'Öğrenci Kayıtları', icon: Users },
    parents: { label: 'Veli Kayıtları', icon: Users },
    classes: { label: 'Sınıflar & Şubeler', icon: Database },
    meetings: { label: 'Görüşme Kayıtları', icon: MessagesSquare },
    appointments: { label: 'Randevular', icon: CalendarCheck },
    tasks: { label: 'Görevler & Hatırlatıcılar', icon: ClipboardList },
    surveyApplications: { label: 'Anket Uygulama Sonuçları', icon: FileCheck },
    surveys: { label: 'Anket Katalogları', icon: FileCheck },
    dailyNotes: { label: 'Günlük Notlar', icon: Calendar },
    activities: { label: 'Rehberlik Etkinlikleri', icon: Calendar }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>%100 Yerel Veri Yönetimi</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Veri Aktarımı ve Yedekleme
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            İki bilgisayar arasında veritabanı kayıtlarınızı güvenle taşıyın. Tüm veriler PBKDF2 ve AES-256-GCM ile şifrelenir.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {lastBackupDateStr && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Son Yedekleme: <strong className="text-slate-800 font-mono">{lastBackupDateStr}</strong></span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tüm veritabanı kayıtlarını ve ekranları yeniden yükle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Yenileniyor...' : 'Verileri Yenile'}</span>
          </button>
        </div>
      </div>

      {/* Refresh Feedback Notification */}
      {refreshFeedback && (
        <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{refreshFeedback}</span>
        </div>
      )}

      {/* 2. Status Alerts */}
      {exportStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
          exportStatus.success ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-red-50/80 border-red-200 text-red-900'
        }`}>
          {exportStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          <div className="text-xs space-y-1">
            <p className="font-bold">{exportStatus.message}</p>
            {exportStatus.filePath && (
              <p className="font-mono text-[11px] opacity-80 break-all">{exportStatus.filePath}</p>
            )}
          </div>
        </div>
      )}

      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
          importStatus.success ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-red-50/80 border-red-200 text-red-900'
        }`}>
          {importStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          <div className="text-xs font-bold">{importStatus.message}</div>
        </div>
      )}

      {resetStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
          resetStatus.success ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-red-50/80 border-red-200 text-red-900'
        }`}>
          {resetStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          <div className="text-xs font-bold">{resetStatus.message}</div>
        </div>
      )}

      {/* 3. Three Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Export */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Veritabanını Dışa Aktar</h2>
              <p className="text-xs text-slate-500 mt-1">
                SQLite veritabanınızı şifreli <strong>.pdrbak</strong> paketi olarak kaydedin. Yerel parola pakete dahil edilmez.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between font-medium">
                <span>Toplam Öğrenci:</span>
                <strong className="text-slate-800">{currentCounts.students || 0}</strong>
              </div>
              <div className="flex justify-between font-medium">
                <span>Görüşmeler:</span>
                <strong className="text-slate-800">{currentCounts.meetings || 0}</strong>
              </div>
              <div className="flex justify-between font-medium">
                <span>Randevular:</span>
                <strong className="text-slate-800">{currentCounts.appointments || 0}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenExportModal}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Paket Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Dışa Aktar (.pdrbak)</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Import */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Veritabanını İçe Aktar</h2>
              <p className="text-xs text-slate-500 mt-1">
                Diğer bilgisayardan aldığınız <strong>.pdrbak</strong> dosyasını şifresini girerek inceleyin ve içe aktarın.
              </p>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>Güvenli Değiştirme:</strong> İçe aktarma öncesinde mevcut verilerinizin otomatik güvenlik yedeği alınır. Bu cihazın yerel parolası korunur.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartImportFlow}
            disabled={isInspecting}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 active:scale-[0.99] border border-purple-200 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Yedek Seç & Karşılaştır</span>
          </button>
        </div>

        {/* Card 3: Reset */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Veritabanını Sıfırla</h2>
              <p className="text-xs text-slate-500 mt-1">
                Test verilerini temizleyip uygulamayı fabrika ayarlarına döndürün. Anket katalogları ve evrak dosyaları korunur.
              </p>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-[11px] text-rose-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Güvenlik Koruması:</strong> Sıfırlama öncesinde zorunlu otomatik yedek alınır. Evrak/sunum dosyaları silinmez.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenResetModal}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-[0.99] border border-rose-200 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Veritabanını Sıfırla</span>
          </button>
        </div>
      </div>

      {/* 4. Live Storage Entity Counts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mevcut Taşınabilir Veri Sayımları</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Şema Sürümü: v14</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-slate-100">
          {Object.entries(ENTITY_LABELS).map(([key, item]) => {
            const Icon = item.icon;
            const count = currentCounts[key] || 0;
            return (
              <div key={key} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">{item.label}</div>
                  <div className="text-base font-black text-slate-900">{count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL 1: EXPORT PASSWORD MODAL --- */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Yedek Şifreleme Parolası</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Yedek dosyanız AES-256-GCM ile şifrelenecektir. İçe aktarırken bu parolayı girmeniz gerekecektir. Cihaz yerel parolası pakete eklenmez.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Yedekleme Parolası</label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Güvenli bir parola belirleyin"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Parolayı Tekrar Girin</label>
                <input
                  type="password"
                  value={exportConfirmPassword}
                  onChange={(e) => setExportConfirmPassword(e.target.value)}
                  placeholder="Parolayı tekrar girin"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              {exportPasswordError && (
                <p className="text-[11px] text-red-600 font-semibold">{exportPasswordError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
              >
                Yedeği Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: IMPORT PASSWORD PROMPT MODAL --- */}
      {showPasswordPromptForImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Yedek Parolasını Girin</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPasswordPromptForImport(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seçilen <strong>{selectedImportFilePath.split(/[\\/]/).pop()}</strong> dosyasının şifresini çözüp karşılaştırmak için yedekleme parolasını girin.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Yedekleme Parolası</label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Yedekleme parolası"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPasswordPromptForImport(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleInspectWithPassword}
                disabled={isInspecting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isInspecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Şifre Çözülüyor...</span>
                  </>
                ) : (
                  <span>Doğrula & Karşılaştır</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: COMPARISON & DIFF MODAL --- */}
      {comparisonData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Veritabanı Karşılaştırması</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {comparisonData.fileName}
                </h3>
                {comparisonData.manifest && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Yedek Alma Tarihi: {new Date(comparisonData.manifest.exportedAtTimestamp).toLocaleString('tr-TR')} • Şema Sürümü: v{comparisonData.manifest.schemaVersion}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setComparisonData(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800">Kayıt Sayıları ve Fark Tablosu:</div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                      <th className="p-2.5">Veri Türü</th>
                      <th className="p-2.5 text-center">Bu Bilgisayarda (Mevcut)</th>
                      <th className="p-2.5 text-center bg-purple-50/50">Gelen Yedekte</th>
                      <th className="p-2.5 text-center">Fark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonData.comparison && Object.entries(comparisonData.comparison.diff).map(([key, diffItem]) => {
                      const item = diffItem as { incoming: number; current: number; delta: number; isHigher: boolean };
                      const meta = ENTITY_LABELS[key] || { label: key, icon: Database };
                      const Icon = meta.icon;
                      const deltaText = item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? `${item.delta}` : '0';
                      const deltaColor = item.delta > 0 ? 'text-emerald-700 bg-emerald-50' : item.delta < 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-400 bg-slate-50';

                      return (
                        <tr key={key} className="hover:bg-slate-50/60">
                          <td className="p-2.5 flex items-center gap-2 font-semibold text-slate-800">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{meta.label}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600 font-medium">
                            {item.current}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-purple-900 bg-purple-50/30">
                            {item.incoming}
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${deltaColor}`}>
                              {deltaText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Safety Warning Box */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Önemli Bilgilendirme</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Bu işlem <strong>mevcut veritabanının yerine seçtiğiniz yedeği</strong> devreye alacaktır. Herhangi bir veri kaybını önlemek için mevcut verilerinizin <strong>otomatik güvenlik yedeği</strong> alınacaktır. Yerel evrak ve sunum dosyalarınız ile bu bilgisayarın yerel parolası korunacaktır.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setComparisonData(null)}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.99] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Yedek Alınıyor & İçe Aktarılıyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Onayla ve İçe Aktar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DATABASE RESET CONFIRMATION MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Veritabanını Sıfırlama Onayı</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-2">
              <p className="font-bold">⚠️ DİKKAT: Bu işlem geri alınamaz!</p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Tüm öğrenci, görüşme, randevu ve anket uygulama kayıtları kalıcı olarak silinecektir. Sıfırlamadan önce mevcut verilerinizin <strong>otomatik güvenlik yedeği</strong> alınacaktır. Evraklar, sunumlar ve yerel kilit parolası silinmez.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Onaylamak için <strong className="text-rose-600 select-all font-mono">VERİLERİ SIFIRLA</strong> yazın:
                </label>
                <input
                  type="text"
                  value={resetConfirmationText}
                  onChange={(e) => setResetConfirmationText(e.target.value)}
                  placeholder="VERİLERİ SIFIRLA"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono font-bold text-rose-700 uppercase"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reset-checkbox"
                  checked={resetCheckboxChecked}
                  onChange={(e) => setResetCheckboxChecked(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="reset-checkbox" className="text-[11px] text-slate-600 cursor-pointer leading-tight">
                  Verilerimin silineceğini, anket kataloglarının ve yerel dosyalarımın korunacağını ve güvenlik yedeği alınacağını anladım.
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetConfirmationText !== 'VERİLERİ SIFIRLA' || !resetCheckboxChecked || isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sıfırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Veritabanını Sıfırla</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
