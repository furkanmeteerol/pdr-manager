import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle
} from 'lucide-react';
import { PresentationDto, PresentationContentDto } from '@shared/ipc-types';
import JSZip from 'jszip';
import { 
  parseZip, 
  buildPresentation, 
  renderSlide, 
  RECOMMENDED_ZIP_LIMITS, 
  PresentationData, 
  SlideHandle 
} from '@aiden0z/pptx-renderer';

// PDF.js import
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ModalPortal } from '../../components/ModalPortal';

interface PresentationViewerModalProps {
  presentation: PresentationDto | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (id: string) => void;
}

/**
 * Normalizes OpenXML PPTX zip entries to ensure embedded modern SVG graphics
 * (which Office 2016+ stores in <asvg:svgBlip r:embed="rIdX"/> inside <a:blip>)
 * are properly exposed with r:embed attributes on <a:blip> for full renderer compatibility.
 */
async function normalizePptxZip(buffer: ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let modified = false;

    const xmlRegex = /^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/;

    for (const [filename, file] of Object.entries(zip.files)) {
      if (xmlRegex.test(filename) && !file.dir) {
        const content = await file.async('text');
        
        // Check if there are any svgBlip elements
        if (content.includes('svgBlip')) {
          const newContent = content.replace(
            /<a:blip\b([^>]*)>([\s\S]*?<\/a:blip>)/gi,
            (fullMatch, attrs, inner) => {
              const svgMatch = inner.match(/<[a-zA-Z0-9_:]*svgBlip\b[^>]*\br:embed="([^"]+)"/i);
              if (svgMatch) {
                const svgRId = svgMatch[1];
                const trimmed = (attrs || '').trim();
                let newAttrs: string;
                if (/\br:embed="[^"]*"/.test(trimmed)) {
                  newAttrs = ` ${trimmed.replace(/\br:embed="[^"]*"/, `r:embed="${svgRId}"`)}`;
                } else {
                  newAttrs = ` r:embed="${svgRId}"${trimmed ? ` ${trimmed}` : ''}`;
                }
                return `<a:blip${newAttrs}>${inner}`;
              }
              return fullMatch;
            }
          );

          if (newContent !== content) {
            zip.file(filename, newContent);
            modified = true;
          }
        }
      }
    }

    if (modified) {
      return await zip.generateAsync({ type: 'arraybuffer' });
    }
  } catch (err) {
    console.warn('[PresentationViewer] PPTX normalization skipped, using raw buffer:', err);
  }

  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }
  const u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

export const PresentationViewerModal: React.FC<PresentationViewerModalProps> = ({
  presentation,
  isOpen,
  onClose,
  onDownload
}) => {
  const [contentDto, setContentDto] = useState<PresentationContentDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation & Zoom State
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // PPTX State
  const [pptxPresentation, setPptxPresentation] = useState<PresentationData | null>(null);
  const activeSlideHandleRef = useRef<SlideHandle | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pptxSlideWrapperRef = useRef<HTMLDivElement>(null);

  // Load Content from IPC
  useEffect(() => {
    if (!isOpen || !presentation) {
      setContentDto(null);
      setPdfDoc(null);
      setPptxPresentation(null);
      if (activeSlideHandleRef.current) {
        try {
          activeSlideHandleRef.current.dispose();
        } catch (_) {}
        activeSlideHandleRef.current = null;
      }
      setCurrentPageIndex(0);
      setTotalPages(1);
      setZoomLevel(1.0);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);
    setCurrentPageIndex(0);
    setZoomLevel(1.0);

    const loadContent = async () => {
      try {
        if (!window.api || !window.api.presentations) {
          throw new Error('Sunum servisi API erişimi bulunamadı.');
        }

        console.log(`[PresentationViewer] Loading presentation: ${presentation.title} (${presentation.fileName})`);
        const data = await window.api.presentations.getContent(presentation.id);
        if (!isMounted) return;

        if (data.error) {
          console.error('[PresentationViewer] Content error from backend:', data.error);
          setLoadError(data.error);
          setIsLoading(false);
          return;
        }

        setContentDto(data);

        if (!data.contentBase64) {
          throw new Error('Sunum dosya içeriği boş.');
        }

        const binaryString = atob(data.contentBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        console.log(`[PresentationViewer] Decoded binary payload: ${bytes.byteLength} bytes. FileType: ${data.fileType}`);

        if (data.fileType === 'pdf') {
          // Initialize PDF.js
          const loadingTask = pdfjsLib.getDocument({
            data: bytes,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true
          });
          const pdf = await loadingTask.promise;
          if (isMounted) {
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages || 1);
            console.log(`[PresentationViewer] PDF.js loaded: ${pdf.numPages} pages.`);
          }
        } else if (data.fileType === 'pptx') {
          // Parse PPTX with @aiden0z/pptx-renderer
          console.log('[PresentationViewer] Normalizing & parsing PPTX zip archive...');
          const normalizedArrayBuffer = await normalizePptxZip(bytes);
          const pptxFiles = await parseZip(normalizedArrayBuffer, RECOMMENDED_ZIP_LIMITS);
          console.log('[PresentationViewer] Building PPTX presentation model...');
          const model = buildPresentation(pptxFiles);
          console.log(`[PresentationViewer] PPTX presentation parsed successfully. Dimensions: ${model.width}x${model.height}, Slides: ${model.slides.length}`);

          if (!model.slides || model.slides.length === 0) {
            throw new Error('PowerPoint dosyasında görüntülenebilecek slayt bulunamadı.');
          }

          if (isMounted) {
            setPptxPresentation(model);
            setTotalPages(model.slides.length);
          }
        }
      } catch (err: any) {
        console.error('[PresentationViewer] Failed to initialize presentation viewer:', err);
        if (isMounted) {
          setLoadError(
            err.message ||
            'Bu PowerPoint dosyası görüntülenirken bir hata oluştu. Dosyayı İndir butonu ile PowerPoint uygulamasında açabilirsiniz.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
      if (activeSlideHandleRef.current) {
        try {
          activeSlideHandleRef.current.dispose();
        } catch (_) {}
        activeSlideHandleRef.current = null;
      }
    };
  }, [isOpen, presentation]);

  // Render PDF Page
  useEffect(() => {
    if (!pdfDoc || contentDto?.fileType !== 'pdf' || !canvasRef.current) return;

    let renderTask: any = null;
    const pageNum = currentPageIndex + 1;

    const renderPdfPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current ? containerRef.current.clientWidth - (isFullscreen ? 32 : 64) : 960;
        const containerHeight = containerRef.current ? containerRef.current.clientHeight - (isFullscreen ? 64 : 120) : 540;

        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const baseScale = Math.min(scaleX, scaleY, 2.5);
        const finalScale = Math.max(0.4, baseScale * zoomLevel);

        const scaledViewport = page.getViewport({ scale: finalScale });

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(scaledViewport.width * outputScale);
        canvas.height = Math.floor(scaledViewport.height * outputScale);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        renderTask = page.render({
          canvasContext: context,
          transform,
          viewport: scaledViewport
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('[PresentationViewer] PDF Page render error:', err);
        }
      }
    };

    renderPdfPage();

    return () => {
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPageIndex, zoomLevel, isFullscreen, contentDto?.fileType]);

  // Render PPTX Slide using @aiden0z/pptx-renderer
  useEffect(() => {
    if (!pptxPresentation || contentDto?.fileType !== 'pptx' || !pptxSlideWrapperRef.current) return;

    const wrapper = pptxSlideWrapperRef.current;

    // Dispose previous slide handle
    if (activeSlideHandleRef.current) {
      try {
        activeSlideHandleRef.current.dispose();
      } catch (_) {}
      activeSlideHandleRef.current = null;
    }

    wrapper.innerHTML = '';

    const slideData = pptxPresentation.slides[currentPageIndex];
    if (!slideData) {
      console.warn(`[PresentationViewer] Slide at index ${currentPageIndex} not found.`);
      return;
    }

    try {
      console.log(`[PresentationViewer] Rendering PPTX slide ${currentPageIndex + 1}/${pptxPresentation.slides.length}`);
      const slideHandle = renderSlide(pptxPresentation, slideData, {
        onNodeError: (nodeId, err) => {
          console.warn(`[PresentationViewer] Node ${nodeId} render warning:`, err);
        },
        onNavigate: (target) => {
          if (target.slideIndex !== undefined) {
            setCurrentPageIndex(target.slideIndex);
          }
        }
      });

      activeSlideHandleRef.current = slideHandle;

      // Calculate scale to fit container preserving aspect ratio
      const containerWidth = containerRef.current ? containerRef.current.clientWidth - (isFullscreen ? 32 : 64) : 960;
      const containerHeight = containerRef.current ? containerRef.current.clientHeight - (isFullscreen ? 64 : 120) : 540;

      const intrinsicW = pptxPresentation.width || 960;
      const intrinsicH = pptxPresentation.height || 540;

      const scaleX = containerWidth / intrinsicW;
      const scaleY = containerHeight / intrinsicH;
      const baseScale = Math.min(scaleX, scaleY, 2.5);
      const finalScale = Math.max(0.3, baseScale * zoomLevel);

      const targetW = Math.round(intrinsicW * finalScale);
      const targetH = Math.round(intrinsicH * finalScale);

      // Setup wrapper styling
      wrapper.style.width = `${targetW}px`;
      wrapper.style.height = `${targetH}px`;
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      wrapper.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.5)';
      wrapper.style.borderRadius = '8px';
      wrapper.style.backgroundColor = '#ffffff';

      // Setup rendered slide element scaling
      const slideEl = slideHandle.element;

      // Auto-fit & Text Overflow Prevention:
      // Prevent artificial text clipping by relaxing overflow:hidden on text boxes
      // and applying high-fidelity auto-fit scaling where text exceeds its bounding box.
      const textContainers = slideEl.querySelectorAll<HTMLElement>('div[style*="flex-direction: column"], div[style*="flex-direction:column"]');
      textContainers.forEach((box) => {
        if (box.style.overflowY === 'hidden') {
          box.style.overflowY = 'visible';
        }
        if (box.style.overflowX === 'hidden') {
          box.style.overflowX = 'visible';
        }
        const parent = box.parentElement;
        if (parent && parent.style.overflow === 'hidden' && !parent.querySelector('img, svg, canvas')) {
          parent.style.overflow = 'visible';
        }
      });

      slideEl.style.transform = `scale(${finalScale})`;
      slideEl.style.transformOrigin = 'top left';
      slideEl.style.position = 'absolute';
      slideEl.style.left = '0';
      slideEl.style.top = '0';

      wrapper.appendChild(slideEl);

      // Post-mount layout refinement for exact normAutofit height convergence
      requestAnimationFrame(() => {
        const boxes = wrapper.querySelectorAll<HTMLElement>('div[style*="flex-direction: column"], div[style*="flex-direction:column"]');
        boxes.forEach((box) => {
          if (box.scrollHeight > box.clientHeight + 4 && box.clientHeight > 40) {
            const autoFitScale = Math.max(0.80, box.clientHeight / box.scrollHeight);
            if (autoFitScale < 0.99) {
              box.style.transform = `scale(${autoFitScale.toFixed(3)})`;
              box.style.transformOrigin = 'top left';
              box.style.width = `${(100 / autoFitScale).toFixed(1)}%`;
            }
          }
          box.style.overflowY = 'visible';
        });
      });

      console.log(`[PresentationViewer] Slide ${currentPageIndex + 1} rendered successfully (${targetW}x${targetH}px, scale=${finalScale.toFixed(3)})`);
    } catch (err: any) {
      console.error(`[PresentationViewer] Failed to render PPTX slide ${currentPageIndex + 1}:`, err);
      wrapper.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff1f2; color: #9f1239; padding: 24px; text-align: center; font-size: 13px;">
          <p style="font-weight: bold; margin-bottom: 8px;">Slayt ${currentPageIndex + 1} Görüntülenemedi</p>
          <p style="font-size: 11px; opacity: 0.8;">${err.message || 'Slayt öğeleri işlenirken bir hata oluştu.'}</p>
        </div>
      `;
    }
  }, [pptxPresentation, currentPageIndex, zoomLevel, isFullscreen, contentDto?.fileType]);

  // Navigation Handlers
  const handleNext = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [currentPageIndex]);

  // Zoom Controls
  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(2.5, parseFloat((z + 0.2).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(0.6, parseFloat((z - 0.2).toFixed(1))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Fullscreen Management
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !presentation) return null;

  const isPptx = presentation.fileName.endsWith('.pptx');

  return (
    <ModalPortal>
      <div
        ref={containerRef}
        className={`fixed inset-0 z-[1000] flex flex-col bg-slate-950 text-white transition-all select-none ${
          isFullscreen ? 'w-screen h-screen p-0 m-0' : 'p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md'
        }`}
      >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 rounded-t-2xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
              isPptx
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isPptx ? 'PPTX' : 'PDF'}
          </span>
          <div className="max-w-md truncate">
            <h2 className="text-sm font-bold text-slate-100 truncate">{presentation.title}</h2>
            <p className="text-[11px] text-slate-400 truncate">{presentation.fileName}</p>
          </div>
        </div>

        {/* Center Controls: Prev, Next, Slide Counter, Zoom */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-all text-slate-200 cursor-pointer shadow-xs"
            title="Önceki Slayt (← / PageUp)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 font-mono text-xs font-bold text-slate-200">
            <span>{currentPageIndex + 1}</span>
            <span className="text-slate-500">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPageIndex >= totalPages - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-all text-slate-200 cursor-pointer shadow-xs"
            title="Sonraki Slayt (→ / PageDown / Space)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="Uzaklaştır (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-300 transition-all cursor-pointer"
              title="Varsayılan Boyut (0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="Yakınlaştır (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Download, Fullscreen, Close */}
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(presentation.id)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer border border-slate-700"
              title="Orijinal Sunumu İndir"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* True Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isFullscreen ? 'Tam Ekrandan Çık (ESC)' : 'Tam Ekran (F / F11)'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tam Ekrandan Çık</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tam Ekran</span>
              </>
            )}
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer border border-slate-700"
            title="Kapat (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto relative bg-slate-900"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleNext();
          }
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">
              {isPptx
                ? 'PowerPoint slaytları hazırlanıyor...'
                : 'PDF sayfaları hazırlanıyor...'}
            </p>
          </div>
        ) : loadError ? (
          <div className="bg-rose-950/60 border border-rose-800 p-6 rounded-2xl max-w-lg text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-rose-100">Sunum Görüntülenemedi</h3>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                Bu PowerPoint dosyası görüntülenirken bir hata oluştu. Dosyayı İndir butonu ile PowerPoint uygulamasında açabilirsiniz.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {onDownload && (
                <button
                  type="button"
                  onClick={() => onDownload(presentation.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Dosyayı İndir</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : contentDto?.fileType === 'pdf' ? (
          <div
            className="relative flex items-center justify-center max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden bg-white"
            onClick={handleNext}
          >
            <canvas ref={canvasRef} className="block max-h-[82vh] w-auto shadow-2xl" />
          </div>
        ) : (
          <div
            ref={pptxSlideWrapperRef}
            className="cursor-pointer transition-all duration-150"
            onClick={handleNext}
          />
        )}
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>Klavye: <strong>← → / Space / PageUp-Down</strong></span>
          <span>•</span>
          <span>Yakınlaştırma: <strong>+ / - / 0</strong></span>
          <span>•</span>
          <span>Tam Ekran: <strong>F / F11</strong></span>
          <span>•</span>
          <span>Çıkış: <strong>ESC</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-medium">
            {isPptx ? `Slayt ${currentPageIndex + 1} / ${totalPages}` : `Sayfa ${currentPageIndex + 1} / ${totalPages}`}
          </span>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
