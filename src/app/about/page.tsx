"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    ShieldCheck,
    Lock,
    Users,
    Activity,
    Sparkles,
    Building2,
    CheckCircle2,
    ArrowUpRight
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { TransitionLink } from "@/components/transitions/PageTransitionProvider";

const VALUES = [
    {
        icon: Lock,
        title: "Privacy-First",
        desc: "Invite-only workflows protect sensitive property and tenant data from unnecessary public exposure."
    },
    {
        icon: ShieldCheck,
        title: "Operational Security",
        desc: "Bank-grade protocols ensure your portfolio data remains protected at every interaction."
    },
    {
        icon: Activity,
        title: "Proactive Management",
        desc: "Daily briefings and automated reminders keep operations running smoothly without constant oversight."
    },
    {
        icon: Users,
        title: "Clear Accountability",
        desc: "Role-based access ensures every stakeholder knows exactly what they're responsible for."
    }
];

const WHO_IT_SERVES = [
    {
        role: "Property Owners",
        desc: "Portfolio visibility without the chaos. Track occupancy, payments, and maintenance in one calm interface."
    },
    {
        role: "Landlords",
        desc: "Streamlined tenant placement and automated rent collection reduce administrative burden significantly."
    },
    {
        role: "Tenants",
        desc: "A private, focused portal for rent payments, maintenance requests, and community engagement."
    }
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/5" />
            </div>

            <header className="relative z-50 p-6 md:p-8 flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Link href="/">
                        <Logo className="h-9 w-auto" />
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-3"
                >
                    <ThemeToggle />
                    <TransitionLink
                        href="/login"
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-bold hover:border-primary/30 hover:bg-muted/50 transition-all"
                    >
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                    </TransitionLink>
                </motion.div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center py-16 md:py-24"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">About iReside</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        The calm way to
                        <span className="block text-primary">manage rentals.</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                        iReside is an operational platform designed for property owners and landlords who value control, consistency, and security in their rental management.
                    </p>
                </motion.section>

                <section className="py-16 md:py-20">
                    <div className="rounded-[2.5rem] border border-border bg-card p-8 md:p-12 shadow-sm">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                                Built on principles that matter.
                            </h2>
                            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                                Every feature in iReside serves one goal: making rental operations feel manageable, not overwhelming.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {VALUES.map((value, i) => (
                                <motion.div
                                    key={value.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="p-6 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                            <value.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16 md:py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                            Who iReside is for.
                        </h2>
                        <p className="text-muted-foreground font-medium max-w-xl mx-auto">
                            Designed for private portfolios where security, structure, and calm operations take priority.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {WHO_IT_SERVES.map((item, i) => (
                            <motion.div
                                key={item.role}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="relative p-8 rounded-[2rem] border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors"
                            >
                                <div className="absolute -top-20 -right-20 w-[10rem] h-[10rem] rounded-full bg-primary/5 blur-[60px] group-hover:bg-primary/10 transition-all" />
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            {i === 0 && <Building2 className="h-5 w-5 text-primary" />}
                                            {i === 1 && <ShieldCheck className="h-5 w-5 text-primary" />}
                                            {i === 2 && <Users className="h-5 w-5 text-primary" />}
                                        </div>
                                        <h3 className="text-xl font-bold">{item.role}</h3>
                                    </div>
                                    <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="py-16 md:py-20">
                    <div className="relative rounded-[2.5rem] border border-border bg-card p-8 md:p-12 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,152,56,0.08),transparent_60%)]" />
                        <div className="relative max-w-2xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                                Ready to experience calmer operations?
                            </h2>
                            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
                                Join a growing community of property owners who have made the switch to organized, secure rental management.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <TransitionLink
                                    href="/signup"
                                    className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                                >
                                    Request Access
                                    <ArrowRight className="h-5 w-5" />
                                </TransitionLink>
                                <TransitionLink
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl border border-border bg-card font-bold hover:bg-muted transition-all"
                                >
                                    Sign In Instead
                                </TransitionLink>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-12 border-t border-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="flex items-center gap-3">
                            <Logo className="h-8 w-auto" />
                            <span className="text-sm text-muted-foreground">2026 iReside Technologies</span>
                        </div>
                        <nav className="flex items-center gap-6 text-sm">
                            <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors">
                                Documentation
                            </Link>
                            <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                                Sign In
                            </Link>
                            <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                                Register
                            </Link>
                        </nav>
                    </div>
                </section>
            </main>
        </div>
    );
}