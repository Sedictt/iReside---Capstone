import os

content = """\"use client\";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, ShieldCheck, Wallet, Lock, Activity, Users, Building, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
    {
        id: 1,
        title: "Private & Secure",
        desc: "No public listings. Your properties are hidden from the general public. We only invite verified, background-checked tenants.",
        icon: Lock,
        color: "from-emerald-500/20",
        accent: "text-emerald-400"
    },
    {
        id: 2,
        title: "Automated Rent",
        desc: "Stop chasing payments. Rent is collected automatically on the 1st of every month and deposited directly to you.",
        icon: Wallet,
        color: "from-teal-500/20",
        accent: "text-teal-400"
    },
    {
        id: 3,
        title: "Zero Headaches",
        desc: "Designed for property owners, not tech experts. Manage simple leases, maintenance requests, and communication from one shockingly easy dashboard.",
        icon: ShieldCheck,
        color: "from-zinc-500/20",
        accent: "text-zinc-400"
    }
];

export default function ScrollyTellingLandingPage() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: targetRef });
    
    // Smooth out scroll progress for horizontal translation
    const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
    const x = useTransform(smoothProgress, [0, 1], ["0%", "-65%"]);

    // Hero Scroll Effects
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 500], [1, 0.85]);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "30%"]);

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
            {/* Ambient Background Architecture */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.04] mix-blend-overlay" />
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-zinc-800/30 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)]" />
            </div>

            {/* Smart Navbar */}
            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 w-full z-50 border-b border-white/[0.04] bg-[#0A0A0B]/80 backdrop-blur-2xl"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105 ring-1 ring-white/10">
                            <Building className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl md:text-2xl font-extrabold tracking-tight leading-none text-white/95">iReside</span>
                            <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400/90 leading-tight mt-0.5">Landlord Access</span>
                        </div>
                    </div>
                    <Link href="/login" className="relative flex items-center gap-2 overflow-hidden group px-6 py-2.5 rounded-full border border-white/10 bg-white/[0.02] text-sm font-bold text-white transition-all hover:bg-white/[0.08] hover:border-white/20">
                        <span className="relative z-10 hidden md:block">Access Portal</span>
                        <span className="relative z-10 md:hidden">Login</span>
                        <ChevronRight className="h-4 w-4 relative z-10 text-white/50 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>
            </motion.nav>

            {/* Immersive Hero Section */}
            <section className="relative min-h-[110vh] flex flex-col items-center justify-center px-6 pt-24 z-10">
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                    className="max-w-[70rem] mx-auto text-center w-full relative"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-10 shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-md">
                            <ShieldCheck className="h-4 w-4" />
                            Exclusive Network
                        </span>
                        
                        <h1 className="text-[3.5rem] sm:text-7xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter leading-[0.85] mb-10">
                            <span className="text-white block pb-2 md:pb-6 drop-shadow-2xl">Property</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-600 block pr-4">Perfected.</span>
                        </h1>
                        
                        <p className="text-xl md:text-3xl text-zinc-400/90 max-w-3xl mx-auto font-medium leading-relaxed mb-16 tracking-tight">
                            A highly secure, invite-only platform. We place verified tenants, automate rent collection, and silence operational noise.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/apply-landlord" className="group relative flex items-center justify-center h-16 md:h-20 px-8 md:px-12 rounded-full bg-emerald-500 text-black font-black text-lg md:text-xl transition-all hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative z-10 flex items-center gap-3">
                                    Apply for Landlord Access
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1.5 transition-transform" />
                                </span>
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
                
                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Scroll to Explore</span>
                    <div className="w-[1px] h-16 bg-gradient-to-b from-emerald-500/50 to-transparent" />
                </motion.div>
            </section>

            {/* Horizontal Scrollytelling Section */}
            <section ref={targetRef} className="relative h-[300vh] bg-[#0A0A0B] z-20">
                <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                    
                    {/* Background Progress Gradient that shifts with scroll */}
                    <motion.div 
                        className="absolute inset-0 opacity-20 pointer-events-none blend-screen" 
                        style={{
                            background: useTransform(
                                scrollYProgress,
                                [0, 0.5, 1],
                                [
                                    "radial-gradient(circle at 10% 50%, rgba(16, 185, 129, 0.4) 0%, transparent 50%)",
                                    "radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.4) 0%, transparent 50%)",
                                    "radial-gradient(circle at 90% 50%, rgba(63, 63, 70, 0.4) 0%, transparent 50%)"
                                ]
                            )
                        }}
                    />

                    <motion.div style={{ x }} className="flex gap-8 md:gap-16 px-12 md:pl-40 pr-[60vw]">
                        {/* Intro Panel */}
                        <div className="w-[80vw] max-w-xl shrink-0 flex flex-col justify-center">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white leading-tight">
                                Drop the spread<br className="hidden md:block"/>sheets.
                            </h2>
                            <p className="text-2xl text-zinc-400 font-medium leading-relaxed">
                                The era of manual landlord operations is over. iReside automates your cashflow, secures your background checks, and silences the operational noise.
                            </p>
                        </div>

                        {/* Feature Cards */}
                        {FEATURES.map((feature, i) => (
                            <div key={feature.id} className="w-[85vw] md:w-[70vw] max-w-2xl shrink-0 h-[65vh] min-h-[500px] flex items-center">
                                <div className="relative w-full h-full rounded-[3rem] border border-white/10 bg-zinc-950/80 backdrop-blur-2xl p-8 md:p-16 flex flex-col justify-between overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all hover:border-white/20">
                                    
                                    <div className={cn("absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-opacity duration-700 group-hover:opacity-50 bg-gradient-to-br", feature.color)} />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-12">
                                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <feature.icon className={cn("h-8 w-8 md:h-10 md:w-10", feature.accent)} />
                                            </div>
                                            <span className="text-zinc-500 font-black text-6xl opacity-20">0{i + 1}</span>
                                        </div>
                                        
                                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6 leading-none">
                                            {feature.title}
                                        </h3>
                                        <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                    
                                    <div className="relative z-10 flex items-center gap-3 text-xs md:text-sm font-black uppercase tracking-widest text-white/30 pt-8 border-t border-white/10">
                                        <Activity className="h-4 w-4 text-emerald-500/50" />
                                        Platform Core Advantage
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Massive CTA Footer */}
            <section className="relative py-32 md:py-52 px-6 border-t border-white/10 bg-[#0A0A0B] overflow-hidden z-20">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0A0A0B] to-[#0A0A0B] pointer-events-none" />
                
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-5xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-10 text-white">
                            Stake Your Claim.
                        </h2>
                        <p className="text-xl md:text-3xl text-zinc-400 font-medium mb-16 tracking-tight max-w-3xl mx-auto">
                            Join the closed network of landlords who have outsourced their stress to iReside.
                        </p>
                        
                        <Link href="/apply-landlord" className="group inline-flex items-center justify-center h-20 md:h-24 px-10 md:px-14 rounded-full bg-emerald-500 text-black font-black text-xl md:text-3xl transition-all hover:scale-105 shadow-[0_0_80px_rgba(16,185,129,0.3)] hover:shadow-[0_0_100px_rgba(16,185,129,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                            <span className="relative z-10 flex items-center">
                                Start Verification
                                <ArrowRight className="ml-4 h-6 w-6 md:h-8 md:w-8 group-hover:translate-x-2 transition-transform" />
                            </span>
                        </Link>

                        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-zinc-500 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500/50" /> Manual Review</span>
                            <span className="hidden md:flex w-1 h-1 bg-zinc-700 justify-center rounded-full" />
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500/50" /> Bank-Grade Security</span>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
"""

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("page.tsx updated via python")