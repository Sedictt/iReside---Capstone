"use client";

import React from 'react';
import Image from 'next/image';
import {
    Building2,
    MapPin,
    Mail,
    Phone,
    Calendar,
    Award,
    TrendingUp,
    Users,
    Home,
    Star,
    Edit2,
} from 'lucide-react';
import { Playfair_Display, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export default function LandlordProfilePage() {
    return (
        <div className={cn("min-h-screen bg-[#0f172a] text-white", inter.className)}>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

                {/* Hero Section */}
                <section className="relative w-full h-[300px] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                    <div className="absolute inset-0">
                        <Image
                            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop"
                            alt="Property Management"
                            fill
                            className="object-cover opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
                    </div>

                    <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Verified Landlord</span>
                        </div>

                        <h1 className={cn("text-5xl md:text-6xl text-white mb-2 leading-tight", playfair.className)}>
                            Elite Property Management Group
                        </h1>
                        <p className={cn("text-xl md:text-2xl text-slate-300 italic font-light", playfair.className)}>
                            Managing Premium Spaces Since 2015
                        </p>
                    </div>
                </section>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative h-32 w-32 mb-4">
                                    <div className="absolute inset-0 rounded-full border border-white/10"></div>
                                    <div className="absolute inset-2 rounded-full overflow-hidden bg-white p-3 shadow-2xl flex items-center justify-center">
                                        <Building2 className="h-16 w-16 text-blue-600" />
                                    </div>
                                    <div className="absolute top-2 right-2 h-5 w-5 bg-emerald-500 border-2 border-[#1e293b] rounded-full flex items-center justify-center">
                                        <Award className="h-3 w-3 text-white" />
                                    </div>
                                </div>

                                <h2 className={cn("text-2xl text-white mb-1", playfair.className)}>Elite Property Group</h2>
                                <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase mb-4">ID : EPG-99291</p>
                            </div>

                            <div className="w-full h-px bg-white/10 mb-6"></div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Headquarters</p>
                                        <p className="text-sm text-white">123 Business Avenue, Suite 400</p>
                                        <p className="text-sm text-slate-400">Manila, Philippines</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Primary Contact</p>
                                        <p className="text-sm text-white">contact@eliteproperty.ph</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="text-sm text-white">+63 917 123 4567</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
                                        <p className="text-sm text-white">January 2015</p>
                                    </div>
                                </div>
                            </div>

                            <button className="mt-6 w-full py-3 rounded-lg border border-white/20 text-sm font-medium hover:bg-white hover:text-[#0f172a] transition-all flex items-center justify-center gap-2">
                                <Edit2 className="h-4 w-4" />
                                Edit Profile
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Statistics */}
                        <section>
                            <h3 className={cn("text-3xl text-white mb-6 border-b border-white/10 pb-3", playfair.className)}>
                                Portfolio Overview
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-lg bg-blue-500/10 p-2">
                                            <Home className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Properties</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold text-white">24</p>
                                                <span className="text-xs text-emerald-500 font-medium">+2 this year</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-lg bg-purple-500/10 p-2">
                                            <Users className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Active Tenants</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold text-white">148</p>
                                                <span className="text-xs text-emerald-500 font-medium">92% occupancy</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-lg bg-emerald-500/10 p-2">
                                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold text-white">₱450k</p>
                                                <span className="text-xs text-emerald-500 font-medium">+12%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Achievements */}
                        <section>
                            <h3 className={cn("text-3xl text-white mb-6 border-b border-white/10 pb-3", playfair.className)}>
                                Achievements & Recognition
                            </h3>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-amber-500/10 p-3">
                                            <Award className="h-6 w-6 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-white mb-1">Verified Property Manager</h4>
                                            <p className="text-sm text-slate-400 mb-2">
                                                Certified by iReside as a trusted property management partner with excellent tenant satisfaction ratings.
                                            </p>
                                            <p className="text-xs text-slate-500">Awarded: October 2023</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-blue-500/10 p-3">
                                            <Star className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-white mb-1">Excellent Service Rating</h4>
                                            <p className="text-sm text-slate-400 mb-2">
                                                Maintained a 4.8/5.0 average rating across all properties with outstanding tenant reviews.
                                            </p>
                                            <p className="text-xs text-slate-500">Based on 342 reviews</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6 hover:border-white/10 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-lg bg-emerald-500/10 p-3">
                                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-white mb-1">Growth Leader</h4>
                                            <p className="text-sm text-slate-400 mb-2">
                                                Recognized for consistent portfolio growth and professional property management practices.
                                            </p>
                                            <p className="text-xs text-slate-500">8 years of sustained growth</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* About */}
                        <section>
                            <h3 className={cn("text-3xl text-white mb-6 border-b border-white/10 pb-3", playfair.className)}>
                                About
                            </h3>

                            <div className="rounded-xl border border-white/5 bg-[#1e293b] p-6">
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    Elite Property Management Group has been a trusted name in premium property management since 2015.
                                    We specialize in managing high-end residential and commercial properties across Metro Manila,
                                    ensuring exceptional service and satisfaction for both property owners and tenants.
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                    Our commitment to excellence, transparency, and professional property management has earned us
                                    recognition as one of the leading property management firms in the Philippines. We take pride in
                                    maintaining long-term relationships with our clients and providing top-tier living experiences.
                                </p>
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    );
}
