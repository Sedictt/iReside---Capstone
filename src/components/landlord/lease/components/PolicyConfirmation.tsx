import { ShieldCheck } from "lucide-react";
import { useLanguageContext } from "@/context/LanguageContext";

interface PolicyConfirmationProps {
    isFinalApproval: boolean;
    applicantEmail?: string;
}

export function PolicyConfirmation({
    isFinalApproval,
    applicantEmail,
}: PolicyConfirmationProps) {
    const { t } = useLanguageContext();
    return (
        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="leading-relaxed">
                {isFinalApproval
                    ? t("This will finalize the lease and mark the tenant as approved.")
                    : applicantEmail
                        ? t("This sends a private payment link to {email}. You will still confirm their receipt before move-in.", {
                              email: applicantEmail,
                          })
                        : t("This sends a private payment link to the applicant. You will still confirm their receipt before move-in.")}
            </p>
        </div>
    );
}
