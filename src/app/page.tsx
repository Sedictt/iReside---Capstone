"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowRight, ShieldCheck, Wallet, Lock, Activity, Users, Building, ChevronRight, MapPin, LayoutDashboard, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    ScrollTrigger.config({
        limitCallbacks: true,
        ignoreMobileResize: true,
    });
}

const FEATURES = [
    {
        id: 1,
        title: "Private & Secure",
        desc: "No public listings. Your properties are hidden from the general public. We only invite verified, background-checked tenants.",
        icon: Lock,
        color: "from-emerald-500/20",
        accent: "text-primary dark:text-primary-200"
    },
    {
        id: 2,
        title: "Automated Rent",
        desc: "Stop chasing payments. Rent is collected automatically on the 1st of every month and deposited directly to you.",
        icon: Wallet,
        color: "from-teal-500/20 dark:from-teal-500/10",
        accent: "text-teal-600 dark:text-teal-400"
    },
    {
        id: 3,
        title: "Zero Headaches",
        desc: "Designed for property owners, not tech experts. Manage simple leases, maintenance requests, and communication from one shockingly easy dashboard.",
        icon: ShieldCheck,
        color: "from-zinc-500/20 dark:from-zinc-500/10",
        accent: "text-muted-foreground"
    }
];

const SHOWCASE_MODULES = [
    {
        id: "map",
        title: "Interactive Unit Map",
        desc: "Visualize your entire portfolio spatially. See exactly where your vacant units are, track maintenance requests geographically, and easily show properties to prospects via the visual map interface.",
        icon: MapPin,
        color: "bg-emerald-500",
        shadow: "shadow-emerald-500/20",
    },
    {
        id: "dashboard",
        title: "Intelligent Dashboard",
        desc: "At-a-glance metrics focusing on cashflow, upcoming lease expirations, and unread tenant messages. Your entire operation distilled into a single, actionable analytical screen.",
        icon: LayoutDashboard,
        color: "bg-blue-500",
        shadow: "shadow-blue-500/20",
    },
    {
        id: "finance",
        title: "Automated Financials",
        desc: "Let the system handle the ledgers. We auto-generate invoices, collect rent, process late fees, and enforce compliance automatically so you can focus on scaling.",
        icon: Receipt,
        color: "bg-purple-500",
        shadow: "shadow-purple-500/20",
    }
];

export default function ScrollyTellingLandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollWrapperRef = useRef<HTMLDivElement>(null);
    const showcaseContainerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const cards = gsap.utils.toArray('.showcase-card') as HTMLElement[];
        if (cards.length === 0) return;

        ScrollTrigger.getById("landing-showcase-stack")?.kill();
        gsap.set(cards, { yPercent: 100, scale: 1, opacity: 1 });
        gsap.set(cards[0], { yPercent: 0 });
        gsap.set(cards, { force3D: true, willChange: "transform" });
        
        const tl = gsap.timeline({
            scrollTrigger: {
                id: "landing-showcase-stack",
                trigger: showcaseContainerRef.current,
                pin: true,
                pinSpacing: true,
                scrub: 1,
                start: "top top",
                end: `+=${window.innerHeight * Math.max(cards.length - 1, 1)}`,
                anticipatePin: 1,
                refreshPriority: 1,
                invalidateOnRefresh: true,
            }
        });

        cards.forEach((card, index) => {
            if (index === 0) return;
            tl.fromTo(card, 
                { yPercent: 100 }, 
                { yPercent: 0, ease: "none", force3D: true }, 
                `card-${index}`
            );
        });
    }, { scope: showcaseContainerRef });

    useGSAP(() => {
        const wrapper = scrollWrapperRef.current;
        const trigger = containerRef.current;
        if (!wrapper || !trigger) return;
        if (window.matchMedia("(max-width: 1023px)").matches) {
            gsap.set(wrapper, { clearProps: "transform" });
            return;
        }

        const getScrollDistance = () =>
            Math.max(0, (wrapper.scrollWidth || 0) - window.innerWidth);

        if (getScrollDistance() === 0) {
            gsap.set(wrapper, { x: 0 });
            return;
        }

        ScrollTrigger.getById("landing-horizontal-features")?.kill();
        gsap.set(wrapper, { force3D: true, willChange: "transform" });

        gsap.to(wrapper, {
            x: () => -getScrollDistance(),
            ease: "none",
            force3D: true,
            scrollTrigger: {
                id: "landing-horizontal-features",
                trigger,
                start: "top top",
                pin: true,
                pinSpacing: true,
                scrub: 1,
                anticipatePin: 1,
                refreshPriority: 2,
                invalidateOnRefresh: true,
                end: () => "+=" + getScrollDistance()
            }
        });
    }, { scope: containerRef });

    useGSAP(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.5))]" />
                <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.04] mix-blend-overlay z-10" />
                
                {/* Animated Ripple Background */}
                <style dangerouslySetInnerHTML={{__html: `
                    .ripple-background {
                        position: absolute;
                        inset: 0;
                        background: transparent;
                        overflow: hidden;
                        z-index: -1;
                    }
                    .ripple-circle {
                        position: absolute;
                        border-radius: 50%;
                        background: var(--primary);
                        animation: ripple 15s infinite;
                        box-shadow: 0px 0px 1px 0px var(--primary);
                    }
                    .ripple-small { width: 200px; height: 200px; left: -100px; bottom: -100px; }
                    .ripple-medium { width: 400px; height: 400px; left: -200px; bottom: -200px; }
                    .ripple-large { width: 600px; height: 600px; left: -300px; bottom: -300px; }
                    .ripple-xlarge { width: 800px; height: 800px; left: -400px; bottom: -400px; }
                    .ripple-xxlarge { width: 1000px; height: 1000px; left: -500px; bottom: -500px; }
                    
                    .ripple-shade1 { opacity: 0.03; }
                    .ripple-shade2 { opacity: 0.05; }
                    .ripple-shade3 { opacity: 0.08; }
                    .ripple-shade4 { opacity: 0.12; }
                    .ripple-shade5 { opacity: 0.15; }

                    .dark .ripple-circle {
                        background: var(--primary);
                        box-shadow: 0px 0px 1px 0px var(--primary);
                    }
                    .dark .ripple-shade1 { opacity: 0.02; }
                    .dark .ripple-shade2 { opacity: 0.04; }
                    .dark .ripple-shade3 { opacity: 0.06; }
                    .dark .ripple-shade4 { opacity: 0.08; }
                    .dark .ripple-shade5 { opacity: 0.1; }

                    @keyframes ripple {
                        0% { transform: scale(0.8); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(0.8); }
                    }
                `}} />
                <div className="ripple-background">
                    <div className="ripple-circle ripple-xxlarge ripple-shade1"></div>
                    <div className="ripple-circle ripple-xlarge ripple-shade2"></div>
                    <div className="ripple-circle ripple-large ripple-shade3"></div>
                    <div className="ripple-circle ripple-medium ripple-shade4"></div>
                    <div className="ripple-circle ripple-small ripple-shade5"></div>
                </div>

                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-2xl"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary-200 to-primary-dark flex items-center justify-center rounded-xl shadow-[0_0_25px_rgba(109,152,56,0.3)] transition-transform group-hover:scale-105 ring-1 ring-border">
                            <Building className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl md:text-2xl font-extrabold tracking-tight leading-none text-foreground">iReside</span>
                            <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary leading-tight mt-0.5">Landlord Access</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4"><ThemeToggle /><Link href="/login" className="relative flex items-center gap-2 overflow-hidden group px-6 py-2.5 rounded-full border border-zinc-200 bg-muted border-border text-sm font-bold text-foreground transition-all hover:bg-muted/80 hover:border-primary/30">
                        <span className="relative z-10 hidden md:block">Access Portal</span>
                        <span className="relative z-10 md:hidden">Login</span>
                        <ChevronRight className="h-4 w-4 relative z-10 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link></div>
                </div>
            </motion.nav>

            <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pb-24 z-10 box-border">
                <motion.div 
                    className="max-w-[70rem] mx-auto text-center w-full relative"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-6 shadow-[0_0_30px_rgba(109,152,56,0.15)] backdrop-blur-md">
                            <ShieldCheck className="h-4 w-4" />
                            Exclusive Network
                        </span>
                        
                        <h1 className="text-[3.5rem] sm:text-6xl md:text-[6.5rem] lg:text-[8rem] font-black tracking-tighter leading-[0.85] mb-6">
                            <span className="text-foreground block pb-2 md:pb-4 drop-shadow-sm dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)]">Property</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary to-primary-dark dark:from-primary-200 dark:via-primary dark:to-primary block pr-4">Perfected.</span>
                        </h1>
                        
                        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-8 tracking-tight">
                            A highly secure, invite-only platform. We place verified tenants, automate rent collection, and silence operational noise.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/apply-landlord" className="group relative flex items-center justify-center h-14 md:h-16 px-8 md:px-10 rounded-full bg-primary text-primary-foreground font-black text-lg transition-all hover:scale-105 hover:bg-primary-dark shadow-[0_0_40px_rgba(109,152,56,0.3)] hover:shadow-[0_0_60px_rgba(109,152,56,0.5)] overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative z-10 flex items-center gap-3">
                                    Apply for Landlord Access
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                                </span>
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3"
                >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scroll to Explore</span>
                    <div className="w-[1px] h-6 md:h-10 bg-gradient-to-b from-primary/50 to-transparent" />
                </motion.div>
            </section>

            <section ref={containerRef} className="relative h-screen z-20 overflow-hidden">
                <div ref={scrollWrapperRef} style={{ willChange: "transform" }} className="flex h-screen items-center w-max px-[5vw] pt-24 [transform:translate3d(0,0,0)]">
                    
                    <div className="w-[90vw] md:w-[60vw] shrink-0 flex flex-col justify-center px-12 md:px-20">
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-foreground leading-tight">
                            Drop the spread<br className="hidden md:block"/>sheets.
                        </h2>
                        <p className="text-2xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                            The era of manual landlord operations is over. iReside automates your cashflow, secures your background checks, and silences the operational noise.
                        </p>
                    </div>

                    {FEATURES.map((feature, i) => (
                        <div key={feature.id} className="w-[90vw] md:w-[70vw] lg:w-[60vw] shrink-0 h-[65vh] min-h-[500px] flex items-center px-6 md:px-12">
                            <div className="relative w-full h-full rounded-[3rem] border border-border bg-card p-8 md:p-16 flex flex-col justify-between overflow-hidden group shadow-lg transition-all hover:border-primary/50">
                                
                                <div className={cn("absolute -top-40 -right-40 hidden md:block w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-opacity duration-700 group-hover:opacity-50 bg-gradient-to-br", feature.color)} />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] bg-muted border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <feature.icon className={cn("h-8 w-8 md:h-10 md:w-10", feature.accent)} />
                                        </div>
                                        <span className="text-muted-foreground font-black text-6xl opacity-20">0{i + 1}</span>
                                    </div>
                                    
                                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground mb-6 leading-none">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                                
                                <div className="relative z-10 flex items-center gap-3 text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground pt-8 border-t border-border">
                                    <Activity className="h-4 w-4 text-primary-500/50" />
                                    Platform Core Advantage
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="w-[20vw] shrink-0"></div>
                </div>
            </section>

            <section ref={showcaseContainerRef} className="relative h-screen bg-background z-20 overflow-hidden">
                {SHOWCASE_MODULES.map((mod, i) => (
                    <div 
                        key={mod.id} 
                        className="showcase-card absolute inset-0 flex items-center justify-center p-6 md:p-12 border-t border-border bg-background shadow-lg origin-top [transform:translate3d(0,0,0)] [will-change:transform]"
                        style={{ zIndex: i }}
                    >
                        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="flex flex-col">
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-2xl", mod.color, mod.shadow)}>
                                    <mod.icon className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">{mod.title}</h2>
                                <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                                    {mod.desc}
                                </p>
                            </div>
                            <div className="relative h-[40vh] md:h-[60vh] w-full rounded-[2.5rem] border border-white/5 bg-white/[0.02] shadow-xl overflow-hidden flex flex-col items-center justify-center dark:bg-black/20 transition-transform duration-500 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                
                                <div className="absolute top-6 left-6 flex gap-2 z-20">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                </div>
                                
                                <mod.icon className="w-32 h-32 md:w-48 md:h-48 text-primary shadow-[0_0_80px_rgba(109,152,56,0.3)] bg-primary/10 rounded-3xl p-6 md:p-8 rotate-[8deg] transition-all duration-700 hover:rotate-0 z-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <section className="relative min-h-screen py-32 md:py-52 px-6 border-t border-border overflow-hidden z-20 flex flex-col justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-background dark:via-background-dark to-background dark:to-background-dark pointer-events-none" />
                
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h2 className="text-5xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-10 text-foreground">
                            Stake Your Claim.
                        </h2>
                        <p className="text-xl md:text-3xl text-muted-foreground font-medium mb-16 tracking-tight max-w-3xl mx-auto">
                            Join the closed network of landlords who have outsourced their stress to iReside.
                        </p>
                        
                        <Link href="/apply-landlord" className="group inline-flex items-center justify-center h-20 md:h-24 px-10 md:px-14 rounded-full bg-primary text-primary-foreground font-black text-xl md:text-3xl transition-all hover:scale-105 shadow-[0_0_80px_rgba(109,152,56,0.3)] hover:shadow-[0_0_100px_rgba(109,152,56,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                            <span className="relative z-10 flex items-center">
                                Start Verification
                                <ArrowRight className="ml-4 h-6 w-6 md:h-8 md:w-8 group-hover:translate-x-2 transition-transform" />
                            </span>
                        </Link>

                        <div className="mt-16 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-500/50" /> Manual Review</span>
                            <span className="hidden md:flex w-1 h-1 bg-muted-foreground/30 justify-center rounded-full" />
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary-500/50" /> Bank-Grade Security</span>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
