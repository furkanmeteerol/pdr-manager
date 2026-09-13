import React, { useState, useEffect } from 'react';
import { X, Bug, CheckCircle2, AlertTriangle, Send, Loader2, ShieldCheck } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
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

    const trimmed = message.trim();
    if (!trimmed) {
      setError('Lütfen karşılaştığınız sorunu veya hatayı açıklayan bir mesaj yazın.');
      return;
    }

    setLoading(true);
    try {
      if (window.api && window.api.feedback) {
        const res = await window.api.feedback.send({ message: trimmed });
        if (res.success) {
          setSuccess('Hata bildiriminiz başarıyla iletildi. Teşekkür ederiz.');
          setMessage('');
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(res.error || 'Bildirim gönderilemedi. İnternet bağlantınızı kontrol edin.');
        }
      } else {
        setError('Geri bildirim servisi şu anda kullanılamıyor.');
      }
    } catch (err: any) {
      setError(err?.message || 'Bildirim gönderilemedi. İnternet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 tracking-tight">Hata / Sorun Bildir</h3>
                <p className="text-[11px] text-slate-400">Karşılaştığınız bir sorunu veya teknik hatayı doğrudan geliştiriciye iletin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{success}</span>
              </div>
            )}

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Sorun Açıklaması *</label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {message.length} karakter
                </span>
              </div>
              <textarea
                required
                rows={5}
                disabled={loading || Boolean(success)}
                placeholder="Karşılaştığınız sorunu veya hatayı yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>

            {/* Privacy & Security Notice */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Gizlilik Güvencesi
              </p>
              <p className="leading-relaxed text-slate-500">
                Bu bildirim yalnızca yazdığınız mesajı, uygulama sürümünü ve temel sistem bilgisini iletir. Öğrenci veya okul verileriniz kesinlikle paylaşılmaz.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !message.trim() || Boolean(success)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Bildirimi Gönder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
