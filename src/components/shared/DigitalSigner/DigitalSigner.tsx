"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import NextImage from "next/image";
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import SignaturePad from 'signature_pad';
import { 
  PenTool, 
  Image as ImageIcon, 
  Save, 
  X, 
  Trash2, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Loader2,
  FileCheck
} from 'lucide-react';
import { m as motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { playSound } from '@/hooks/useSound';
import { IResideLoading } from '../IResideLoading';

// Configure worker using the local build
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

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

interface DigitalSignerProps {
  initialFile?: File | Blob | string | null;
  onSigned?: (signedBlob: Blob, signatureDataUrl?: string) => void | Promise<void>;
  title?: string;
  isProcessingInitial?: boolean;
  hideToolbar?: boolean;
  hideSidebar?: boolean;
  primaryActionLabel?: string;
  onClose?: () => void;
}

export function DigitalSigner({ 
  initialFile, 
  onSigned, 
  title = "Document Signer",
  isProcessingInitial = false,
  hideToolbar = false,
  hideSidebar = false,
  primaryActionLabel = "Finalize",
  onClose
}: DigitalSignerProps) {
  const [file, setFile] = useState<File | Blob | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(isProcessingInitial);
  const [isExporting, setIsExporting] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isPenActive, setIsPenActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(0.6);
  const [penSize, setPenSize] = useState(1.5);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasDrawnOnCanvas, setHasDrawnOnCanvas] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const signaturePads = useRef<(SignaturePad | null)[]>([]);
  const canvasSizesRef = useRef<Array<{ width: number; height: number }>>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFile) {
        if (typeof initialFile === 'string') {
            loadInitialFileFromUrl(initialFile);
        } else {
            // Create a new local Blob to avoid cross-origin XrayWrapper issues in Firefox
            const localBlob = new Blob([initialFile], { type: (initialFile as any).type || 'application/pdf' });
            setFile(localBlob);
            processFile(localBlob);
        }
    }
  }, [initialFile]);

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
      const cssWidth = Math.round(rect.width);
      const cssHeight = Math.round(rect.height);
      if (!cssWidth || !cssHeight) return;

      const previousSize = canvasSizesRef.current[idx];
      const previousPad = signaturePads.current[idx];

      const unchanged =
        previousPad &&
        previousSize &&
        previousSize.width === cssWidth &&
        previousSize.height === cssHeight;

      if (unchanged) {
        previousPad.minWidth = penSize * 0.8;
        previousPad.maxWidth = penSize * 2;
        return;
      }

      let preservedData: ReturnType<SignaturePad["toData"]> | null = null;
      if (preserveInk && previousPad && !previousPad.isEmpty()) {
        preservedData = previousPad.toData();
        if (previousSize && previousSize.width > 0 && previousSize.height > 0) {
          const scaleX = cssWidth / previousSize.width;
          const scaleY = cssHeight / previousSize.height;
          if (scaleX !== 1 || scaleY !== 1) {
            preservedData = scaleSignatureData(preservedData, scaleX, scaleY);
          }
        }
      }

      previousPad?.off();

      // Set canvas buffer to match CSS size 1:1.
      // SignaturePad internally handles the coordinate mapping via canvas.width / rect.width,
      // so we must NOT add a manual context.scale() — that causes double-scaling and offset.
      canvas.width = cssWidth;
      canvas.height = cssHeight;

      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(37, 99, 235)',
        minWidth: penSize * 0.8,
        maxWidth: penSize * 2
      });

      pad.addEventListener('endStroke', () => {
        checkCanvasStatus();
      });

      signaturePads.current[idx] = pad;
      canvasSizesRef.current[idx] = { width: cssWidth, height: cssHeight };

      if (preservedData && preservedData.length > 0) {
        pad.fromData(preservedData);
      }
    },
    [penSize, scaleSignatureData]
  );

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

  const loadInitialFileFromUrl = async (url: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const loadedFile = new File([blob], "document.pdf", { type: "application/pdf" });
      setFile(loadedFile);
      await processFile(loadedFile);
    } catch (error) {
      console.error('Error loading initial PDF:', error);
      toast.error('Failed to load document');
      setIsProcessing(false);
    }
  };

  const processFile = async (fileToProcess: File | Blob) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await fileToProcess.arrayBuffer();
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
      console.error('Error processing PDF:', error);
      toast.error('Failed to process document');
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
        setSignatures(prev => [...prev, newSignature]);
        setIsPenActive(false);
        playSound("success");
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
      link.download = `Draft_${(file as File).name || 'document.pdf'}`;
      link.click();
      toast.success('Local copy downloaded');
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setIsExporting(false);
    }
  };

  const checkCanvasStatus = useCallback(() => {
    const hasInk = signaturePads.current.some(pad => pad && !pad.isEmpty());
    setHasDrawnOnCanvas(hasInk);
  }, []);

  const handleExport = async () => {
    if (!file) return;
    setShowConfirmation(false);
    setIsExporting(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) return;

      // Extract a single representative signature for backend recording.
      // We must crop to just the ink region — pad.toDataURL() exports the 
      // entire page-sized canvas, making the actual signature appear tiny.
      let representativeSignature = "";
      
      for (let padIdx = 0; padIdx < signaturePads.current.length; padIdx++) {
        const pad = signaturePads.current[padIdx];
        if (pad && !pad.isEmpty()) {
          const srcCanvas = canvasRefs.current[padIdx];
          if (!srcCanvas) continue;
          const ctx = srcCanvas.getContext("2d");
          if (!ctx) continue;

          const imgData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
          const { data, width: imgW, height: imgH } = imgData;

          // Find bounding box of non-transparent pixels
          let minX = imgW, minY = imgH, maxX = 0, maxY = 0;
          for (let y = 0; y < imgH; y++) {
            for (let x = 0; x < imgW; x++) {
              const alpha = data[(y * imgW + x) * 4 + 3];
              if (alpha > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (maxX >= minX && maxY >= minY) {
            // Add padding around the cropped region
            const pad2 = 20;
            minX = Math.max(0, minX - pad2);
            minY = Math.max(0, minY - pad2);
            maxX = Math.min(imgW - 1, maxX + pad2);
            maxY = Math.min(imgH - 1, maxY + pad2);

            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;
            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            const cropCtx = cropCanvas.getContext("2d");
            if (cropCtx) {
              cropCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
              representativeSignature = cropCanvas.toDataURL("image/png");
            }
          }
          break;
        }
      }

      // Fallback to overlay signatures if no ink found
      if (!representativeSignature && signatures.length > 0) {
        representativeSignature = signatures[0].dataUrl;
      }
      
      if (onSigned) await onSigned(blob, representativeSignature);
      else {
          // Default behavior if no onSigned provided
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Signed_${(file as File).name || 'document.pdf'}`;
          link.click();
          toast.success('Document finalized');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Finalization failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-foreground flex flex-col font-sans overflow-hidden">
      {/* 
        Integrated Modern Header 
        - Simplified and focused on the core actions.
      */}
      <header className="h-20 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 z-[100] shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onClose?.()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group"
          >
            <div className="size-10 rounded-full border border-border flex items-center justify-center group-hover:bg-muted transition-colors">
              <X className="size-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Exit Signer</span>
          </button>
          
          <div className="h-8 w-px bg-border/50 mx-2 hidden md:block" />

          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-black tracking-tight truncate max-w-[150px] md:max-w-[300px]">
              {title}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className={cn("size-1.5 rounded-full", isPenActive ? "bg-primary animate-pulse" : "bg-emerald-500")} />
              {isPenActive ? 'Active Signing' : 'Reviewing Document'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted/50 border border-border mr-2">
            <CheckCircle2 className={cn("size-4", signatures.length > 0 || hasDrawnOnCanvas ? "text-emerald-500" : "text-muted-foreground/30")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {signatures.length === 0 && !hasDrawnOnCanvas ? "Awaiting Signature" : "Signature Ready"}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmation(true)}
            disabled={isExporting || (signatures.length === 0 && !hasDrawnOnCanvas)}
            className={cn(
                "px-6 py-2.5 md:px-8 md:py-3 rounded-2xl transition-all text-xs font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-xl relative overflow-hidden group",
                (signatures.length > 0 || hasDrawnOnCanvas)
                    ? "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/20" 
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-50"
            )}
          >
            {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <FileCheck className="size-4" />
            )}
            {primaryActionLabel}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Floating Page Navigator (Left Side) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-3">
          {pdfPages.map((_, idx) => (
            <button
              key={`nav-dot-${idx}`}
              onClick={() => scrollToPage(idx)}
              className={cn(
                "size-3 rounded-full transition-all duration-300",
                currentPage === idx ? "bg-primary h-8" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
              title={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
        {/* Main View Area */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-neutral-100 dark:bg-[#050505] relative custom-scrollbar p-6 md:p-16 lg:p-20 scroll-smooth"
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
          <div className="max-w-fit mx-auto space-y-8 md:space-y-16 pb-64">
            {pdfPages.map((page, idx) => (
              <div 
                key={`pdf-page-${idx}`}
                ref={el => { pageRefs.current[idx] = el; }}
                className={cn(
                  "relative bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-300",
                  currentPage === idx ? "scale-100" : (isPenActive ? "scale-100 opacity-40" : "scale-[0.95] opacity-50")
                )}
                style={{ 
                  width: `${page.width * zoom}px`, 
                  height: `${page.height * zoom}px`,
                  transformOrigin: 'top center'
                }}
              >
                <NextImage src={page.dataUrl} fill className="object-contain pointer-events-none select-none" alt={`Document page ${idx + 1}`} />
                
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
                        setSignatures(prev => prev.map(s => s.id === sig.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s));
                      }}
                      className={cn("absolute pointer-events-auto cursor-move group/sig", isPenActive && "opacity-30")}
                    >
                      <div className="relative">
                        <NextImage 
                          src={sig.dataUrl} alt="Signature overlay" 
                          width={250} height={100}
                          unoptimized
                          style={{ transform: `scale(${sig.scale * (window.innerWidth < 768 ? 0.7 : 1)})`, transformOrigin: 'top left' }}
                          className="max-w-[150px] md:max-w-[250px] select-none h-auto w-auto"
                        />
                        <button 
                          onClick={() => setSignatures(prev => prev.filter(s => s.id !== sig.id))}
                          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black opacity-0 group-hover/sig:opacity-100 transition-all shadow-xl"
                        >REMOVE</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 
          Master Tool Dock
          - Centered, floating, and contains all necessary tools.
        */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-4 w-full px-6">
          <AnimatePresence>
            {isPenActive && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-background/90 backdrop-blur-2xl border border-border p-2 rounded-[2rem] shadow-2xl flex items-center gap-2 mb-2"
              >
                <div className="flex items-center px-4 gap-3 border-r border-border py-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Weight</span>
                  <div className="flex gap-1">
                    {[0.5, 1.5, 3, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPenSize(size)}
                        className={cn(
                          "size-8 rounded-full transition-all flex items-center justify-center",
                          penSize === size ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted"
                        )}
                      >
                        <div 
                          className="bg-current rounded-full" 
                          style={{ width: `${Math.max(2, size * 1.5)}px`, height: `${Math.max(2, size * 1.5)}px` }} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2">
                  <button 
                    onClick={() => {
                      signaturePads.current[currentPage]?.clear();
                      checkCanvasStatus();
                      toast.success("Page cleared");
                    }}
                    className="h-10 px-4 rounded-full hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="size-4" />
                    Clear
                  </button>

                  <label className="h-10 px-4 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <ImageIcon className="size-4" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-background/90 backdrop-blur-2xl border border-border p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center bg-muted/50 rounded-full p-1 gap-1 ml-1">
              <button onClick={() => setZoom(Math.max(0.1, zoom - 0.2))} className="p-2 hover:bg-background rounded-full transition-all active:scale-90">
                <ZoomOut className="size-4" />
              </button>
              <span className="text-[10px] font-black w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(2, zoom + 0.2))} className="p-2 hover:bg-background rounded-full transition-all active:scale-90">
                <ZoomIn className="size-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-border/50" />

            {/* Primary Draw Toggle */}
            <button
              onClick={() => setIsPenActive(!isPenActive)}
              className={cn(
                "h-14 px-8 rounded-full flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-lg active:scale-95",
                isPenActive 
                  ? "bg-red-500 text-white shadow-red-500/20" 
                  : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-105"
              )}
            >
              {isPenActive ? (
                <>
                  <X className="size-4" />
                  Stop Signing
                </>
              ) : (
                <>
                  <PenTool className="size-4" />
                  Sign Document
                </>
              )}
            </button>

            <div className="h-8 w-px bg-border/50" />

            {/* Page Indicator / Quick Nav */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
              <button 
                onClick={() => currentPage > 0 && scrollToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="size-4" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                Pg {currentPage + 1} / {pdfPages.length}
              </span>
              <button 
                onClick={() => currentPage < pdfPages.length - 1 && scrollToPage(currentPage + 1)}
                disabled={currentPage === pdfPages.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      <IResideLoading 
        isVisible={isProcessing || isExporting} 
        title={isExporting ? "Finalizing Document" : "Preparing Document"} 
        subtext={isExporting ? "Encrypting and Saving" : "Building Secure Artifact"} 
      />

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-background border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12 space-y-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 rotate-[10deg]">
                    <ShieldCheck className="size-10 text-primary -rotate-[10deg]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">Make it Official?</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      By finalizing, you confirm that you have reviewed the document and your signature is legally binding.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-4 min-w-0">
                      <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground mb-0.5">Agreement</p>
                        <p className="text-xs text-foreground font-black truncate leading-tight">{title}</p>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleExport}
                    className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Confirm & Finalize
                  </button>
                  <button 
                    onClick={() => setShowConfirmation(false)}
                    className="w-full h-14 rounded-2xl bg-muted text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/80 transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        
        .signature-pad-canvas {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

