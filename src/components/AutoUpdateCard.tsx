import React, { useEffect } from 'react';
import { useUpdaterStore } from '../stores/updaterStore';
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Info, 
  ArrowUpCircle
} from 'lucide-react';

export const AutoUpdateCard: React.FC = () => {
  const { 
    status, 
    isChecking, 
    isDownloading, 
    actionError, 
    checkForUpdates, 
    downloadUpdate, 
    quitAndInstall, 
    initListeners 
  } = useUpdaterStore();

  useEffect(() => {
    const unsub = initListeners();
    return () => unsub();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCheckedDate = (timestamp: number | null): string => {
    if (!timestamp) return 'Henüz kontrol edilmedi';
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Otomatik Güncelleme & Sürüm Yönetimi</h3>
            <p className="text-xs text-slate-500">
              Uygulama sürümünüzü kontrol edebilir ve yeni güncellemeleri tek tıkla yükleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Current Version Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Mevcut Sürüm:</span>
          <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200 shadow-2xs">
            v{status.currentVersion}
          </span>
        </div>
      </div>

      {/* Main Status & Action Area */}
      <div className="space-y-4">
        {/* Status Banner */}
        {status.state === 'idle' && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-slate-700">Güncelleme Durumu Beklemede</div>
                <div className="text-[11px] text-slate-500">Son kontrol: {formatCheckedDate(status.checkedAt)}</div>
              </div>
            </div>
            <button
              onClick={() => checkForUpdates()}
              disabled={isChecking}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Güncellemeleri Kontrol Et</span>
            </button>
          </div>
        )}

        {status.state === 'checking' && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <div className="text-xs font-bold text-blue-900">Güncellemeler Kontrol Ediliyor...</div>
              <div className="text-[11px] text-blue-700">En son sürüm bilgisi sorgulanıyor, lütfen bekleyiniz.</div>
            </div>
          </div>
        )}

        {status.state === 'not-available' && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-emerald-900">PDR Manager Güncel!</div>
                <div className="text-[11px] text-emerald-700">
                  En son sürüm olan <strong>v{status.currentVersion}</strong> yüklü. (Son kontrol: {formatCheckedDate(status.checkedAt)})
                </div>
              </div>
            </div>
            <button
              onClick={() => checkForUpdates()}
              disabled={isChecking}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tekrar Kontrol Et</span>
            </button>
          </div>
        )}

        {status.state === 'available' && (
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Yeni Sürüm Bulundu: v{status.availableVersion}</div>
                  <div className="text-[11px] text-indigo-700">
                    Mevcut sürümünüz: <strong>v{status.currentVersion}</strong>. Yeni sürümü hemen indirebilirsiniz.
                  </div>
                </div>
              </div>
              <button
                onClick={() => downloadUpdate()}
                disabled={isDownloading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Şimdi İndir</span>
              </button>
            </div>

            {status.releaseNotes && (
              <div className="p-3 bg-white/80 rounded-lg border border-indigo-100 text-[11px] text-slate-700 space-y-1">
                <div className="font-bold text-indigo-900">Sürüm Notları:</div>
                <div className="whitespace-pre-line leading-relaxed">{status.releaseNotes}</div>
              </div>
            )}
          </div>
        )}

        {status.state === 'downloading' && (
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="font-bold text-blue-900">Güncelleme İndiriliyor...</span>
              </div>
              <div className="font-mono font-bold text-blue-700">
                %{status.progress?.percent || 0}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${status.progress?.percent || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-600 font-mono">
              <span>İndirilen: {formatBytes(status.progress?.transferred || 0)} / {formatBytes(status.progress?.total || 0)}</span>
              <span>Hız: {formatBytes(status.progress?.bytesPerSecond || 0)}/sn</span>
            </div>
          </div>
        )}

        {status.state === 'downloaded' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-950">Güncelleme Hazır! (v{status.availableVersion})</div>
                <div className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  {status.platform === 'darwin' ? (
                    <span>
                      Yeni sürüm DMG dosyası başarıyla indirildi. <strong>&ldquo;DMG&apos;yi Aç&rdquo;</strong> butonuna basarak açılan pencereden PDR Manager uygulamasını Applications (Uygulamalar) klasörüne sürükleyiniz. Mevcut sürümün üzerine yazmanız normaldir; verileriniz ve ayarlarınız silinmez.
                    </span>
                  ) : (
                    <span>
                      Yeni sürüm başarıyla indirildi. Kurulumu tamamlamak için uygulamayı yeniden başlatınız.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => quitAndInstall()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 self-start md:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{status.platform === 'darwin' ? "DMG'yi Aç ve Kur" : "Şimdi Güncelle"}</span>
            </button>
          </div>
        )}

        {status.state === 'error' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-rose-950">
                  {status.errorPhase === 'install'
                    ? 'Güncelleme Kurulamadı'
                    : status.errorPhase === 'download'
                    ? 'Güncelleme İndirilemedi'
                    : 'Güncelleme Kontrolü Yapılamadı'}
                </div>
                <div className="text-[11px] text-rose-700 font-mono break-all max-w-xl mt-0.5">
                  {status.errorMessage || actionError || 'Güncelleme sunucusuna ulaşılamadı.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (status.errorPhase === 'install') {
                  quitAndInstall();
                } else if (status.errorPhase === 'download') {
                  downloadUpdate();
                } else {
                  checkForUpdates();
                }
              }}
              disabled={isChecking || isDownloading}
              className="px-3 py-1.5 bg-white hover:bg-rose-100/50 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ml-3"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
              <span>Tekrar Dene</span>
            </button>
          </div>
        )}

        {status.state === 'dev-mode' && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-900">Geliştirme / Yerel Ortam (Dev Mode)</div>
                <div className="text-[11px] text-amber-700">
                  Geliştirici ortamında otomatik arka plan güncellemeleri devre dışıdır. Canlı update akışı paketlenmiş (Setup.exe) sürümde aktifleşir.
                </div>
              </div>
            </div>
            <button
              onClick={() => checkForUpdates()}
              className="px-3 py-1.5 bg-white hover:bg-amber-100/50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Durumu Yenile</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety & Architecture Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-slate-800">Veritabanı & Veri Güvenliği</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Güncelleme işlemi sırasında SQLite veritabanı, öğrenci kayıtları, anket sonuçları ve ayarlar kesinlikle silinmez veya sıfırlanmaz.
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-slate-800">Sıfır Ek Kurulum (Tokenless)</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              Güncelleme için GitHub hesabı, token veya ek bir program gerekmez. Tüm işlemler PDR Manager içerisinden güvenle yönetilir.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
