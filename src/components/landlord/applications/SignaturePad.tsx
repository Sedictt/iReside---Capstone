"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  className?: string;
}

export function SignaturePad({
  onSave,
  onClear,
  width = 600,
  height = 300,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Configure drawing style
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [width, height]);

  const getCoordinates = useCallback(
    (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if (event instanceof MouseEvent) {
        return {
          x: (event.clientX - rect.left) * scaleX,
          y: (event.clientY - rect.top) * scaleY,
        };
      } else {
        const touch = event.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
    },
    []
  );

  const startDrawing = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const coords = getCoordinates(event);
      if (!coords) return;

      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    },
    [getCoordinates]
  );

  const draw = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const coords = getCoordinates(event);
      if (!coords) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsEmpty(false);
    },
    [isDrawing, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onClear?.();
  }, [onClear]);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }, [isEmpty, onSave]);

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Touch event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative rounded-2xl border border-white/[0.12] bg-white/[0.05] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto cursor-crosshair touch-none bg-neutral-900/50"
          style={{ maxWidth: "100%" }}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className={cn(
            "flex-1 h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300",
            "flex items-center justify-center gap-2",
            isEmpty
              ? "bg-white/5 text-neutral-600 cursor-not-allowed"
              : "bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20"
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
            "flex-1 h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300",
            "flex items-center justify-center gap-2",
            isEmpty
              ? "bg-primary/20 text-neutral-600 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-black border border-primary/30 hover:scale-105 active:scale-95"
          )}
        >
          <Save size={18} />
          Save Signature
        </button>
      </div>
    </div>
  );
}
