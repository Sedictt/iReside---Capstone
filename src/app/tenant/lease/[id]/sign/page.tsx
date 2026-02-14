"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LeaseHeader } from "@/components/lease/LeaseHeader";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { SignatureModal } from "@/components/lease/SignatureModal";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Mock Data matching the screenshot
const MOCK_DATA = {
    parties: {
        landlord: "Skyline Property Management LLC",
        tenant: "Alex J. Richardson",
    },
    property: {
        unit: "Unit 402, The Beacon Towers",
        street: "880 Mission Street",
        city: "San Francisco",
        zip: "CA 94103",
    },
    term: {
        start: "November 1, 2024",
        end: "October 31, 2025",
    },
    rent: {
        monthly: 3200,
        due: "1st",
    },
    deposit: 3200,
};

const STEPS = [
    { id: 1, label: "Details" },
    { id: 2, label: "Review" },
    { id: 3, label: "Sign" },
];

export default function LeaseSignaturePage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(true);
    const [signed, setSigned] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = async (signature: string) => {
        setIsSubmitting(true);
        // Simulate API call or processing
        console.log("Processing signature:", signature);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSigned(true);
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    if (signed) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 p-8 rounded-2xl border border-emerald-500/20 shadow-2xl text-center max-w-md w-full"
                >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6 border border-emerald-500/20">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Lease Signed Successfully!</h1>
                    <p className="text-slate-400 mb-8">
                        Your lease agreement for <span className="text-white font-medium">{MOCK_DATA.property.unit}</span> has been finalized securely.
                    </p>
                    <button
                        onClick={() => router.push('/tenant/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-slate-950 relative overflow-x-hidden">
            <LeaseHeader currentStep={3} steps={STEPS} leaseId={id || "LR-9821-X"} />

            <main className="container mx-auto px-4 py-8 md:py-12 pb-32">
                <div className="flex justify-center">
                    <LeaseDocument
                        leaseId={id || "LR-9821-X"}
                        parties={MOCK_DATA.parties}
                        property={MOCK_DATA.property}
                        term={MOCK_DATA.term}
                        rent={MOCK_DATA.rent}
                        deposit={MOCK_DATA.deposit}
                    />
                </div>
            </main>

            {/* Floating Action Button to reopen modal if closed */}
            {!isModalOpen && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-8 right-8 z-40"
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                        <span className="text-lg">✎</span> Finalize Lease
                    </button>
                </motion.div>
            )}

            <SignatureModal
                isOpen={isModalOpen}
                onSign={handleSign}
                onClear={() => { }}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 text-white">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                        <p className="font-medium animate-pulse text-lg">Finalizing secure document...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
