"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Calendar,
  User,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  MessageSquare,
  FileText,
  Mail,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { MoveOutStatusBadge } from "./MoveOutStatusBadge";
import { MoveOutStatus } from "@/types/database";

import { MoveOutInspectionForm } from "./MoveOutInspectionForm";

interface MoveOutRequest {
  id: string;
  status: MoveOutStatus;
  requested_date: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  denial_reason: string | null;
  denied_at: string | null;
  approved_at: string | null;
  inspection_date: string | null;
  inspection_notes: string | null;
  deposit_refund_amount: number | null;
  checklist_data: Record<string, boolean> | null;
  lease: {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    unit: {
      name: string;
      property: {
        id: string;
        name: string;
        address: string;
      };
    };
    tenant: {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
    };
  };
}

interface MoveOutRequestDetailsProps {
  request: MoveOutRequest;
  onBack: () => void;
  onUpdate: () => void;
}

export function MoveOutRequestDetails({ request, onBack, onUpdate }: MoveOutRequestDetailsProps) {
  const [actionLoading, setActionLoading] = useState<"approve" | "deny" | null>(null);
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this move-out request? This will align the lease end date with the requested move-out date.")) return;
    
    setActionLoading("approve");
    setError(null);
    try {
      const response = await fetch(`/api/landlord/move-out/${request.id}/approve`, {
        method: "PUT",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve request");
      }
      
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!denialReason.trim()) {
      setError("Please provide a reason for denial.");
      return;
    }
    
    setActionLoading("deny");
    setError(null);
    try {
      const response = await fetch(`/api/landlord/move-out/${request.id}/deny`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denial_reason: denialReason }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to deny request");
      }
      
      setShowDenyDialog(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Are you sure you want to finalize this move-out? This will terminate the lease and mark the unit as vacant.")) return;
    
    setActionLoading("approve"); // reuse loading state for simplicity or add a new one
    setError(null);
    try {
      const response = await fetch(`/api/landlord/move-out/${request.id}/complete`, {
        method: "PUT",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete move-out");
      }
      
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const timelineEvents = [
    {
      title: "Request Submitted",
      date: formatDate(request.created_at),
      icon: Clock,
      status: "completed",
    },
    {
      title: request.status === "denied" ? "Request Denied" : "Landlord Approval",
      date: request.approved_at ? formatDate(request.approved_at) : (request.denied_at ? formatDate(request.denied_at) : "Pending"),
      icon: request.status === "denied" ? XCircle : CheckCircle2,
      status: request.status === "pending" ? "pending" : "completed",
      color: request.status === "denied" ? "text-red-500" : "text-blue-500",
    },
    {
      title: "Move-Out Inspection",
      date: "Scheduled after approval",
      icon: ShieldCheck,
      status: request.status === "approved" || request.status === "completed" ? "pending" : "upcoming",
    },
    {
      title: "Lease Terminated",
      date: "Final step",
      icon: FileText,
      status: request.status === "completed" ? "completed" : "upcoming",
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className="group flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:bg-muted active:scale-95"
          >
            <ChevronLeft className="size-5 text-muted-foreground group-hover:text-primary" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground">Move-Out Request</h1>
              <MoveOutStatusBadge status={request.status} />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">ID: {request.id.slice(0, 8)}</span>
              <span>•</span>
              <span>Submitted on {formatDate(request.created_at)}</span>
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDenyDialog(true)}
              disabled={!!actionLoading}
              className="flex h-11 items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 active:scale-95 disabled:opacity-50"
            >
              <XCircle className="size-4" />
              Deny Request
            </button>
            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {actionLoading === "approve" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Approve Move-Out
            </button>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-medium text-red-500"
        >
          <AlertTriangle className="size-5 shrink-0" />
          {error}
        </motion.div>
      )}

      {isInspecting ? (
        <MoveOutInspectionForm
          requestId={request.id}
          leaseId={request.lease.id}
          originalDeposit={request.lease.security_deposit}
          onSuccess={() => {
            setIsInspecting(false);
            onUpdate();
          }}
          onCancel={() => setIsInspecting(false)}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content Column */}
          <div className="flex flex-col gap-8 lg:col-span-8">
            
            {/* Contextual Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Dates Snapshot */}
              <div className="col-span-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="grid divide-x divide-border md:grid-cols-2">
                  <div className="flex items-center gap-4 p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Calendar className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requested Move-Out</p>
                      <p className="text-lg font-black text-foreground">{formatDate(request.requested_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-muted/10">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                      <Clock className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Lease Ends</p>
                      <p className="text-lg font-black text-foreground">{formatDate(request.lease.end_date)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Card */}
              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
                    <User className="size-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-foreground truncate">{request.lease.tenant.full_name}</p>
                    <p className="text-xs font-medium text-muted-foreground truncate">{request.lease.tenant.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a href={`mailto:${request.lease.tenant.email}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted">
                    <Mail className="size-3.5" /> Email
                  </a>
                  {request.lease.tenant.phone && (
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <MessageSquare className="size-3.5" /> {request.lease.tenant.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Property Card */}
              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property & Unit</h3>
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/5">
                    <Home className="size-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-foreground truncate">{request.lease.unit.name}</p>
                    <p className="text-xs font-medium text-muted-foreground truncate">{request.lease.unit.property.name}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-[10px] font-bold text-muted-foreground leading-relaxed">
                  {request.lease.unit.property.address}
                </div>
              </div>
            </div>

            {/* Narrative Sections */}
            <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-primary" />
                  Reason for Moving Out
                </h3>
                <div className="rounded-2xl bg-muted/20 p-6 italic text-sm font-medium text-foreground leading-relaxed ring-1 ring-border/50">
                  &quot;{request.reason || "No reason provided by tenant."}&quot;
                </div>
              </div>

              {request.status === "denied" && request.denial_reason && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <XCircle className="size-3.5" />
                    Reason for Denial
                  </h3>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 italic text-sm font-medium text-red-600 leading-relaxed">
                    &quot;{request.denial_reason}&quot;
                  </div>
                </div>
              )}

              {request.inspection_notes && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <ShieldCheck className="size-3.5" />
                    Inspection Notes
                  </h3>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-sm font-medium text-foreground leading-relaxed">
                    {request.inspection_notes}
                  </div>
                </div>
              )}
            </div>

            {/* Action Banners */}
            {request.status === "approved" && !request.inspection_date && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Pending Inspection</h3>
                    <p className="text-sm font-medium text-primary-foreground/80 max-w-lg">
                      The move-out has been approved. Please perform the physical inspection to finalize security deposit deductions.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInspecting(true)}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-white px-8 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-white/90 active:scale-95"
                  >
                    Start Inspection
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                {/* Subtle background decoration */}
                <ShieldCheck className="absolute -right-4 -bottom-4 size-32 text-white/5 rotate-12" />
              </motion.div>
            )}

            {request.status === "approved" && request.inspection_date && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] bg-emerald-500 p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Inspection Completed</h3>
                    <p className="text-sm font-medium text-white/80 max-w-lg">
                      Refund amount: <span className="text-white font-black">₱{(request.deposit_refund_amount || 0).toLocaleString()}</span>. Finalize the move-out to terminate the lease.
                    </p>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={!!actionLoading}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-white px-8 text-[10px] font-black uppercase tracking-widest text-emerald-600 transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === "approve" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Complete Move-Out
                  </button>
                </div>
                <CheckCircle2 className="absolute -right-4 -bottom-4 size-32 text-white/5 rotate-12" />
              </motion.div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Clearance Checklist */}
            {(request.status === "completed" || request.checklist_data) && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clearance Checklist</h3>
                <div className="space-y-2">
                  {Object.entries(request.checklist_data || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      <span className="text-[11px] font-bold capitalize text-foreground">{key.replace(/_/g, " ")}</span>
                      {value ? (
                        <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                          <CheckCircle2 className="size-3.5" />
                        </div>
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                          <XCircle className="size-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Timeline */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workflow Timeline</h3>
              <div className="relative space-y-8">
                <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" />

                {timelineEvents.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className={cn(
                        "z-10 flex size-8 items-center justify-center rounded-xl transition-all ring-4 ring-card",
                        event.status === "completed" ? (event.color?.replace('text-', 'bg-') || "bg-primary text-white") : (event.status === "pending" ? "bg-amber-500 text-white animate-pulse" : "bg-muted text-muted-foreground")
                      )}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className={cn(
                          "text-xs font-black",
                          event.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {event.title}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {event.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lease Stats Card */}
            <div className="rounded-3xl border border-border bg-muted/20 p-6">
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lease Financials</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Monthly Rent</span>
                  <span className="text-sm font-black text-foreground">₱{(request.lease?.monthly_rent || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Security Deposit</span>
                  <span className="text-sm font-black text-foreground">₱{(request.lease?.security_deposit || 0).toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted active:scale-[0.98]">
                    <FileText className="size-3.5" />
                    Original Lease
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deny Dialog */}
      <AnimatePresence>
        {showDenyDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDenyDialog(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-foreground tracking-tight">Deny Move-Out</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">
                Please provide a reason for denying this request. This will be shared with the tenant for their record.
              </p>

              <div className="mt-6">
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="e.g., Minimum stay requirements not met..."
                  className="h-32 w-full rounded-2xl border border-border bg-background p-4 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowDenyDialog(false)}
                  className="flex-1 rounded-2xl border border-border py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeny}
                  disabled={actionLoading === "deny"}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === "deny" ? (
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  ) : (
                    "Confirm Denial"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

