"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Wallet, X } from "lucide-react";

export function InPersonPaymentModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        const checkStorage = () => {
            const status = localStorage.getItem('pendingInPersonPayment');
            if (status === 'true') {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkStorage();
        const interval = setInterval(checkStorage, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleConfirm = () => {
        setIsConfirming(true);
        setTimeout(() => {
            setIsConfirming(false);
            localStorage.setItem('pendingInPersonPayment', 'completed');
            setIsOpen(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={() => {
                        setIsOpen(false);
                        localStorage.removeItem('pendingInPersonPayment');
                    }}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <Wallet className="w-6 h-6 text-emerald-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">In-Person Payment Confirmation</h3>
                <p className="text-neutral-400 text-sm mb-6">
                    A tenant has reported handing you cash for their rent. Please confirm you have received the exact amount.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Tenant</span>
                        <span className="font-medium text-white">Marcus Johnson</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Unit</span>
                        <span className="font-medium text-white">Unit 304</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Amount Received</span>
                        <span className="font-bold text-emerald-400">₱18,500.00</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            localStorage.removeItem('pendingInPersonPayment');
                        }}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                    >
                        Dismiss
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {isConfirming ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                Confirming...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm Receipt
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
