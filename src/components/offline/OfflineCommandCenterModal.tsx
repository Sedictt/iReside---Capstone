"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAuth } from "@/hooks/useAuth";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { offlineTaskManager, type OfflineTask } from "@/lib/offline/offlineTaskManager";
import { LeaseOfflineSigner } from "@/lib/offline/leaseOfflineSigner";
import { 
  WifiOff, 
  Zap, 
  PhoneCall, 
  MessageSquare, 
  FileSignature, 
  CreditCard, 
  Maximize2, 
  Minimize2, 
  ArrowRight, 
  ShieldAlert, 
  Users, 
  Wrench, 
  UserPlus, 
  ArrowLeft, 
  Search, 
  Trash2, 
  Check, 
  X, 
  ClipboardList, 
  ExternalLink, 
  BellRing
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ActiveView = 
  | "menu" 
  | "tasks_review"
  | "payments" 
  | "maintenance" 
  | "registration" 
  | "tenants" 
  | "leases" 
  | "utilities" 
  | "emergency";

export function OfflineCommandCenterModal() {
  const { isOnline } = useNetworkStatus();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<OfflineTask[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("menu");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isDismissedOnline, setIsDismissedOnline] = useState<boolean>(false);

  const role = profile?.role || user?.user_metadata?.role || "tenant";
  const isLandlord = role === "landlord" || role === "admin";

  useEffect(() => {
    const unsub = offlineTaskManager.subscribe(setTasks);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setIsDismissedOnline(false);
    } else if (wasOffline && isOnline) {
      // Returned online
      if (tasks.length > 0 && !isDismissedOnline) {
        // Automatically open reminders checklist for convenience
        setActiveView("tasks_review");
        setIsMinimized(false);
      }
      setWasOffline(false);
    }
  }, [isOnline, wasOffline, tasks.length, isDismissedOnline]);

  // If online and (no tasks OR user explicitly closed via X), don't show
  if (isOnline && (tasks.length === 0 || isDismissedOnline)) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* 1. MINIMIZED BOTTOM DOCK PILL (Available in both Offline and Online modes) */}
      {isMinimized && (
        <motion.div
          key="minimized-dock"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[999] max-w-sm w-auto"
        >
          <div className="rounded-2xl border border-amber-500/30 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl p-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center gap-3">
            <div className="relative flex items-center justify-center size-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {!isOnline ? <WifiOff className="size-4.5" /> : <BellRing className="size-4.5" />}
              {!isOnline && <span className="absolute -top-1 -right-1 size-2.5 bg-amber-500 rounded-full animate-ping" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {!isOnline ? "Dead-Zone Mode" : "Action Reminders"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                {tasks.length > 0 ? `${tasks.length} offline reminder${tasks.length > 1 ? "s" : ""}` : "Operating in local vault"}
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="ml-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Maximize2 className="size-3.5" />
              Open List
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. FULL DEAD-ZONE / REMINDERS LIGHTBOX OVERLAY */}
      {!isMinimized && (
        <motion.div
          key="offline-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-[2.25rem] border backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-left transition-colors duration-500",
              isOnline
                ? "border-emerald-500/40 bg-white/95 dark:bg-[#0f1117]/95 text-slate-900 dark:text-white"
                : "border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f1117]/95 text-slate-900 dark:text-white"
            )}
          >
            {/* Top Identity Bar */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-200/60 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                {activeView !== "menu" && (
                  <button
                    onClick={() => setActiveView("menu")}
                    className="size-9 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0"
                    title="Back to Operations Menu"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}

                <div
                  className={cn(
                    "flex items-center justify-center size-10 rounded-2xl border shadow-inner shrink-0",
                    isOnline
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {isOnline ? (
                    <BellRing className="size-5.5" />
                  ) : (
                    <WifiOff className="size-5.5 animate-pulse" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                        isOnline
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {isOnline
                        ? "Connection Restored • Action Reminders"
                        : "Offline • Dead-Zone Mode"}
                    </span>
                    {tasks.length > 0 && (
                      <span className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {tasks.length} reminder{tasks.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
                    {isOnline
                      ? "Offline Action Reminders"
                      : activeView === "menu"
                      ? "Dead-Zone Command Center"
                      : activeView === "tasks_review"
                      ? "Recorded Reminders Checklist"
                      : getSubViewTitle(activeView)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch to Reminders Checklist Button if tasks exist */}
                {tasks.length > 0 && activeView !== "tasks_review" && (
                  <button
                    onClick={() => setActiveView("tasks_review")}
                    className="px-3.5 py-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardList className="size-4" />
                    <span>View Reminders ({tasks.length})</span>
                  </button>
                )}

                {/* Minimize Button: Always Available in both Online & Offline modes */}
                <button
                  onClick={() => setIsMinimized(true)}
                  title="Minimize to floating bottom dock"
                  className="flex size-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Minimize2 className="size-4" />
                </button>

                {/* Close Button: Completely dismisses when online */}
                {isOnline && (
                  <button
                    onClick={() => setIsDismissedOnline(true)}
                    title="Close reminders modal"
                    className="flex size-9 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-View Content Container (Scrollable) */}
            <div className="px-6 sm:px-8 py-5 overflow-y-auto flex-1 custom-scrollbar-premium">
              {activeView === "tasks_review" || (isOnline && activeView === "menu") ? (
                /* REMINDER CHECKLIST VIEW */
                <OfflineRemindersChecklistView 
                  tasks={tasks} 
                  isOnline={isOnline} 
                  onBackToMenu={() => setActiveView("menu")} 
                  onNavigate={(url) => {
                    setIsMinimized(true); // Minimize instead of closing, so dock pill remains accessible
                    router.push(url);
                  }}
                />
              ) : activeView === "menu" ? (
                /* Main Menu Grid */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                      Select an Operation to Note Down in Dead Zone
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                      <ClipboardList className="size-3.5" /> Saves as Action Reminder
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {isLandlord ? (
                      <>
                        {/* 1. Payment Collections */}
                        <button
                          type="button"
                          onClick={() => setActiveView("payments")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <CreditCard className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              Payments
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Payment Collections
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Note down cash collected & issue offline reminders.
                            </p>
                          </div>
                        </button>

                        {/* 2. Maintenance Operations */}
                        <button
                          type="button"
                          onClick={() => setActiveView("maintenance")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-red-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Wrench className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                              Maintenance
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              Maintenance Tickets
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Note urgent repairs & technician tasks on-site.
                            </p>
                          </div>
                        </button>

                        {/* 3. Tenant Registration */}
                        <button
                          type="button"
                          onClick={() => setActiveView("registration")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-blue-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <UserPlus className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                              Registration
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              Tenant Registration
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Note walk-in resident details & generate offline voucher.
                            </p>
                          </div>
                        </button>

                        {/* 4. Tenant Directory */}
                        <button
                          type="button"
                          onClick={() => setActiveView("tenants")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Users className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              Tenant List
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              Tenant Directory
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Search cached tenant profiles, contacts & room numbers.
                            </p>
                          </div>
                        </button>

                        {/* 5. Lease Agreements */}
                        <button
                          type="button"
                          onClick={() => setActiveView("leases")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileSignature className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                              Lease List
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              Leases & Move-Ins
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Review contracts & capture biometric signatures on-screen.
                            </p>
                          </div>
                        </button>

                        {/* 6. Corridor Sub-Meters */}
                        <button
                          type="button"
                          onClick={() => setActiveView("utilities")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Zap className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                              Utilities
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                              Corridor Sub-Meters
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Walk hallways noting power & water with instant ₱ calculation.
                            </p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Tenant Operation 1: Emergency Maintenance */}
                        <button
                          type="button"
                          onClick={() => setActiveView("emergency")}
                          className="group p-5 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <ShieldAlert className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                              Urgent
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-red-600 dark:text-red-300 group-hover:text-red-500 dark:group-hover:text-red-200 transition-colors">
                              Emergency Hazard Hotline
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              1-tap phone dialer & pre-filled SMS for immediate hazards.
                            </p>
                          </div>
                        </button>

                        {/* Tenant Operation 2: Stage GCash Payment */}
                        <button
                          type="button"
                          onClick={() => setActiveView("payments")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <CreditCard className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              Payment
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              Stage GCash Payment Proof
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Note receipt reference code for record keeping.
                            </p>
                          </div>
                        </button>

                        {/* Tenant Operation 3: Move-In Contract */}
                        <button
                          type="button"
                          onClick={() => setActiveView("leases")}
                          className="group p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.07] hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 text-left cursor-pointer active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="size-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <FileSignature className="size-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                              Lease
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              Move-In Lease Contract
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                              Review contract clauses & draw biometric signature.
                            </p>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : activeView === "payments" ? (
                /* IN-LIGHTBOX VIEW: Payments */
                <OfflinePaymentsView onDone={() => setActiveView("menu")} />
              ) : activeView === "maintenance" ? (
                /* IN-LIGHTBOX VIEW: Maintenance */
                <OfflineMaintenanceView onDone={() => setActiveView("menu")} />
              ) : activeView === "registration" ? (
                /* IN-LIGHTBOX VIEW: Registration */
                <OfflineRegistrationView onDone={() => setActiveView("menu")} />
              ) : activeView === "tenants" ? (
                /* IN-LIGHTBOX VIEW: Tenant List */
                <OfflineTenantListView />
              ) : activeView === "leases" ? (
                /* IN-LIGHTBOX VIEW: Leases & Signatures */
                <OfflineLeasesView onDone={() => setActiveView("menu")} />
              ) : activeView === "utilities" ? (
                /* IN-LIGHTBOX VIEW: Sub-Meter Utilities */
                <OfflineUtilitiesView onDone={() => setActiveView("menu")} />
              ) : activeView === "emergency" ? (
                /* IN-LIGHTBOX VIEW: Emergency Hotline */
                <OfflineEmergencyView />
              ) : null}
            </div>

            {/* Footer Status Bar with Minimize Link */}
            <div className="px-6 sm:px-8 py-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    isOnline
                      ? "bg-emerald-500 animate-ping"
                      : "bg-amber-500 animate-ping"
                  )}
                />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                  {isOnline
                    ? "Online • Review reminders & navigate to record in live forms"
                    : "Operating in dead zone • All notes saved to checklist"}
                </span>
              </div>

              <button
                onClick={() => setIsMinimized(true)}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Minimize to Dock <ArrowRight className="size-3" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getSubViewTitle(view: ActiveView): string {
  switch (view) {
    case "tasks_review": return "Action Reminders Checklist";
    case "payments": return "Payment Collection Note";
    case "maintenance": return "Emergency Maintenance Note";
    case "registration": return "Walk-In Tenant Registration";
    case "tenants": return "Cached Tenant Directory";
    case "leases": return "Leases & Biometric Move-In Signer";
    case "utilities": return "Corridor Sub-Meter Logger";
    case "emergency": return "Emergency Hazard Hotline";
    default: return "Offline Operations";
  }
}

/* =========================================================================
   ACTION REMINDERS CHECKLIST VIEW (Landlord Manual Recording Guide)
   ========================================================================= */
function OfflineRemindersChecklistView({ 
  tasks, 
  isOnline, 
  onBackToMenu,
  onNavigate
}: { 
  tasks: OfflineTask[]; 
  isOnline: boolean; 
  onBackToMenu: () => void; 
  onNavigate: (url: string) => void;
}) {
  const handleClearAll = () => {
    offlineTaskManager.clearAll();
    toast.success("All offline reminders cleared.");
  };

  const handleDismiss = (taskId: string) => {
    offlineTaskManager.removeTask(taskId);
    toast.info("Reminder dismissed.");
  };

  if (tasks.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xl font-black text-slate-900 dark:text-white">All Reminders Cleared!</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-sm">
            There are no pending offline notes or action reminders.
          </p>
        </div>
        <button
          onClick={onBackToMenu}
          className="mt-3 px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
        >
          Return to Operations Menu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
        <div>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {tasks.length} Action{tasks.length > 1 ? "s" : ""} Noted Down While in Dead Zone
          </span>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            {isOnline
              ? "Use these notes to record transactions into the system. Click 'Open Module' to navigate, or check off when recorded."
              : "Saved in your offline notepad. You can review your notes here before returning online."}
          </p>
        </div>

        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 text-slate-600 dark:text-neutral-300 font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Trash2 className="size-3.5" /> Clear All
        </button>
      </div>

      {/* Reminder Cards List */}
      <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1 custom-scrollbar-premium">
        {tasks.map((task) => {
          return (
            <div
              key={task.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={cn(
                    "size-10 rounded-2xl border flex items-center justify-center shrink-0 text-sm font-black",
                    task.type === "payment"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : task.type === "utility"
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                      : task.type === "maintenance"
                      ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                      : task.type === "registration"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                  )}
                >
                  {task.type === "payment" && <CreditCard className="size-5" />}
                  {task.type === "utility" && <Zap className="size-5" />}
                  {task.type === "maintenance" && <Wrench className="size-5" />}
                  {task.type === "registration" && <UserPlus className="size-5" />}
                  {task.type === "lease_signature" && <FileSignature className="size-5" />}
                </div>

                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                        task.type === "payment"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : task.type === "utility"
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                          : task.type === "maintenance"
                          ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                          : task.type === "registration"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                      )}
                    >
                      {task.type.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
                      Noted at {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {task.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {isOnline && (
                  <button
                    type="button"
                    onClick={() => onNavigate(task.actionUrl)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title={`Navigate to ${task.actionLabel}`}
                  >
                    <ExternalLink className="size-3.5" /> {task.actionLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDismiss(task.id)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
                  title="Mark as recorded"
                >
                  <Check className="size-3.5" />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Return to Operations Button */}
      <div className="pt-2 flex justify-start">
        <button
          type="button"
          onClick={onBackToMenu}
          className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="size-3.5" /> Return to Operations Menu
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   1. IN-LIGHTBOX SUB-VIEW: PAYMENTS
   ========================================================================= */
function OfflinePaymentsView({ onDone }: { onDone: () => void }) {
  const [unit, setUnit] = useState("Unit 101");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Rent");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const payload = {
      unit,
      amount: Number(amount),
      category,
      note,
      recordedAt: new Date().toISOString(),
      method: "cash",
    };

    // Add to Offline Task Reminder Checklist
    offlineTaskManager.addTask(
      "payment",
      `₱${Number(amount).toLocaleString()} Payment (${category})`,
      `${unit} • ${note ? note : "Cash payment in person"}`,
      payload
    );

    // Save in offline snapshot ledger
    const historyKey = "offline_recorded_payments";
    const existing = OfflineStorage.get<any[]>(historyKey)?.data || [];
    OfflineStorage.set(historyKey, [payload, ...existing], null, "payments");

    toast.success(`Payment note for ₱${Number(amount).toLocaleString()} saved to Reminders!`);
    setSubmitted(true);
    setTimeout(() => {
      onDone();
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Payment Reminder Saved</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Added to your offline checklist so you can record it in your ledger later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Unit / Tenant</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. Unit 101 - Juan Dela Cruz"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Amount (₱)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 7500"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
          >
            <option value="Rent">Monthly Rent</option>
            <option value="Electricity">Electricity Dues</option>
            <option value="Water">Water Dues</option>
            <option value="Security Deposit">Security Deposit</option>
            <option value="Other">Other Assessment</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Receipt / Reference Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid in cash at hallway"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
        >
          <CreditCard className="size-4" /> Save to Action Reminders
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   2. IN-LIGHTBOX SUB-VIEW: MAINTENANCE
   ========================================================================= */
function OfflineMaintenanceView({ onDone }: { onDone: () => void }) {
  const [unit, setUnit] = useState("Unit 101");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [priority, setPriority] = useState("High");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ticketId = `TICKET-OFFLINE-${Date.now().toString().slice(-4)}`;
    const payload = {
      ticketId,
      unit,
      title,
      category,
      priority,
      description,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    // Add to Offline Task Reminder Checklist
    offlineTaskManager.addTask(
      "maintenance",
      `Maintenance: ${title}`,
      `${unit} • ${category} (${priority} Priority)`,
      payload
    );

    const historyKey = "offline_maintenance_tickets";
    const existing = OfflineStorage.get<any[]>(historyKey)?.data || [];
    OfflineStorage.set(historyKey, [payload, ...existing], null, "maintenance");

    toast.success(`Maintenance note saved to Reminders!`);
    setSubmitted(true);
    setTimeout(() => {
      onDone();
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shadow-lg shadow-red-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Maintenance Note Saved</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Added to your offline checklist so you can log the ticket once online.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Unit / Location</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. Unit 203 / 2nd Floor Hallway"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Issue Headline</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leaking pipe under bathroom sink"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
          >
            <option value="Plumbing">Plumbing & Water</option>
            <option value="Electrical">Electrical & Power</option>
            <option value="Aircon">Air Conditioning</option>
            <option value="Lock & Keys">Locks & Security</option>
            <option value="Structural">Structural / Carpentry</option>
            <option value="Other">Other Hazard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Urgency Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
          >
            <option value="Urgent">🚨 Urgent (Immediate Hazard)</option>
            <option value="High">⚠️ High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low (Routine Check)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Detailed Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe symptoms, exact location, or instructions for technician..."
          className="w-full mt-1.5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all resize-none"
        />
      </div>

      <div className="pt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
        >
          <Wrench className="size-4" /> Save to Action Reminders
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   3. IN-LIGHTBOX SUB-VIEW: TENANT REGISTRATION
   ========================================================================= */
function OfflineRegistrationView({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("Unit 102");
  const [rent, setRent] = useState("8000");
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const generatedVoucher = `INVITE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const payload = {
      fullName: name,
      phone,
      unitName: unit,
      monthlyRent: Number(rent),
      voucherCode: generatedVoucher,
      registeredAt: new Date().toISOString(),
    };

    // Add to Offline Task Reminder Checklist
    offlineTaskManager.addTask(
      "registration",
      `Register Tenant: ${name}`,
      `${unit} • ₱${Number(rent).toLocaleString()}/mo (Voucher: ${generatedVoucher})`,
      payload
    );

    // Save in offline tenants cache
    const key = "offline_registered_tenants";
    const existing = OfflineStorage.get<any[]>(key)?.data || [];
    OfflineStorage.set(key, [payload, ...existing], null, "tenants");

    setVoucherCode(generatedVoucher);
    toast.success(`Tenant ${name} added to Action Reminders!`);
  };

  if (voucherCode) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-slate-900 dark:text-white">Walk-In Registration Noted</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Give this offline voucher token to the tenant. The reminder has been saved to your checklist.
          </p>
          <div className="mt-4 px-6 py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-black text-xl tracking-widest inline-block select-all shadow-inner">
            {voucherCode}
          </div>
        </div>
        <button
          onClick={onDone}
          className="mt-3 px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maria Santos"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Mobile Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 09171234567"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Assigned Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. Unit 102"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Monthly Rent (₱)</label>
          <input
            type="number"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
            placeholder="e.g. 8000"
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
      </div>

      <div className="pt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
        >
          <UserPlus className="size-4" /> Save Registration Reminder
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   4. IN-LIGHTBOX SUB-VIEW: TENANT LIST
   ========================================================================= */
function OfflineTenantListView() {
  const [search, setSearch] = useState("");

  const sampleTenants = useMemo(() => [
    { id: "1", name: "Juan Dela Cruz", unit: "Unit 101", phone: "09171234567", status: "Active Lease", balance: 0 },
    { id: "2", name: "Maria Santos", unit: "Unit 102", phone: "09189876543", status: "Active Lease", balance: 7500 },
    { id: "3", name: "Gabriel Mendoza", unit: "Unit 103", phone: "09205551234", status: "Active Lease", balance: 0 },
    { id: "4", name: "Ana Reyes", unit: "Unit 201", phone: "09176543210", status: "Due Soon", balance: 8200 },
    { id: "5", name: "Carlos Ramos", unit: "Unit 202", phone: "09193334444", status: "Active Lease", balance: 0 },
  ], []);

  const filtered = sampleTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.unit.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
  );

  return (
    <div className="space-y-3.5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-neutral-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tenant name, unit number, or phone..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
        />
      </div>

      <div className="space-y-2.5 max-h-[44vh] overflow-y-auto pr-1 custom-scrollbar-premium">
        {filtered.map((tenant) => (
          <div
            key={tenant.id}
            className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] flex items-center justify-between gap-3 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-xs flex items-center justify-center shrink-0">
                {tenant.unit.replace("Unit ", "U")}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {tenant.name}
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    {tenant.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
                  {tenant.unit} • {tenant.phone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {tenant.balance > 0 ? (
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  ₱{tenant.balance.toLocaleString()} Due
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Paid ✓</span>
              )}
              <a
                href={`tel:${tenant.phone}`}
                className="size-9 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-xs"
                title="Direct Phone Call"
              >
                <PhoneCall className="size-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. IN-LIGHTBOX SUB-VIEW: LEASES & BIOMETRIC MOVE-IN SIGNER
   ========================================================================= */
function OfflineLeasesView({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState("Maria Santos");
  const [unit, setUnit] = useState("Unit 102");
  const [sealed, setSealed] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSeal = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL("image/png");

    await LeaseOfflineSigner.stageOfflineSignature({
      leaseId: `lease_${unit.toLowerCase().replace(" ", "_")}`,
      signerRole: "tenant",
      signerName,
      signatureDataUrl: dataUrl,
    });

    // Add to Offline Task Reminder Checklist
    offlineTaskManager.addTask(
      "lease_signature",
      `Sign Lease: ${signerName}`,
      `${unit} • Biometric Signature Stored Locally`,
      {
        leaseId: `lease_${unit.toLowerCase().replace(" ", "_")}`,
        signerName,
        unit,
        signatureDataUrl: dataUrl,
        signedAt: new Date().toISOString(),
      }
    );

    toast.success("Biometric contract saved to Reminders!");
    setSealed(true);
    setTimeout(() => {
      onDone();
    }, 1500);
  };

  if (sealed) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Lease Signature Saved</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Stored in local storage. You can reference this when formalizing the lease online.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Tenant Signer</label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            placeholder="Full legal name"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Assigned Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            placeholder="e.g. Unit 102"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            Draw Move-In Digital Signature
          </label>
          {hasSignature && (
            <button
              onClick={clearCanvas}
              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold cursor-pointer transition-colors"
            >
              <Trash2 className="size-3.5" /> Clear Signature
            </button>
          )}
        </div>

        <div className="relative border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-100/80 dark:bg-[#07090e] overflow-hidden touch-none h-40 flex items-center justify-center shadow-inner">
          {!hasSignature && (
            <span className="absolute text-slate-400 dark:text-neutral-600 text-xs font-semibold pointer-events-none select-none">
              ✍️ Sign with finger or stylus here
            </span>
          )}
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      <div className="pt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSeal}
          disabled={!hasSignature}
          className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
        >
          <FileSignature className="size-4" /> Save Signature Reminder
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   6. IN-LIGHTBOX SUB-VIEW: CORRIDOR SUB-METERS
   ========================================================================= */
function OfflineUtilitiesView({ onDone }: { onDone: () => void }) {
  const [unit, setUnit] = useState("Unit 101");
  const [meterType, setMeterType] = useState<"Electricity" | "Water">("Electricity");
  const [prevReading, setPrevReading] = useState("1420");
  const [currReading, setCurrReading] = useState("1510");
  const [rate, setRate] = useState("12.50");
  const [logged, setLogged] = useState(false);

  const consumption = Math.max(0, Number(currReading || 0) - Number(prevReading || 0));
  const charge = consumption * Number(rate || 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (consumption <= 0) {
      toast.error("Current reading must be greater than previous reading.");
      return;
    }

    const payload = {
      unit,
      meterType,
      prevReading: Number(prevReading),
      currReading: Number(currReading),
      consumption,
      rate: Number(rate),
      computedCharge: charge,
      loggedAt: new Date().toISOString(),
    };

    // Add to Offline Task Reminder Checklist
    offlineTaskManager.addTask(
      "utility",
      `Sub-Meter Note: ${unit} (${meterType})`,
      `${consumption} ${meterType === "Electricity" ? "kWh" : "m³"} • ₱${charge.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      payload
    );

    const historyKey = "offline_submeter_readings";
    const existing = OfflineStorage.get<any[]>(historyKey)?.data || [];
    OfflineStorage.set(historyKey, [payload, ...existing], null, "utilities");

    toast.success(`Reading note for ${unit} saved to Reminders!`);
    setLogged(true);
    setTimeout(() => {
      onDone();
    }, 1500);
  };

  if (logged) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="size-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Check className="size-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Meter Note Saved</h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Added to your checklist. You can reference this reading when creating invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Unit Number</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            placeholder="e.g. Unit 101"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Utility Type</label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => {
                setMeterType("Electricity");
                setRate("12.50");
              }}
              className={cn(
                "py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border",
                meterType === "Electricity"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 shadow-xs"
                  : "bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400"
              )}
            >
              ⚡ Electricity (kWh)
            </button>
            <button
              type="button"
              onClick={() => {
                setMeterType("Water");
                setRate("45.00");
              }}
              className={cn(
                "py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border",
                meterType === "Water"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-300 shadow-xs"
                  : "bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400"
              )}
            >
              💧 Water (m³)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Previous</label>
          <input
            type="number"
            value={prevReading}
            onChange={(e) => setPrevReading(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Current</label>
          <input
            type="number"
            value={currReading}
            onChange={(e) => setCurrReading(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Rate (₱)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            step="0.01"
            className="w-full mt-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            required
          />
        </div>
      </div>

      {/* Live Computed Summary Card */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Calculated Usage
          </span>
          <div className="text-base font-black text-slate-900 dark:text-white">
            {consumption} {meterType === "Electricity" ? "kWh" : "m³"}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Computed Charge
          </span>
          <div className="text-lg font-black text-cyan-600 dark:text-cyan-300">
            ₱{charge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="pt-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
        >
          <Zap className="size-4" /> Save to Action Reminders
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
   7. IN-LIGHTBOX SUB-VIEW: EMERGENCY HOTLINE
   ========================================================================= */
function OfflineEmergencyView() {
  return (
    <div className="space-y-4 py-2">
      <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
          <ShieldAlert className="size-5 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider">
            Direct Telephony & Emergency Radio Fallback
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 leading-relaxed">
          When cellular data is dead, your phone's standard GSM connection can still place a direct phone call or send an emergency SMS directly to property management:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <a
          href="tel:09171234567"
          className="p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm text-center flex items-center justify-center gap-2.5 shadow-md transition-transform active:scale-95"
        >
          <PhoneCall className="size-5" /> Call Property Hotline
        </a>
        <a
          href="sms:09171234567?body=EMERGENCY%20HAZARD:%20Need%20immediate%20property%20assistance."
          className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold text-sm text-center flex items-center justify-center gap-2.5 transition-transform active:scale-95 shadow-xs"
        >
          <MessageSquare className="size-5" /> Send Emergency SMS
        </a>
      </div>
    </div>
  );
}
