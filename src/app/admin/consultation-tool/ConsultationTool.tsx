"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import SignaturePad from 'signature_pad';
import { PenTool, Image as ImageIcon, Save, X, Trash2, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Set PDF.js worker using unpkg
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Signature {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  pageIndex: number;
}

interface PdfPage {
  dataUrl: string;
  width: number;
  height: number;
}

interface ConsultationToolProps {
  fileUrl?: string;
  onSigned?: (signedUrl: string) => Promise<void>;
}

export default function ConsultationTool({ fileUrl, onSigned }: ConsultationToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isPenActive, setIsPenActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [penSize, setPenSize] = useState(1.5);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const signaturePads = useRef<(SignaturePad | null)[]>([]);
  const canvasSizesRef = useRef<Array<{ width: number; height: number }>>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (fileUrl) loadInitialFile(fileUrl);
  }, [fileUrl]);

  const scaleSignatureData = useCallback(
    (data: ReturnType<SignaturePad["toData"]>, scaleX: number, scaleY: number) =>
      data.map((group) => ({
        ...group,
        points: group.points.map((point) => ({
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY,
        })),
      })),
    []
  );

  const syncSignaturePadCanvas = useCallback(
    (idx: number, preserveInk = true) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      if (!cssWidth || !cssHeight) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const nextWidth = Math.round(cssWidth * ratio);
      const nextHeight = Math.round(cssHeight * ratio);
      const previousSize = canvasSizesRef.current[idx];
      const previousPad = signaturePads.current[idx];

      const unchanged =
        previousPad &&
        previousSize &&
        previousSize.width === nextWidth &&
        previousSize.height === nextHeight;

      if (unchanged) {
        previousPad.minWidth = penSize * 0.8;
        previousPad.maxWidth = penSize * 2;
        return;
      }

      let preservedData: ReturnType<SignaturePad["toData"]> | null = null;
      if (preserveInk && previousPad && !previousPad.isEmpty()) {
        preservedData = previousPad.toData();
        if (previousSize && previousSize.width > 0 && previousSize.height > 0) {
          const scaleX = nextWidth / previousSize.width;
          const scaleY = nextHeight / previousSize.height;
          if (scaleX !== 1 || scaleY !== 1) {
            preservedData = scaleSignatureData(preservedData, scaleX, scaleY);
          }
        }
      }

      previousPad?.off();

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);

      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: penSize * 0.8,
        maxWidth: penSize * 2
      });
      signaturePads.current[idx] = pad;
      canvasSizesRef.current[idx] = { width: nextWidth, height: nextHeight };

      if (preservedData && preservedData.length > 0) {
        pad.fromData(preservedData);
      }
    },
    [penSize, scaleSignatureData]
  );

  // Handle auto-zoom for mobile on mount/load
  useEffect(() => {
    if (pdfPages.length > 0 && typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const pageWidth = pdfPages[0].width;
        const screenWidth = window.innerWidth - 48; // Padding
        setZoom(screenWidth / pageWidth);
      }
    }
  }, [pdfPages]);

  const loadInitialFile = async (url: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const loadedFile = new File([blob], "document.pdf", { type: "application/pdf" });
      setFile(loadedFile);
      
      const arrayBuffer = await loadedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: PdfPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        pages.push({
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
          width: viewport.width,
          height: viewport.height
        });
      }
      setPdfPages(pages);
    } catch (error) {
      console.error('Error loading initial PDF:', error);
      toast.error('Failed to load document');
    } finally {
      setIsProcessing(false);
    }
  };

  useLayoutEffect(() => {
    if (pdfPages.length === 0) return;
    pdfPages.forEach((_, idx) => syncSignaturePadCanvas(idx, true));
  }, [pdfPages, zoom, syncSignaturePadCanvas]);

  useEffect(() => {
    const handleResize = () => {
      pdfPages.forEach((_, idx) => syncSignaturePadCanvas(idx, true));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfPages, syncSignaturePadCanvas]);

  useEffect(() => () => {
    signaturePads.current.forEach((pad) => pad?.off());
  }, []);

  // Update pen size for all pads
  useEffect(() => {
    signaturePads.current.forEach(pad => {
      if (pad) {
        pad.minWidth = penSize * 0.8;
        pad.maxWidth = penSize * 2;
      }
    });
  }, [penSize]);

  const scrollToPage = (idx: number) => {
    setCurrentPage(idx);
    pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const photo = e.target.files?.[0];
    if (!photo) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) data[i+3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
        const newSignature: Signature = {
          id: Math.random().toString(36).substr(2, 9),
          dataUrl: canvas.toDataURL(),
          x: 50, y: 50, scale: 0.2, pageIndex: currentPage
        };
        setSignatures([...signatures, newSignature]);
        setIsPenActive(false);
        toast.success('Signature extracted and placed');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(photo);
  };

  const generatePdfBlob = async () => {
    if (!file) return null;
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pdfPages.length; i++) {
      const pdfPage = pages[i];
      const pageNode = pageRefs.current[i];
      const pad = signaturePads.current[i];
      if (!pdfPage || !pageNode) continue;
      const { width: pdfPageWidth, height: pdfPageHeight } = pdfPage.getSize();
      const scaleX = pdfPageWidth / pageNode.offsetWidth;
      const scaleY = pdfPageHeight / pageNode.offsetHeight;
      if (pad && !pad.isEmpty()) {
        const inkDataUrl = pad.toDataURL();
        const inkImage = await pdfDoc.embedPng(inkDataUrl);
        pdfPage.drawImage(inkImage, { x: 0, y: 0, width: pdfPageWidth, height: pdfPageHeight });
      }
      const pageSigs = signatures.filter(s => s.pageIndex === i);
      for (const sig of pageSigs) {
        const pngImage = await pdfDoc.embedPng(sig.dataUrl);
        const drawWidth = (pngImage.width / 3) * sig.scale * scaleX;
        const drawHeight = (pngImage.height / 3) * sig.scale * scaleY;
        const drawX = sig.x * scaleX;
        const drawY = pdfPageHeight - (sig.y * scaleY) - drawHeight;
        pdfPage.drawImage(pngImage, { x: drawX, y: drawY, width: drawWidth, height: drawHeight });
      }
    }
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  };

  const handleDownloadOnly = async () => {
    if (!file) return;
    setIsExporting(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Draft_${file.name}`;
      link.click();
      toast.success('Local copy downloaded');
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (!file) return;
    setIsExporting(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;
      
      const fileName = `Signed_${file.name}`;
      const { data: uploadData, error } = await supabase.storage.from('consultation-documents').upload(`${Date.now()}_${fileName}`, blob);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('consultation-documents').getPublicUrl(uploadData.path);
        if (onSigned) await onSigned(publicUrl);
        toast.success('Document finalized');
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Finalization failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans overflow-hidden">
      {/* Premium Sticky Toolbar */}
      <header className="h-20 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 z-[100] shrink-0">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-indigo-600 items-center justify-center shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[10px] md:text-sm font-black tracking-tight uppercase truncate max-w-[120px] md:max-w-[200px]">
                {file?.name || 'Document Viewer'}
              </h1>
              <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <span className={cn("w-1.5 h-1.5 rounded-full", isPenActive ? "bg-indigo-500 animate-pulse" : "bg-emerald-500")} />
                <span className="hidden xs:inline">{isPenActive ? 'Drawing Mode' : 'View Mode'}</span>
                <span className="xs:hidden">{isPenActive ? 'Draw' : 'View'}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block h-8 w-px bg-zinc-800 mx-2" />

          {/* View Controls - Mobile/Desktop */}
          <div className="flex items-center bg-zinc-800/50 rounded-xl p-1 gap-1">
            <button onClick={() => setZoom(Math.max(0.1, zoom - 0.2))} className="p-1.5 md:p-2 hover:bg-zinc-700 rounded-lg transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black w-11 md:w-12 text-center uppercase tracking-tighter">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.2))} className="p-1.5 md:p-2 hover:bg-zinc-700 rounded-lg transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleDownloadOnly}
            disabled={isExporting}
            className="p-2.5 md:px-5 md:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all text-xs font-bold flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" /> 
            <span className="hidden md:inline">Download</span>
          </button>

          <div className="hidden md:block h-8 w-px bg-zinc-800 mx-1" />

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2.5 md:px-8 md:py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-xl"
          >
            {isExporting ? <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Finalize
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        <aside className={cn(
          "absolute inset-y-0 left-0 w-64 border-r border-zinc-800 bg-[#0d0d0d] flex flex-col shrink-0 z-50 transition-transform duration-300 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Thumbnails</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {pdfPages.map((page, idx) => (
              <button
                key={idx}
                onClick={() => scrollToPage(idx)}
                className={cn(
                  "w-full aspect-[1/1.4] rounded-xl border-2 transition-all relative group overflow-hidden bg-white",
                  currentPage === idx ? "border-indigo-600 shadow-2xl scale-[1.02]" : "border-zinc-800 grayscale hover:grayscale-0 hover:border-zinc-600"
                )}
              >
                <img src={page.dataUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Main View Area */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-[#050505] relative custom-scrollbar p-4 md:p-12 scroll-smooth"
          onScroll={(e) => {
            const scrollPos = (e.target as HTMLDivElement).scrollTop;
            const pageHeights = pageRefs.current.map(p => p?.offsetHeight || 0);
            let cumulative = 0;
            const padding = window.innerWidth < 768 ? 16 : 48;
            for (let i = 0; i < pageHeights.length; i++) {
              cumulative += pageHeights[i] + padding;
              if (scrollPos < cumulative) {
                setCurrentPage(i);
                break;
              }
            }
          }}
        >
          <div className="max-w-fit mx-auto space-y-4 md:space-y-12 pb-48">
            {pdfPages.map((page, idx) => (
              <div 
                key={idx}
                ref={el => { pageRefs.current[idx] = el; }}
                className={cn(
                  "relative bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all",
                  currentPage === idx ? "scale-100" : (isPenActive ? "scale-100 opacity-40" : "scale-[0.95] opacity-50")
                )}
                style={{ 
                  width: `${page.width * zoom}px`, 
                  height: `${page.height * zoom}px`,
                  transformOrigin: 'top center'
                }}
              >
                <img src={page.dataUrl} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" alt="" />
                
                {/* Direct Ink Canvas */}
                <canvas 
                  ref={el => { canvasRefs.current[idx] = el; }}
                  className={cn(
                    "absolute inset-0 w-full h-full z-10 signature-pad-canvas",
                    isPenActive && currentPage === idx ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
                  )}
                  style={{
                    touchAction: isPenActive && currentPage === idx ? 'none' : 'auto'
                  }}
                />

                {/* Draggable Signatures */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {signatures.filter(s => s.pageIndex === idx).map((sig) => (
                    <motion.div
                      key={sig.id} drag dragMomentum={false}
                      initial={{ left: sig.x, top: sig.y }}
                      onDragEnd={(_, info) => {
                        setSignatures(signatures.map(s => s.id === sig.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s));
                      }}
                      className={cn("absolute pointer-events-auto cursor-move group/sig", isPenActive && "opacity-30")}
                    >
                      <div className="relative">
                        <img 
                          src={sig.dataUrl} alt="" 
                          style={{ transform: `scale(${sig.scale * (window.innerWidth < 768 ? 0.7 : 1)})`, transformOrigin: 'top left' }}
                          className="max-w-[150px] md:max-w-[250px] select-none"
                        />
                        <button 
                          onClick={() => setSignatures(signatures.filter(s => s.id !== sig.id))}
                          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold opacity-0 group-hover/sig:opacity-100 transition-all shadow-xl"
                        >REMOVE</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Floating Action Button (Lower Right) */}
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 flex flex-col items-end gap-4 z-[200]">
          <AnimatePresence>
            {isPenActive && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 p-3 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col md:gap-6 w-fit max-w-[calc(100vw-2rem)]"
              >
                <div className="flex flex-row md:flex-col gap-4 md:gap-6 items-center md:items-stretch">
                  {/* Custom Rect Thickness Component */}
                  <div className="space-y-2 md:space-y-3">
                    <div className="hidden md:flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <span>Pen Weight</span>
                      <span>{penSize}pt</span>
                    </div>
                    <div className="flex gap-1.5 md:gap-2">
                      {[0.5, 1.5, 3, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => setPenSize(size)}
                          className={cn(
                            "w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl border-2 transition-all flex items-center justify-center relative group",
                            penSize === size ? "bg-indigo-600 border-indigo-500 shadow-lg" : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
                          )}
                        >
                          <div 
                            className="bg-current rounded-full" 
                            style={{ width: `${size * 1.5 + 2}px`, height: `${size * 1.5 + 2}px`, color: penSize === size ? 'white' : '#71717a' }} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:block h-px w-full bg-zinc-800" />
                  <div className="md:hidden w-px h-8 bg-zinc-800" />

                  <div className="flex flex-row gap-2 md:gap-3">
                    <label className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-2 md:gap-3 text-[10px] font-black uppercase tracking-widest group">
                      <ImageIcon className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
                      <span className="hidden md:inline">Upload Signature</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>

                    <button 
                      onClick={() => signaturePads.current[currentPage]?.clear()}
                      className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 transition-all flex items-center justify-center gap-2 md:gap-3 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Clear</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsPenActive(!isPenActive)}
            className={cn(
              "w-14 h-14 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[2.5rem] flex items-center justify-center transition-all shadow-2xl group",
              isPenActive ? "bg-zinc-900 border-2 border-indigo-500 text-indigo-400" : "bg-indigo-600 text-white hover:scale-110 active:scale-95"
            )}
          >
            {isPenActive ? <X className="w-6 h-6 md:w-8 md:h-8" /> : <PenTool className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />}
          </button>
        </div>
      </div>


      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-indigo-500/10 rounded-full" />
              <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 border-t-2 border-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black mt-8 md:mt-12 tracking-tighter text-white uppercase italic">Processing Document</p>
            <p className="text-zinc-500 text-[10px] md:text-xs mt-3 font-bold uppercase tracking-[0.3em]">Calibrating Vector Engine</p>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        
        .signature-pad-canvas {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
