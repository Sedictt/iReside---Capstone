"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type LeaseAuditEvent = {
  id: string;
  created_at: string;
  event_type:
    | "signing_link_generated"
    | "signing_link_accessed"
    | "signing_link_expired"
    | "signing_link_regenerated"
    | "tenant_signed"
    | "landlord_signed"
    | "lease_activated"
    | "signing_failed";
  metadata?: Record<string, unknown> | null;
  actor_label?: string | null;
};

type LeaseAuditTrailProps = {
  events: LeaseAuditEvent[];
  className?: string;
};

const EVENT_LABELS: Record<LeaseAuditEvent["event_type"], string> = {
  signing_link_generated: "Signing link generated",
  signing_link_accessed: "Signing link accessed",
  signing_link_expired: "Signing link expired",
  signing_link_regenerated: "Signing link regenerated",
  tenant_signed: "Tenant signed lease",
  landlord_signed: "Landlord countersigned lease",
  lease_activated: "Lease activated",
  signing_failed: "Signing failed",
};

function formatAuditTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

export function LeaseAuditTrail({ events, className }: LeaseAuditTrailProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events]
  );

  if (sortedEvents.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] p-4", className)}>
        <p className="text-xs font-medium text-neutral-400">No signing audit events yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3", className)}>
      {sortedEvents.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">{EVENT_LABELS[event.event_type]}</p>
            {event.actor_label && <p className="text-[11px] text-neutral-400 mt-0.5">By: {event.actor_label}</p>}
          </div>
          <p className="text-[11px] text-neutral-400 whitespace-nowrap">{formatAuditTimestamp(event.created_at)}</p>
        </div>
      ))}
    </div>
  );
}

