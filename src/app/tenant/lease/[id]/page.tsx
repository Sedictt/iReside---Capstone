import {
    ChevronLeft,
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    Users,
    MapPin,
    ArrowUpRight,
    Building2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function LeaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: lease } = await supabase
        .from("leases")
        .select(`
            id,
            status,
            start_date,
            end_date,
            monthly_rent,
            security_deposit,
            signed_at,
            signed_document_url,
            terms,
            unit:units!inner (
                name,
                floor,
                sqft,
                beds,
                baths,
                property:properties!inner (
                    id,
                    name,
                    address,
                    city
                )
            ),
            landlord:profiles!leases_landlord_id_fkey (
                id,
                full_name,
                avatar_url
            ),
            tenant:profiles!leases_tenant_id_fkey (
                full_name
            )
        `)
        .eq("id", id)
        .eq("tenant_id", user?.id ?? "")
        .maybeSingle();

    if (!lease) {
        return (
            <div className="space-y-8">
                <Link href="/tenant/lease" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="size-4 mr-1" />
                    Back to Leases
                </Link>
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Building2 className="size-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground">Lease Not Found</h2>
                        <p className="text-sm text-muted-foreground mt-1">This lease does not exist or you don&apos;t have access to it.</p>
                    </div>
                    <Link href="/tenant/lease" className="text-sm font-black text-primary hover:text-primary/80 transition-colors">
                        Return to Lease Hub
                    </Link>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };

    const leaseHash = lease.id.replace(/-/g, "").substring(0, 8).toUpperCase();
    const rentDueDay = (lease.terms as { rent_due_day?: number })?.rent_due_day ?? 1;
    const gracePeriodDays = (lease.terms as { grace_period_days?: number })?.grace_period_days ?? 0;

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            <Link href="/tenant/lease" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="size-4 mr-1" />
                Back to Lease Hub
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
                        Lease #LSE-{leaseHash}
                    </h1>
                    <p className="text-muted-foreground">
                        {lease.unit.property.name} &mdash; Unit {lease.unit.name} &middot;{" "}
                        <span className="capitalize">{lease.status}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lease.signed_document_url && (
                        <Link
                            href={lease.signed_document_url}
                            target="_blank"
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            <Download className="size-4" />
                            Download PDF
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Lease Terms Summary */}
                    <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-black text-foreground mb-6">Lease Summary</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Property</p>
                                <div className="flex items-start gap-3">
                                    <MapPin className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">{lease.unit.property.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Unit {lease.unit.name}<br />
                                            {lease.unit.property.address}, {lease.unit.property.city}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Occupants</p>
                                <div className="flex items-start gap-3">
                                    <Users className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">{lease.tenant?.full_name || "Current Tenant"}</p>
                                        <p className="text-sm text-muted-foreground">Primary Tenant</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Term</p>
                                <div className="flex items-start gap-3">
                                    <Calendar className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">
                                            {lease.start_date && lease.end_date
                                                ? `${Math.round((new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) / 86400000 / 30)} Months`
                                                : "Variable"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(lease.start_date)} &ndash; {formatDate(lease.end_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rent</p>
                                <div className="flex items-start gap-3">
                                    <div className="size-5 flex items-center justify-center rounded-full bg-primary/20 text-primary font-black text-xs shrink-0">₱</div>
                                    <div>
                                        <p className="font-black text-foreground">₱{formatCurrency(lease.monthly_rent)} / month</p>
                                        <p className="text-sm text-muted-foreground">Due on the {rentDueDay}{rentDueDay === 1 ? "st" : rentDueDay === 2 ? "nd" : rentDueDay === 3 ? "rd" : "th"}{gracePeriodDays > 0 ? ` (${gracePeriodDays}-day grace period)` : ""}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Terms */}
                    <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-black text-foreground mb-6">Key Terms</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                Security Deposit: ₱{formatCurrency(lease.security_deposit)}
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                Monthly Rent: ₱{formatCurrency(lease.monthly_rent)} due on the {rentDueDay}{rentDueDay === 1 ? "st" : rentDueDay === 2 ? "nd" : rentDueDay === 3 ? "rd" : "th"}
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                {lease.unit.beds} Bedroom &middot; {lease.unit.baths} Bathroom &middot; {lease.unit.sqft ? `${lease.unit.sqft} sqft` : "Size not specified"}
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                Lease period: {formatDate(lease.start_date)} &ndash; {formatDate(lease.end_date)}
                            </div>
                        </div>
                        {lease.signed_document_url && (
                            <Link
                                href={lease.signed_document_url}
                                target="_blank"
                                className="mt-6 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group"
                            >
                                View Full Agreement <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sidebar - Timeline/Status */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-black text-foreground mb-6">Timeline</h3>
                        <div className="relative border-l-2 border-border ml-3 space-y-8 pl-6 pb-2">
                            {lease.status === "active" && lease.start_date && (
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                                    <p className="text-sm font-black text-foreground">Lease Active</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(lease.start_date)}</p>
                                </div>
                            )}
                            {lease.signed_at && (
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                                    <p className="text-sm font-medium text-foreground">Signed by Tenant</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(lease.signed_at)}</p>
                                </div>
                            )}
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                                <p className="text-sm font-medium text-foreground">Tenant: {lease.tenant?.full_name || "Current Tenant"}</p>
                                <p className="text-xs text-muted-foreground mt-1">ID: {lease.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-black text-foreground mb-4">Landlord</h3>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                                {lease.landlord?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">{lease.landlord?.full_name || "Property Manager"}</p>
                                <p className="text-xs text-muted-foreground">Property Manager</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
