"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Check, Download, AlertCircle, Maximize2, Lock } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SignatureModalProps {
    isOpen: boolean;
    onSign: (signature: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export function SignatureModal({
    isOpen,
    onSign,
    onClear,
    onClose,
}: SignatureModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#f8fafc'; // White signature
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                // Clear initially
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [isOpen]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).nativeEvent.offsetX;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).nativeEvent.offsetY;

        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onClear();
    };

    const handleComplete = () => {
        if (!hasSignature) return;
        const canvas = canvasRef.current;
        if (canvas) {
            onSign(canvas.toDataURL());
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-6 right-6 z-50 w-full max-w-sm overflow-hidden rounded-2xl bg-[#1e293b]/95 p-0 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl md:bottom-10 md:right-10 md:max-w-md"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#0f172a] px-6 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Finalize Lease</h2>
                            <p className="text-xs text-slate-400">Review the document and provide your digital signature below.</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <Maximize2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4 flex items-start gap-3 rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-200 border border-yellow-500/20">
                            <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500" />
                            <p>By signing, you agree to the Terms of Service and acknowledge the legal weight of this signature.</p>
                        </div>

                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature</span>
                                <div className="flex bg-slate-800 rounded-lg p-0.5">
                                    <button className="rounded px-3 py-0.5 text-xs font-medium bg-slate-600 text-white shadow-sm">Draw</button>
                                    <button className="rounded px-3 py-0.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">Type</button>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-inner ring-1 ring-black/20">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={160}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full h-[160px] cursor-crosshair touch-none"
                                />
                                {!hasSignature && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <span className="font-serif text-3xl text-slate-700 opacity-50 select-none italic">Sign Here</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleClear}
                                    className="absolute bottom-3 right-3 rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-white/5"
                                    title="Clear Signature"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={!hasSignature}
                            className={cn(
                                "group relative mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98]",
                                !hasSignature && "cursor-not-allowed opacity-50 grayscale hover:bg-blue-600 hover:shadow-none"
                            )}
                        >
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:animate-shimmer" />
                            <Check className="h-4 w-4" />
                            <span>Sign & Complete Lease</span>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleClear}
                                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white hover:border-white/20"
                            >
                                Clear
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white hover:border-white/20">
                                <Download className="h-4 w-4" />
                                Download
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                            <Lock className="h-2.5 w-2.5" />
                            Secure 256-Bit Encryption
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
