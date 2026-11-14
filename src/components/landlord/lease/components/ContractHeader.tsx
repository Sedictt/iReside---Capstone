import { X } from "lucide-react";
import { useLanguageContext } from "@/context/LanguageContext";

interface ContractHeaderProps {
    isFinalApproval: boolean;
    onClose: () => void;
}

export function ContractHeader({ isFinalApproval, onClose }: ContractHeaderProps) {
    const { t } = useLanguageContext();
    return (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
            <div>
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    {isFinalApproval ? t("Approve Tenant") : t("Send Payment Request")}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {isFinalApproval
                        ? t("Confirm payment and create the lease contract.")
                        : t("Set the move-in amounts and send a payment link to the tenant.")}
                </p>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label={t("Close")}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <X className="size-5" />
            </button>
        </div>
    );
}
