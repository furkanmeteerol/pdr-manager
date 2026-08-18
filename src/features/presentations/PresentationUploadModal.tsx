import React, { useState, useRef, useEffect } from 'react';
import { PresentationDto } from '@shared/ipc-types';
import { 
  X, 
  Upload, 
  AlertCircle, 
  Trash2, 
  FileCheck, 
  Presentation 
} from 'lucide-react';
import { getLocalDateIso, formatIsoToTr } from '../../utils/dateUtils';
import { ModalPortal } from '../../components/ModalPortal';

interface PresentationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pres: PresentationDto) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const PresentationUploadModal: React.FC<PresentationUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    base64: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadDateIso = getLocalDateIso();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setIsSubmitting(false);
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (file: File) => {
    setError(null);
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pptx' && ext !== 'pdf') {
      setError('Yalnızca .pptx (PowerPoint) ve .pdf (Acrobat) formatları kabul edilmektedir.');
      return;
    }

    // Auto-fill title from filename if currently empty or matches previous filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1] || '';
      setSelectedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
        base64: base64Content
      });
    };
    reader.onerror = () => {
      setError('Dosya okunurken bir hata oluştu.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Lütfen sunum adını giriniz.');
      return;
    }

    if (!selectedFile) {
      setError('Lütfen yüklenecek bir PowerPoint (.pptx) veya PDF (.pdf) dosyası seçiniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!window.api || !window.api.presentations) {
        throw new Error('Sunum servisi API erişimi bulunamadı.');
      }

      const created = await window.api.presentations.create({
        title: title.trim(),
        description: description.trim() || undefined,
        fileName: selectedFile.name,
        fileBase64: selectedFile.base64,
        mimeType: selectedFile.mimeType,
        fileSize: selectedFile.size
      });

      onSuccess(created);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Sunum kaydedilirken bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Yeni Sunum Yükle</h3>
              <p className="text-xs text-slate-500">PowerPoint (.pptx) veya PDF (.pdf) arşiv kaydı</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dosya Seçimi <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Dosyayı buraya sürükleyin veya <span className="text-blue-600 underline">gözatın</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Desteklenen formatlar: <strong>.pptx, .pdf</strong> (Maksimum 100 MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                    {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[260px]">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Dosyayı Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sunum Adı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Sunum Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Akran Zorbalığı ve Baş Etme Yolları"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs font-medium"
            />
          </div>

          {/* Sunum Açıklaması */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Sunum Açıklaması <span className="text-slate-400 font-normal">(Opsiyonel)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sunumun içeriği, hedef kazanımları veya önemli notlar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Yükleme Tarihi (Otomatik / Read-only) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Yükleme Tarihi</label>
            <input
              type="text"
              disabled
              value={formatIsoToTr(uploadDateIso)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed select-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Sunumu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
