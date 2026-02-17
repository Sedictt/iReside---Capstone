"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Bell,
    Search,
    Download,
    ChevronRight,
    Shield,
    Zap,
    LayoutDashboard,
    FileText,
    CreditCard,
    User
} from 'lucide-react';
import { Playfair_Display, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

// Fonts
const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export default function TenantProfilePage() {
    const [activeTab, setActiveTab] = useState('Profile');

    return (
        <div className={cn("min-h-screen bg-[#050505] text-white", inter.className)}>

            {/* Navbar */}
            <nav className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 bg-blue-600 rounded-sm"></div>
                            <span className="font-bold text-lg tracking-tight">iReside</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                            {['Dashboard', 'Leases', 'Payments', 'Profile'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setActiveTab(item)}
                                    className={cn(
                                        "hover:text-white transition-colors relative py-5",
                                        activeTab === item && "text-white after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-500"
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                            <Link
                                href="/tenant/dashboard/ai-concierge"
                                className="hover:text-white transition-colors relative py-5"
                            >
                                Concierge
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-[#121212] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                            />
                        </div>
                        <button className="text-slate-400 hover:text-white transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[1px]">
                            <div className="h-full w-full rounded-full overflow-hidden relative border-2 border-[#050505]">
                                <Image
                                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">

                {/* Hero Section */}
                <section className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src="https://images.unsplash.com/photo-1512918580421-b2feee3b85a6?q=80&w=2000&auto=format&fit=crop"
                            alt="Penthouse"
                            fill
                            className="object-cover opacity-40 hover:scale-105 transition-transform duration-[20s]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                    </div>

                    <div className="relative h-full flex flex-col justify-end p-10 md:p-14 z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Active Residency</span>
                        </div>

                        <h1 className={cn("text-6xl md:text-7xl text-white mb-2 leading-tight", playfair.className)}>
                            Skyline Loft
                        </h1>
                        <p className={cn("text-2xl md:text-3xl text-slate-300 italic font-light mb-12", playfair.className)}>
                            Unit 402, Towers
                        </p>

                        <div className="flex gap-16 border-t border-white/10 pt-8">
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Lease Period</p>
                                <p className="text-white font-medium">Jan 24 — Jan 25</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Investment</p>
                                <p className="text-white font-medium">₱2,450.00 <span className="text-slate-500 text-sm font-normal">/ mo</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Days Remaining</p>
                                <p className="text-white font-medium italic">182 Days</p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Sidebar */}
                    <aside className="lg:col-span-3 space-y-8">
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div className="relative h-32 w-32 mb-6">
                                <div className="absolute inset-0 rounded-full border border-white/10"></div>
                                <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-[#050505] shadow-2xl">
                                    <Image
                                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
                                        alt="Alex Thompson"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 border-2 border-[#050505] rounded-full"></div>
                            </div>

                            <h2 className={cn("text-3xl text-white mb-1", playfair.className)}>Alex Thompson</h2>
                            <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase mb-8">ID : IR-992034</p>

                            <div className="w-full h-px bg-white/10 mb-8"></div>

                            <div className="space-y-6 w-full">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Verified Member</p>
                                    <p className={cn("text-white text-lg italic", playfair.className)}>Since 2021</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Primary Contact</p>
                                    <p className="text-white">alex.t@example.com</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-1">Phone</p>
                                    <p className="text-white">+1 555 0123 4567</p>
                                </div>
                            </div>

                            <button className="mt-8 w-full py-3 rounded-full border border-white/20 text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-all uppercase">
                                Edit Portfolio
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-16">

                        {/* Journey History */}
                        <section>
                            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                                <h3 className={cn("text-4xl text-white", playfair.className)}>Journey History</h3>
                                <a href="#" className="text-[10px] font-bold tracking-widest text-slate-500 hover:text-white uppercase transition-colors">Archive of residencies</a>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Card 1 */}
                                <div className="group relative bg-[#121212] border border-white/5 rounded-sm p-8 hover:border-white/10 transition-colors overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 transform group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                        <LayoutDashboard className="h-48 w-48 text-white" />
                                    </div>
                                    <p className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-3">Entry: 2022</p>
                                    <h4 className={cn("text-2xl text-white mb-1", playfair.className)}>The Kensington #310</h4>
                                    <p className={cn("text-slate-500 italic text-sm mb-12", playfair.className)}>Los Angeles, CA</p>

                                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                        <span className="text-lg font-medium text-white">₱2,100 <span className="text-sm text-slate-500 font-normal">/ mo</span></span>
                                        <button className="text-slate-500 hover:text-white transition-colors">
                                            <Download className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="group relative bg-[#121212] border border-white/5 rounded-sm p-8 hover:border-white/10 transition-colors overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 transform group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                        <CreditCard className="h-48 w-48 text-white" />
                                    </div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Entry: 2021</p>
                                    <h4 className={cn("text-2xl text-white mb-1", playfair.className)}>Sunset Lofts #12</h4>
                                    <p className={cn("text-slate-500 italic text-sm mb-12", playfair.className)}>Santa Monica, CA</p>

                                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                        <span className="text-lg font-medium text-white">₱1,850 <span className="text-sm text-slate-500 font-normal">/ mo</span></span>
                                        <button className="text-slate-500 hover:text-white transition-colors">
                                            <Download className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </section>


                        {/* Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                            {/* Security */}
                            <section>
                                <h3 className={cn("text-3xl text-white mb-2", playfair.className)}>Security</h3>
                                <p className={cn("text-slate-500 italic text-sm mb-8", playfair.className)}>Protecting your private portfolio.</p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Current Password</label>
                                        <input type="password" value="............" readOnly className="w-full bg-transparent border-b border-white/10 py-2 text-white text-lg tracking-widest focus:outline-none focus:border-white/30 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">New Password</label>
                                        <input type="password" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-white/30 transition-colors" />
                                    </div>

                                    <button className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-blue-900/20">
                                        Update Signature
                                    </button>
                                </div>
                            </section>

                            {/* Signal */}
                            <section>
                                <h3 className={cn("text-3xl text-white mb-2", playfair.className)}>Signal</h3>
                                <p className={cn("text-slate-500 italic text-sm mb-8", playfair.className)}>How you receive residency news.</p>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Rent Reminders</span>
                                        <div className="h-4 w-8 rounded-full bg-white/10 relative transition-colors">
                                            <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-white/50"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Maintenance Signals</span>
                                        <div className="h-4 w-8 rounded-full bg-blue-500/20 relative transition-colors">
                                            <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500 shadow-custom-blue"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Curated Offers</span>
                                        <div className="h-4 w-8 rounded-full bg-white/10 relative transition-colors">
                                            <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-white/50"></div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>

                    </div>
                </div>

            </main>

            <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #2a2a2a;
        }
        .shadow-custom-blue {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
        </div>
    );
}
