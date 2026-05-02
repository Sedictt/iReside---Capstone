"use client";

import { motion } from "framer-motion";
import { LeaseData } from "@/types/lease";

export function LeaseDocument(props: LeaseData) {
    const {
        id: leaseId,
        landlord,
        tenant,
        unit,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
    } = props;

    const parties = {
        landlord: landlord.full_name,
        tenant: tenant.full_name
    };

    const property = {
        unit: unit.name,
        street: unit.property.address,
        city: unit.property.city,
        zip: "" // Optional if not in DB
    };

    const term = {
        start: start_date,
        end: end_date
    };

    const rent = {
        monthly: monthly_rent,
        due: "1st of the month" // Default or from DB if available
    };

    const deposit = security_deposit;
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto w-full max-w-4xl bg-white p-6 text-slate-900 shadow-2xl md:p-8 lg:p-10 mb-32 print:shadow-none print:mb-0 transform-gpu font-serif"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
            <header className="mb-6 border-b-2 border-slate-900 pb-3 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                <div>
                    <h1 className="mb-0.5 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
                        RESIDENTIAL LEASE AGREEMENT
                    </h1>
                    <p className="text-sm text-slate-600 italic leading-none">Official Binding Documentation</p>
                </div>
                <div className="text-right text-[9px] uppercase text-slate-500 font-mono tracking-widest">
                    <p className="font-bold">Ref: #{leaseId}</p>
                    <p>Date: {currentDate}</p>
                </div>
            </header>

            <section className="space-y-6 relative z-10 leading-snug text-[13.5px]">
                {/* Section 1: Parties */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        1. PARTIES
                    </h2>
                    <p className="text-slate-800">
                        This Agreement is entered into on <span className="font-bold">{currentDate}</span>, by and between:
                    </p>
                    <div className="grid gap-6 md:grid-cols-2 pt-0.5">
                        <div className="space-y-0">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Landlord</p>
                            <p className="text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-2">{parties.landlord}</p>
                        </div>
                        <div className="space-y-0">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Tenant</p>
                            <p className="text-sm font-bold text-slate-950 underline decoration-slate-300 underline-offset-2">{parties.tenant}</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Property */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        2. THE PREMISES
                    </h2>
                    <div className="pl-4 border-l-2 border-slate-100">
                        <p className="font-bold text-slate-950 text-base leading-tight">{property.unit}</p>
                        <p className="text-slate-700 text-sm">{property.street}, {property.city}</p>
                    </div>
                </div>

                {/* Section 3: Term */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        3. TERM OF LEASE
                    </h2>
                    <p className="text-slate-800">
                        Term begins on <span className="font-bold underline">{term.start}</span> and ends on <span className="font-bold underline">{term.end}</span>.
                    </p>
                </div>

                {/* Section 4: Rent */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        4. RENT PAYMENTS
                    </h2>
                    <p className="text-slate-800">
                        Monthly rent of <span className="font-bold text-slate-950">PHP {rent.monthly.toLocaleString()}.00</span> due on the {rent.due} day of each month.
                    </p>
                </div>

                {/* Section 5: Security Deposit */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        5. SECURITY DEPOSIT
                    </h2>
                    <p className="text-slate-800">
                        Deposit of <span className="font-bold text-slate-950">PHP {deposit.toLocaleString()}.00</span> held for damages or defaults.
                    </p>
                </div>

                {/* Section 6: Utilities */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        6. UTILITIES AND SERVICES
                    </h2>
                    {props.unit.property.house_rules?.includes("strategy:inclusive") ? (
                        <p className="text-slate-800">
                            The monthly rent is <span className="font-bold">INCLUSIVE</span> of standard essential utilities (Water and Electricity).
                        </p>
                    ) : (
                        <p className="text-slate-800">
                            The Tenant shall be responsible for all costs related to: <span className="font-bold">Water and Electricity.</span>
                        </p>
                    )}
                </div>

                {/* Section 7: Amenities & Facilities */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        7. AMENITIES AND FACILITIES
                    </h2>
                    <p className="text-slate-800">
                        Access provided as part of residency: <span className="italic font-bold text-slate-950">{props.unit.property.amenities.length > 0 ? props.unit.property.amenities.map(a => a.name).join(", ") + "." : "Standard residential access."}</span>
                    </p>
                </div>

                {/* Section 8: Building Rules & Conduct */}
                <div className="space-y-1.5">
                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-200 pb-0.5">
                        8. BUILDING RULES & CONDUCT
                    </h2>
                    <p className="text-slate-800 leading-tight">
                        Compliance required for:{" "}
                        <span className="font-bold text-slate-950">
                            {props.unit.property.house_rules
                                ?.filter(rule => !rule.startsWith("strategy:"))
                                .join(", ") || "Standard residential conduct"}
                        </span>. 
                        Violations may constitute a material breach of this Agreement.
                    </p>
                </div>

                {/* Signature Placeholder */}
                <div className="mt-8 pt-4 border-t border-slate-200">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-1.5">
                            <div className="h-10 border-b border-slate-400"></div>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                                LESSEE (TENANT) SIGNATURE
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <div className={`h-10 border-b border-slate-400 flex items-end justify-start ${currentDate.length > 15 ? 'pb-0.5' : 'pb-1'}`}>
                                <span className="text-slate-950 font-mono text-[10px]">{currentDate}</span>
                            </div>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">DATE OF EXECUTION</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.015]">
                <p className="-rotate-45 text-[min(10rem,12vw)] font-black uppercase text-slate-950 select-none">
                    LEGAL DRAFT
                </p>
            </div>

        </motion.div>
    );
}
