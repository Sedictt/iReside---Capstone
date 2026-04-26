"use client";

import Link from "next/link";
import { 
    User, 
    ArrowRight, 
    Home, 
    ShieldCheck, 
    Sparkles,
    Smartphone,
    Search,
    MapPin,
    ArrowLeft,
    Info,
    CheckCircle2,
    Lock
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function TenantRegistrationPage() {
    const [mounted, setMounted] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-svh bg-background text-foreground font-sans relative selection:bg-primary/30 overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[60rem] h-[60rem] rounded-full bg-primary/5 blur-[150px] pointer-events-none opacity-50 dark:bg-primary/10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none opacity-40 dark:bg-blue-500/10" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-10 py-8 shrink-0">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Link href="/login" className="flex items-center">
                        <Logo className="h-10 w-36" />
                    </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-8">
                    <ThemeToggle />
                    <Link href="/login" className="text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group">
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </Link>
                </motion.div>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto custom-scrollbar">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-5xl flex flex-col items-center text-center space-y-12"
                >
                    {/* Invite Only Badge */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/5 group cursor-help"
                    >
                        <Lock className="h-5 w-5" />
                        Private Residency — Invite Only
                        <div className="w-[1px] h-4 bg-amber-500/20 mx-1" />
                        <span className="text-[10px] opacity-70">How it works?</span>
                    </motion.div>

                    <div className="space-y-6">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl">
                            The <span className="text-primary italic underline decoration-primary/20 decoration-8 underline-offset-8">future</span> <br /> 
                            of community living.
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto">
                            iReside is an exclusive ecosystem. Access is granted via property owner invites to ensure a secure and trusted community.
                        </p>
                        
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => setShowHowItWorks(!showHowItWorks)}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95",
                                    showHowItWorks 
                                        ? "bg-primary text-primary-foreground shadow-primary/30" 
                                        : "bg-surface-1/50 backdrop-blur-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-sm"
                                )}
                            >
                                {showHowItWorks ? <Sparkles className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                                {showHowItWorks ? "Back to Highlights" : "See How to Join"}
                            </button>
                        </div>
                    </div>

                    <div className="w-full max-w-4xl relative">
                        <AnimatePresence mode="wait">
                            {!showHowItWorks ? (
                                <motion.div
                                    key="features"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                                >
                                    {[
                                        { 
                                            icon: Smartphone, 
                                            title: "Smart Access", 
                                            desc: "Everything from digital keys to payments in one app." 
                                        },
                                        { 
                                            icon: ShieldCheck, 
                                            title: "Verified Security", 
                                            desc: "Highest standards of data and physical safety." 
                                        },
                                        { 
                                            icon: Home, 
                                            title: "Priority Care", 
                                            desc: "Direct line to maintenance and concierge services." 
                                        }
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-8 rounded-[2.5rem] bg-surface-1/50 backdrop-blur-xl border border-border/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group text-left"
                                        >
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tight mb-3">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="how-it-works"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="p-12 rounded-[3rem] bg-surface-2/80 backdrop-blur-2xl border border-primary/20 shadow-2xl text-left max-w-3xl mx-auto relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-5">
                                        <Info className="h-64 w-64 rotate-12" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-8 flex items-center gap-4">
                                        <Sparkles className="h-8 w-8 text-primary" />
                                        Seamless Onboarding
                                    </h3>
                                    <div className="space-y-8">
                                        {[
                                            { step: "01", title: "Receive Private Invite", desc: "Your property owner sends a unique, secure link to your verified email or phone number." },
                                            { step: "02", title: "Identity Sync", desc: "Complete a 60-second digital verification to ensure community safety and trust." },
                                            { step: "03", title: "Instant Activation", desc: "Unlock your unit, sign lease documents, and join the resident community hub instantly." }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-6 items-start">
                                                <div className="text-3xl font-black text-primary/20 select-none">
                                                    {item.step}
                                                </div>
                                                <div className="space-y-1 pt-1">
                                                    <h4 className="font-black text-xl leading-none">{item.title}</h4>
                                                    <p className="text-base text-muted-foreground font-medium">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setShowHowItWorks(false)}
                                        className="mt-10 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                                    >
                                        Return to overview
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Section */}
                    <div className="w-full max-w-4xl pt-8">
                        <div className="p-12 rounded-[3.5rem] bg-surface-1 border border-border relative overflow-hidden group shadow-2xl shadow-primary/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Search className="h-48 w-48 rotate-12" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="text-left space-y-3">
                                    <h2 className="text-4xl font-black tracking-tight leading-none text-foreground">Find a home?</h2>
                                    <p className="text-muted-foreground font-medium text-lg">Browse our managed portfolio of modern properties.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                                    <button className="h-16 px-12 rounded-2xl bg-primary font-black text-primary-foreground text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-4 active:scale-95 group w-full sm:w-auto">
                                        Browse Portfolio
                                        <Search className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <Link href="/login" className="h-16 px-12 rounded-2xl bg-surface-2 border border-border font-black text-lg hover:bg-surface-3 transition-all flex items-center justify-center gap-4 group w-full sm:w-auto">
                                        I have an invite
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Visual Spacing for Mobile */}
                <div className="h-20 shrink-0" />
            </main>

            {/* Footer Decor */}
            <footer className="relative z-10 py-10 text-center opacity-30 select-none pointer-events-none shrink-0 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Global Standards — © 2026 iReside Technologies</p>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary-rgb), 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
