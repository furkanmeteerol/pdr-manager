import React, { useState } from 'react';
import { useUpdaterStore } from '../stores/updaterStore';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  X
} from 'lucide-react';

export const UpdateNotificationBanner: React.FC = () => {
  const { status, isDownloading, downloadUpdate, quitAndInstall } = useUpdaterStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // If no available/downloaded update or dismissed for this session, don't show
  if (isDismissed) return null;
  if (status.state !== 'available' && status.state !== 'downloading' && status.state !== 'downloaded') {
    return null;
  }

  return (
    <aside aria-label="Güncelleme Bildirimi" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-medium z-30 shrink-0 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          {status.state === 'downloaded' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          ) : status.state === 'downloading' ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-200 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
        </div>

        <div>
          {status.state === 'available' && (
            <span>
              <strong>Yeni Güncelleme Bulundu:</strong> PDR Manager <strong>v{status.availableVersion}</strong> yayında!
            </span>
          )}

          {status.state === 'downloading' && (
            <div className="flex items-center gap-2">
              <span>Güncelleme indiriliyor... <strong>%{status.progress?.percent || 0}</strong></span>
              <div className="w-28 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${status.progress?.percent || 0}%` }}
                />
              </div>
            </div>
          )}

          {status.state === 'downloaded' && (
            <span>
              <strong>Güncelleme Hazır!</strong> PDR Manager <strong>v{status.availableVersion}</strong> başarıyla indirildi. {status.platform === 'darwin' ? "DMG'yi açarak Applications'a sürükleyiniz." : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {status.state === 'available' && (
          <>
            <button
              onClick={() => downloadUpdate()}
              disabled={isDownloading}
              className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Şimdi İndir</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Daha Sonra
            </button>
          </>
        )}

        {status.state === 'downloaded' && (
          <>
            <button
              onClick={() => quitAndInstall()}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{status.platform === 'darwin' ? "DMG'yi Aç ve Kur" : "Şimdi Güncelle ve Yeniden Başlat"}</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-2 py-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Daha Sonra
            </button>
          </>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
          title="Kapat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
