"use client";

import { motion } from "framer-motion";

interface LeaseDocumentProps {
    leaseId: string;
    parties: { landlord: string; tenant: string };
    property: { unit: string; street: string; city: string; zip: string };
    term: { start: string; end: string };
    rent: { monthly: number; due: string };
    deposit: number;
}

export function LeaseDocument({
    leaseId,
    parties,
    property,
    term,
    rent,
    deposit,
}: LeaseDocumentProps) {
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
            className="relative mx-auto w-full max-w-4xl bg-white p-8 text-slate-800 shadow-2xl md:p-12 lg:p-16 mb-32 print:shadow-none print:mb-0 transform-gpu"
        >
            <header className="mb-12 border-b border-slate-200 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                <div>
                    <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl font-serif">
                        RESIDENTIAL LEASE AGREEMENT
                    </h1>
                    <p className="text-lg text-slate-500 font-serif italic">State of California</p>
                </div>
                <div className="text-right text-xs uppercase text-slate-400 font-mono tracking-wide">
                    <p>Doc Ref: #{leaseId}</p>
                    <p>Date: {currentDate}</p>
                </div>
            </header>

            <section className="space-y-12 relative z-10">
                {/* Section 1: Parties */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        1. Parties
                    </h2>
                    <p className="mb-6 leading-relaxed text-slate-600">
                        This Residential Lease Agreement (&quot;Agreement&quot;) is made and entered into on this{" "}
                        <span className="font-semibold text-slate-900">{currentDate}</span>, by and between:
                    </p>
                    <div className="grid gap-6 rounded-xl bg-slate-50 p-6 md:grid-cols-2 border border-slate-100">
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Landlord
                            </p>
                            <p className="text-lg font-semibold text-slate-900">{parties.landlord}</p>
                            <p className="text-sm text-slate-500">123 Business Park Dr, San Francisco, CA</p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Tenant
                            </p>
                            <p className="text-lg font-semibold text-slate-900">{parties.tenant}</p>
                            <p className="text-sm text-slate-500">ID: 998-XX-XXXX</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Property */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        2. Property
                    </h2>
                    <p className="mb-4 leading-relaxed text-slate-600">
                        The Landlord agrees to lease to the Tenant, and the Tenant agrees to lease from the
                        Landlord, the following property:
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-4">
                        <div className="h-10 w-1 bg-slate-200 rounded-full"></div>
                        <div>
                            <p className="font-medium text-slate-900 text-lg">{property.unit}</p>
                            <p className="text-slate-600">{property.street}</p>
                            <p className="text-slate-600">
                                {property.city}, {property.zip}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 3: Term */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        3. Term
                    </h2>
                    <p className="leading-relaxed text-slate-600 border-l-4 border-blue-500 pl-4 py-3 bg-blue-50/30 rounded-r-lg italic">
                        The lease term shall commence on{" "}
                        <span className="font-semibold text-slate-900 not-italic">{term.start}</span> and shall terminate on{" "}
                        <span className="font-semibold text-slate-900 not-italic">{term.end}</span> (&quot;Lease Term&quot;).
                    </p>
                </div>

                {/* Section 4: Rent */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        4. Rent
                    </h2>
                    <p className="mb-4 leading-relaxed text-slate-600">
                        Tenant agrees to pay Landlord as rent for the Premises the sum of{" "}
                        <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                            ${rent.monthly.toLocaleString()}.00
                        </span>{" "}
                        per month, payable in advance on the {rent.due} day of each month.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600 ml-4 marker:text-blue-500">
                        <li>Late fee: 5% of monthly rent if paid after the 5th.</li>
                        <li>Payment method: ACH Transfer via iReside Portal.</li>
                    </ul>
                </div>

                {/* Section 5: Security Deposit */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        5. Security Deposit
                    </h2>
                    <p className="leading-relaxed text-slate-600">
                        Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of{" "}
                        <span className="font-bold text-slate-900">
                            ${deposit.toLocaleString()}.00
                        </span>{" "}
                        as security for any damage caused to the Premises during the term hereof.
                    </p>
                </div>

                {/* Section 6: Utilities */}
                <div>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                        6. Utilities
                    </h2>
                    <p className="mb-4 leading-relaxed text-slate-600">
                        Tenant shall be responsible for arranging and paying for all utility services required on
                        the premises:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {["Water", "Electricity", "Gas", "Trash Collection", "Internet/Cable", "Sewer"].map((util) => (
                            <span
                                key={util}
                                className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200"
                            >
                                {util}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Signature Placeholder */}
                <div className="mt-20 pt-8 border-t-2 border-dashed border-slate-300">
                    <div className="grid md:grid-cols-2 gap-16">
                        <div>
                            <div className="h-16 border-b border-slate-900 mb-2 bg-slate-50/50"></div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                                <span>Tenant Signature</span>
                                <span className="text-slate-300 font-normal normal-case italic">Sign above</span>
                            </p>
                        </div>
                        <div>
                            <div className="h-16 border-b border-slate-900 mb-2 flex items-end justify-start">
                                <span className="text-slate-900 font-mono mb-1 text-lg">{currentDate}</span>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <p className="-rotate-45 text-[min(12rem,15vw)] font-black uppercase text-slate-100 select-none">
                    DRAFT
                </p>
            </div>

        </motion.div>
    );
}
