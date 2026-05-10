import { cn } from "@/lib/utils";
import { Building2, ShieldCheck, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type BadgeRole = "tenant" | "landlord" | "admin";

type RoleBadgeProps = {
    role?: BadgeRole | null;
    className?: string;
    showTenant?: boolean;
};

const ROLE_META: Record<
    BadgeRole,
    { label: string; className: string; icon: LucideIcon }
> = {
    tenant: {
        label: "Tenant",
        className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
        icon: User,
    },
    landlord: {
        label: "Landlord",
        className: "border-primary/35 bg-primary/15 text-primary",
        icon: Building2,
    },
    admin: {
        label: "Admin",
        className: "border-violet-500/35 bg-violet-500/15 text-violet-300",
        icon: ShieldCheck,
    },
};

export function RoleBadge({ role, className, showTenant = false }: RoleBadgeProps) {
    if (!role) return null;
    if (role === "tenant" && !showTenant) return null;

    const meta = ROLE_META[role];
    const Icon = meta.icon;

    return (
        <span
            role="img"
            aria-label={meta.label}
            title={meta.label}
            className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center rounded-full border",
                meta.className,
                className
            )}
        >
            <Icon className="size-2.5" />
        </span>
    );
}
