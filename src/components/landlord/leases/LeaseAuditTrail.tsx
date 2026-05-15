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
      <div className={cn("rounded-2xl border border-border bg-muted/20 p-6 text-center", className)}>
        <p className="text-xs font-medium text-muted-foreground">No audit events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sortedEvents.map((event) => (
        <div
          key={event.id}
          className="relative pl-6 before:absolute before:left-[7px] before:top-2 before:h-full before:w-[1px] before:bg-border last:before:hidden"
        >
          <div className="absolute left-0 top-1.5 size-3.5 rounded-full border-2 border-primary bg-background shadow-sm" />
          <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/30">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-[13px] font-bold text-foreground">
                {EVENT_LABELS[event.event_type]}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {formatAuditTimestamp(event.created_at)}
              </p>
            </div>
            {event.actor_label && (
              <p className="mt-1 text-[11px] font-medium text-muted-foreground/70">
                Action by {event.actor_label}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


