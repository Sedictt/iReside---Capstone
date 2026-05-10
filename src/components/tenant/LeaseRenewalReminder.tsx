"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X, ArrowRight, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import LeaseRenewalRequest from "./LeaseRenewalRequest";

interface LeaseRenewalReminderProps {
    daysRemaining: number;
    leaseId?: string;
    teamMembers?: Array<{
        avatar_url?: string;
        name?: string;
    }>;
}

export default function LeaseRenewalReminder({ daysRemaining, leaseId, teamMembers }: LeaseRenewalReminderProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showRenewalRequest, setShowRenewalRequest] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Use provided team members or fall back to empty array for placeholders
    const displayMembers = teamMembers && teamMembers.length > 0 ? teamMembers : null;

    useEffect(() => {
        // Eligibility check: Within 90 days
        const isEligible = daysRemaining > 0 && daysRemaining <= 90;
        
        if (!isEligible) return;

        // Check for permanent dismissal
        const isPermanentlyDismissed = localStorage.getItem(`ireside_renewal_reminder_dismissed_${leaseId}`);
        if (isPermanentlyDismissed) return;

        // Check if shown in this session to avoid spamming
        const hasBeenShown = sessionStorage.getItem(`ireside_renewal_reminder_shown_${leaseId}`);
        
        if (!hasBeenShown) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                sessionStorage.setItem(`ireside_renewal_reminder_shown_${leaseId}`, "true");
            }, 2000); // Show after 2 seconds for better impact
            
            return () => clearTimeout(timer);
        }
    }, [daysRemaining, leaseId]);

    if (!isVisible && !showRenewalRequest) return null;

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            className="absolute inset-0 bg-black/40 pointer-events-auto"
                            onClick={() => setIsVisible(false)}
                        />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-card border border-border/50 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto ring-1 ring-white/10"
                        >
                            {/* Premium Background Elements */}
                            <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
                            <div className="absolute bottom-0 left-0 size-48 bg-primary/5 rounded-full blur-[60px] -ml-24 -mb-24" />
                            
                            <div className="relative z-10 p-8 md:p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                                        <RefreshCw className="size-8 animate-spin-slow" />
                                    </div>
                                    <button 
                                        onClick={() => setIsVisible(false)}
                                        className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock className="size-3" /> {daysRemaining} Days Left
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-3xl font-semibold text-foreground tracking-tighter leading-none">
                                        Lease Renewal Available
                                    </h2>
                                    
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        Your current lease is now eligible for renewal. You can submit a request to extend your stay for another term.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="w-full py-4 rounded-2xl border border-border bg-muted/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-widest hover:bg-muted hover:text-foreground transition-all"
                                    >
                                        Maybe Later
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsVisible(false);
                                            setShowRenewalRequest(true);
                                        }}
                                        className="w-full py-4 rounded-2xl bg-primary text-white text-[11px] font-semibold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                    >
                                        Renew Now <ArrowRight className="size-4" />
                                    </button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <div className="relative flex items-center justify-center">
                                            <input 
                                                type="checkbox" 
                                                id="dontShowAgain"
                                                checked={dontShowAgain}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setDontShowAgain(checked);
                                                    if (checked) {
                                                        localStorage.setItem(`ireside_renewal_reminder_dismissed_${leaseId}`, "true");
                                                    } else {
                                                        localStorage.removeItem(`ireside_renewal_reminder_dismissed_${leaseId}`);
                                                    }
                                                }}
                                                className="peer size-4 shrink-0 rounded border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary transition-all appearance-none"
                                            />
                                            <Check className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity stroke-[4]" />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">Do not show again</span>
                                    </label>
                                    <div className="flex -space-x-2">
                                        {displayMembers ? (
                                            displayMembers.slice(0, 3).map((member, i) => (
                                                <div 
                                                    key={i} 
                                                    className="size-6 rounded-full border-2 border-card bg-muted overflow-hidden"
                                                    title={member.name}
                                                >
                                                    {member.avatar_url ? (
                                                        <Image 
                                                            src={member.avatar_url} 
                                                            alt={member.name || `Team member ${i + 1}`}
                                                            width={24}
                                                            height={24}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                            {member.name?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            [1, 2, 3].map((i) => (
                                                <div key={i} className="size-6 rounded-full border-2 border-card bg-muted" />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showRenewalRequest && (
                <LeaseRenewalRequest 
                    leaseId={leaseId} 
                    daysRemaining={daysRemaining} 
                    variant="none" 
                    autoOpen={true}
                />
            )}

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </>
    );
}


