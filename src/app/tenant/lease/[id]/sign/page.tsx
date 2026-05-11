"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { generateLeasePdf } from "@/lib/lease-pdf";
import { CheckCircle, Loader2, X } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";

// Dynamic import for DigitalSigner to avoid SSR errors with pdfjs-dist
const DigitalSigner = dynamic(
  () => import("@/components/shared/DigitalSigner/DigitalSigner").then(mod => mod.DigitalSigner),
  { ssr: false }
);

export default function LeaseSignaturePage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [signed, setSigned] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load/Generate PDF
    useEffect(() => {
        const load = async () => {
            try {
                // In a real scenario, we'd fetch actual lease data. 
                // For this legacy route, we'll generate it with mock data if needed, 
                // but let's try to make it look professional.
                const blob = await generateLeasePdf({
                    id: `LEGACY-${id}`,
                    tenant: { name: "Alex J. Richardson", email: "alex@example.com" },
                    landlord: { name: "Skyline Property Management LLC", email: "mgmt@skyline.com" },
                    property: { name: "The Beacon Towers", address: "880 Mission Street, San Francisco, CA 94103" },
                    unit: { name: "Unit 402" },
                    startDate: "2024-11-01",
                    endDate: "2025-10-31",
                    monthlyRent: 3200,
                    securityDeposit: 3200,
                });
                setPdfBlob(blob);
            } catch (err) {
                setError("Failed to load lease document.");
            }
        };
        load();
    }, []);

    const handleSigned = async (blob: Blob) => {
        setIsSubmitting(true);
        try {
            // Simulate upload
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSigned(true);
        } catch (err) {
            setError("Failed to save signature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (signed) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-neutral-900 p-12 rounded-[3rem] border border-emerald-500/20 shadow-2xl text-center max-w-md w-full"
                >
                    <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-emerald-500/10 mb-8 border border-emerald-500/20">
                        <CheckCircle className="size-12 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 tracking-tight">Lease Executed</h1>
                    <p className="text-neutral-400 mb-10 leading-relaxed">
                        Your agreement for <span className="text-white font-bold">Unit 402, The Beacon Towers</span> has been finalized and secured.
                    </p>
                    <button
                        onClick={() => router.push('/tenant/dashboard')}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/10 uppercase text-xs tracking-widest"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <p className="text-red-400 font-bold">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-xs font-bold uppercase tracking-widest text-white underline">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <AnimatePresence>
                {pdfBlob ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="h-screen w-screen"
                    >
                        <DigitalSigner 
                            initialFile={pdfBlob}
                            title="Lease Agreement - Unit 402"
                            onSigned={handleSigned}
                        />
                    </motion.div>
                ) : (
                    <div className="h-screen w-screen flex flex-col items-center justify-center gap-6">
                        <Loader2 className="size-10 animate-spin text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Preparing Secure Document</p>
                    </div>
                )}
            </AnimatePresence>

            {isSubmitting && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-6 text-white">
                        <div className="relative">
                            <Loader2 className="size-16 animate-spin text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-8 rounded-full bg-primary/20 animate-ping" />
                            </div>
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em] animate-pulse">Encrypting & Finalizing</p>
                    </div>
                </div>
            )}
        </div>
    );
}
