"use client";

import React, { useState } from "react";
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  PlayCircle,
  Loader2,
  ChevronDown,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceTicketSummary } from "@/lib/services/iris";

export interface MaintenanceTicketCardProps {
  tickets?: MaintenanceTicketSummary[];
  onTicketUpdated?: (updated: MaintenanceTicketSummary) => void;
  className?: string;
}

export function MaintenanceTicketCard({
  tickets = [],
  onTicketUpdated,
  className,
}: MaintenanceTicketCardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(() => {
    return tickets[0]?.id || "";
  });

  const [activeAction, setActiveAction] = useState<
    "assign" | "in_progress" | "resolved" | null
  >(null);

  const [technicianName, setTechnicianName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleActionClick = (action: "assign" | "in_progress" | "resolved") => {
    setActiveAction((prev) => (prev === action ? null : action));
    setErrorMsg(null);
    setSuccessMsg(null);
    if (action === "assign" && selectedTicket?.assignedTechnician) {
      setTechnicianName(selectedTicket.assignedTechnician);
    }
  };

  const handleUpdateStatus = async (
    targetStatus: MaintenanceTicketSummary["status"]
  ) => {
    if (!selectedTicket) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (targetStatus === "assigned" && !technicianName.trim()) {
      setErrorMsg("Please enter the technician or contractor's name.");
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch("/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: targetStatus,
          assignedTechnician: technicianName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ticket.");
      }

      setSuccessMsg(`Ticket updated to ${targetStatus.replace("_", " ")}.`);
      setActiveAction(null);
      setTechnicianName("");
      setNotes("");
      onTicketUpdated?.(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error updating ticket status.";
      setErrorMsg(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityBadgeClass = (priority: MaintenanceTicketSummary["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "high":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "medium":
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "low":
      default:
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
  };

  const getStatusBadgeClass = (status: MaintenanceTicketSummary["status"]) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "in_progress":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "assigned":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "pending":
      default:
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div
      className={cn(
        "neumorphic-panel rounded-3xl p-6 sm:p-8 space-y-6 text-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Maintenance & Repairs</h3>
            <p className="text-xs text-muted-foreground">
              Review open repair requests and assign technicians.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-full">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl neumorphic-inset p-8 text-center space-y-2">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-foreground">All Good! No Issues Today</p>
          <p className="text-xs text-muted-foreground">
            No pending or active maintenance tickets for your properties.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Ticket Selector if multiple tickets */}
          {tickets.length > 1 && (
            <div className="space-y-1.5">
              <label
                htmlFor="ticket-select"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Select Request
              </label>
              <select
                id="ticket-select"
                value={selectedTicket?.id}
                onChange={(e) => {
                  setSelectedTicketId(e.target.value);
                  setActiveAction(null);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {tickets.map((t) => (
                  <option key={t.id} value={t.id} className="bg-card text-foreground">
                    [{t.priority.toUpperCase()}] Unit {t.unitName} — {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Ticket Details */}
          {selectedTicket && (
            <div className="rounded-2xl neumorphic-inset p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                      getPriorityBadgeClass(selectedTicket.priority)
                    )}
                  >
                    {selectedTicket.priority} Priority
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                      getStatusBadgeClass(selectedTicket.status)
                    )}
                  >
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="size-3.5" />
                  <span>
                    {new Date(selectedTicket.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedTicket.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Location</span>
                  <span className="font-semibold text-foreground">
                    Unit {selectedTicket.unitName} ({selectedTicket.propertyName})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Resident</span>
                  <span className="font-semibold text-foreground">
                    {selectedTicket.tenantName}
                  </span>
                </div>
                {selectedTicket.assignedTechnician && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[11px]">
                      Assigned Technician
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedTicket.assignedTechnician}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Status Action Buttons */}
          <div className="space-y-3 pt-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Update Status
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleActionClick("assign")}
                className={cn(
                  "min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeAction === "assign"
                    ? "neumorphic-primary text-white shadow-xs"
                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCheck className="size-4" />
                Assign Tech
              </button>

              <button
                type="button"
                onClick={() => handleActionClick("in_progress")}
                className={cn(
                  "min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeAction === "in_progress"
                    ? "neumorphic-primary text-white shadow-xs"
                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                )}
              >
                <PlayCircle className="size-4" />
                In Progress
              </button>

              <button
                type="button"
                onClick={() => handleActionClick("resolved")}
                className={cn(
                  "min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeAction === "resolved"
                    ? "neumorphic-primary text-white shadow-xs"
                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                )}
              >
                <CheckCircle2 className="size-4" />
                Resolved
              </button>
            </div>
          </div>

          {/* Interactive Form Drawer when action selected */}
          {activeAction && (
            <div className="rounded-2xl neumorphic-panel p-4 space-y-3 border border-border/50 animate-in fade-in duration-150">
              {activeAction === "assign" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="tech-name"
                    className="block text-xs font-bold text-foreground"
                  >
                    Technician / Contractor Name
                  </label>
                  <input
                    id="tech-name"
                    type="text"
                    maxLength={60}
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Mang Roberto (Plumber)"
                    className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="action-notes"
                    className="block text-xs font-bold text-foreground"
                  >
                    Resolution / Progress Note (Optional)
                  </label>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {notes.length} / 250
                  </span>
                </div>
                <textarea
                  id="action-notes"
                  maxLength={250}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replaced leaking valve, tested flow..."
                  className="w-full rounded-xl neumorphic-inset p-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  disabled={isUpdating}
                  className="min-h-[40px] px-4 rounded-xl neumorphic-extruded text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    const targetStatus =
                      activeAction === "assign"
                        ? "assigned"
                        : activeAction === "in_progress"
                        ? "in_progress"
                        : "resolved";
                    handleUpdateStatus(targetStatus);
                  }}
                  className="min-h-[40px] px-5 rounded-xl neumorphic-primary font-bold text-xs text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      Confirm Update
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
