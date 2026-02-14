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
  Home
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

        {/* Seeker Side (Left) */}
        <div className="group relative flex-1 h-1/2 md:h-full cursor-pointer overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-emerald-900/10 transition-colors duration-500 z-10" />
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop"
            alt="Seeker Building"
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 p-3 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400"
            >
              <MapPin className="h-6 w-6" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-2">Seeker</h2>
            <p className="text-slate-400 text-sm tracking-widest uppercase mb-8">Find beautiful places to call home</p>
            <Link href="/search">
              <button className="px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                Begin Searching
              </button>
            </Link>
          </div>
        </div>

        {/* Steward Side (Right) */}
        <div className="group relative flex-1 h-1/2 md:h-full cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-indigo-900/10 transition-colors duration-500 z-10" />
          <img
            src="https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=2574&auto=format&fit=crop"
            alt="Steward Building"
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 p-3 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-400"
            >
              <Building2 className="h-6 w-6" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-2">Steward</h2>
            <p className="text-slate-400 text-sm tracking-widest uppercase mb-8">List & manage seamlessly</p>
            <Link href="/login">
              <button className="px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all">
                Enter Domain
              </button>
            </Link>
          </div>
        </div>

      </section>

      {/* Identity Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop"
            alt="Office Night"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase">Verified Identity</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
              Your digital reputation <br /> starts here.
            </h3>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Say goodbye to repetitive forms. Create your universal resident profile once, and verify it forever. Secure, portable, and trusted by top landlords.
            </p>
          </div>

          {/* Glass Card */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Who are you?</h4>
                  <p className="text-xs text-slate-400">Tell us a bit about yourself.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block group-focus-within:text-emerald-500 transition-colors">Your Full Name</label>
                  <div className="relative">
                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-white placeholder-slate-600" placeholder="e.g. Alex Sterling" />
                    <User className="absolute right-3 top-3 h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <div className="group">
                  <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block group-focus-within:text-emerald-500 transition-colors">Email Address</label>
                  <div className="relative">
                    <input type="email" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-white placeholder-slate-600" placeholder="name@example.com" />
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Encrypted</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Private</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24 bg-zinc-950">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1481026469463-66327c86e544?q=80&w=2000&auto=format&fit=crop"
            alt="Architecture"
            className="absolute inset-0 w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">

          {/* Glass Card - Left Side */}
          <div className="flex justify-center md:justify-start">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">The Canvas</h4>
                  <p className="text-xs text-slate-400">Where are you painting your future?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">Preferred City</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-slate-300">
                    <option>New York, NY</option>
                    <option>San Francisco, CA</option>
                    <option>Austin, TX</option>
                  </select>
                </div>
                <div className="group">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-slate-500 uppercase font-semibold">Price Range</label>
                    <span className="text-xs text-emerald-400 font-mono">$1.2k - $3.5k</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full w-full">
                    <div className="h-1 bg-emerald-500 w-2/3 rounded-full relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-xs text-slate-300 gap-2">
                    <Home className="h-4 w-4" />
                    <span>Studio</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-emerald-500/50 bg-emerald-500/20 text-xs text-white gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>1 Bed</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-xs text-slate-300 gap-2">
                    <Home className="h-4 w-4" />
                    <span>2+ Bed</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:text-right">
            <div className="flex md:justify-end items-center gap-3 text-emerald-500">
              <span className="text-xs font-bold tracking-widest uppercase">Hyper-Personal Match</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-3xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-l from-white to-slate-500">
              Curated homes, <br /> tailored for you.
            </h3>
            <p className="text-slate-400 max-w-md ml-auto leading-relaxed">
              Our AI analyzes thousands of data points to bring you matches that fit not just your budget, but your lifestyle, commute, and aesthetic preferences.
            </p>
          </div>

        </div>
      </section>

      {/* Footer / Final CTA */}
      <section className="relative py-32 bg-black flex flex-col items-center justify-center text-center px-6 border-t border-white/10">
        <div className="mb-8 p-4 rounded-full bg-emerald-900/20 border border-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
          The Vision is Ready.
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mb-12">
          Your journey into the future of living starts now. Join thousands of users who have upgraded their residential experience.
        </p>

        <Link href="/login">
          <button className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95">
            Finalize Profile
            <div className="absolute inset-0 rounded-full ring-4 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all w-full h-full" />
          </button>
        </Link>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-4xl w-full border-t border-white/10 pt-12">
          {[
            { icon: Search, label: "Search", desc: "Browse curated listings" },
            { icon: CheckCircle2, label: "Connect", desc: "Verified messaging" },
            { icon: MapPin, label: "Tour", desc: "Smart scheduling" },
            { icon: Home, label: "Live", desc: "Digital lease & rent" },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white/10 group-hover:text-emerald-500 transition-colors">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-300">{step.label}</span>
              <span className="text-[10px] text-slate-500 uppercase">{step.desc}</span>
            </div>
          ))}
        </div>

        <footer className="absolute bottom-6 text-[10px] text-slate-700 tracking-widest uppercase">
          © 2026 iReside Inc. All Rights Reserved.
        </footer>
      </section>

    </div>
  );
}
