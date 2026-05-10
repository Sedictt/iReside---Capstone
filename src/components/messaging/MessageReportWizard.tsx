"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  ClipboardPaste, 
  Paperclip, 
  X, 
  MessageSquareOff, 
  ShieldAlert, 
  UserX, 
  History, 
  PlusCircle, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  Camera,
  Trash2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageReportCategory = "spam" | "phishing" | "harassment" | "profanity" | "other";

type MessageReportWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null | undefined;
  conversationId: string | null | undefined;
  reportedUserLabel?: string;
  initialMessageId?: string;
};

const CATEGORY_META: Array<{ 
  key: MessageReportCategory; 
  label: string; 
  helper: string;
  icon: any;
  color: string;
}> = [
  { 
    key: "spam", 
    label: "Spam", 
    helper: "Unwanted promotions, repetitive content.", 
    icon: MessageSquareOff,
    color: "amber"
  },
  { 
    key: "phishing", 
    label: "Phishing", 
    helper: "Scams, fake links, OTP requests.", 
    icon: ShieldAlert,
    color: "blue"
  },
  { 
    key: "harassment", 
    label: "Harassment", 
    helper: "Threats, abusive language.", 
    icon: UserX,
    color: "rose"
  },
  { 
    key: "profanity", 
    label: "Profanity", 
    helper: "Offensive or inappropriate language.", 
    icon: AlertTriangle,
    color: "orange"
  },
  { 
    key: "other", 
    label: "Other", 
    helper: "Anything else that violates terms.", 
    icon: PlusCircle,
    color: "slate"
  },
];

function normalizePastedMessageId(raw: string) {
  const text = (raw || "").trim();
  const match = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return (match?.[0] ?? text).trim();
}

export function MessageReportWizard({
  isOpen,
  onClose,
  targetUserId,
  conversationId,
  reportedUserLabel,
  initialMessageId,
}: MessageReportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<MessageReportCategory>("spam");
  const [details, setDetails] = useState("");
  const [exactMessage, setExactMessage] = useState("");
  const [reportedMessageId, setReportedMessageId] = useState(initialMessageId || "");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  useMemo(() => {
    if (isOpen && initialMessageId) {
      setReportedMessageId(initialMessageId);
    }
  }, [isOpen, initialMessageId]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAttachMore = screenshots.length < 4;

  const hasAnyEvidence = useMemo(() => {
    return Boolean(details.trim()) || Boolean(exactMessage.trim()) || Boolean(reportedMessageId.trim()) || screenshots.length > 0;
  }, [details, exactMessage, reportedMessageId, screenshots.length]);

  const activeCategoryMeta = useMemo(() => CATEGORY_META.find((c) => c.key === category), [category]);

  const reset = () => {
    setCategory("spam");
    setDetails("");
    setExactMessage("");
    setReportedMessageId("");
    screenshots.forEach((_, idx) => {
        if (screenshotPreviews[idx]) URL.revokeObjectURL(screenshotPreviews[idx]);
    });
    setScreenshots([]);
    setScreenshotPreviews([]);
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addScreenshots = (files: File[]) => {
    if (files.length === 0) return;
    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    const next = files
      .filter((f) => allowed.has(f.type))
      .slice(0, Math.max(0, 4 - screenshots.length));
    
    if (next.length === 0) return;

    const newPreviews = next.map(f => URL.createObjectURL(f));
    setScreenshots((prev) => [...prev, ...next]);
    setScreenshotPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeScreenshot = (index: number) => {
    URL.revokeObjectURL(screenshotPreviews[index]);
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePasteMessageId = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      const normalized = normalizePastedMessageId(raw);
      setReportedMessageId(normalized);
    } catch {
      // Clipboard can be blocked by browser permissions
    }
  };

  const submit = async () => {
    if (!targetUserId || !conversationId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("category", category);
      formData.append("details", details);
      formData.append("exactMessage", exactMessage);
      formData.append("reportedMessageId", reportedMessageId);
      screenshots.forEach((s) => formData.append("screenshots", s));

      const response = await fetch(`/api/messages/users/${targetUserId}/reports`, { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Failed to submit report.");
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-divider p-6 bg-surface-1/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 shadow-inner">
                  <ShieldAlert className="size-6" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black tracking-tight text-high">Security Report</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-disabled">
                    {reportedUserLabel ? `Submitting for ${reportedUserLabel}` : "Citizen Safety & Verification"}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="rounded-2xl p-2.5 hover:bg-surface-2 transition-all active:scale-90" 
                aria-label="Close report wizard"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-8 space-y-8">
              {/* Category Selection */}
              <section>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-disabled mb-4 ml-1">
                  Violation Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORY_META.map((c) => {
                    const Icon = c.icon;
                    const isActive = category === c.key;
                    
                    // Map color keys to Tailwind classes
                    const colorMap: Record<string, { icon: string; bg: string; border: string; ring: string }> = {
                      amber: { icon: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "ring-amber-500/5" },
                      blue: { icon: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", ring: "ring-blue-500/5" },
                      rose: { icon: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30", ring: "ring-rose-500/5" },
                      orange: { icon: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", ring: "ring-orange-500/5" },
                      slate: { icon: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/30", ring: "ring-slate-500/5" },
                    };
                    const theme = colorMap[c.color] || colorMap.slate;

                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className={cn(
                          "group relative flex flex-col p-4 rounded-3xl border transition-all text-left active:scale-[0.98]",
                          isActive
                            ? cn("bg-surface-1 shadow-2xl z-10", theme.bg, theme.border, "ring-4", theme.ring)
                            : "bg-surface-2 border-border hover:border-text-disabled hover:bg-surface-3"
                        )}
                      >
                        <div className={cn(
                          "mb-3 p-2.5 rounded-xl w-fit transition-all shadow-sm",
                          isActive 
                            ? cn("bg-high text-surface-0 shadow-lg") 
                            : cn("bg-surface-4", theme.icon)
                        )}>
                          <Icon className="size-4" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest mb-1 transition-colors",
                          isActive ? theme.icon : "text-high"
                        )}>
                          {c.label}
                        </span>
                        <span className="text-[10px] font-medium text-disabled line-clamp-1 group-hover:text-medium transition-colors">
                          {c.helper}
                        </span>
                        {isActive && (
                          <motion.div 
                            layoutId="active-check"
                            className={cn("absolute top-4 right-4", theme.icon)}
                          >
                            <CheckCircle2 className="size-4" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Message Evidence */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="message-id" className="block text-[10px] font-black uppercase tracking-[0.3em] text-disabled mb-3 ml-1">
                    Message Identifier
                  </label>
                  <div className="group relative">
                    <input
                      id="message-id"
                      value={reportedMessageId}
                      onChange={(e) => setReportedMessageId(normalizePastedMessageId(e.target.value))}
                      placeholder="Paste message ID..."
                      className="w-full h-12 rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handlePasteMessageId}
                      className="absolute right-2 top-2 p-1.5 rounded-xl text-disabled hover:text-primary hover:bg-primary/5 transition-all"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-disabled px-1">
                    Enables exact snapshot verification for faster moderation.
                  </p>
                </div>

                <div>
                  <label htmlFor="exact-content" className="block text-[10px] font-black uppercase tracking-[0.3em] text-disabled mb-3 ml-1">
                    Exact Content (Optional)
                  </label>
                  <textarea
                    id="exact-content"
                    value={exactMessage}
                    onChange={(e) => setExactMessage(e.target.value)}
                    placeholder="Copy-paste the offending text..."
                    className="w-full h-12 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none min-h-[48px]"
                  />
                </div>
              </section>

              {/* Details */}
              <section>
                <label htmlFor="incident-narrative" className="block text-[10px] font-black uppercase tracking-[0.3em] text-disabled mb-3 ml-1">
                  Incident Narrative
                </label>
                <textarea
                  id="incident-narrative"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide context, dates, or why this behavior is unsafe..."
                  className="w-full rounded-[2rem] border border-border bg-surface-2 p-5 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all h-32 resize-none"
                />
              </section>

              {/* Screenshots */}
              <section>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <label htmlFor="screenshot-input" className="block text-[10px] font-black uppercase tracking-[0.3em] text-disabled">
                    Visual Evidence
                  </label>
                  <span className="text-[10px] font-black tracking-widest text-disabled">{screenshots.length}/4</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence mode="popLayout">
                    {screenshotPreviews.map((url, idx) => (
                      <motion.div
                        key={url}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="group relative size-24 rounded-2xl border border-border overflow-hidden bg-surface-3 shadow-sm"
                      >
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeScreenshot(idx)}
                            className="p-2 rounded-xl bg-red-500 text-white shadow-lg active:scale-90"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {canAttachMore && (
                      <motion.button
                        layout
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="size-24 rounded-2xl border-2 border-dashed border-divider hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="p-2 rounded-full bg-surface-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Camera className="size-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-disabled group-hover:text-primary">
                          Add
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  id="screenshot-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    addScreenshots(files);
                    e.target.value = "";
                  }}
                />
              </section>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 flex items-center gap-3"
                >
                  <AlertTriangle className="size-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-500">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-divider p-6 bg-surface-1/50 flex items-center justify-between gap-4">
              <div className="hidden sm:flex items-center gap-2 text-disabled">
                <ShieldAlert className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Confidential Submission</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-medium hover:bg-surface-2 hover:text-high transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting || !hasAnyEvidence || !targetUserId || !conversationId}
                  className={cn(
                    "flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale",
                    "bg-red-500 hover:bg-red-600 shadow-red-500/20 flex items-center justify-center gap-3"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Official Report</span>
                      <ChevronRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


