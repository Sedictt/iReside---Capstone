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
import { isFixedTerm, termLengthMonths } from "@/lib/lease-term";
import { LeaseTermText } from "@/components/shared/LeaseTermText";
import { T } from "@/context/LanguageContext";

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
            term_type,
            monthly_rent,
            security_deposit,
            signed_at,
            signed_document_url,
            tenant_signature,
            tenant_signed_at,
            landlord_signature,
            landlord_signed_at,
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
                    <T>Back to Leases</T>
                </Link>
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Building2 className="size-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground"><T>Lease Not Found</T></h2>
                        <p className="text-sm text-muted-foreground mt-1"><T>{"This lease does not exist or you don't have access to it."}</T></p>
                    </div>
                    <Link href="/tenant/lease" className="text-sm font-black text-primary hover:text-primary/80 transition-colors">
                        <T>Return to Lease Hub</T>
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
    // Fixed terms show their length; open-ended leases show their state ("Open-ended" / "Moving out …").
    const leaseTermInput = { start_date: lease.start_date, end_date: lease.end_date, term_type: lease.term_type, status: lease.status };
    const termMonths = isFixedTerm(lease) ? termLengthMonths(lease.start_date, lease.end_date) : null;
    const termHeadline = termMonths !== null
        ? <T params={{ count: termMonths }}>{termMonths === 1 ? "{count} Month" : "{count} Months"}</T>
        : <LeaseTermText kind="term" lease={leaseTermInput} />;
    const rentDueDay = (lease.terms as { rent_due_day?: number })?.rent_due_day ?? 1;
    const gracePeriodDays = (lease.terms as { grace_period_days?: number })?.grace_period_days ?? 0;
    const rentDueDayOrdinal = `${rentDueDay}${rentDueDay === 1 ? "st" : rentDueDay === 2 ? "nd" : rentDueDay === 3 ? "rd" : "th"}`;
    const statusLabel = lease.status.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            <Link href="/tenant/lease" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="size-4 mr-1" />
                <T>Back to Lease Hub</T>
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
                        <T params={{ id: `LSE-${leaseHash}` }}>{"Lease #{id}"}</T>
                    </h1>
                    <p className="text-muted-foreground">
                        {lease.unit.property.name} &mdash; <T params={{ unit: lease.unit.name }}>{"Unit {unit}"}</T> &middot;{" "}
                        <span><T>{statusLabel}</T></span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lease.signed_document_url && (
                        <Link
                            href={lease.signed_document_url}
                            target="_blank"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black transition-all text-sm neumorphic-primary"
                        >
                            <Download className="size-4" />
                            <T>Download PDF</T>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Lease Terms Summary */}
                    <div className="rounded-2xl p-6 backdrop-blur-sm neumorphic-panel">
                        <h3 className="text-lg font-black text-foreground mb-6"><T>Lease Summary</T></h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl neumorphic-inset">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"><T>Property</T></p>
                                <div className="flex items-start gap-3">
                                    <MapPin className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">{lease.unit.property.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            <T params={{ unit: lease.unit.name }}>{"Unit {unit}"}</T><br />
                                            {lease.unit.property.address}, {lease.unit.property.city}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl neumorphic-inset">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"><T>Occupants</T></p>
                                <div className="flex items-start gap-3">
                                    <Users className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">{lease.tenant?.full_name || <T>Current Tenant</T>}</p>
                                        <p className="text-sm text-muted-foreground"><T>Primary Tenant</T></p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl neumorphic-inset">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"><T>Term</T></p>
                                <div className="flex items-start gap-3">
                                    <Calendar className="size-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-black text-foreground">{termHeadline}</p>
                                        <p className="text-sm text-muted-foreground"><LeaseTermText kind="range" lease={leaseTermInput} /></p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl neumorphic-inset">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2"><T>Rent</T></p>
                                <div className="flex items-start gap-3">
                                    <div className="size-5 flex items-center justify-center rounded-full text-primary font-black text-xs shrink-0 neumorphic-inset-card">₱</div>
                                    <div>
                                        <p className="font-black text-foreground"><T params={{ amount: `₱${formatCurrency(lease.monthly_rent)}` }}>{"{amount} / month"}</T></p>
                                        <p className="text-sm text-muted-foreground">
                                            {gracePeriodDays > 0
                                                ? <T params={{ day: rentDueDayOrdinal, days: gracePeriodDays }}>{"Due on the {day} ({days}-day grace period)"}</T>
                                                : <T params={{ day: rentDueDayOrdinal }}>{"Due on the {day}"}</T>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Terms */}
                    <div className="rounded-2xl p-6 backdrop-blur-sm neumorphic-panel">
                        <h3 className="text-lg font-black text-foreground mb-6"><T>Key Terms</T></h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg transition-colors neumorphic-extruded">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                <T params={{ amount: `₱${formatCurrency(lease.security_deposit)}` }}>{"Security Deposit: {amount}"}</T>
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg transition-colors neumorphic-extruded">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                <T params={{ amount: `₱${formatCurrency(lease.monthly_rent)}`, day: rentDueDayOrdinal }}>{"Monthly Rent: {amount} due on the {day}"}</T>
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg transition-colors neumorphic-extruded">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                <T params={{ count: lease.unit.beds }}>{"{count} Bedroom"}</T> &middot; <T params={{ count: lease.unit.baths }}>{"{count} Bathroom"}</T> &middot; {lease.unit.sqft ? `${lease.unit.sqft} sqft` : <T>Size not specified</T>}
                            </div>
                            <div className="flex items-center gap-3 text-foreground text-sm p-3 rounded-lg transition-colors neumorphic-extruded">
                                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                                <T>Lease period:</T> <LeaseTermText kind="range" lease={leaseTermInput} />
                            </div>
                        </div>
                        {lease.signed_document_url && (
                            <Link
                                href={lease.signed_document_url}
                                target="_blank"
                                className="mt-6 text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group"
                            >
                                <T>View Full Agreement</T> <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sidebar - Timeline/Status */}
                <div className="space-y-6">
                    <div className="rounded-2xl p-6 backdrop-blur-sm neumorphic-panel">
                        <h3 className="text-lg font-black text-foreground mb-6"><T>Timeline</T></h3>
                        <div className="relative border-l-2 border-border ml-3 space-y-8 pl-6 pb-2">
                            {lease.status === "active" && lease.start_date && (
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                                    <p className="text-sm font-black text-foreground"><T>Lease Active</T></p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(lease.start_date)}</p>
                                </div>
                            )}
                            {lease.signed_at && (
                                <div className="relative">
                                    <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                                    <p className="text-sm font-medium text-foreground"><T>Signed by Tenant</T></p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDate(lease.signed_at)}</p>
                                </div>
                            )}
                            <div className="relative">
                                <span className="absolute -left-[30px] top-1 size-3 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                                <p className="text-sm font-medium text-foreground"><T>Tenant:</T> {lease.tenant?.full_name || <T>Current Tenant</T>}</p>
                                <p className="text-xs text-muted-foreground mt-1">ID: {lease.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 backdrop-blur-sm neumorphic-panel">
                        <h3 className="text-sm font-black text-foreground mb-4"><T>Landlord</T></h3>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full flex items-center justify-center text-primary font-black neumorphic-inset-card">
                                {lease.landlord?.full_name?.charAt(0) || "?"}
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">{lease.landlord?.full_name || <T>Property Manager</T>}</p>
                                <p className="text-xs text-muted-foreground"><T>Property Manager</T></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
