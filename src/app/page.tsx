"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  BarChart3,
  Zap,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Star,
  Heart,
  ArrowRight,
  TrendingUp,
  Map as MapIcon,
  Globe
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { properties } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("All Rentals");
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { name: "All Rentals", icon: Globe },
    { name: "Apartments", icon: Building2 },
    { name: "Family Homes", icon: House },
    { name: "Bedspaces", icon: Users },
    { name: "Condos", icon: Zap },
    { name: "Budget Friendly", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">

      {/* Navigation */}
      <nav className="fixed top-0 z-[100] w-full px-6 py-5 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
            <div className="h-4 w-4 bg-black rounded-sm" />
          </div>
          iRESIDE
        </div>

        <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
          <Link href="/search" className="hover:opacity-100 transition-opacity">Find Homes</Link>
          <Link href="/login" className="hover:opacity-100 transition-opacity">For Landlords</Link>
          <Link href="#" className="hover:opacity-100 transition-opacity">iRis AI</Link>
          <Link href="#" className="hover:opacity-100 transition-opacity">About</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors">Log In</Link>
          <Link href="/search" className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-white/90 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section - Klook Style */}
      <section className="relative h-[95vh] w-full flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop"
            alt="Luxury Penthouse"
            fill
            className="object-cover opacity-60 scale-105 animate-[slow-zoom_20s_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black tracking-[0.3em] uppercase mb-6">
              <Sparkles className="h-3 w-3 text-amber-400" /> Hassle-Free Renting
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              FIND YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-primary">NEXT HOME.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Looking for a bedspace, apartment, or a budget-friendly home? iReside is here to make your rental journey fast and easy.
            </p>
          </motion.div>

          {/* Search Dock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center gap-2">
              {/* Location Input */}
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/5 transition-colors group rounded-l-[2rem]">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="text-left w-full">
                  <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Location</p>
                  <input
                    type="text"
                    placeholder="Where do you want to live?"
                    className="bg-transparent border-none text-white placeholder-slate-400 focus:outline-none w-full font-bold text-sm"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/5 transition-colors group">
                <House className="h-5 w-5 text-primary" />
                <div className="text-left w-full">
                  <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Property Type</p>
                  <select className="bg-transparent border-none text-white focus:outline-none w-full font-bold text-sm appearance-none cursor-pointer">
                    <option className="bg-neutral-900">Any Type</option>
                    <option className="bg-neutral-900">Apartments</option>
                    <option className="bg-neutral-900">Bedspaces</option>
                    <option className="bg-neutral-900">Houses for Rent</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors group mr-2">
                <Wallet className="h-5 w-5 text-primary" />
                <div className="text-left w-full">
                  <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Price Range</p>
                  <p className="font-bold text-sm text-white">Any Budget</p>
                </div>
              </div>

              {/* Search Button */}
              <Link
                href="/search"
                className="w-full md:w-[200px] h-14 md:h-16 flex items-center justify-center gap-3 bg-white text-black rounded-full md:rounded-[1.8rem] font-black text-xs tracking-widest uppercase hover:bg-primary hover:text-white transition-all duration-300 group"
              >
                <Search className="h-4 w-4 transition-transform group-hover:scale-125" />
                Search
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Icons for Aesthetic */}
        <div className="absolute bottom-10 left-10 hidden xl:flex flex-col gap-6 opacity-40">
          <Link href="#" className="h-12 w-12 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <TrendingUp className="h-5 w-5" />
          </Link>
          <Link href="#" className="h-12 w-12 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <MapIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 bg-black overflow-x-auto whitespace-nowrap flex justify-center items-center gap-4 px-6 no-scrollbar border-b border-white/5">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={cn(
              "flex flex-col items-center gap-3 px-6 py-4 rounded-[2rem] transition-all group",
              activeCategory === cat.name ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
            )}
          >
            <div className={cn(
              "p-4 rounded-full border transition-all",
              activeCategory === cat.name ? "bg-primary border-primary text-white scale-110" : "bg-neutral-900 border-white/10 text-slate-500 group-hover:border-white/30"
            )}>
              <cat.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase">{cat.name}</span>
          </button>
        ))}
      </section>

      {/* Featured Collections */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <Star className="h-3 w-3 fill-current" /> Popular Right Now
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">GREAT RENTAL <span className="text-slate-600">FINDS.</span></h2>
          </div>
          <Link href="/search" className="flex items-center gap-3 text-xs font-black tracking-widest uppercase text-slate-500 hover:text-primary transition-colors group">
            View All <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.filter(p => p.featured).map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <PropertyCard
                property={property}
                isLiked={!!isLiked[property.id]}
                onLike={() => toggleLike(property.id)}
                onClick={() => { }} // Handle redirection if needed
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lifestyle Banners */}
      <section className="py-24 bg-neutral-950">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-8">
          <div className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-white/5">
            <Image
              src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=2600&auto=format&fit=crop"
              alt="City Living"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <h3 className="text-4xl font-black tracking-tighter mb-4">Near <br />Work.</h3>
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-8">Convenient stays near transport hubs and CBDs</p>
              <button className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-primary hover:text-white transition-all group/btn">
                <ArrowRight className="h-6 w-6 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="group relative h-[500px] rounded-[3rem] overflow-hidden cursor-pointer border border-white/5">
            <Image
              src="https://images.unsplash.com/photo-1449156001935-d2863fb72690?q=80&w=2600&auto=format&fit=crop"
              alt="Quiet Retreat"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <h3 className="text-4xl font-black tracking-tighter mb-4">Budget <br />Friendly.</h3>
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-8">Affordable rentals for you and your family</p>
              <button className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-primary hover:text-white transition-all group/btn">
                <ArrowRight className="h-6 w-6 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* iRis AI Assistant Canvas */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[160px] opacity-50" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block p-1 rounded-3xl bg-gradient-to-tr from-primary/20 via-white/10 to-blue-500/20 mb-12"
          >
            <div className="px-10 py-16 rounded-[2.5rem] bg-black/40 backdrop-blur-2xl border border-white/10">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(62,123,57,0.4)]">
                <Sparkles className="h-10 w-10 text-white animate-pulse" />
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 underline decoration-primary/40 underline-offset-8">MEET iRIS.</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                iRis has got your back! She&apos;ll help you find the right place and make talking to your landlord a breeze whenever you need something.
              </p>

              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Easy Search</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">24/7 Support</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Fast Process</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Landlord CTA - Final Pitch */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto rounded-[4rem] overflow-hidden bg-white text-black flex flex-col lg:flex-row">
          <div className="flex-1 p-12 md:p-20">
            <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase mb-8 opacity-40">For Landlords</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8">HAVE A PROPERTY <br /><span className="text-primary italic">TO RENT OUT?</span></h2>
            <p className="text-lg font-medium text-black/60 mb-12 max-w-md">
              Managing your properties is now easier! Track rents, check analytics, and communicate with your tenants seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="px-10 py-5 rounded-full bg-black text-white text-xs font-black tracking-widest uppercase hover:bg-primary transition-all text-center">
                Start Now
              </Link>
              <Link href="#" className="px-10 py-5 rounded-full border border-black/10 text-xs font-black tracking-widest uppercase hover:bg-black/5 transition-all text-center">
                View Features
              </Link>
            </div>
          </div>
          <div className="flex-1 min-h-[400px] relative">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop"
              alt="Modern Workspace"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-20 border-t border-white/5 opacity-40 hover:opacity-100 transition-all duration-700">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
          <div className="flex items-center gap-3 font-black text-xl tracking-tighter">
            <div className="h-6 w-6 rounded bg-white flex items-center justify-center">
              <div className="h-3 w-3 bg-black rounded-sm" />
            </div>
            iRESIDE
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black tracking-[0.3em] uppercase">
            <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-primary transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-primary transition-colors">Legal</Link>
          </div>

          <p className="text-[9px] font-black tracking-widest uppercase">© 2026 iReside Co. Built for a better future.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes slow-zoom {
          from { transform: scale(1.05); }
          to { transform: scale(1.15); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
}
