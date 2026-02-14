"use client";

import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  ArrowRight,
  Search,
  ShieldCheck,
  User,
  Mail,
  CheckCircle2,
  SlidersHorizontal,
  Home,
  Wallet,
  Sparkles,
  BarChart3,
  Globe,
  Lock,
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
          <Link href="#" className="hover:opacity-100 transition-opacity">Our Story</Link>
          <Link href="#" className="hover:opacity-100 transition-opacity"> The Journey</Link>
          <Link href="/login" className="hover:opacity-100 transition-opacity">Member Login</Link>
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

      {/* Features Grid */}
      <section className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="mb-20 md:text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-6"
            >
              <Zap className="h-3 w-3" /> System Capabilities
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500"
            >
              Redefining the <br /> standard of living.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed"
            >
              A unified ecosystem bringing advanced property technology to modern residents and forward-thinking landlords.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "AI Concierge", desc: "24/7 intelligent assistance for maintenance requests and localized recommendations.", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              { title: "Smart Finance", desc: "Automated rent payments, wallet integration, and real-time portfolio tracking.", icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { title: "Global Access", desc: "Manage your properties or pay your rent from anywhere in the world.", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { title: "Verified Identity", desc: "Bank-grade identity verification for secure and trusted interactions.", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { title: "Market Insights", desc: "Data-driven analytics to maximize yield and optimize occupancy rates.", icon: BarChart3, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
              { title: "Secure Living", desc: "Digital key access and integrated smart home security features.", icon: Lock, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                <div className={`h-12 w-12 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="py-24 bg-black border-y border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-4 gap-12 text-center">
          {[
            { value: "50k+", label: "Active Units" },
            { value: "$2M+", label: "Rent Processed" },
            { value: "98%", label: "Satisfaction" },
            { value: "24/7", label: "Support" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Footer */}
      <section className="relative py-32 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black z-0" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-4">
              <div className="h-8 w-8 bg-black rounded-lg" />
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            Ready to upgrade?
          </h2>
          <p className="text-slate-400 text-lg">
            Join the network of premium properties and verified residents.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <Link href="/search">
              <button className="px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest uppercase transition-all hover:scale-105 min-w-[200px]">
                I'm a Resident
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-4 rounded-full border border-white/20 bg-white/5 hover:bg-white hover:text-black text-white font-bold tracking-widest uppercase transition-all hover:scale-105 min-w-[200px]">
                I'm a Landlord
              </button>
            </Link>
          </div>

          <footer className="pt-24 text-[10px] text-slate-600 tracking-widest uppercase">
            © 2026 iiReside Inc. • Privacy • Terms • Security
          </footer>
        </div>
      </section>

    </div>
  );
}
