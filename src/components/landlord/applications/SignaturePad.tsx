"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import SignaturePadLibrary from "signature_pad";
import { Eraser, Save, FileText, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DigitalSigner } from "@/components/shared/DigitalSigner/DigitalSigner";
import { toast } from "sonner";

interface SignaturePadProps {
  onSave: (dataUrl: string, blob?: Blob) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  className?: string;
  pdfBlob?: Blob | null;
  documentTitle?: string;
  variant?: 'pad' | 'button';
}

export function SignaturePad({
  onSave,
  onClear,
  width = 600,
  height = 300,
  className,
  pdfBlob,
  documentTitle = "Lease Agreement",
  variant = 'pad'
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLibrary | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [showFullSigner, setShowFullSigner] = useState(false);

  // Initialize signature pad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas for high DPI
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePadLibrary(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "rgb(255, 255, 255)",
      minWidth: 1.5,
      maxWidth: 3.5,
    });

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
    });

    signaturePadRef.current = pad;

    return () => {
      pad.off();
    };
  }, []);

  const clear = useCallback(() => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    onClear?.();
  }, [onClear]);

  const save = useCallback(() => {
    if (signaturePadRef.current?.isEmpty()) return;
    const dataUrl = signaturePadRef.current?.toDataURL("image/png");
    if (dataUrl) onSave(dataUrl);
  }, [onSave]);

  const handleFullSignerComplete = async (signedBlob: Blob) => {
    // In full signer mode, we get a signed PDF blob.
    // We pass it back to the caller who should handle PDF storage.
    const reader = new FileReader();
    reader.readAsDataURL(signedBlob);
    reader.onloadend = () => {
        onSave(reader.result as string, signedBlob);
        setShowFullSigner(false);
        toast.success("Document signed successfully");
    };
  };

  return (
    <div className={cn("space-y-4", className)}>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={() => setShowFullSigner(true)}
          className={cn(
            "group relative flex h-20 w-full items-center justify-center gap-4 overflow-hidden rounded-[1.5rem] bg-neutral-900/40 border border-white/10 p-4 transition-all hover:border-primary/40 hover:bg-neutral-800/60 active:scale-[0.98]",
            className
          )}
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
            <Maximize2 size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Open Advanced Signer</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Full Document Review & Signature</span>
          </div>
        </button>
      ) : (
        <>
          <div className="relative group rounded-[2rem] border border-white/[0.1] bg-neutral-900/40 overflow-hidden backdrop-blur-md transition-all hover:border-primary/30">
            <canvas
              ref={canvasRef}
              className="w-full h-[200px] md:h-[300px] cursor-crosshair touch-none"
            />
            
            {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-20">
                    <FileText className="size-12 mb-2 text-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Sign Here</p>
                </div>
            )}

            {pdfBlob && (
                <button
                    type="button"
                    onClick={() => setShowFullSigner(true)}
                    className="absolute top-4 right-4 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all flex items-center gap-2 group/btn"
                >
                    <Maximize2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Advanced Signer</span>
                </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={clear}
              disabled={isEmpty}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300",
                "flex items-center justify-center gap-2",
                isEmpty
                  ? "bg-white/5 text-neutral-600 cursor-not-allowed"
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
              )}
            >
              <Eraser size={18} />
              Clear
            </button>

            <button
              type="button"
              onClick={save}
              disabled={isEmpty}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300",
                "flex items-center justify-center gap-3",
                isEmpty
                  ? "bg-primary/20 text-neutral-600 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/30 shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95"
              )}
            >
              <Save size={18} />
              Finalize Signature
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {showFullSigner && pdfBlob && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black"
            >
                <DigitalSigner 
                    initialFile={pdfBlob}
                    title={documentTitle}
                    onSigned={handleFullSignerComplete}
                    isProcessingInitial={true}
                    hideToolbar={true}
                    hideSidebar={true}
                />
                <button 
                    onClick={() => setShowFullSigner(false)}
                    className="absolute top-6 left-6 z-[10000] p-3 rounded-full bg-black/50 text-white hover:bg-black transition-colors"
                >
                    <X size={24} />
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

