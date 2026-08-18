import React, { useState, useEffect, useMemo } from 'react';
import { CounselorDocumentDto } from '@shared/ipc-types';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  FolderOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

function formatIsoToTr(isoDateStr?: string | null): string {
  if (!isoDateStr) return '—';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDateStr;
}

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<CounselorDocumentDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<CounselorDocumentDto | null>(null);
  const [docToDelete, setDocToDelete] = useState<CounselorDocumentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      if (window.api && window.api.documents) {
        const list = await window.api.documents.list(searchTerm);
        setDocuments(list);
      }
    } catch (err) {
      console.error('Error fetching counselor documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const handleGlobalRefresh = () => {
      fetchDocuments();
    };
    window.addEventListener('pdr:data-refreshed', handleGlobalRefresh);
    return () => window.removeEventListener('pdr:data-refreshed', handleGlobalRefresh);
  }, [searchTerm]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDownload = async (doc: CounselorDocumentDto) => {
    try {
      if (window.api && window.api.documents) {
        // First try native dialog download
        const res = await window.api.documents.download(doc.id);
        if (res.success) {
          showToast(`"${doc.title}" başarıyla indirildi.`);
          return;
        }

        // Fallback: browser blob download via getFileData
        const fileData = await window.api.documents.getFileData(doc.id);
        if (fileData) {
          const byteCharacters = atob(fileData.contentBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileData.fileName || doc.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`"${doc.title}" başarıyla indirildi.`);
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('Dosya indirilirken bir hata oluştu.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      if (window.api && window.api.documents) {
        await window.api.documents.delete(docToDelete.id);
        showToast(`"${docToDelete.title}" evrakı arşivden silindi.`);
        setDocToDelete(null);
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Evrak silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort alphabetically A -> Z
  const filteredAndSortedDocs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = documents.filter(d => {
      if (!term) return true;
      return (
        d.title.toLowerCase().includes(term) ||
        (d.description && d.description.toLowerCase().includes(term)) ||
        d.fileName.toLowerCase().includes(term)
      );
    });

    return list.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  }, [documents, searchTerm]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight">
              Evrak Çantası / Arşiv
            </h1>
            <p className="text-xs text-slate-500">
              PDR danışmanı resmi form, çizelge, dilekçe ve çalışma evrakları arşivi
            </p>
          </div>
        </div>

        {/* + Evrak Ekle Button */}
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Evrak Ekle</span>
        </button>
      </div>

      {/* Toast Message */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Counter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Evrak adı veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            {filteredAndSortedDocs.length} Evrak
          </span>
        </div>
      </div>

      {/* Documents Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Evraklar yükleniyor...</p>
          </div>
        ) : filteredAndSortedDocs.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                {searchTerm ? 'Aramanıza Uygun Evrak Bulunamadı' : 'Henüz Yüklenmiş Evrak Bulunmuyor'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm 
                  ? 'Farklı bir arama terimi deneyebilir veya filtreyi temizleyebilirsiniz.'
                  : 'Sağ üstteki "+ Evrak Ekle" butonuna tıklayarak PDF, Word, Excel veya resim evraklarınızı arşivinize ekleyebilirsiniz.'
                }
              </p>
            </div>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Evrakı Ekle</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="pdr-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>EVRAK ADI</th>
                  <th>AÇIKLAMA</th>
                  <th className="w-36 text-center">YÜKLEME TARİHİ</th>
                  <th className="w-52 text-center">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sıra */}
                    <td className="text-center font-medium text-slate-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* Evrak Adı */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-800 text-xs">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {doc.fileName} • {doc.fileSizeFormatted}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Açıklama */}
                    <td className="text-slate-600 text-xs max-w-sm">
                      {doc.description ? (
                        <span className="line-clamp-2">{doc.description}</span>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Yükleme Tarihi */}
                    <td className="text-center font-mono text-xs text-slate-600">
                      {formatIsoToTr(doc.uploadDate)}
                    </td>

                    {/* İşlemler */}
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Önizle */}
                        <button
                          type="button"
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Evrakı Önizle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Önizle</span>
                        </button>

                        {/* İndir */}
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Dosyayı İndir"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>İndir</span>
                        </button>

                        {/* Sil */}
                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Evrakı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: + Evrak Ekle */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(newDoc) => {
          showToast(`"${newDoc.title}" başarıyla arşive eklendi.`);
          fetchDocuments();
        }}
      />

      {/* Modal: Evrak Önizleme */}
      <DocumentPreviewModal
        document={selectedDocForPreview}
        isOpen={Boolean(selectedDocForPreview)}
        onClose={() => setSelectedDocForPreview(null)}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Evrakı Sil</h4>
                <p className="text-[11px] text-slate-400">Bu işlem geri alınamaz</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">"{docToDelete.title}"</strong> adlı evrakı ve fiziksel dosyasını arşivden silmek istediğinize emin misiniz?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
