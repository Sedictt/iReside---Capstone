"use client";

import { useState, useEffect } from "react";
import { m as motion } from "framer-motion";
import { UiMessage } from "@/components/landlord/messages/types";
import { cn } from "@/lib/utils";

interface OfficialReceiptProps {
    message: UiMessage;
    onDownload?: (id: string, name: string) => void;
    isDownloading?: boolean;
    role?: "landlord" | "tenant";
    isCompact?: boolean;
}

interface InvoiceData {
    invoiceNumber?: string;
    issuedDate?: string;
    landlord?: { full_name?: string };
    property?: { name?: string };
    tenant?: { full_name?: string };
    unit?: { name?: string };
    description?: string;
    totalAmount?: number;
    status?: string;
}

export function OfficialReceipt({ 
    message, 
    onDownload, 
    isDownloading,
    role = "landlord",
    isCompact = false
}: OfficialReceiptProps) {
    const [realData, setRealData] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRealInfo = async () => {
            // Priority: invoiceId -> paymentId -> id
            const id = message.invoiceId || message.paymentId || message.id;
            
            // Skip if no valid ID or if it's an optimistic local message
            if (!id || id.startsWith('local-')) return;

            setLoading(true);
            try {
                const endpoint = role === "landlord" 
                    ? `/api/landlord/invoices/${id}` 
                    : `/api/tenant/payments/${id}`;
                
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    if (data.invoice) {
                        setRealData(data.invoice);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch real receipt info:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRealInfo();
    }, [message.invoiceId, message.paymentId, message.id, role]);

    // Use real fetched data if available, otherwise fallback to message metadata
    // This ensures "real" information is used instead of potentially stale or hardcoded metadata
    const displayData = {
        invoiceId: realData?.invoiceNumber || message.invoiceId || "---",
        date: realData?.issuedDate 
            ? new Date(realData.issuedDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) 
            : message.date || "---",
        landlordName: realData?.landlord?.full_name || message.landlordName || "iReside Partner",
        propertyName: realData?.property?.name || message.propertyName || "Managed Property",
        tenantName: realData?.tenant?.full_name || message.tenantName || "Unknown Tenant",
        unit: realData?.unit?.name || message.unit || "---",
        description: realData?.description || message.description || "Rental Payment",
        amount: realData?.totalAmount !== undefined 
            ? new Intl.NumberFormat('en-PH').format(realData.totalAmount) 
            : message.amount || "0",
        status: (realData?.status || "Paid").toUpperCase()
    };

    return (
        <motion.div 
            id={`receipt-${message.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "w-full max-w-[340px] bg-white text-zinc-900 shadow-2xl border border-zinc-200 font-mono relative overflow-hidden",
                isCompact ? "p-4" : "p-8"
            )}
        >
                {/* Subtle paper texture effect */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)',
                        backgroundSize: '100% 1.5px',
                        backgroundRepeat: 'repeat-y'
                    }} 
                />

                {/* Decorative cut marks at top/bottom */}
                <div className="absolute top-0 left-0 right-0 h-1 flex justify-between px-2 overflow-hidden opacity-20">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`deco-top-${i}`} className="size-2 bg-zinc-900 rotate-45 -translate-y-1" />
                    ))}
                </div>

                {/* Logo Area */}
                <div className={cn(
                    "text-center relative pt-2",
                    isCompact ? "mb-4" : "mb-8"
                )}>
                    <h1 className={cn(
                        "font-black tracking-tighter mb-1",
                        isCompact ? "text-lg" : "text-xl"
                    )}>iReside</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Payment Confirmation</p>
                    {loading && (
                        <div className="absolute -top-1 right-0">
                            <div className="size-2 rounded-full bg-primary animate-ping" />
                        </div>
                    )}
                </div>

                {/* Receipt Data */}
                <div className={cn(
                    "space-y-3 relative",
                    isCompact ? "text-[10px]" : "text-[11px]"
                )}>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Invoice #:</span>
                        <span className="text-right truncate max-w-[150px] font-black">{displayData.invoiceId}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Date:</span>
                        <span className="text-right font-black">{displayData.date}</span>
                    </div>
                    
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Landlord:</span>
                        <span className="text-right font-black uppercase">{displayData.landlordName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Property:</span>
                        <span className="text-right font-black uppercase">{displayData.propertyName}</span>
                    </div>

                    <div className="my-4 border-t border-zinc-100" />

                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Tenant:</span>
                        <span className="text-right font-black uppercase">{displayData.tenantName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Unit:</span>
                        <span className="text-right font-black">{displayData.unit}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Description:</span>
                        <span className="text-right font-black">{displayData.description}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="shrink-0 opacity-60">Status:</span>
                        <span className="px-1.5 py-0.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider">
                            {displayData.status}
                        </span>
                    </div>
                </div>

                {/* Separator */}
                <div className={cn(
                    "border-t border-dashed border-zinc-300 relative",
                    isCompact ? "my-4" : "my-6"
                )} />

                {/* Totals */}
                <div className={cn(
                    "space-y-1 relative",
                    isCompact ? "mb-4" : "mb-8"
                )}>
                    <div className={cn(
                        "flex justify-between font-black",
                        isCompact ? "text-xs" : "text-sm"
                    )}>
                        <span>TOTAL AMOUNT:</span>
                        <span>₱{displayData.amount}</span>
                    </div>
                </div>

                {/* Action / Footer */}
                <div className="pt-4 border-t-2 border-zinc-900 relative">
                    <div id={`receipt-actions-${message.id}`} className="flex items-center justify-end">
                        <button
                            disabled={isDownloading}
                            onClick={() => onDownload?.(`receipt-${message.id}`, `Receipt-${displayData.invoiceId}`)}
                            className="text-[10px] font-black underline hover:no-underline uppercase tracking-tighter disabled:opacity-50"
                        >
                            {isDownloading ? "Saving..." : "Save as Photo"}
                        </button>
                    </div>
                </div>

                {/* Decorative cut marks at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-between px-2 overflow-hidden opacity-20">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`deco-bottom-${i}`} className="size-2 bg-zinc-900 rotate-45 translate-y-1" />
                    ))}
                </div>
            </motion.div>
    );
}

