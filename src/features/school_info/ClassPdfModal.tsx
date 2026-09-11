import React, { useState } from 'react';
import { ClassDto } from '@shared/ipc-types';
import { useAppStore } from '../../stores/appStore';
import { 
  X, 
  FileText, 
  Upload, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface ClassPdfModalProps {
  cls: ClassDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClassPdfModal: React.FC<ClassPdfModalProps> = ({ cls, isOpen, onClose }) => {
  const { fetchClasses } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !cls) return null;

  const uploadDateStr = cls.pdfUploadDate || (cls.pdfUploadedAt ? new Date(cls.pdfUploadedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null);
  const uploadTimeStr = cls.pdfUploadTime || (cls.pdfUploadedAt ? new Date(cls.pdfUploadedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null);

  const handleOpenPdf = async () => {
    setErrorMsg(null);
    try {
      if (window.api) {
        const res = await window.api.schools.openClassPdf(cls.id);
        if (!res.success) {
          setErrorMsg(res.error || 'PDF açılamadı.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hata oluştu');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Lütfen geçerli bir PDF dosyası seçiniz.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        if (window.api) {
          await window.api.schools.saveClassPdf(cls.id, file.name, base64Content);
          await fetchClasses();
          setSuccessMsg('Sınıf listesi PDF belgesi başarıyla güncellendi.');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setErrorMsg('Dosya okunamadı');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Yükleme başarısız');
      setIsUploading(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!window.confirm(`${cls.name} sınıfına ait PDF listesini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      if (window.api) {
        await window.api.schools.deleteClassPdf(cls.id);
        await fetchClasses();
        setSuccessMsg('Sınıf listesi PDF belgesi silindi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Silme işlemi başarısız');
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">{cls.name} Sınıf Listesi Belgesi</h3>
              <p className="text-[11px] text-slate-500">Resmi sınıf öğrenci listesi PDF yönetimi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current File Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mevcut Liste Belgesi</span>
            {cls.pdfPath ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate" title={cls.pdfName || 'sinif_listesi.pdf'}>
                      {cls.pdfName || 'sinif_listesi.pdf'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleOpenPdf}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Aç</span>
                    </button>
                    <button
                      onClick={handleDeletePdf}
                      className="p-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="PDF Belgesini Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {(uploadDateStr || uploadTimeStr) && (
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                    {uploadDateStr && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Eklenme: <strong className="text-slate-700 font-semibold">{uploadDateStr}</strong></span>
                      </span>
                    )}
                    {uploadDateStr && uploadTimeStr && <span className="text-slate-300">•</span>}
                    {uploadTimeStr && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Saat: <strong className="text-slate-700 font-semibold">{uploadTimeStr}</strong></span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-1">
                Bu sınıfa ait yüklenmiş resmi PDF listesi bulunmuyor.
              </div>
            )}
          </div>

          {/* Upload / Replace Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {cls.pdfPath ? 'Listeyi Değiştir (Yeni PDF Yükle)' : 'Sınıf Listesi PDF Yükle'}
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-blue-600">
                {isUploading ? 'Dosya Yükleniyor...' : 'Bilgisayardan PDF Seç'}
              </span>
              <span className="text-[10px] text-slate-400">Yalnızca .pdf formatında dosyalar</span>
              <input 
                type="file" 
                accept=".pdf,application/pdf" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
