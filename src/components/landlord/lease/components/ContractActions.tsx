import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractActionsProps {
    canSubmit: boolean;
    submitting: boolean;
    isFinalApproval: boolean;
    onClick: () => void;
}

export function ContractActions({
    canSubmit,
    submitting,
    isFinalApproval,
    onClick,
}: ContractActionsProps) {
    return (
        <button
            onClick={onClick}
            disabled={!canSubmit}
            className={cn(
                "w-full h-14 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed",
                canSubmit
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : "bg-white/10 text-neutral-500"
            )}
        >
            {submitting ? (
                <Loader2 className="size-5 animate-spin" />
            ) : (
                <ShieldCheck className="size-5" />
            )}
            {submitting
                ? isFinalApproval
                    ? "Finalizing…"
                    : "Requesting…"
                : isFinalApproval
                  ? "Finalize Approval"
                  : "Request Payments"}
        </button>
    );
}