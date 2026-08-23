"use client";

import React from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Save, Trash2, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDiscard: () => void;
  onSaveAndExit: () => Promise<void> | void;
  isSaving?: boolean;
  title?: string;
  description?: string;
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onConfirmDiscard,
  onSaveAndExit,
  isSaving = false,
  title = "Unsaved Changes Detected",
  description = "You have made changes across your settings that haven't been saved yet. Leaving now will discard these modifications.",
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSaving ? undefined : onClose}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg neumorphic-panel rounded-3xl border border-amber-500/30 overflow-hidden shadow-2xl bg-background"
        >
          {/* Header Bar with Alert Accent */}
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  Attention required before leaving
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            <div className="p-4 rounded-2xl bg-surface-2/60 border border-border/50 text-xs text-foreground/80 space-y-1">
              <p className="font-bold flex items-center gap-2 text-foreground">
                <Save className="size-3.5 text-primary" /> What would you like to do?
              </p>
              <p className="text-muted-foreground">
                You can save all your changes across all tabs with one click, or discard them and exit immediately.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-2/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl neumorphic-extruded text-xs font-black text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 order-3 sm:order-1"
            >
              Keep Editing
            </button>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5 order-1 sm:order-2">
              <button
                type="button"
                onClick={onConfirmDiscard}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                <span>Don&apos;t Save</span>
              </button>

              <button
                type="button"
                onClick={onSaveAndExit}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl neumorphic-primary text-primary-foreground text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                <Save className="size-3.5" />
                <span>{isSaving ? "Saving All…" : "Save All & Exit"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
