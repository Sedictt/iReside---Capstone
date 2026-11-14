import { Home, User } from "lucide-react";

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
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground">
                <User className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-bold">{applicantName}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground break-all">{applicantEmail}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                <Home className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">{propertyName}</span>
                <span>·</span>
                <span>{unitName}</span>
            </div>
        </div>
    );
}
