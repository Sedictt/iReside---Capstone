"use client";

import Link from "next/link";
import { 
    ArrowLeft,
    Lock,
    FileText,
    CreditCard,
    Wrench,
    MessageSquare,
    Sparkles,
    Home,
    Calendar,
    Shield,
    Users,
    Bell,
    ChevronRight,
    KeyRound,
    Receipt,
    Settings,
    Building2,
    Clock,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const featureCategories = [
    {
        title: "Residency Management",
        icon: Home,
        color: "emerald",
        features: [
            { icon: FileText, label: "Digital Lease Signing", desc: "Sign your lease documents electronically with secure e-signatures" },
            { icon: Calendar, label: "Lease Overview", desc: "View lease terms, dates, and renewal eligibility at a glance" },
            { icon: Building2, label: "Unit Map", desc: "Explore your building layout and request unit transfers" },
            { icon: FileText, label: "Document Vault", desc: "Access all your important documents in one secure place" },
        ]
    },
    {
        title: "Payments & Billing",
        icon: CreditCard,
        color: "blue",
        features: [
            { icon: Receipt, label: "Financial Ledger", desc: "Track monthly dues, balances, and payment history" },
            { icon: CreditCard, label: "Payment History", desc: "View all past transactions with detailed breakdowns" },
            { icon: Bell, label: "Payment Reminders", desc: "Get notified before payment due dates" },
            { icon: Clock, label: "Due Date Tracking", desc: "Never miss a payment with real-time balance monitoring" },
        ]
    },
    {
        title: "Maintenance & Support",
        icon: Wrench,
        color: "amber",
        features: [
            { icon: Wrench, label: "Maintenance Requests", desc: "Submit repair tickets with photo uploads" },
            { icon: Settings, label: "Repair Tracking", desc: "Monitor status updates in real-time" },
            { icon: MessageSquare, label: "Direct Communication", desc: "Chat directly with your landlord about issues" },
            { icon: CheckCircle2, label: "Resolution Updates", desc: "Get notified when repairs are completed" },
        ]
    },
    {
        title: "Communication Hub",
        icon: MessageSquare,
        color: "purple",
        features: [
            { icon: MessageSquare, label: "Messaging Portal", desc: "Real-time chat with typing indicators and read receipts" },
            { icon: Sparkles, label: "iRis AI Assistant", desc: "Get instant answers about amenities, rules, and lease details" },
            { icon: Users, label: "Community Board", desc: "Connect with fellow residents through posts and polls" },
            { icon: Bell, label: "Announcements", desc: "Receive building-wide updates from management" },
        ]
    }
];

const onboardingSteps = [
    {
        number: "01",
        title: "Receive Your Invitation",
        description: "Your property manager sends a secure invite to your verified email or phone number.",
        icon: Lock
    },
    {
        number: "02",
        title: "Complete Verification",
        description: "Finish a quick identity verification to ensure community safety and trust.",
        icon: Shield
    },
    {
        number: "03",
        title: "Access Your Dashboard",
        description: "Unlock your unit, view your lease, and start managing your residency instantly.",
        icon: KeyRound
    }
];

export default function TenantInformationPage() {
    const [mounted, setMounted] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/login" className="flex items-center">
                            <Logo className="h-8 w-28" />
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <ThemeToggle />
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Login
                        </Link>
                    </motion.div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    {/* Invite Badge */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <Lock className="size-3.5" />
                        Private Residency — Invite Only
                    </motion.div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
                        Your all-in-one<br />
                        <span className="text-primary">resident hub</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        iReside is an exclusive ecosystem for residents. Once invited, you will have access to lease management, payments, maintenance, messaging, and more — all in one place.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                        >
                            I have an invite
                            <ArrowRight className="size-5" />
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border bg-card text-foreground font-bold text-base hover:bg-muted transition-all"
                        >
                            See what's included
                            <ChevronRight className="size-5" />
                        </a>
                    </div>
                </motion.section>

                {/* Onboarding Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-20"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                            Getting started is simple
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Once you receive your invitation, you will be up and running in minutes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {onboardingSteps.map((step, idx) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="relative rounded-3xl border border-border bg-card p-8 shadow-sm"
                            >
                                <div className="absolute -top-4 left-8 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest">
                                    Step {step.number}
                                </div>
                                <div className="mt-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                        <step.icon className="size-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold tracking-tight mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Features Section */}
                <motion.section
                    id="features"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-20"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                            Everything you need, one platform
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Manage your entire residency from your personal dashboard.
                        </p>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {featureCategories.map((category, idx) => (
                            <button
                                key={category.title}
                                onClick={() => setActiveCategory(idx)}
                                className={cn(
                                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                    activeCategory === idx
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <category.icon className="size-4" />
                                {category.title}
                            </button>
                        ))}
                    </div>

                    {/* Feature Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            {featureCategories[activeCategory].features.map((feature, idx) => (
                                <div
                                    key={feature.label}
                                    className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                                >
                                    <div className={cn(
                                        "size-10 rounded-xl flex items-center justify-center mb-4",
                                        featureCategories[activeCategory].color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                                        featureCategories[activeCategory].color === "blue" && "bg-blue-500/10 text-blue-500",
                                        featureCategories[activeCategory].color === "amber" && "bg-amber-500/10 text-amber-500",
                                        featureCategories[activeCategory].color === "purple" && "bg-purple-500/10 text-purple-500"
                                    )}
                                    >
                                        <feature.icon className="size-5" />
                                    </div>
                                    <h4 className="font-semibold mb-1">{feature.label}</h4>
                                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </motion.section>

                {/* CTA Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="rounded-[2rem] border border-border bg-card p-10 sm:p-14 text-center shadow-sm"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <CheckCircle2 className="size-3.5" />
                        Invite Only Community
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                        If you have received an invitation from your property manager, click below to access your resident portal.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    >
                        Access Resident Portal
                        <ArrowRight className="size-5" />
                    </Link>
                </motion.section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © 2026 iReside Technologies. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
