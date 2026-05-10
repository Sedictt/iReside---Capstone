"use client";

import { X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaseDocument } from "@/components/lease/LeaseDocument";

type SupportedPropertyEnum = "apartment" | "dormitory" | "boarding_house";

interface SmartContractPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        propertyName: string;
        propertyType: SupportedPropertyEnum;
        baseRent: number;
        occupancyLimit: string;
        utilityBilling: string;
        amenities: string[];
        buildingRules: string[];
    };
    landlordName?: string;
}

export function SmartContractPreviewModal({
    isOpen,
    onClose,
    data,
    landlordName = "Authorized Landlord"
}: SmartContractPreviewModalProps) {
    if (!isOpen) return null;

    // Construct the standard LeaseData expected by LeaseDocument
    const leaseData = {
        id: "DRAFT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        start_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        end_date: new Date(Date.now() + 31536000000).toLocaleDateString('en-CA'), // +1 year
        monthly_rent: data.baseRent,
        security_deposit: data.baseRent * 2,
        signed_at: null,
        signed_document_url: null,
        unit: {
            id: "PREVIEW-UNIT",
            name: "Property Asset: " + data.propertyName,
            floor: 1,
            sqft: 0,
            beds: 1,
            baths: 1,
            property: {
                id: "PREVIEW-PROP",
                name: data.propertyName,
                address: "Property Address (Verified)",
                city: "Valenzuela",
                images: [],
                house_rules: [
                    data.utilityBilling === "fixed_charge" ? "strategy:inclusive" : "strategy:exclusive",
                    ...data.buildingRules
                ],
                amenities: data.amenities.map((a, i) => ({
                    id: `a-${i}`,
                    name: a,
                    type: "Standard",
                    description: "Available for all residents",
                    price_per_unit: 0,
                    unit_type: "Fixed",
                    capacity: 1,
                    icon_name: "Star",
                    location_details: "On-site",
                    status: "Active"
                }))
            }
        },
        landlord: {
            id: "landlord-id",
            full_name: landlordName,
            avatar_url: "",
            avatar_bg_color: "#7CA34D",
            phone: ""
        },
        tenant: {
            full_name: "Prospective Tenant"
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <button 
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-default" 
                onClick={onClose}
                aria-label="Close contract preview"
            />

            <div className={cn(
                "relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
                "max-h-[95vh] sm:max-h-[90vh]"
            )}>
                {/* Header */}
                <div className="relative shrink-0 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex justify-between items-center p-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Shield className="size-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Digital Asset Agreement</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Universal iReside Format</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-black/40">
                    <div className="max-w-4xl mx-auto shadow-2xl">
                        <LeaseDocument {...leaseData} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="size-2 rounded-full bg-primary animate-pulse" />
                         <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest italic">Draft is synchronized with real-time property rules.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-primary text-black rounded-xl font-semibold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        Acknowledged
                    </button>
                </div>
            </div>
        </div>
    );
}

