import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const WizardModal: React.FC = () => {
  const [step, setStep] = useState(1);
  const [schoolName, setSchoolName] = useState('Cumhuriyet Anadolu Lisesi');
  const [counselorName, setCounselorName] = useState('Psk. Dan. Ahmet Yılmaz');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [masterRecoveryPassphrase, setMasterRecoveryPassphrase] = useState(
    'pdr-kurtarma-anahtari-2026-guvenli-master-passphrase'
  );
  const [localPassword, setLocalPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { fetchStatus } = useAppStore();

  const handleComplete = async () => {
    if (!localPassword || localPassword !== confirmPassword) {
      setError('Parolalar eşleşmiyor veya boş.');
      return;
    }
    if (localPassword.length < 4) {
      setError('Yerel parola en az 4 karakter olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (window.api) {
        const res = await window.api.system.completeWizard({
          schoolName,
          counselorName,
          academicYear,
          masterRecoveryPassphrase,
          localPassword
        });

        if (res.success) {
          await fetchStatus();
        } else {
          setError(res.error || 'Kurulum tamamlanamadı.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Kurulum hatası');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">PDR Manager Kurulum Sihirbazı</h2>
              <p className="text-xs text-slate-500">İlk çalıştırma ve güvenlik yapılandırması</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Adım {step} / 3
          </span>
        </div>

        {/* Step 1: School Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 mb-2">
              Kurum bilgilerinizi ve rehberlik servisi detaylarını girin:
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Okul / Kurum Adı</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rehber Öğretmen / Psikolojik Danışman Adı</label>
              <input
                type="text"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aktif Öğretim Yılı</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Master Recovery Passphrase */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
              <strong>Önemli (Sıfır-Bilgi Güvenliği):</strong> Bu kurtarma anahtarı, diğer bilgisayarlarınızı (PC B vb.) bağlamak ve yedekleri kurtarmak için kullanılacaktır. Lütfen güvenli bir yere kaydedin.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Master Kurtarma Parolası</label>
              <textarea
                rows={2}
                value={masterRecoveryPassphrase}
                onChange={(e) => setMasterRecoveryPassphrase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Local Password */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500 mb-2">
              Bu bilgisayarda oturumu hızlıca açmak için kullanacağınız yerel parolayı belirleyin:
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bu PC İçin Yerel Parola</label>
              <input
                type="password"
                value={localPassword}
                onChange={(e) => setLocalPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parolayı Tekrar Girin</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <span>İleri</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Kurulumu Tamamla'}</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
