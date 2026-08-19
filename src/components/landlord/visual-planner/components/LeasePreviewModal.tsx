"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X, Printer, FileText, Loader2, AlertCircle } from "lucide-react";
import { Unit } from "../types";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { LeaseData } from "@/types/lease";

interface LeasePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
    property?: {
        id?: string;
        name?: string;
        address?: string;
        city?: string;
        [key: string]: any;
    } | null;
}

export const LeasePreviewModal = ({
    isOpen,
    onClose,
    unit,
    property,
}: LeasePreviewModalProps) => {
    const [loading, setLoading] = useState(false);
    const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !unit) {
            setLeaseData(null);
            setError(null);
            return;
        }

        let isMounted = true;
        const fetchOrBuildLease = async () => {
            setLoading(true);
            setError(null);

            const targetUnitId = unit.dbId || unit.id;

            try {
                // Try fetching real lease from API
                const res = await fetch(`/api/landlord/leases?unitId=${encodeURIComponent(targetUnitId)}`);
                if (res.ok) {
                    const data = await res.json();
                    const matchedLease = Array.isArray(data) ? data[0] : null;

                    if (matchedLease && isMounted) {
                        // Map API LeaseListItem / LeaseDetail to LeaseData for LeaseDocument
                        const formattedLease: LeaseData = {
                            id: matchedLease.id || `LSE-${targetUnitId.slice(0, 8).toUpperCase()}`,
                            start_date: matchedLease.start_date || unit.leaseStart || new Date().toISOString().split("T")[0],
                            end_date: matchedLease.end_date || unit.leaseEnd || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
                            monthly_rent: Number(matchedLease.monthly_rent || matchedLease.unit?.rent_amount || 0),
                            security_deposit: Number(matchedLease.security_deposit || (matchedLease.monthly_rent || 0)),
                            signed_at: matchedLease.signed_at || matchedLease.landlord_signed_at || null,
                            signed_document_url: matchedLease.signed_document_url || null,
                            terms: {
                                rent_due_day: matchedLease.terms?.rent_due_day || 1,
                                late_fee_day: matchedLease.terms?.late_fee_day || 5,
                                grace_period_days: matchedLease.terms?.grace_period_days || 3,
                            },
                            unit: {
                                id: matchedLease.unit?.id || targetUnitId,
                                name: matchedLease.unit?.name || unit.name,
                                floor: unit.floor || 1,
                                sqft: unit.areaSqm ? unit.areaSqm * 10.764 : null,
                                beds: unit.bedrooms ?? 1,
                                baths: unit.baths ?? 1,
                                property: {
                                    id: property?.id || matchedLease.unit?.property?.id || "prop-1",
                                    name: property?.name || matchedLease.unit?.property?.name || "Residential Property",
                                    address: property?.address || matchedLease.unit?.property?.address || "Main Street",
                                    city: property?.city || "Metro Manila",
                                    images: [],
                                    house_rules: ["Standard Residential Guidelines", "No Unauthorized Alterations", "Quiet Hours 10PM-8AM"],
                                    amenities: [],
                                },
                            },
                            landlord: {
                                id: matchedLease.landlord?.id || "landlord-1",
                                full_name: matchedLease.landlord?.full_name || "Property Owner",
                                avatar_url: matchedLease.landlord?.avatar_url || "",
                                avatar_bg_color: matchedLease.landlord?.avatar_bg_color || "bg-primary",
                                phone: matchedLease.landlord?.phone || "+63 900 000 0000",
                            },
                            tenant: {
                                full_name: matchedLease.tenant?.full_name || unit.tenant || "Valued Resident",
                            },
                        };

                        setLeaseData(formattedLease);
                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.warn("[LeasePreviewModal] Failed to fetch backend lease, using unit snapshot:", err);
            }

            if (!isMounted) return;

            // Fallback for demo / preview / prototype units
            const fallbackLease: LeaseData = {
                id: `LSE-${targetUnitId.slice(0, 8).toUpperCase()}`,
                start_date: unit.leaseStart || new Date().toISOString().split("T")[0],
                end_date: unit.leaseEnd || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
                monthly_rent: 15000,
                security_deposit: 15000,
                signed_at: new Date().toISOString(),
                signed_document_url: null,
                terms: {
                    rent_due_day: 1,
                    late_fee_day: 5,
                    grace_period_days: 3,
                },
                unit: {
                    id: targetUnitId,
                    name: unit.name,
                    floor: unit.floor || 1,
                    sqft: unit.areaSqm ? Math.round(unit.areaSqm * 10.764) : 450,
                    beds: unit.bedrooms ?? 1,
                    baths: unit.baths ?? 1,
                    property: {
                        id: property?.id || "prop-1",
                        name: property?.name || "Residential Property",
                        address: property?.address || "iReside Residences, Taft Ave",
                        city: property?.city || "Metro Manila",
                        images: [],
                        house_rules: ["Standard Residential Guidelines", "No Unauthorized Alterations", "Quiet Hours 10PM-8AM"],
                        amenities: [],
                    },
                },
                landlord: {
                    id: "landlord-1",
                    full_name: "Property Management Office",
                    avatar_url: "",
                    avatar_bg_color: "bg-primary",
                    phone: "+63 900 000 0000",
                },
                tenant: {
                    full_name: unit.tenant || "Active Resident",
                },
            };

            setLeaseData(fallbackLease);
            setLoading(false);
        };

        void fetchOrBuildLease();

        return () => {
            isMounted = false;
        };
    }, [isOpen, unit, property]);

    if (!isOpen || !unit) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/75 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[1000px] h-[92vh] flex flex-col rounded-[2rem] border border-white/10 bg-card text-foreground shadow-[0_24px_70px_rgba(0,0,0,0.6)] overflow-hidden z-10 backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground">
                                    Lease Agreement
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                                    #{leaseData?.id || unit.id} • Unit {unit.name} • {unit.status.toUpperCase()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl transition-colors bg-muted hover:bg-muted/80"
                                title="Print Lease Agreement"
                            >
                                <Printer className="size-4" />
                                <span>Print</span>
                            </button>

                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                                title="Download / Export Document"
                            >
                                <Printer className="size-4 sm:hidden" />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>

                            <div className="w-px h-6 bg-border mx-2" />

                            <button
                                onClick={onClose}
                                className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Dark Container for the Light Document */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar bg-zinc-950/40">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground py-20">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase tracking-widest">
                                    Loading Lease Agreement...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
                                <AlertCircle className="size-5 shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        ) : leaseData ? (
                            <div className="max-w-[850px] mx-auto shadow-2xl rounded-sm overflow-hidden bg-white">
                                <LeaseDocument {...leaseData} />
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="p-4 flex items-center justify-between border-t border-border bg-card/90">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black">
                            End of Document • Securely stored and encrypted by iReside
                        </p>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-muted hover:bg-muted/80 text-foreground transition-all"
                        >
                            Close Preview
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
