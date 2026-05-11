import type { LeaseStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type LeaseStatusBadgeProps = {
  status: LeaseStatus;
  className?: string;
};

const STATUS_STYLES: Record<LeaseStatus, { label: string; classes: string }> = {
  draft: {
    label: "Draft",
    classes: "bg-neutral-500/10 border-neutral-500/30 text-neutral-300",
  },
  pending_signature: {
    label: "Pending Signature",
    classes: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  },
  pending_tenant_signature: {
    label: "Awaiting Tenant",
    classes: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  },
  pending_landlord_signature: {
    label: "Awaiting Landlord",
    classes: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  },
  active: {
    label: "Active",
    classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
  expired: {
    label: "Expired",
    classes: "bg-orange-500/10 border-orange-500/30 text-orange-300",
  },
  terminated: {
    label: "Terminated",
    classes: "bg-red-500/10 border-red-500/30 text-red-300",
  },
};

export function LeaseStatusBadge({ status, className }: LeaseStatusBadgeProps) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        style.classes,
        className
      )}
    >
      {style.label}
    </span>
  );
}

