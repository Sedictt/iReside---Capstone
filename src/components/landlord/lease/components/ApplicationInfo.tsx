import { Home, User, Mail } from "lucide-react";

interface ApplicationInfoProps {
    propertyName: string;
    unitName: string;
    applicantName: string;
    applicantEmail: string;
}

export function ApplicationInfo({
    propertyName,
    unitName,
    applicantName,
    applicantEmail,
}: ApplicationInfoProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-neutral-300">
                <Home className="size-4 text-neutral-500" />
                <span className="font-medium text-white">{propertyName}</span>
                <span className="text-neutral-500">-</span>
                <span>{unitName}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
                <User className="size-4 text-neutral-500" />
                <span>
                    Tenant: <span className="text-white font-medium">{applicantName}</span>
                </span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300">
                <Mail className="size-4 text-neutral-500" />
                <span>{applicantEmail}</span>
            </div>
        </div>
    );
}