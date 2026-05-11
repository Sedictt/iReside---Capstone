"use client";

import React, { useState } from "react";
import { Map, CheckCircle, Maximize2, X } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";

import { createPortal } from "react-dom";

export function UnitMapFeatureSection() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const lightboxContent = (
    <AnimatePresence>
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={() => setIsLightboxOpen(false)}
          />
          
          <div className="absolute top-8 right-8 z-[10100]">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="size-14 rounded-full bg-black/40 backdrop-blur-xl text-white flex items-center justify-center hover:bg-black/60 border border-white/20 transition-all shadow-2xl"
            >
              <X className="size-7" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-[90vw] h-[90vh] bg-zinc-950 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
          >
            <div className="h-full w-full">
              <VisualBuilder key="demo-builder" demoMode={true} readOnly={false} />
            </div>
            
            {/* Top hint */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none z-[110]">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.4em] bg-black/40 backdrop-blur-md px-10 py-3.5 rounded-full border border-white/10 shadow-2xl">
                ESC TO EXIT PREVIEW
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="unit-map" className="scroll-mt-24 space-y-8 rounded-3xl border border-divider bg-surface-1 p-8 lg:p-12 shadow-sm">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 text-primary font-semibold">
            <Map className="size-6" />
            <span>Signature Feature</span>
          </div>
          <h2 className="text-3xl font-semibold text-text-high">Interactive Unit Map</h2>
          <p className="text-lg text-text-medium leading-relaxed">
            Visualize your entire property layout at a glance. The Unit Map feature transforms standard, text-based property lists into an interactive, visual grid that mirrors your actual building layout.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex gap-3">
              <div className="mt-1 size-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                <CheckCircle className="h-full w-full" />
              </div>
              <span className="text-text-medium"><strong>Visual Organization:</strong> Represent properties spatially to match reality. Easily identify which unit is adjacent to which.</span>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 size-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                <CheckCircle className="h-full w-full" />
              </div>
              <span className="text-text-medium"><strong>Instant Status Indicators:</strong> Color-coded blocks immediately reveal which units are vacant, occupied, or pending maintenance.</span>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 size-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                <CheckCircle className="h-full w-full" />
              </div>
              <span className="text-text-medium"><strong>Quick Actions:</strong> Click any unit block to instantly access lease details, tenant information, and open requests.</span>
            </li>
          </ul>
        </div>
        
        <div className="flex-1 group relative">
          <div
            className="rounded-xl border border-divider bg-surface-2 p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl relative"
            onClick={() => setIsLightboxOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLightboxOpen(true); }}}
            tabIndex={0}
            role="button"
          >
            {/* Background Blur Preview */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity blur-[2px] scale-105 pointer-events-none">
              <VisualBuilder key="demo-preview-bg" demoMode={true} readOnly={true} />
            </div>
            
            {/* Overlay Info */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Maximize2 className="size-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-text-high">Try the Interactive Demo</p>
                <p className="text-sm text-text-medium max-w-[240px] mt-1">Experience the Unit Map interface exactly as landlords do.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest">
                Launch Live Preview
              </div>
            </div>
          </div>
          <p className="text-sm text-text-medium italic text-center mt-4">Click the preview above to launch the interactive unit map experience</p>
        </div>
      </div>

      {mounted && createPortal(lightboxContent, document.body)}
    </section>
  );
}

