import { m as motion } from "framer-motion";
import { LeaseData } from "@/types/lease";
import { cn } from "@/lib/utils";

export interface LeaseDocumentProps {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    signed_at?: string | null;
    signed_document_url?: string | null;
    status?: string;
    tenant_signature?: string | null;
    tenant_signed_at?: string | null;
    landlord_signature?: string | null;
    landlord_signed_at?: string | null;
    terms?: any;
    unit?: {
        name?: string;
        property?: {
            name?: string;
            address?: string;
            city?: string;
            house_rules?: string[];
            amenities?: any[];
            [key: string]: any;
        };
        [key: string]: any;
    };
    landlord?: {
        full_name?: string;
        email?: string;
        [key: string]: any;
    };
    tenant?: {
        full_name?: string;
        email?: string;
        [key: string]: any;
    };
    containerId?: string;
    className?: string;
    disableAnimation?: boolean;
}

export function LeaseDocument(leaseDataProps: LeaseDocumentProps) {
    const {
        id: leaseId,
        landlord,
        tenant,
        unit,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        containerId,
        className,
        disableAnimation = false,
    } = leaseDataProps;

    const parties = {
        landlord: landlord?.full_name || "Property Owner",
        tenant: tenant?.full_name || "Valued Resident"
    };

    const property = {
        unit: unit?.name ? (unit.name.toLowerCase().startsWith("unit") ? unit.name : `Unit ${unit.name}`) : "Unit",
        street: unit?.property?.address || "Main Street",
        city: unit?.property?.city || "",
        zip: "" // Optional if not in DB
    };

    const formatDateStr = (d?: string) => {
        if (!d || d === "--") return "--";
        try {
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) return d;
            return dateObj.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return d;
        }
    };

    const term = {
        start: formatDateStr(start_date),
        end: formatDateStr(end_date)
    };

    const getOrdinalSuffix = (dayOfMonth: number): string => {
        if (dayOfMonth > 3 && dayOfMonth < 21) return 'th';
        switch (dayOfMonth % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const dueDay = leaseDataProps.terms?.due_day ?? leaseDataProps.terms?.rent_due_day;
    const rentDetails = {
        monthly: monthly_rent || 0,
        due: dueDay ? `${dueDay}${getOrdinalSuffix(Number(dueDay))} of the month` : "1st of the month"
    };

    const deposit = security_deposit || 0;
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div
            id={containerId}
            className={cn(
                "relative mx-auto w-full max-w-4xl bg-white p-6 text-zinc-900 shadow-2xl md:p-8 lg:p-10 print:shadow-none print:mb-0 transform-gpu font-serif",
                className
            )}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            suppressHydrationWarning
        >
            <header className="mb-6 border-b-2 border-zinc-900 pb-3 flex justify-between items-end gap-4 relative z-10">
                <div>
                    <h1 className="mb-0.5 text-xl font-black tracking-tight text-zinc-950 md:text-2xl leading-none">
                        RESIDENTIAL LEASE AGREEMENT
                    </h1>
                    <p className="text-sm text-zinc-600 italic leading-none mt-1">Official Binding Documentation</p>
                </div>
                <div className="text-right text-[9px] uppercase text-zinc-500 font-mono tracking-widest shrink-0">
                    <p className="font-black text-zinc-700">Ref: #{leaseId ? (leaseId.length > 16 ? leaseId.slice(0, 8).toUpperCase() : leaseId.toUpperCase()) : "OFFICIAL"}</p>
                    <p>Date: {currentDate}</p>
                </div>
            </header>

            <section className="space-y-6 relative z-10 leading-snug text-[13.5px]">
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        1. PARTIES
                    </h2>
                    <p className="text-zinc-800">
                        This Agreement is entered into on <span className="font-black">{currentDate}</span>, by and between:
                    </p>
                    <div className="grid gap-6 md:grid-cols-2 pt-0.5">
                        <div className="space-y-0">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Landlord</p>
                            <p className="text-sm font-black text-zinc-950 underline decoration-border underline-offset-2">{parties.landlord}</p>
                        </div>
                        <div className="space-y-0">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Tenant</p>
                            <p className="text-sm font-black text-zinc-950 underline decoration-border underline-offset-2">{parties.tenant}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        2. THE PREMISES
                    </h2>
                    <div className="pl-4 border-l-2 border-zinc-100">
                        <p className="font-black text-zinc-950 text-base leading-tight">{property.unit}</p>
                        <p className="text-zinc-700 text-sm">{property.street}, {property.city}</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        3. TERM OF LEASE
                    </h2>
                    <p className="text-zinc-800">
                        Term begins on <span className="font-black underline">{term.start}</span> and ends on <span className="font-black underline">{term.end}</span>.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        4. RENT PAYMENTS
                    </h2>
                    <p className="text-zinc-800">
                        Monthly rent of <span className="font-black text-zinc-950">₱ {rentDetails.monthly.toLocaleString()}.00</span> due on the {rentDetails.due} day of each month.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        5. SECURITY DEPOSIT
                    </h2>
                    <p className="text-zinc-800">
                        Deposit of <span className="font-black text-zinc-950">₱ {deposit.toLocaleString()}.00</span> held for damages or defaults.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        6. UTILITIES AND SERVICES
                    </h2>
                    {Array.isArray(leaseDataProps.unit?.property?.house_rules) && leaseDataProps.unit.property.house_rules.includes("strategy:inclusive") ? (
                        <p className="text-zinc-800">
                            The monthly rent is <span className="font-black">INCLUSIVE</span> of standard essential utilities (Water and Electricity).
                        </p>
                    ) : (
                        <p className="text-zinc-800">
                            The Tenant shall be responsible for all costs related to: <span className="font-black">Water and Electricity.</span>
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        7. AMENITIES AND FACILITIES
                    </h2>
                    <p className="text-zinc-800">
                        Access provided as part of residency: <span className="italic font-black text-zinc-950">{Array.isArray(leaseDataProps.unit?.property?.amenities) && leaseDataProps.unit.property.amenities.length > 0 ? leaseDataProps.unit.property.amenities.map(amenityItem => amenityItem.name).join(", ") + "." : "Standard residential access."}</span>
                    </p>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-0.5">
                        8. BUILDING RULES & CONDUCT
                    </h2>
                    <p className="text-zinc-800 leading-tight">
                        Compliance required for:{" "}
                        <span className="font-black text-zinc-950">
                            {(Array.isArray(leaseDataProps.unit?.property?.house_rules)
                                ? leaseDataProps.unit.property.house_rules
                                    .filter(ruleItem => !ruleItem.startsWith("strategy:"))
                                    .join(", ")
                                : "") || "Standard residential conduct"}
                        </span>. 
                        Violations may constitute a material breach of this Agreement.
                    </p>
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-200">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Tenant signature block */}
                        <div className="space-y-1.5">
                            <div className="h-12 border-b border-zinc-400 flex items-end pb-1">
                                {leaseDataProps.tenant_signature ? (
                                    <img 
                                        src={leaseDataProps.tenant_signature} 
                                        alt="Tenant Signature" 
                                        className="h-10 max-w-full object-contain" 
                                    />
                                ) : (
                                    <span className="text-[10px] text-zinc-400 italic">
                                        {leaseDataProps.tenant_signed_at ? "Signed digitally" : "Pending signature"}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                    LESSEE (TENANT) SIGNATURE
                                </p>
                                {leaseDataProps.tenant_signed_at && (
                                    <span className="text-[8px] font-mono text-zinc-500">
                                        {new Date(leaseDataProps.tenant_signed_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Landlord signature block */}
                        <div className="space-y-1.5">
                            <div className="h-12 border-b border-zinc-400 flex items-end pb-1">
                                {leaseDataProps.landlord_signature ? (
                                    <img 
                                        src={leaseDataProps.landlord_signature} 
                                        alt="Landlord Signature" 
                                        className="h-10 max-w-full object-contain" 
                                    />
                                ) : (
                                    <span className="text-[10px] text-zinc-400 italic">
                                        {leaseDataProps.landlord_signed_at ? "Signed digitally" : "Pending signature"}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                    LESSOR (LANDLORD) SIGNATURE
                                </p>
                                <span className="text-[8px] font-mono text-zinc-500">
                                    {leaseDataProps.landlord_signed_at 
                                        ? new Date(leaseDataProps.landlord_signed_at).toLocaleDateString()
                                        : currentDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.02]">
                <p className="-rotate-45 text-[min(8rem,10vw)] font-black uppercase text-zinc-950 select-none tracking-widest">
                    {leaseDataProps.signed_at || leaseDataProps.landlord_signed_at || leaseDataProps.status === "active" 
                        ? "OFFICIAL LEASE" 
                        : "LEGAL DRAFT"}
                </p>
            </div>
        </div>
    );
}

