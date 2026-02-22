"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    MapPin,
    Building,
    Calendar,
    ChevronRight,
    ArrowRight,
    Loader2,
    Handshake,
    FileEdit,
    CheckSquare,
    Square,
    Upload,
    Send,
    MessageSquare,
    Bell,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { properties } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = typeof params.id === 'string' ? params.id : 'APP-8920';

    // Progress state for the radial animation
    const [progress, setProgress] = useState(0);
    const targetProgress = 65;

    useEffect(() => {
        const timer = setTimeout(() => setProgress(targetProgress), 500);
        return () => clearTimeout(timer);
    }, []);

    // Find property details (fallback)
    const property = properties.find(p => p.id === params.id) || properties[0];

    // Chat state
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([
        { role: "manager", text: "Hi Alex, thanks for submitting the application so quickly.", time: "10:00 AM" },
        { role: "manager", text: "I'm just reviewing your credit report now. I might need one more paystub from September if you have it handy?", time: "10:02 AM" },
        { role: "user", text: "Sure thing, Sarah. I'll upload that in the next hour.", time: "10:15 AM" }
    ]);

    const handleSendMessage = () => {
        if (!message.trim()) return;
        setChat([...chat, { role: "user", text: message, time: "Just now" }]);
        setMessage("");
    };

    const timelineSteps = [
        { id: 1, label: "Submitted", date: "Oct 10, 2:30 PM", status: "completed", icon: Check },
        { id: 2, label: "Background Check", date: "Oct 12, 9:15 AM", status: "completed", icon: Check },
        { id: 3, label: "Landlord Review", date: "In Progress", status: "active", icon: Loader2 },
        { id: 4, label: "Negotiation", date: "Pending", status: "pending", icon: Handshake },
        { id: 5, label: "Final Signing", date: "Pending", status: "pending", icon: FileEdit },
    ];

    const nextSteps = [
        { label: "Submit Application Form", completed: true },
        { label: "Sign Disclosure Form", completed: true },
        { label: "Provide 2023 Tax Return", completed: false, action: "Upload" },
    ];

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-hidden">
            {/* Header Area - Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-2">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Link href="/tenant/applications" className="text-primary hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/10">
                            Application Pending
                        </span>
                        <span className="text-white/30 text-[10px] font-medium">ID: #{applicationId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                            Unit {property.id}02, {property.name}
                        </h1>
                        <p className="text-white/40 text-xs flex items-center gap-1.5 font-medium bg-white/5 px-2 py-1 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {property.address}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xl group">
                        <Download className="w-4 h-4 text-primary group-hover:scale-110" />
                        Support Docs
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 text-white/50 hover:text-red-400 text-xs font-bold transition-all">
                        Withdraw
                    </button>
                </div>
            </div>

            {/* Dashboard Grid - Filling Space */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

                {/* Left Column: Property Preview (4 cols) */}
                <div className="lg:col-span-4 h-full">
                    <div className="bg-card border border-neutral-800 rounded-3xl overflow-hidden h-full flex flex-col shadow-2xl">
                        <div className="relative h-1/3 lg:min-h-[220px] w-full group overflow-hidden shrink-0">
                            <Image
                                src={property.images[0]}
                                alt={property.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                            <div className="absolute bottom-5 left-5">
                                <h3 className="text-xl font-bold text-white tracking-tight">{property.name}</h3>
                                <p className="text-primary text-[10px] font-black uppercase tracking-widest">Luxury Collection</p>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col justify-between flex-1 min-h-0">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Rent", val: `${property.price}`, sub: "/mo" },
                                    { label: "Move-in", val: "Oct 1st" },
                                    { label: "Term", val: "12 Mo" },
                                    { label: "Deposit", val: `${property.price}` },
                                ].map((item, i) => (
                                    <div key={i} className="bg-neutral-900/50 rounded-2xl p-3 border border-white/5">
                                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">{item.label}</p>
                                        <p className="text-white font-black text-lg tracking-tight">
                                            {item.val}
                                            {item.sub && <span className="text-[10px] font-medium text-white/50 ml-0.5">{item.sub}</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3 opacity-40">Amenities included</h4>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities.slice(0, 5).map((amenity, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/70 border border-white/5">
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <Link href={`/search`} className="mt-4 p-4 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-2xl text-[10px] text-primary transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest group">
                                View Full Listing
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Column: Progress Tracker (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                    {/* Main Status Card */}
                    <div className="bg-card border border-neutral-800 rounded-3xl p-6 relative overflow-hidden group shadow-2xl flex-1 flex flex-col items-center justify-center">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(109,152,56,0.06)_0%,transparent_70%)] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-40 h-40 md:w-52 md:h-52 mb-6 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="none" r={radius} stroke="#1a1a1a" strokeWidth="4" />
                                    <motion.circle
                                        cx="50" cy="50" fill="none" r={radius}
                                        stroke="#6d9838"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: offset }}
                                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                                        strokeLinecap="round" strokeWidth="4"
                                        className="drop-shadow-[0_0_15px_rgba(109,152,56,0.2)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-5xl md:text-6xl font-black text-white tracking-tighter"
                                    >
                                        {progress}%
                                    </motion.span>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Complete</span>
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tighter">Landlord Review in Progress</h2>
                            <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed font-medium">
                                Your application is being reviewed. Expected update within <span className="text-primary font-bold">24 hours</span>.
                            </p>
                        </div>
                    </div>

                    {/* Timeline Stages - Compact */}
                    <div className="bg-card border border-neutral-800 rounded-3xl p-6 shadow-2xl shrink-0">
                        <div className="relative">
                            <div className="absolute top-[17px] left-0 right-0 h-0.5 bg-neutral-900 hidden lg:block" />

                            <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-4 relative px-2">
                                {timelineSteps.map((step, i) => (
                                    <div key={step.id} className="flex lg:flex-col items-center gap-4 lg:gap-0 lg:text-center relative group lg:flex-1">
                                        {i > 0 && timelineSteps[i - 1].status === 'completed' && (
                                            <div className="absolute top-[17px] right-[50%] w-full h-0.5 bg-primary/30 hidden lg:block -z-10 translate-x-[-50%]" />
                                        )}

                                        <div className={cn(
                                            "relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                                            step.status === 'completed' ? "bg-primary/20 border border-primary text-primary" :
                                                step.status === 'active' ? "bg-primary text-black shadow-lg shadow-primary/40 animate-pulse" :
                                                    "bg-neutral-900 border border-white/5 text-white/20"
                                        )}>
                                            <step.icon className={cn("w-4 h-4", step.status === 'active' && "animate-spin-slow")} />
                                        </div>

                                        <div className="lg:mt-3">
                                            <p className={cn(
                                                "font-bold text-xs tracking-tight",
                                                step.status === 'active' ? "text-primary" :
                                                    step.status === 'completed' ? "text-white" : "text-white/20"
                                            )}>
                                                {step.label}
                                            </p>
                                            <p className="text-[9px] uppercase font-black tracking-tighter mt-0.5 text-white/30 truncate max-w-[80px]">
                                                {step.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
