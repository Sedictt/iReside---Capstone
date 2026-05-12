interface PolicyConfirmationProps {
    policyConfirmed: boolean;
    isFinalApproval: boolean;
    onPolicyConfirmedChange: (checked: boolean) => void;
}

export function PolicyConfirmation({
    policyConfirmed,
    isFinalApproval,
    onPolicyConfirmedChange,
}: PolicyConfirmationProps) {
    return (
        <>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-100">
                <p className="font-bold mb-1">Policy enforcement</p>
                <p>
                    Approval creates pending invoices only. Move-in payment completion is counted after
                    landlord-confirmed proof, not at application submission.
                </p>
            </div>

            {!isFinalApproval && (
                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={policyConfirmed}
                        onChange={(event) => onPolicyConfirmedChange(event.target.checked)}
                        className="mt-0.5 size-4 rounded border-white/20 bg-transparent"
                    />
                    <span className="text-xs text-neutral-300 leading-relaxed">
                        I confirm this should start payment-pending stage and send the payment portal
                        link to the prospect.
                    </span>
                </label>
            )}
        </>
    );
}