import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [masterKey, setMasterKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMasterKey('');
      setNewPassword('');
      setConfirmPassword('');
      setShowMasterKey(false);
      setShowNew(false);
      setLoading(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!masterKey.trim()) {
      setError('Lütfen Cihaz Master Key\'ini giriniz.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError('Yeni parola en az 4 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni parolalar birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      if (window.api && window.api.system) {
        const res = await window.api.system.changePassword({
          masterKey: masterKey.trim(),
          newPassword
        });

        if (res.success) {
          setSuccess('Yerel kilit parolası başarıyla güncellendi.');
          setMasterKey('');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => {
            onClose();
          }, 1400);
        } else {
          setError(res.error || 'Parola değiştirilemedi.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 tracking-tight">Yerel Parolayı Değiştir</h3>
                <p className="text-[11px] text-slate-400">Master Key doğrulaması ile yeni uygulama kilit parolası belirleyin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Cihaz Master Key'i */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cihaz Master Key'i *</label>
              <div className="relative">
                <input
                  type={showMasterKey ? 'text' : 'password'}
                  required
                  placeholder="Cihazınızın Master Key'ini giriniz"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterKey(!showMasterKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yeni Parola */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Yerel Parola *</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Yeni parolanız (en az 4 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yeni Parola Tekrar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Yeni Yerel Parola (Tekrar) *</label>
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="Yeni parolanızı tekrar giriniz"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Master Key Doğrulaması
              </p>
              <p>Yerel parolayı değiştirmek için cihazınıza ait Master Key gereklidir. Master Key cihazın kalıcı kimliğidir, veritabanı veya yedek paketleriyle taşınamaz.</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{loading ? 'Güncelleniyor...' : 'Parolayı Güncelle'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
