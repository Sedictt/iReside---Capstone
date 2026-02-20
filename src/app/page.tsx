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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">

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
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-blue-900/40 to-black/60 group-hover:from-blue-900/50 group-hover:via-blue-800/30 transition-all duration-700 z-10" />
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
              className="mb-6 p-4 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-colors"
            >
              <Home className="h-8 w-8" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 text-white drop-shadow-2xl">Resident</h2>
            <p className="text-slate-300 text-sm md:text-base tracking-[0.2em] uppercase mb-10 font-medium max-w-xs leading-relaxed group-hover:text-white transition-colors">
              Find your sanctuary
            </p>
            <div className="px-8 py-3 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white transition-all duration-300">
              Find Your Home
            </div>
          </div>
        </Link>

        {/* Landlord Side (Right) -- Revamped */}
        <Link href="/login" className="group relative flex-1 h-1/2 md:h-full cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/60 via-primary/40 to-black/60 group-hover:from-primary-dark/50 group-hover:via-primary/30 transition-all duration-700 z-10" />
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
              className="mb-6 p-4 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-primary group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors"
            >
              <Building2 className="h-8 w-8" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 text-white drop-shadow-2xl">Landlord</h2>
            <p className="text-slate-300 text-sm md:text-base tracking-[0.2em] uppercase mb-10 font-medium max-w-xs leading-relaxed group-hover:text-white transition-colors">
              Manage your portfolio
            </p>
            <div className="px-8 py-3 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
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
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase mb-5"
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
                title: "AI Assistant",
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
                iconStyle: "text-primary bg-primary/10 border-primary/20",
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
      <section className="relative py-32 border-y border-white/10 overflow-hidden">
        {/* Background with gradient overlay - slightly darker for better text contrast */}
        <div className="absolute inset-0 bg-[#0b1630]" />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2400&auto=format&fit=crop"
          alt="City Night"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#0b1630]/80 to-[#000000]" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">The Rental Lifecycle</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              A seamless path from searching to living, automated for efficiency and clarity.
            </p>
          </motion.div>

          {/* Timeline Steps - improved visuals */}
          <div className="relative grid md:grid-cols-4 gap-8 mb-24">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

            {[
              { title: "Discovery", icon: Search, desc: "Smart listings & AI compatibility." },
              { title: "Leasing", icon: FileText, desc: "Digital contracts in minutes." },
              { title: "Automation", icon: Bot, desc: "Auto-reconciliation & notifications." },
              { title: "Living", icon: House, desc: "Community tools & unified support." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="relative z-10 h-24 w-24 rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl shadow-primary/10 flex items-center justify-center mb-6 overflow-hidden group-hover:border-primary/50 transition-colors duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <item.icon className="h-8 w-8 text-primary/80 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Bento Grid Features */}
          <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            {/* Card 1: Manual-Free Payments (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.05]"
            >
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex h-full flex-col justify-between sm:flex-row sm:items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-2">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Smart Payment Tracking</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Tenants upload payment proofs directly. Our system organizes receipts for easy verification, keeping your ledger accurate without the manual chase.
                  </p>
                </div>
                {/* CSS Graphic: Phone Mockup */}
                <div className="relative h-48 w-28 shrink-0 rotate-[-12deg] transform transition-transform group-hover:rotate-0 duration-500">
                  <div className="absolute inset-0 rounded-[20px] bg-[#0f172a] border-2 border-white/20 shadow-2xl overflow-hidden p-2">
                    {/* Screen Content */}
                    <div className="h-full w-full rounded-[14px] bg-[#1e293b] flex flex-col items-center pt-4 px-2 space-y-2">
                      <div className="w-8 h-1 rounded-full bg-white/20 mb-2" />
                      <div className="w-full h-8 rounded bg-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-400">RECEIPT SENT</div>
                      <div className="w-full h-16 rounded bg-white/5 border border-white/5" />
                      <div className="w-full h-8 rounded bg-emerald-500 flex items-center justify-center font-bold text-white text-[8px]">VERIFIED</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Community Interaction (Tall/Small) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.05]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary mb-6">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Community First</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  Notices, amenity bookings, and unified messaging in one place.
                </p>
                {/* CSS Graphic: Chat Bubbles */}
                <div className="mt-auto space-y-3">
                  <div className="w-3/4 p-3 rounded-2xl rounded-tl-none bg-white/10 border border-white/5 text-[10px] text-slate-300">
                    Gym is open 24/7 now?
                  </div>
                  <div className="w-3/4 ml-auto p-3 rounded-2xl rounded-tr-none bg-primary/20 border border-primary/20 text-[10px] text-primary text-right">
                    Yes! Access via keycard.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Tracking Requests (Small) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-1 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.05]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-6">
                <Wrench className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Maintenance</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Log issues with photos. Track status from "In Review" to "Resolved".
              </p>
              {/* CSS Graphic: Progress Bars */}
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-amber-500" />
                </div>
                <div className="flex justify-between text-[10px] font-medium text-amber-500 uppercase tracking-wider">
                  <span>In Progress</span>
                  <span>75%</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Data-Driven Insights (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:bg-white/[0.05]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-8">
                <div className="max-w-md">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary mb-6">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">Data-Driven Insights</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Predict vacancy rates, monitor portfolio ROI, and identify performing units with enterprise analytics.
                  </p>
                </div>
                {/* CSS Graphic: Bar Chart */}
                <div className="flex items-end gap-3 h-32 flex-1 justify-end pb-2">
                  <div className="w-8 h-12 bg-white/5 rounded-t-sm group-hover:h-16 transition-all duration-700" />
                  <div className="w-8 h-20 bg-white/10 rounded-t-sm group-hover:h-24 transition-all duration-700 delay-75" />
                  <div className="w-8 h-16 bg-white/10 rounded-t-sm group-hover:h-20 transition-all duration-700 delay-100" />
                  <div className="w-8 h-28 bg-primary rounded-t-sm shadow-[0_0_15px_rgba(62,123,57,0.5)] group-hover:h-32 transition-all duration-500 delay-150" />
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
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-widest uppercase transition-colors"
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
