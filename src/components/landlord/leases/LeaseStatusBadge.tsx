import type { LeaseStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type LeaseStatusBadgeProps = {
  status: LeaseStatus;
  className?: string;
  dotOnly?: boolean;
};

const STATUS_STYLES: Record<LeaseStatus, { label: string; dotClass: string; badgeClass: string }> = {
  draft: {
    label: "Draft",
    dotClass: "bg-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  pending_signature: {
    label: "Pending Signature",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  pending_tenant_signature: {
    label: "Awaiting Tenant",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  pending_landlord_signature: {
    label: "Awaiting Landlord",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  active: {
    label: "Active",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  expired: {
    label: "Expired",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  terminated: {
    label: "Terminated",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export function LeaseStatusBadge({ status, className, dotOnly }: LeaseStatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  
  if (dotOnly) {
    return (
      <div 
        role="status" 
        aria-label={`Lease status: ${style.label}`}
        className={cn("relative flex size-2.5 items-center justify-center", className)}
      >
        <span className={cn("absolute size-full animate-ping rounded-full opacity-20", style.dotClass)} />
        <span className={cn("relative size-2 rounded-full", style.dotClass)} />
      </div>
    );
  }

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        style.badgeClass,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dotClass)} aria-hidden="true" />
      {style.label}
    </span>
  );
}


