import { X } from "lucide-react";

interface ContractHeaderProps {
    isFinalApproval: boolean;
    onClose: () => void;
}

export function ContractHeader({ isFinalApproval, onClose }: ContractHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-[#111] border-b border-white/5 p-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-white">
                    {isFinalApproval ? "Finalize Approval" : "Request Payments"}
                </h2>
                <p className="text-xs text-neutral-400">
                    {isFinalApproval
                        ? "Complete approval after both payment requests are confirmed."
                        : "Move application to payment-pending and send secure portal link."}
                </p>
            </div>
            <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="size-5" />
            </button>
        </div>
    );
}