import { Calendar, Banknote } from "lucide-react";

interface LeaseFormFieldsProps {
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    advanceAmount: number;
    securityDeposit: number;
    isFinalApproval: boolean;
    onLeaseStartChange: (value: string) => void;
    onMonthlyRentChange: (value: number) => void;
    onAdvanceAmountChange: (value: number) => void;
    onSecurityDepositChange: (value: number) => void;
}

export function LeaseFormFields({
    leaseStart,
    leaseEnd,
    monthlyRent,
    advanceAmount,
    securityDeposit,
    isFinalApproval,
    onLeaseStartChange,
    onMonthlyRentChange,
    onAdvanceAmountChange,
    onSecurityDepositChange,
}: LeaseFormFieldsProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label
                        htmlFor="lease-start"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Calendar className="size-3.5" />
                        Lease Start Date
                    </label>
                    <input
                        id="lease-start"
                        type="date"
                        value={leaseStart}
                        onChange={(event) => onLeaseStartChange(event.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="lease-end"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Calendar className="size-3.5" />
                        Lease End Date
                    </label>
                    <input
                        id="lease-end"
                        type="date"
                        value={leaseEnd}
                        disabled
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-neutral-400 text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label
                        htmlFor="monthly-rent"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Monthly Rent
                    </label>
                    <input
                        id="monthly-rent"
                        type="number"
                        min={0}
                        value={monthlyRent}
                        onChange={(event) => onMonthlyRentChange(Number(event.target.value) || 0)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="advance-invoice"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Advance Invoice
                    </label>
                    <input
                        id="advance-invoice"
                        type="number"
                        min={0}
                        value={advanceAmount}
                        onChange={(event) => onAdvanceAmountChange(Number(event.target.value) || 0)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="security-deposit"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Security Deposit
                    </label>
                    <input
                        id="security-deposit"
                        type="number"
                        min={0}
                        value={securityDeposit}
                        onChange={(event) => onSecurityDepositChange(Number(event.target.value) || 0)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>
        </>
    );
}