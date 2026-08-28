"use client";

import { useState, useEffect } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const { isOnline, isReconnecting, pendingSyncCount, triggerSync } = useNetworkStatus();
  const [showRestoredBanner, setShowRestoredBanner] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestoredBanner(false);
    } else if (wasOffline && isOnline) {
      // Just reconnected! Show the green restored banner for 4 seconds
      setShowRestoredBanner(true);
      const timer = setTimeout(() => {
        setShowRestoredBanner(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {/* 1. OFFLINE BANNER (Amber Floating Pill) */}
      {!isOnline && (
        <motion.div
          key="offline-pill"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90vw] sm:max-w-md w-full pointer-events-auto"
        >
          <div className="bg-amber-500/95 dark:bg-amber-600/95 text-black dark:text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-7 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <WifiOff className="size-4 animate-pulse" />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-black leading-tight tracking-tight">Offline Mode</span>
                <span className="text-[10px] font-bold opacity-85 truncate">
                  Viewing local cached data
                </span>
              </div>
            </div>

            {pendingSyncCount > 0 ? (
              <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2 py-1 rounded-lg shrink-0">
                <CloudUpload className="size-3" />
                <span className="text-[10px] font-black">{pendingSyncCount} queued</span>
              </div>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 shrink-0">
                Read-Only
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* 2. RECONNECTING / RESTORED BANNER (Green Floating Pill) */}
      {isOnline && (showRestoredBanner || isReconnecting) && (
        <motion.div
          key="restored-pill"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90vw] sm:max-w-md w-full pointer-events-auto"
        >
          <div className="bg-emerald-500/95 dark:bg-emerald-600/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {isReconnecting ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-black leading-tight tracking-tight">
                  {isReconnecting ? "Synchronizing Changes..." : "Connection Restored"}
                </span>
                <span className="text-[10px] font-medium opacity-90 truncate">
                  {isReconnecting ? "Sending queued actions to cloud" : "All data is up to date"}
                </span>
              </div>
            </div>

            {pendingSyncCount > 0 && !isReconnecting && (
              <button
                onClick={() => triggerSync()}
                className="text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors shrink-0"
              >
                Sync Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
