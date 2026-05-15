"use client";

import { useState, useMemo, useEffect, useReducer } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Deduction {
  id: string;
  description: string;
  amount: number;
}

interface Checklist {
  keys_returned: boolean;
  unit_cleaned: boolean;
  no_major_damage: boolean;
  rent_settled: boolean;
  utilities_settled: boolean;
  other_dues_cleared: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const [notes, setNotes] = useState("");
  const [deductions, setDeductions] = useState<Deduction[]>([]);

  // Reducer for draft state (notes, deductions, checklist) to avoid multiple setState calls
  type DraftState = { notes: string; deductions: Deduction[]; checklist: Checklist };
  type DraftAction =
      | { type: 'RESTORE_DRAFT'; payload: { notes: string; deductions: Deduction[]; checklist: Checklist } };

  const draftReducer = (state: DraftState, action: DraftAction): DraftState => {
      switch (action.type) {
          case 'RESTORE_DRAFT':
              return { notes: action.payload.notes, deductions: action.payload.deductions, checklist: action.payload.checklist };
          default:
              return state;
      }
  };

  // Reducer for clearance status state to avoid multiple setState calls
  type ClearanceStatus = {
    rent_settled: boolean;
    utilities_settled: boolean;
    outstanding_balance: number;
    water_balance: number;
    electricity_balance: number;
    pending_readings: number;
  } | null;
  type ClearanceState = { systemStatus: ClearanceStatus; checklist: Checklist; initialLoading: boolean };
  type ClearanceAction =
      | { type: 'SET_SYSTEM_STATUS'; payload: ClearanceStatus }
      | { type: 'UPDATE_CHECKLIST'; payload: Partial<Checklist> }
      | { type: 'SET_INITIAL_LOADING'; payload: boolean }
      | { type: 'RESTORE_FROM_FETCH'; payload: ClearanceStatus }
      | { type: 'CLEARANCE_POLL_SUCCESS'; payload: { systemStatus: ClearanceStatus; checklistUpdate: Partial<Checklist> } }
      | { type: 'CLEARANCE_POLL_ERROR' };

  const clearanceReducer = (state: ClearanceState, action: ClearanceAction): ClearanceState => {
      switch (action.type) {
          case 'SET_SYSTEM_STATUS':
              return { ...state, systemStatus: action.payload };
          case 'UPDATE_CHECKLIST':
              return { ...state, checklist: { ...state.checklist, ...action.payload } };
          case 'SET_INITIAL_LOADING':
              return { ...state, initialLoading: action.payload };
          case 'RESTORE_FROM_FETCH':
              return {
                  ...state,
                  systemStatus: action.payload,
                  checklist: { ...state.checklist, ...action.payload ? { rent_settled: action.payload.rent_settled, utilities_settled: action.payload.utilities_settled } : {} }
              };
          case 'CLEARANCE_POLL_SUCCESS':
              return {
                  ...state,
                  systemStatus: action.payload.systemStatus,
                  checklist: { ...state.checklist, ...action.payload.checklistUpdate },
                  initialLoading: false
              };
          case 'CLEARANCE_POLL_ERROR':
              return { ...state, initialLoading: false };
          default:
              return state;
      }
  };

  const [clearanceState, dispatchClearance] = useReducer(clearanceReducer, {
      systemStatus: null,
      checklist: {
        keys_returned: false,
        unit_cleaned: false,
        no_major_damage: false,
        rent_settled: false,
        utilities_settled: false,
        other_dues_cleared: false,
      },
      initialLoading: true,
  });
  const { systemStatus, checklist, initialLoading: clearanceLoading } = clearanceState;

  useEffect(() => {
    const cachedDraft = localStorage.getItem(`inspection_draft_${requestId}`);
    if (cachedDraft) {
      try {
        const draftData = JSON.parse(cachedDraft);
        setDeductions(draftData.deductions || []);
        setNotes(draftData.notes || "");
      } catch (err) {
        console.error("Failed to parse inspection draft", err);
      }
    }
  }, [requestId]);

  useEffect(() => {
    const draft = { notes, deductions, checklist };
    localStorage.setItem(`inspection_draft_${requestId}`, JSON.stringify(draft));
  }, [notes, deductions, checklist, requestId]);

  useEffect(() => {
    const checkClearance = async () => {
      try {
        const response = await fetch(`/api/landlord/move-out/check-clearance?requestId=${requestId}`);
        if (response.ok) {
          const responseData = await response.json();
          dispatchClearance({
            type: 'CLEARANCE_POLL_SUCCESS',
            payload: {
              systemStatus: responseData,
              checklistUpdate: {
                rent_settled: responseData.rent_settled,
                utilities_settled: responseData.utilities_settled,
              }
            }
          });
        }
      } catch (err) {
        console.error("Clearance check failed", err);
        dispatchClearance({ type: 'CLEARANCE_POLL_ERROR' });
      }
    };

    checkClearance();
    const pollingInterval = setInterval(checkClearance, 5000);
    return () => clearInterval(pollingInterval);
  }, [requestId]);

  const totalDeductions = useMemo(() => {
    return deductions.reduce((total, deduction) => total + deduction.amount, 0);
  }, [deductions]);

  const refundAmount = Math.max(0, originalDeposit - totalDeductions);

  const validateForm = () => {
    const hasInvalidDeduction = deductions.some(d => !d.description.trim() || d.amount <= 0);
    if (hasInvalidDeduction) {
      setError("Please provide a description and a positive amount for all deductions.");
      return false;
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
        const responseData = await response.json();
        throw new Error(responseData.error || "Failed to submit inspection");
      }

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

  return clearanceLoading ? (
    <div className="flex h-[400px] items-center justify-center rounded-[2.5rem] border border-border bg-card">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="relative">
      <div className={cn(
        "flex flex-col gap-10 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm transition-all",
        showConfirmSubmit && "blur-sm pointer-events-none opacity-50"
      )}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
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
            <AlertCircle className="size-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clearance Status</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(checklist).map(([checklistKey, isCleared]) => (
                  <div key={checklistKey} className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-8 items-center justify-center rounded-xl ring-1",
                        isCleared ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" : "bg-amber-500/10 text-amber-500 ring-amber-500/20"
                      )}>
                        {isCleared ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                      </div>
                      <span className="text-xs font-black capitalize text-foreground">{checklistKey.replace(/_/g, " ")}</span>
                    </div>
                    <Badge variant={isCleared ? "success" : "warning"} className="h-6 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                      {isCleared ? "Cleared" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">General Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record any specific damages or observations..."
                className="h-32 w-full rounded-2xl border border-border bg-background p-4 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-5">
            <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
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
            </section>

            {/* Deposit Deductions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit Deductions</h3>
                <button
                  onClick={() => setDeductions([...deductions, { id: Math.random().toString(36).slice(2), description: "", amount: 0 }])}
                  className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/10"
                >
                  <Plus className="size-3" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {deductions.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-[2rem] border border-dashed border-border bg-muted/10 text-xs font-medium text-muted-foreground">
                    No deductions added.
                  </div>
                ) : (
                  deductions.map((deduction) => (
                    <motion.div
                      key={deduction.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={deduction.description}
                        onChange={(e) => setDeductions(deductions.map(item => item.id === deduction.id ? { ...item, description: e.target.value } : item))}
                        placeholder="Damage description"
                        className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-black focus:border-primary/50 focus:outline-none"
                      />
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black">₱</span>
                        <input
                          type="number"
                          value={deduction.amount}
                          onChange={(e) => setDeductions(deductions.map(item => item.id === deduction.id ? { ...item, amount: parseFloat(e.target.value) || 0 } : item))}
                          className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-xs font-black focus:border-primary/50 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setDeductions(deductions.filter(item => item.id !== deduction.id))}
                        className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="size-4" />
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
                    <span className="text-xs font-black text-muted-foreground">Security Deposit</span>
                    <span className="text-sm font-black text-foreground">₱{originalDeposit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-500">
                    <span className="text-xs font-black">Total Deductions</span>
                    <span className="text-sm font-black">- ₱{totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground">Net Refund</span>
                      <span className="text-2xl font-black text-primary">₱{refundAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <Info className="size-3" />
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
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
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
                <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-amber-500/10 text-amber-500">
                  <AlertCircle className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Final Confirmation</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    You are about to finalize the move-out inspection. This will determine the final refund of <span className="font-black text-primary">₱{refundAmount.toLocaleString()}</span> and notify the tenant.
                  </p>
                </div>

                {/* Conflict Warnings */}
                {(checklist.rent_settled && systemStatus && !systemStatus.rent_settled) && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-black text-red-500">
                    Warning: System shows an outstanding rent balance of ₱{(systemStatus.outstanding_balance || 0).toLocaleString()}. Are you sure it has been settled?
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
                    {loading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Confirm & Save"}
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

