import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { CounselingActivityDto } from '@shared/ipc-types';
import { X, ClipboardList, Check, AlertTriangle } from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface ActivityFormModalProps {
  activity?: CounselingActivityDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ activity, isOpen, onClose }) => {
  const { classes, status, fetchActivities } = useAppStore();
  const [title, setTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setSelectedClassIds(activity.classIds || []);
      setActivityDate(activity.activityDate);
      setParticipantCount(activity.participantCount || 0);
      setNotes(activity.notes || '');
    } else {
      setTitle('');
      setSelectedClassIds([]);
      setActivityDate(new Date().toISOString().split('T')[0]);
      setParticipantCount(0);
      setNotes('');
    }
    setErrorMsg(null);
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Lütfen yapılan çalışma başlığını giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const classNames = selectedClassIds
      .map(id => classes.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    try {
      if (window.api && (window.api as any).activities) {
        if (activity) {
          await (window.api as any).activities.update(activity.id, {
            title: title.trim(),
            classIds: selectedClassIds,
            classNames: classNames || 'Tüm Sınıflar',
            activityDate,
            participantCount,
            notes: notes.trim() || undefined
          });
        } else {
          await (window.api as any).activities.create({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            title: title.trim(),
            classIds: selectedClassIds,
            classNames: classNames || 'Tüm Sınıflar',
            activityDate,
            participantCount,
            notes: notes.trim() || undefined
          });
        }
        await fetchActivities();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kayıt başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {activity ? 'Çalışma Kaydını Düzenle' : 'Yeni Yapılan Çalışma Ekle'}
              </h3>
              <p className="text-[11px] text-slate-500">Rehberlik servisi toplu faaliyet ve seminer kaydı</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Yapılan Çalışma / Faaliyet *</label>
            <input
              type="text"
              placeholder="Örn: Oryantasyon çalışması yapıldı / Sınav Kaygısı semineri verildi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Uygulanan Sınıflar (Birden fazla seçilebilir)</label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 max-h-36 overflow-y-auto">
              {classes.length === 0 ? (
                <span className="text-slate-400 italic text-[11px]">Kayıtlı sınıf bulunamadı.</span>
              ) : (
                classes.map((c) => {
                  const isSelected = selectedClassIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleClass(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Faaliyet Tarihi *</label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Katılımcı Sayısı (Kişi)</label>
              <input
                type="number"
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Açıklama & Çalışma Notları</label>
            <textarea
              rows={2}
              placeholder="Faaliyet içeriği, kullanılan materyaller vb."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Kaydediliyor...' : activity ? 'Güncelle' : 'Çalışmayı Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
