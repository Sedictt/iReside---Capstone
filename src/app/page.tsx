"use client";

import { motion } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  Search,
  FileText,
  Bot,
  House,
  Wallet,
  MessageSquare,
  Wrench,
  Linkedin,
  Twitter,
  Instagram,
  Home,
  Sparkles,
  BarChart3,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">

      {/* Navigation Layer */}
      <nav className="fixed top-0 z-50 w-full px-6 py-4 flex justify-between items-center mix-blend-difference text-white">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="h-6 w-6 rounded bg-white flex items-center justify-center">
            <div className="h-3 w-3 bg-black rounded-sm" />
          </div>
          iRESIDE
        </div>
        <div className="hidden md:flex gap-6 text-xs font-medium tracking-widest uppercase opacity-80">
          <Link href="/search" className="hover:opacity-100 transition-opacity">Find Homes</Link>
          <Link href="/login" className="hover:opacity-100 transition-opacity">For Landlords</Link>
          <Link href="/login" className="hover:opacity-100 transition-opacity">Log In</Link>
        </div>
      </nav>

      {/* Hero Section - Split View */}
      <section className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden">

        {/* Resident Side (Left) -- Revamped */}
        <Link href="/search" className="group relative flex-1 h-1/2 md:h-full cursor-pointer overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-emerald-900/40 to-black/60 group-hover:from-emerald-900/50 group-hover:via-emerald-800/30 transition-all duration-700 z-10" />
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
            alt="Luxury Home"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-70 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center transition-transform duration-700 group-hover:scale-105">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 p-4 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-colors"
            >
              <Home className="h-8 w-8" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 text-white drop-shadow-2xl">Resident</h2>
            <p className="text-slate-300 text-sm md:text-base tracking-[0.2em] uppercase mb-10 font-medium max-w-xs leading-relaxed group-hover:text-white transition-colors">
              Find your sanctuary
            </p>
            <div className="px-8 py-3 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all duration-300">
              Find Your Home
            </div>
          </div>
        </Link>

        {/* Landlord Side (Right) -- Revamped */}
        <Link href="/login" className="group relative flex-1 h-1/2 md:h-full cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-indigo-900/40 to-black/60 group-hover:from-indigo-900/50 group-hover:via-indigo-800/30 transition-all duration-700 z-10" />
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop"
            alt="Modern Office"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-70 transition-all duration-1000 ease-out grayscale group-hover:grayscale-0"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center transition-transform duration-700 group-hover:scale-105">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 rounded-full bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-colors"
            >
              <Building2 className="h-8 w-8" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 text-white drop-shadow-2xl">Landlord</h2>
            <p className="text-slate-300 text-sm md:text-base tracking-[0.2em] uppercase mb-10 font-medium max-w-xs leading-relaxed group-hover:text-white transition-colors">
              Manage your portfolio
            </p>
            <div className="px-8 py-3 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all duration-300">
              Manage Properties
            </div>
          </div>
        </Link>

      </section>

      {/* Core Value Section */}
      <section className="relative py-24 border-y border-white/5 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2400&auto=format&fit=crop"
          alt="Modern apartment interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-5"
            >
              <Zap className="h-3 w-3" /> Why iReside
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter mb-4"
            >
              Everything you need in one platform.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400"
            >
              Clear communication for residents, better operations for landlords, and one shared source of truth.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "AI Concierge",
                description: "Get instant help for property questions, maintenance, and daily tasks.",
                icon: Sparkles,
                iconStyle: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "Verified Security",
                description: "Identity checks and role-based access keep every interaction trusted.",
                icon: ShieldCheck,
                iconStyle: "text-violet-400 bg-violet-500/10 border-violet-500/20",
              },
              {
                title: "Portfolio Insights",
                description: "Track occupancy, payment health, and operational performance in real time.",
                icon: BarChart3,
                iconStyle: "text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md p-7"
              >
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center mb-5 ${item.iconStyle}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Lifecycle */}
      <section className="relative py-24 border-y border-white/10 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2400&auto=format&fit=crop"
          alt="Modern city skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0b1630]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[#0b1630]/55 to-black/65" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The Rental Lifecycle</h2>
            <p className="text-slate-300 text-sm md:text-base">
              A seamless path from searching to living, automated for efficiency and clarity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4 mb-12 relative">
            <div className="hidden md:block absolute top-7 left-0 right-0 h-px bg-blue-400/20" />
            {[
              { title: "Discovery", icon: Search, text: "Smart listings and AI-driven compatibility scores." },
              { title: "Leasing", icon: FileText, text: "Digital signatures and secure contracts in minutes." },
              { title: "Automation", icon: Bot, text: "Collections, notifications, and reconciliation on autopilot." },
              { title: "Living", icon: House, text: "Community tools and real-time support for residents." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="relative text-center"
              >
                <div className="mx-auto h-14 w-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 backdrop-blur-md shadow-[0_8px_24px_rgba(15,23,42,0.35)]">
                  <item.icon className="h-5 w-5 text-blue-300" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[230px] mx-auto">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_12px_36px_rgba(15,23,42,0.35)] p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                    <Wallet className="h-5 w-5 text-blue-300" />
                  </div>
                  <h4 className="text-2xl font-semibold mb-3">Manual-Free Payments</h4>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    Connect your property directly to the iGCash ecosystem. Tenants pay in one tap, and your dashboard reconciles every transaction automatically.
                  </p>
                </div>
                <div className="hidden md:flex h-28 w-28 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm items-center justify-center">
                  <div className="h-20 w-12 rounded-lg bg-slate-100/90 border border-slate-300/40" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_12px_36px_rgba(15,23,42,0.35)] p-6 md:p-7"
            >
              <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5 text-blue-300" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Community Interaction</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Foster a modern living experience with notices, amenity bookings, and tenant-to-management messaging.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_12px_36px_rgba(15,23,42,0.35)] p-6 md:p-7"
            >
              <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Wrench className="h-5 w-5 text-blue-300" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Tracking Requests</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Log maintenance issues with media, then monitor status and resolution in one unified timeline.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="md:col-span-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_12px_36px_rgba(15,23,42,0.35)] p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h4 className="text-xl font-semibold mb-3">Data-Driven Insights</h4>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    Predict vacancy rates, monitor portfolio ROI, and identify top-performing units with enterprise-grade analytics.
                  </p>
                </div>
                <div className="hidden md:flex items-end gap-2 h-20">
                  <div className="w-6 h-8 bg-blue-600/30 rounded-sm" />
                  <div className="w-6 h-12 bg-blue-500/40 rounded-sm" />
                  <div className="w-6 h-16 bg-blue-400/60 rounded-sm" />
                  <div className="w-6 h-10 bg-blue-500/35 rounded-sm" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=2400&auto=format&fit=crop"
          alt="City at dusk"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/85" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5">Keep the move simple.</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            iReside keeps residents and landlords aligned from search to lease to daily operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-widest uppercase transition-colors"
            >
              I&apos;m a Resident
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-black text-white text-xs font-bold tracking-widest uppercase transition-colors"
            >
              I&apos;m a Landlord
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/90 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 py-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 md:p-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">Built for modern renting</p>
              <p className="text-slate-200 text-sm md:text-base">One dashboard for residents, landlords, leases, and daily operations.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-widest text-white transition-colors"
            >
              Open Platform
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-lg tracking-tight mb-3">
                <div className="h-5 w-5 rounded bg-white flex items-center justify-center">
                  <div className="h-2.5 w-2.5 bg-black rounded-sm" />
                </div>
                iRESIDE
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Unified renting for residents and landlords—from discovery to daily operations.
              </p>

              <div className="flex items-center gap-2 mt-6">
                {[
                  { label: "LinkedIn", href: "#", icon: Linkedin },
                  { label: "Twitter", href: "#", icon: Twitter },
                  { label: "Instagram", href: "#", icon: Instagram },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="h-9 w-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">Platform</h4>
              <div className="space-y-2.5 text-sm text-slate-300">
                <Link href="/search" className="block hover:text-white transition-colors">Resident Search</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Landlord Portal</Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">Company</h4>
              <div className="space-y-2.5 text-sm text-slate-300">
                <Link href="#" className="block hover:text-white transition-colors">About</Link>
                <Link href="#" className="block hover:text-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">Legal</h4>
              <div className="space-y-2.5 text-sm text-slate-300">
                <Link href="#" className="block hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="block hover:text-white transition-colors">Terms</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[11px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p>© 2026 iReside Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 uppercase tracking-widest text-[10px]">
              <Link href="#" className="hover:text-slate-300 transition-colors">Status</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
