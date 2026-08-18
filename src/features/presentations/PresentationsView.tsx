import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PresentationDto } from '@shared/ipc-types';
import { 
  Presentation, 
  Search, 
  Play, 
  Download, 
  Plus, 
  Trash2
} from 'lucide-react';
import { PresentationUploadModal } from './PresentationUploadModal';
import { PresentationViewerModal } from './PresentationViewerModal';

export const PresentationsView: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activePresentationForViewer, setActivePresentationForViewer] = useState<PresentationDto | null>(null);
  const [deletingPresentation, setDeletingPresentation] = useState<PresentationDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load presentations from IPC
  const loadPresentations = useCallback(async (query?: string) => {
    if (window.api && window.api.presentations) {
      setIsLoading(true);
      try {
        const list = await window.api.presentations.list(query);
        setPresentations(list);
      } catch (err) {
        console.error('Failed to load presentations:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresentations(searchTerm);
    const handleGlobalRefresh = () => {
      loadPresentations(searchTerm);
    };
    window.addEventListener('pdr:data-refreshed', handleGlobalRefresh);
    return () => window.removeEventListener('pdr:data-refreshed', handleGlobalRefresh);
  }, [searchTerm, loadPresentations]);

  // Download Presentation Handler
  const handleDownload = async (id: string) => {
    try {
      if (window.api && window.api.presentations) {
        const result = await window.api.presentations.download(id);
        if (result.error) {
          alert(`Hata: ${result.error}`);
        }
      }
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Sunum indirilirken bir hata oluştu.');
    }
  };

  // Delete Presentation Handler
  const handleConfirmDelete = async () => {
    if (!deletingPresentation) return;

    setIsDeleting(true);
    try {
      if (window.api && window.api.presentations) {
        await window.api.presentations.delete(deletingPresentation.id);
        setDeletingPresentation(null);
        await loadPresentations(searchTerm);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Sunum silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered & A-Z Sorted List
  const filteredPresentations = useMemo(() => {
    let result = [...presentations];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
    // A -> Z Alphabetical sort by Title
    result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    return result;
  }, [presentations, searchTerm]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Sunumlar</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200">
                {presentations.length} Sunum
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              PowerPoint (.pptx) ve PDF (.pdf) sunum arşivi ve tam ekran sunum modu
            </p>
          </div>
        </div>

        {/* Add Presentation Button */}
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Sunum Ekle</span>
        </button>
      </div>

      {/* Top Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sunum ara... (başlık veya açıklama)"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Presentations Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Sunumlar yükleniyor...</span>
        </div>
      ) : filteredPresentations.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
            <Presentation className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-800">Henüz Yüklenmiş Sunum Bulunmuyor</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              PowerPoint veya PDF sunumlarınızı arşivinize eklemek için Sunum Ekle butonunu kullanabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Sunumu Ekle</span>
          </button>
        </div>
      ) : (
        /* 4-Column Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPresentations.map((item) => {
            const ext = item.fileName.split('.').pop()?.toLowerCase();
            const isPdf = ext === 'pdf';
            const countLabel = isPdf
              ? `${item.slideCount || 1} Sayfa`
              : `${item.slideCount || 1} Slayt`;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                {/* Top: Badge + Delete */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border ${
                        isPdf
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {isPdf ? 'PDF' : 'PPTX'}
                    </span>

                    {/* Small Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingPresentation(item)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Sunumu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  {item.description ? (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-2">
                      Açıklama girilmedi
                    </p>
                  )}
                </div>

                {/* Bottom: Slide Count + Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="text-slate-600 font-semibold">{countLabel}</span>
                    <span className="text-[11px] font-mono">{item.fileSizeFormatted}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePresentationForViewer(item)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Sunumu Başlat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(item.id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs shrink-0"
                      title="Orijinal Sunumu İndir"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Sunumu Sil</h3>
                <p className="text-[11px] text-slate-400">Arşiv kayıt kaldırma onayı</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"{deletingPresentation.title}"</strong> adlı sunumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPresentation(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Siliniyor...' : 'Evet, Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <PresentationUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          loadPresentations(searchTerm);
        }}
      />

      {/* Presentation Viewer Modal */}
      <PresentationViewerModal
        presentation={activePresentationForViewer}
        isOpen={Boolean(activePresentationForViewer)}
        onClose={() => setActivePresentationForViewer(null)}
        onDownload={handleDownload}
      />
    </div>
  );
};
