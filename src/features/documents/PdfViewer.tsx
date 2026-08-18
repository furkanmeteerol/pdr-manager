// Modern JS polyfills for PDF.js compatibility in Electron
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this)
      .map((b: any) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';

if (pdfWorker) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface PdfViewerRef {
  print: () => void;
}

interface PdfViewerProps {
  contentBase64: string;
  title?: string;
}

export const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({ contentBase64, title }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Convert base64 to Uint8Array safely
  const getPdfData = () => {
    const binaryString = atob(contentBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Expose print method to parent
  useImperativeHandle(ref, () => ({
    print: () => {
      const canvases = canvasesRef.current;
      if (!canvases || canvases.length === 0) {
        window.print();
        return;
      }

      const printWin = window.open('', '_blank');
      if (!printWin) {
        window.print();
        return;
      }

      const imagesHtml = canvases
        .map((c) => {
          const dataUrl = c.toDataURL('image/png');
          return `<div style="page-break-after: always; display: flex; justify-content: center; margin-bottom: 20px;">
            <img src="${dataUrl}" style="max-width: 100%; height: auto;" />
          </div>`;
        })
        .join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title || 'PDF Belge'}</title>
            <style>
              @page { margin: 10mm; size: auto; }
              body { margin: 0; background: #fff; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${imagesHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  }));

  useEffect(() => {
    let isMounted = true;
    canvasesRef.current = [];
    setIsLoading(true);
    setError(null);

    const renderPdf = async () => {
      try {
        const data = getPdfData();
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;
        setNumPages(pdf.numPages);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';
        canvasesRef.current = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (!isMounted) return;

          const viewport = page.getViewport({ scale });
          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'pdf-page-wrapper relative shadow-lg rounded-md bg-white border border-slate-200 mb-6 overflow-hidden flex flex-col items-center';

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = 'max-w-full h-auto';

          pageWrapper.appendChild(canvas);

          // Page number tag at bottom
          const pageBadge = document.createElement('div');
          pageBadge.className = 'text-[10px] text-slate-400 font-mono py-1 px-3 bg-slate-50 border-t border-slate-100 w-full text-center select-none';
          pageBadge.innerText = `Sayfa ${pageNum} / ${pdf.numPages}`;
          pageWrapper.appendChild(pageBadge);

          if (containerRef.current) {
            containerRef.current.appendChild(pageWrapper);
          }
          canvasesRef.current.push(canvas);

          if (context) {
            await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('PDF.js render error:', err);
        if (isMounted) {
          setError(err.message || 'PDF dosyası işlenirken bir hata oluştu');
          setIsLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isMounted = false;
    };
  }, [contentBase64, scale]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-200/90 select-none overflow-hidden">
      {/* Zoom / Page Controls Bar */}
      <div className="px-4 py-2 bg-slate-800 text-white flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span>Toplam {numPages > 0 ? `${numPages} Sayfa` : 'Yükleniyor...'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
            disabled={scale <= 0.75 || isLoading}
            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-bold text-slate-200 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setScale((prev) => Math.min(2.5, Number((prev + 0.25).toFixed(2))))}
            disabled={scale >= 2.5 || isLoading}
            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setScale(1.25)}
            disabled={scale === 1.25 || isLoading}
            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-40 ml-1"
            title="Ölçeği Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
        {isLoading && (
          <div className="my-auto flex flex-col items-center gap-3 text-slate-600">
            <div className="w-8 h-8 border-3 border-blue-600/40 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold">PDF sayfaları hazırlanıyor...</p>
          </div>
        )}

        {error && (
          <div className="my-auto p-6 rounded-2xl bg-white border border-rose-200 shadow-md max-w-md text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">PDF Açılamadı</h4>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        )}

        <div ref={containerRef} className="w-full flex flex-col items-center" />
      </div>
    </div>
  );
});

PdfViewer.displayName = 'PdfViewer';
