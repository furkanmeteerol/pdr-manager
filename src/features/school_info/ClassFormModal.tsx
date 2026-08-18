import React, { useState, useEffect } from 'react';
import { ClassDto } from '@shared/ipc-types';
import { useAppStore } from '../../stores/appStore';
import { X, School, Check, AlertTriangle, Upload } from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface ClassFormModalProps {
  cls?: ClassDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({ cls, isOpen, onClose }) => {
  const { status, fetchClasses } = useAppStore();
  const [grade, setGrade] = useState<number>(9);
  const [branch, setBranch] = useState<string>('A');
  const [teacherName, setTeacherName] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (cls) {
      setGrade(cls.grade || 9);
      setBranch(cls.branch || 'A');
      setTeacherName(cls.teacherName || '');
      setPdfFile(null);
    } else {
      setGrade(9);
      setBranch('A');
      setTeacherName('');
      setPdfFile(null);
    }
    setErrorMsg(null);
  }, [cls, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch.trim()) {
      setErrorMsg('Lütfen şube giriniz (ör. A, B, C)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const name = `${grade}-${branch.trim().toUpperCase()}`;

    try {
      if (window.api) {
        let classId = cls?.id;
        if (cls) {
          await window.api.schools.updateClass(cls.id, {
            name,
            grade,
            branch: branch.trim().toUpperCase(),
            teacherName: teacherName.trim() || undefined
          });
        } else {
          const created = await window.api.schools.createClass({
            schoolYearId: status?.activeSchoolYearId || 'default-year',
            name,
            grade,
            branch: branch.trim().toUpperCase(),
            teacherName: teacherName.trim() || undefined
          });
          classId = created.id;
        }

        // If a PDF file is attached, upload it
        if (pdfFile && classId) {
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = async () => {
              try {
                const base64Content = (reader.result as string).split(',')[1];
                await window.api.schools.saveClassPdf(classId!, pdfFile.name, base64Content);
                resolve(true);
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfFile);
          });
        }

        await fetchClasses();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sınıf kaydedilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {cls ? `${cls.name} Sınıfını Düzenle` : 'Yeni Sınıf Ekle'}
              </h3>
              <p className="text-[11px] text-slate-500">Okul kademe ve şube yapılandırması</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sınıf / Kademe *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value={9}>9. Sınıf</option>
                <option value={10}>10. Sınıf</option>
                <option value={11}>11. Sınıf</option>
                <option value={12}>12. Sınıf</option>
                <option value={5}>5. Sınıf</option>
                <option value={6}>6. Sınıf</option>
                <option value={7}>7. Sınıf</option>
                <option value={8}>8. Sınıf</option>
                <option value={1}>1. Sınıf</option>
                <option value={2}>2. Sınıf</option>
                <option value={3}>3. Sınıf</option>
                <option value={4}>4. Sınıf</option>
                <option value={0}>Okul Öncesi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Şube *</label>
              <input
                type="text"
                placeholder="Örn: A, B, C"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                maxLength={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sınıf Rehber Öğretmeni</label>
            <input
              type="text"
              placeholder="Örn: Emre Karataş"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {!cls && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sınıf Listesi PDF (İsteğe Bağlı)
              </label>
              <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-600 truncate">
                    {pdfFile ? pdfFile.name : 'PDF belgesi seçilmedi'}
                  </span>
                </div>
                <label className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-blue-600 cursor-pointer shadow-xs shrink-0">
                  Dosya Seç
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Kaydediliyor...' : cls ? 'Güncelle' : 'Sınıfı Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
