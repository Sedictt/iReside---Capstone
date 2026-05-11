"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
    ArrowRightLeft, 
    X, 
    CheckCircle2, 
    ArrowRight, 
    Building2, 
    Layers, 
    Maximize, 
    Bed, 
    Bath,
    Loader2,
    Search,
    AlertCircle,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Unit {
    id: string;
    name: string;
    floor: number;
    status: string;
    beds: number;
    baths: number;
    sqft: number | null;
    rent_amount: number;
}

interface UnitTransferRequestProps {
    currentUnitId?: string;
}

export default function UnitTransferRequest({ currentUnitId }: UnitTransferRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchAvailableUnits = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tenant/unit-map");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load units");
            
            // Filter out current unit and only show vacant ones
            const availableUnits = (data.units || []).filter((u: Unit) => u.id !== currentUnitId && u.status === "vacant");
            setUnits(availableUnits);
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchAvailableUnits();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnitId) {
            toast.error("Please select a unit to transfer to");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/tenant/unit-map", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestedUnitId: selectedUnitId, reason }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit request");

            toast.success("Unit transfer request submitted successfully");
            setIsOpen(false);
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUnits = units.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.floor.toString().includes(searchQuery)
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 }).format(value);
    };

    return (
        <>
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between ring-1 ring-border group hover:border-primary/30 transition-all relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] select-none pointer-events-none">
                    <ArrowRightLeft className="size-16" />
                </div>
                <div className="space-y-6">
                    <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                        <ArrowRightLeft className="size-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-foreground tracking-tight">Unit Transfer</h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Looking for a different floor, size, or view? Request a move within the same property.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleOpen}
                    className="w-full mt-8 py-4 rounded-xl bg-muted text-[10px] font-bold uppercase tracking-widest border border-border hover:bg-secondary transition-all flex items-center justify-center gap-2"
                >
                    Check Availability <ArrowUpRight className="size-4" />
                </button>
            </div>

            {mounted && isOpen ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="p-8 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                    <ArrowRightLeft className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">Unit Transfer Portal</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Relocation Protocol</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-8 pb-4 space-y-6">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="relative w-full md:w-96">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <input 
                                            type="text"
                                            placeholder="Search by unit number or floor..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                                        {filteredUnits.length} Vacant Units Available
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 no-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                        <Loader2 className="size-8 animate-spin text-primary" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Syncing Property Inventory...</p>
                                    </div>
                                ) : filteredUnits.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <Building2 className="size-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">No units available</p>
                                            <p className="text-xs text-muted-foreground mt-1">Check back later or contact management for waitlist options.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredUnits.map((unit) => (
                                            <button
                                                key={unit.id}
                                                onClick={() => setSelectedUnitId(unit.id)}
                                                className={cn(
                                                    "text-left p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                                                    selectedUnitId === unit.id 
                                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                                                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                                                )}
                                            >
                                                {selectedUnitId === unit.id && (
                                                    <div className="absolute top-4 right-4 text-primary">
                                                        <CheckCircle2 className="size-6" />
                                                    </div>
                                                )}
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Unit {unit.name}</p>
                                                        <h4 className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(unit.rent_amount)}<span className="text-xs font-bold text-muted-foreground lowercase tracking-normal">/mo</span></h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <Layers className="size-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Floor {unit.floor}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <Maximize className="size-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{unit.sqft ? `${unit.sqft} SQFT` : 'Size Varies'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <Bed className="size-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{unit.beds} Bed</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                            <Bath className="size-3.5" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{unit.baths} Bath</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="space-y-2">
                                        <label htmlFor="transferReason" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Reason for Transfer (Optional)</label>
                                        <textarea 
                                            id="transferReason"
                                            rows={3}
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Explain why you'd like to transfer to this unit..."
                                            className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex gap-4">
                                        <AlertCircle className="size-5 text-blue-500 shrink-0" />
                                        <p className="text-[11px] font-medium text-blue-600/80 leading-relaxed uppercase tracking-wider">
                                            Transfer requests are subject to approval. Moving to a unit with different pricing will require a lease addendum or a new agreement.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-border bg-muted/20 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedUnitId}
                                className="flex-1 py-4 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>Initiate Transfer Request <ArrowRight className="size-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body) : null}
        </>
    );
}


