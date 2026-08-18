import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { Lock, KeyRound, ArrowRight, Sparkles, Shield } from 'lucide-react';

export const LockModal: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchStatus, status } = useAppStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (window.api) {
        const res = await window.api.system.unlock({ password });
        if (res.success) {
          await fetchStatus();
        } else {
          setError(res.error || 'Parola hatalı');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Kilit açma hatası');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="opaque-lock-screen"
      className="fixed inset-0 z-[2000] w-screen h-screen min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm text-slate-800 tracking-wider uppercase font-sans">
            PSİKOLOJİK DANIŞMANLIK VE REHBERLİK
          </h1>
          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1.5 mt-0.5">
            <Shield className="w-3.5 h-3.5" />
            PDR Bilgi ve Yönetim Sistemi
          </span>
        </div>
      </div>

      {/* Centered Opaque Lock Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Oturum Kilitlendi</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Öğrenci ve danışmanlık verilerinin gizliliği için lütfen yerel ana parolanızı girin.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Yerel Parola</span>
            </label>
            <input
              id="lock-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer active:scale-[0.99]"
          >
            <span>{isLoading ? 'Doğrulanıyor...' : 'Kilidi Aç'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {status?.schoolName && (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium truncate block">
              {status.schoolName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
