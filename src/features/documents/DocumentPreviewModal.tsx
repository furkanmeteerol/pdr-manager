import React, { useState, useEffect, useRef } from 'react';
import { CounselorDocumentDto, DocumentPreviewDto } from '@shared/ipc-types';
import { PdfViewer, PdfViewerRef } from './PdfViewer';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  AlertCircle, 
  HardDrive, 
  FileSpreadsheet, 
  Info
} from 'lucide-react';
import { ModalPortal } from '../../components/ModalPortal';

interface DocumentPreviewModalProps {
  document: CounselorDocumentDto | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: CounselorDocumentDto) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onDownload
}) => {
  const [previewData, setPreviewData] = useState<DocumentPreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfViewerRef = useRef<PdfViewerRef | null>(null);

  useEffect(() => {
    if (isOpen && doc) {
      setIsLoading(true);
      setError(null);
      setPreviewData(null);

      if (window.api && window.api.documents) {
        window.api.documents.getPreviewData(doc.id)
          .then((res) => {
            if (res) {
              setPreviewData(res);
            } else {
              setError('Evrak verisi okunamadı.');
            }
          })
          .catch((err) => {
            setError(err.message || 'Önizleme yüklenirken bir hata oluştu');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    if (!previewData) {
      window.print();
      return;
    }

    // 1. PDF printing via PdfViewer ref
    if (previewData.fileType === 'pdf' && pdfViewerRef.current) {
      pdfViewerRef.current.print();
      return;
    }

    // 2. DOCX printing via dedicated print window
    if (previewData.fileType === 'docx' && previewData.htmlContent) {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.title}</title>
              <style>
                @page { margin: 15mm; size: auto; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #1e293b;
                  margin: 0;
                  padding: 20px;
                }
                h1, h2, h3, h4, h5, h6 { color: #0f172a; margin-top: 1.2em; margin-bottom: 0.6em; }
                p { margin-top: 0; margin-bottom: 1em; }
                table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                th { background-color: #f8fafc; font-weight: bold; }
                ul, ol { margin-top: 0; margin-bottom: 1em; padding-left: 24px; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px;">${doc.title}</h1>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">${doc.fileName} • ${doc.uploadDate}</p>
              </div>
              <div class="docx-body">
                ${previewData.htmlContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                    window.close();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        return;
      }
    }

    // 3. Image printing
    if (previewData.fileType === 'image' && previewData.contentBase64) {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${doc.title}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
              <img src="data:${doc.mimeType};base64,${previewData.contentBase64}" style="max-width:100%;height:auto;" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWin.document.close();
        return;
      }
    }

    // Fallback: window.print()
    window.print();
  };

  const getFormatBadge = () => {
    const ext = doc.fileName.split('.').pop()?.toUpperCase() || 'DOSYA';
    let colorClasses = 'bg-blue-100 text-blue-800 border-blue-200';
    if (ext === 'PDF') colorClasses = 'bg-rose-100 text-rose-800 border-rose-200';
    if (ext === 'DOC' || ext === 'DOCX') colorClasses = 'bg-sky-100 text-sky-800 border-sky-200';
    if (ext === 'XLS' || ext === 'XLSX') colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${colorClasses}`}>
        {ext}
      </span>
    );
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800 truncate">{doc.title}</h3>
                {getFormatBadge()}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {doc.fileName} • {doc.fileSizeFormatted} • {doc.uploadDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Yazdır Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !previewData}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Evrakı Yazdır"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Yazdır</span>
            </button>

            {/* İndir Button */}
            <button
              type="button"
              onClick={() => onDownload(doc)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Evrakı Bilgisayara İndir"
            >
              <Download className="w-4 h-4" />
              <span>İndir</span>
            </button>

            {/* Kapat Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Preview Area */}
        <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col min-h-0 relative">
          {isLoading ? (
            <div className="m-auto flex flex-col items-center gap-3 text-slate-500">
              <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs font-semibold">Evrak önizlemesi hazırlanıyor...</span>
            </div>
          ) : error || previewData?.error ? (
            <div className="m-auto p-8 rounded-2xl bg-white border border-rose-200 shadow-lg max-w-md text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Önizleme Açılamadı</h4>
              <p className="text-xs text-slate-500">{error || previewData?.error}</p>
              <button
                type="button"
                onClick={() => onDownload(doc)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Dosyayı İndir</span>
              </button>
            </div>
          ) : previewData?.fileType === 'pdf' && previewData.contentBase64 ? (
            /* 1. PDF RENDERER (PDF.JS CANVAS) */
            <PdfViewer
              ref={pdfViewerRef}
              contentBase64={previewData.contentBase64}
              title={doc.title}
            />
          ) : (previewData?.fileType === 'docx' || (previewData?.fileType === 'doc' && previewData?.htmlContent)) ? (
            /* 2. DOCX & DOC RENDERER (HTML IN A4 PAPER) */
            <div className="flex-1 bg-slate-200/80 p-6 overflow-auto flex justify-center">
              <div className="bg-white shadow-xl rounded-md p-10 max-w-4xl w-full min-h-[850px] border border-slate-300 text-slate-800 leading-relaxed text-sm font-sans my-2">
                {/* Docx / Doc Header Information */}
                <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900">{doc.title}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.fileName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${previewData.fileType === 'docx' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {previewData.fileType === 'docx' ? 'Word Belgesi (.docx)' : 'Word 97-2003 (.doc)'}
                  </span>
                </div>

                {previewData.fileType === 'doc' && previewData.docWarning && (
                  <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{previewData.docWarning}</span>
                  </div>
                )}

                {/* Rendered HTML */}
                <div 
                  className="docx-render-content prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 space-y-3"
                  dangerouslySetInnerHTML={{ __html: previewData.htmlContent! }}
                />
              </div>
            </div>
          ) : previewData?.fileType === 'doc' ? (
            /* 3. OLD DOC FORMAT FALLBACK */
            <div className="m-auto p-8 rounded-2xl bg-white border border-amber-200 shadow-lg max-w-lg text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Info className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Eski Word Formatı (.doc)</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {previewData.docWarning || 'Eski Word 97-2003 (.doc) ikili formatı doğrudan uygulama içi HTML önizlemeyi desteklemiyor. Belgeyi görüntülemek için "İndir" butonunu kullanabilir veya güncel .docx formatında yükleyebilirsiniz.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dosya:</span>
                  <span className="font-bold text-slate-700">{doc.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boyut:</span>
                  <span className="font-bold text-slate-700">{doc.fileSizeFormatted}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDownload(doc)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Dosyayı İndir ({doc.fileSizeFormatted})</span>
              </button>
            </div>
          ) : previewData?.fileType === 'image' && previewData.contentBase64 ? (
            /* 4. IMAGE RENDERER */
            <div className="flex-1 p-6 flex items-center justify-center bg-slate-200/80 overflow-auto">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-300 max-w-4xl max-h-full flex items-center justify-center overflow-auto">
                <img
                  src={`data:${doc.mimeType};base64,${previewData.contentBase64}`}
                  alt={doc.title}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>
            </div>
          ) : (
            /* 5. EXCEL / OTHER FORMATS FALLBACK */
            <div className="m-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-lg max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                {previewData?.fileType === 'xlsx' ? (
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-800">{doc.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{doc.fileName}</p>
                {doc.description && (
                  <p className="text-[11px] text-slate-400 mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Dosya Boyutu:</span>
                  <span className="font-bold text-slate-700 font-mono">{doc.fileSizeFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Yükleme Tarihi:</span>
                  <span className="font-bold text-slate-700 font-mono">{doc.uploadDate}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                {previewData?.fileType === 'xlsx' 
                  ? 'Excel çalışma tablosunu görüntülemek ve düzenlemek için bilgisayarınıza indirebilirsiniz.'
                  : 'Bu dosya formatı uygulama içinde doğrudan görüntülenemiyor. Dosyayı indirerek açabilirsiniz.'
                }
              </p>

              <button
                type="button"
                onClick={() => onDownload(doc)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Dosyayı İndir ({doc.fileSizeFormatted})</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>PDR Manager Yerel Evrak Deposu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 rounded-lg text-slate-600 hover:bg-slate-200/60 font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
