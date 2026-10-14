import { X } from "lucide-react";
import { useLanguageContext } from "@/context/LanguageContext";

interface ContractHeaderProps {
    isFinalApproval: boolean;
    onClose: () => void;
}

export function ContractHeader({ isFinalApproval, onClose }: ContractHeaderProps) {
    const { t } = useLanguageContext();
    return (
        <div className="sticky top-0 z-20 bg-[#111] border-b border-white/5 p-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black text-white">
                    {isFinalApproval ? t("Approve Application") : t("Request Payments")}
                </h2>
                <p className="text-xs text-neutral-400">
                    {isFinalApproval
                        ? t("Confirm tenant approval and generate the digital lease contract.")
                        : t("Move application to payment-pending and send secure portal link.")}
                </p>
            </div>
            <button
                onClick={onClose}
                aria-label={t("Close")}
                className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="size-5" />
            </button>
        </div>
    );
}