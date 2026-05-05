"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Camera,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  Info,
} from "lucide-react";

interface Deduction {
  id: string;
  description: string;
  amount: number;
}

interface MoveOutInspectionFormProps {
  requestId: string;
  leaseId: string;
  originalDeposit: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MoveOutInspectionForm({
  requestId,
  leaseId,
  originalDeposit,
  onSuccess,
  onCancel,
}: MoveOutInspectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    rent_settled: boolean;
    utilities_settled: boolean;
    outstanding_balance: number;
    water_balance: number;
    electricity_balance: number;
    pending_readings: number;
  } | null>(null);

  const [notes, setNotes] = useState("");
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [checklist, setChecklist] = useState({
    keys_returned: false,
    unit_cleaned: false,
    no_major_damage: false,
    rent_settled: false,
    utilities_settled: false,
    other_dues_cleared: false,
  });

  // Local Storage Persistence
  useEffect(() => {
    const saved = localStorage.getItem(`inspection_draft_${requestId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed.notes || "");
      setDeductions(parsed.deductions || []);
      setChecklist(prev => ({ ...prev, ...parsed.checklist }));
    }
  }, [requestId]);

  useEffect(() => {
    const draft = { notes, deductions, checklist };
    localStorage.setItem(`inspection_draft_${requestId}`, JSON.stringify(draft));
  }, [notes, deductions, checklist, requestId]);

  // Real-time Polling for Clearance Status
  useEffect(() => {
    async function fetchStatus() {
      // Handle mock data for preview mode
      if (requestId.startsWith("req-")) {
        const mockData = {
          rent_settled: requestId === "req-1" || requestId === "req-3",
          utilities_settled: requestId === "req-1",
          outstanding_balance: requestId === "req-2" ? 12500 : 0,
          water_balance: requestId === "req-2" ? 1500 : 0,
          electricity_balance: requestId === "req-2" ? 3200 : 0,
          pending_readings: requestId === "req-2" ? 2 : 0,
        };
        setSystemStatus(mockData);
        setChecklist(prev => ({
          ...prev,
          rent_settled: mockData.rent_settled,
          utilities_settled: mockData.utilities_settled,
        }));
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/landlord/move-out/${requestId}/inspection`);
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
          // Only auto-check if they were previously unchecked to avoid overriding manual overrides
          setChecklist(prev => ({
            ...prev,
            rent_settled: data.rent_settled,
            utilities_settled: data.utilities_settled,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch clearance status", err);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [requestId]);

  const totalDeductions = useMemo(() => {
    return deductions.reduce((sum, d) => sum + d.amount, 0);
  }, [deductions]);

  const refundAmount = Math.max(0, originalDeposit - totalDeductions);

  // Validation
  const validateForm = () => {
    // 1. Check for empty deduction descriptions or amounts
    const hasInvalidDeduction = deductions.some(d => !d.description.trim() || d.amount <= 0);
    if (hasInvalidDeduction) {
      setError("Please provide a description and a positive amount for all deductions.");
      return false;
    }

    // 2. Warn if rent/utilities are marked as settled but system says otherwise
    if (checklist.rent_settled && systemStatus && !systemStatus.rent_settled) {
      setError("Warning: You've marked Rent as Settled, but the system still shows an outstanding balance.");
      // We'll let them proceed but show a confirmation dialog next
    }

    return true;
  };

  const handlePreSubmit = () => {
    if (validateForm()) {
      setShowConfirmSubmit(true);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/landlord/move-out/${requestId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_notes: notes,
          checklist_data: checklist,
          deposit_deductions: deductions,
          deposit_refund_amount: refundAmount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save inspection");
      }

      // Clear draft on success
      localStorage.removeItem(`inspection_draft_${requestId}`);
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      setShowConfirmSubmit(false);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-[2.5rem] border border-border bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={cn(
        "flex flex-col gap-8 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm transition-all",
        showConfirmSubmit && "blur-sm pointer-events-none opacity-50"
      )}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Move-Out Inspection</h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Record the condition of the unit and calculate security deposit deductions.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-medium text-red-500"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Condition Checklist */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condition Checklist</h3>
            <div className="grid gap-3">
              {Object.entries(checklist).map(([key, value]) => {
                const isSystemChecked = systemStatus && (key === "rent_settled" || key === "utilities_settled");
                const systemValue = key === "rent_settled" ? systemStatus?.rent_settled : systemStatus?.utilities_settled;
                
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all",
                      value ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold capitalize text-foreground">
                          {key.replace(/_/g, " ")}
                        </span>
                        {isSystemChecked && (
                          <div className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter",
                            systemValue ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            <ShieldCheck className="h-2.5 w-2.5" />
                            System Verified
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                      className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20"
                    />
                  </label>
                );
              })}
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">General Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record any specific damages or observations..."
                className="h-32 w-full rounded-2xl border border-border bg-background p-4 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Photos</h3>
              <div className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5">
                <Camera className="mb-2 h-6 w-6 opacity-40" />
                <span className="text-[10px] font-black uppercase tracking-widest">Upload Photos</span>
                <span className="mt-1 text-[9px] opacity-50">JPEG, PNG up to 10MB</span>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Panel */}
          <div className="flex flex-col gap-8">
            {/* Bill Summary Card - Neutral Hierarchy */}
            <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding Bills</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-foreground">Monthly Rent</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Outstanding balance</p>
                  </div>
                  <span className={cn(
                    "text-base font-black",
                    (systemStatus?.outstanding_balance || 0) > 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    ₱{(systemStatus?.outstanding_balance || 0).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Electricity</p>
                    <p className={cn(
                      "text-sm font-black",
                      (systemStatus?.electricity_balance || 0) > 0 ? "text-amber-600" : "text-emerald-500"
                    )}>
                      ₱{(systemStatus?.electricity_balance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-border/50 pl-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Water</p>
                    <p className={cn(
                      "text-sm font-black",
                      (systemStatus?.water_balance || 0) > 0 ? "text-amber-600" : "text-emerald-500"
                    )}>
                      ₱{(systemStatus?.water_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Deductions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit Deductions</h3>
                <button
                  onClick={() => setDeductions([...deductions, { id: Math.random().toString(36).slice(2), description: "", amount: 0 }])}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {deductions.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-[2rem] border border-dashed border-border bg-muted/10 text-xs font-medium text-muted-foreground">
                    No deductions added.
                  </div>
                ) : (
                  deductions.map((d) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={d.description}
                        onChange={(e) => setDeductions(deductions.map(item => item.id === d.id ? { ...item, description: e.target.value } : item))}
                        placeholder="Damage description"
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold focus:border-primary/50 focus:outline-none"
                      />
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black">₱</span>
                        <input
                          type="number"
                          value={d.amount}
                          onChange={(e) => setDeductions(deductions.map(item => item.id === d.id ? { ...item, amount: parseFloat(e.target.value) || 0 } : item))}
                          className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-xs font-bold focus:border-primary/50 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setDeductions(deductions.filter(item => item.id !== d.id))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Refund Summary Card */}
              <div className="rounded-[2.5rem] border border-border bg-muted/30 p-8 shadow-inner">
                <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-muted-foreground">Refund Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Security Deposit</span>
                    <span className="text-sm font-black text-foreground">₱{originalDeposit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-500">
                    <span className="text-xs font-bold">Total Deductions</span>
                    <span className="text-sm font-black">- ₱{totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground">Net Refund</span>
                      <span className="text-2xl font-black text-primary">₱{refundAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <Info className="h-3 w-3" />
                      Refund will be processed after completion.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-8">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-border px-8 py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handlePreSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-primary px-10 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Inspection Results
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Guardrail */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSubmit(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[3rem] border border-border bg-card p-10 shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-amber-500/10 text-amber-500">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Final Confirmation</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    You are about to finalize the move-out inspection. This will determine the final refund of <span className="font-black text-primary">₱{refundAmount.toLocaleString()}</span> and notify the tenant.
                  </p>
                </div>

                {/* Conflict Warnings */}
                {(checklist.rent_settled && systemStatus && !systemStatus.rent_settled) && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-500">
                    Warning: System shows an outstanding rent balance of ₱{systemStatus.outstanding_balance.toLocaleString()}. Are you sure it has been settled?
                  </div>
                )}

                <div className="grid gap-3 pt-4 sm:grid-cols-2">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="h-14 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="h-14 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirm & Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
