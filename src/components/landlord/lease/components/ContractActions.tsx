import { Loader2, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";

interface ContractActionsProps {
    canSubmit: boolean;
    submitting: boolean;
    isFinalApproval: boolean;
    onClick: () => void;
    onCancel?: () => void;
}

export function ContractActions({
    canSubmit,
    submitting,
    isFinalApproval,
    onClick,
    onCancel,
}: ContractActionsProps) {
    const { t } = useLanguageContext();
    return (
        <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-2.5 border-t border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                    {t("Cancel")}
                </button>
            )}
            <button
                type="button"
                onClick={onClick}
                disabled={!canSubmit}
                className={cn(
                    "inline-flex min-h-[48px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-6 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    canSubmit
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground"
                )}
            >
                {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : isFinalApproval ? (
                    <ShieldCheck className="size-5" />
                ) : (
                    <Send className="size-4" />
                )}
                {submitting
                    ? isFinalApproval
                        ? t("Approving...")
                        : t("Sending...")
                    : isFinalApproval
                      ? t("Approve Tenant")
                      : t("Send Payment Link")}
            </button>
        </div>
    );
}
