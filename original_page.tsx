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
  Globe,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { properties } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("All Rentals");
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isPropertyTypeOpen, setIsPropertyTypeOpen] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState("Apartments");
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState("₱5,000 - ₱15,000");

  const propertyTypes = ["Any Type", "Apartments", "Bedspaces", "Houses for Rent"];
  const priceRanges = ["Any Budget", "Under ₱5,000", "₱5,000 - ₱15,000", "₱15,000 - ₱30,000", "₱30,000+"];

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
      <div className="fixed top-0 z-[100] w-full flex justify-center pt-6 px-4 md:px-6 transition-all duration-300">
        <nav className="w-full max-w-7xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-between px-4 md:px-6 py-4 shadow-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 font-black text-lg md:text-xl tracking-wide">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="h-3 w-3 bg-white rounded-sm drop-shadow-md" />
            </div>
            iRESIDE
          </Link>

          {/* Desktop Links - Pill Container */}
          <div className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            <Link href="/search" className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">Rent a Home</Link>
            <Link href="/login" className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">List a Property</Link>
            <Link href="#" className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">AI Assistant</Link>
            <Link href="#" className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all">How it Works</Link>
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white transition-colors">Log In</Link>
            <Link href="/search" className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-[88px] left-4 right-4 md:left-6 md:right-6 bg-neutral-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 lg:hidden"
            >
              <Link href="/search" className="p-3 bg-white/5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors">Rent a Home</Link>
              <Link href="/login" className="p-3 bg-white/5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors">List a Property</Link>
              <Link href="#" className="p-3 bg-white/5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors">AI Assistant</Link>
              <Link href="#" className="p-3 bg-white/5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors">How it Works</Link>
              <div className="h-[1px] w-full bg-white/10 my-2" />
              <Link href="/login" className="p-3 text-center text-base font-semibold text-white hover:text-primary transition-colors">Log In</Link>
              <Link href="/search" className="p-3 text-center rounded-xl bg-white text-black text-base font-bold shadow-lg transition-all">
                Get Started
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section - Klook Style */}
      <section className="relative min-h-[90vh] w-full flex flex-col items-center justify-center pt-32 pb-20">
        {/* Cinematic 3-Column Background */}
        <div className="absolute inset-0 grid grid-cols-3 w-full h-full opacity-40 select-none pointer-events-none overflow-hidden">
          {/* Apartment Column */}
          <div className="relative h-full w-full overflow-hidden border-r border-white/5">
            <div className="absolute top-0 w-full flex flex-col animate-[scroll-up_50s_linear_infinite]">
              <div className="relative h-[100vh] w-full"><Image alt="Apartments 1" src="/hero-images/apartment-01.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Apartments 2" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Apartments 3" src="/hero-images/apartment-03.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Apartments 4" src="/hero-images/apartment-01.png" fill className="object-cover" unoptimized /></div>
            </div>
          </div>

          {/* Dorm Column */}
          <div className="relative h-full w-full overflow-hidden border-r border-white/5">
            <div className="absolute top-0 w-full flex flex-col animate-[scroll-down_45s_linear_infinite]">
              <div className="relative h-[100vh] w-full"><Image alt="Dorms 1" src="/hero-images/dorm-01.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Dorms 2" src="/hero-images/dorm-02.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Dorms 3" src="/hero-images/dorm-03.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Dorms 4" src="/hero-images/dorm-01.png" fill className="object-cover" unoptimized /></div>
            </div>
          </div>

          {/* Boarding House Column */}
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute top-0 w-full flex flex-col animate-[scroll-up_55s_linear_infinite]">
              <div className="relative h-[100vh] w-full"><Image alt="Boarding 1" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Boarding 2" src="/hero-images/dorm-03.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Boarding 3" src="/hero-images/apartment-03.png" fill className="object-cover" unoptimized /></div>
              <div className="relative h-[100vh] w-full"><Image alt="Boarding 4" src="/hero-images/apartment-02.png" fill className="object-cover" unoptimized /></div>
            </div>
          </div>
        </div>

        {/* Global Dark Gradient Overlay for perfect text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10 w-full flex flex-col items-center">

          {/* Main Hero Copy Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto mb-12 flex flex-col items-center mt-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-[11px] font-black tracking-[0.25em] text-white uppercase mb-8 shadow-2xl">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>A new standard for renting</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white drop-shadow-2xl">
              RENTING MADE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-primary to-emerald-500 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">EFFORTLESS.</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl text-center shadow-black drop-shadow-md">
              Find your ideal apartment, dorm, or boarding house seamlessly. Connect with verified landlords and manage everything in one place.
            </p>
          </motion.div>

          {/* Search Dock Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-5xl"
          >
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-2">
              {/* Location Input */}
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/10 transition-colors group rounded-[2rem] md:rounded-r-none md:rounded-l-[2rem]">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="text-left w-full">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-emerald-300 transition-colors uppercase">Location</p>
                  <input
                    type="text"
                    placeholder="Where do you want to live?"
                    className="bg-transparent border-none text-white placeholder-slate-500 focus:outline-none w-full font-bold text-sm"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div
                className="flex-1 w-full px-6 py-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/10 transition-colors group rounded-[2rem] md:rounded-none relative cursor-pointer"
                onClick={() => { setIsPropertyTypeOpen(!isPropertyTypeOpen); setIsPriceRangeOpen(false); }}
              >
                <House className="h-5 w-5 text-primary" />
                <div className="text-left w-full relative">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-emerald-300 transition-colors uppercase">Property Type</p>
                  <div className="flex items-center justify-between w-full">
                    <p className="font-bold text-sm text-white">{selectedPropertyType}</p>
                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isPropertyTypeOpen ? "rotate-180" : "")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isPropertyTypeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[110%] left-0 w-full min-w-[200px] bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 text-left"
                    >
                      {propertyTypes.map((type) => (
                        <div
                          key={type}
                          onClick={(e) => { e.stopPropagation(); setSelectedPropertyType(type); setIsPropertyTypeOpen(false); }}
                          className="px-6 py-3.5 hover:bg-white/10 text-white text-sm font-semibold transition-colors cursor-pointer border-b border-white/5 last:border-0"
                        >
                          {type}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range */}
              <div
                className="flex-1 w-full px-6 py-4 flex items-center gap-4 hover:bg-white/10 transition-colors group rounded-[2rem] md:rounded-none mr-2 relative cursor-pointer"
                onClick={() => { setIsPriceRangeOpen(!isPriceRangeOpen); setIsPropertyTypeOpen(false); }}
              >
                <Wallet className="h-5 w-5 text-primary" />
                <div className="text-left w-full relative">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-emerald-300 transition-colors uppercase">Price Range</p>
                  <div className="flex items-center justify-between w-full">
                    <p className="font-bold text-sm text-white">{selectedPriceRange}</p>
                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isPriceRangeOpen ? "rotate-180" : "")} />
                  </div>
                </div>

                <AnimatePresence>
                  {isPriceRangeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[110%] left-0 w-full min-w-[200px] bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 text-left"
                    >
                      {priceRanges.map((range) => (
                        <div
                          key={range}
                          onClick={(e) => { e.stopPropagation(); setSelectedPriceRange(range); setIsPriceRangeOpen(false); }}
                          className="px-6 py-3.5 hover:bg-white/10 text-white text-sm font-semibold transition-colors cursor-pointer border-b border-white/5 last:border-0"
                        >
                          {range}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Button */}
              <Link
                href="/search"
                className="w-full md:w-[200px] h-14 md:h-16 flex items-center justify-center gap-3 bg-white text-black rounded-full md:rounded-[1.8rem] font-black text-xs tracking-widest uppercase hover:bg-primary shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:text-white transition-all duration-300 group"
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
        @keyframes scroll-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        @keyframes scroll-down {
          from { transform: translateY(-50%); }
          to { transform: translateY(0); }
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
