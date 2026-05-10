import { cn } from "@/lib/utils";
import { MoveOutStatus } from "@/types/database";
import { Clock, CheckCircle2, XCircle, CheckSquare } from "lucide-react";

const STATUS_CONFIG: Record<MoveOutStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  pending: {
    label: "Pending Review",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: CheckCircle2,
  },
  denied: {
    label: "Denied",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    icon: CheckSquare,
  },
};

interface MoveOutStatusBadgeProps {
  status: MoveOutStatus;
  className?: string;
}

export function MoveOutStatusBadge({ status, className }: MoveOutStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      <Icon className="size-4" />
      {config.label}
    </div>
  );
}
