"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Building2,
    MapPin,
    Home,
    Image as ImageIcon,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Camera,
    Upload,
    Check,
    Grid,
    Trees,
    FileText,
    ClipboardList,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartContractBuilderModal } from "@/components/landlord/properties/SmartContractBuilderModal";

type Step = 1 | 2 | 3 | 4;

export default function NewAssetPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContractBuilderOpen, setIsContractBuilderOpen] = useState(false);
    const [isContractGenerated, setIsContractGenerated] = useState(false);
    const [customAmenity, setCustomAmenity] = useState("");
    const [customAmenities, setCustomAmenities] = useState<string[]>([]);

    const handleAddCustomAmenity = () => {
        const value = customAmenity.trim();
        if (!value) return;

        const alreadyExists = customAmenities.some(
            (amenity) => amenity.toLowerCase() === value.toLowerCase()
        );
        if (!alreadyExists) {
            setCustomAmenities((prev) => [...prev, value]);
        }
        setCustomAmenity("");
    };

    const handleNext = () => {
        if (step < 4) setStep((s) => (s + 1) as Step);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep((s) => (s - 1) as Step);
        else router.push("/landlord/properties");
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            router.push("/landlord/properties");
        }, 1500);
    };

    const STEPS = [
        { id: 1, label: "Details", icon: Building2 },
        { id: 2, label: "Units", icon: Grid },
        { id: 3, label: "Media & Docs", icon: ImageIcon },
        { id: 4, label: "Review", icon: CheckCircle2 }
    ];

    return (
        <div className="min-h-screen pb-20 relative selection:bg-primary/30">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute top-[30%] left-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-in fade-in duration-700">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {step === 1 ? "Cancel" : "Go Back"}
                    </button>
                    <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        Asset Creation Wizard
                    </div>
                </div>

                {/* Wizard Container */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Top Progress Tracker */}
                    <div className="p-8 border-b border-white/5 relative overflow-hidden bg-white/[0.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">Onboard New Asset</h1>
                                <p className="text-neutral-400">Add a new property to your portfolio in 4 simple steps.</p>
                            </div>

                            {/* Circular Progress (Visual only) */}
                            <div className="flex gap-2">
                                {STEPS.map((s) => (
                                    <div key={s.id} className="relative group cursor-default">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border relative overflow-hidden",
                                            step === s.id
                                                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-110"
                                                : step > s.id
                                                    ? "bg-primary/20 text-primary border-primary/30"
                                                    : "bg-white/5 text-neutral-600 border-white/5"
                                        )}>
                                            {step > s.id ? <Check className="w-5 h-5 absolute inset-0 m-auto animate-in zoom-in" /> : <s.icon className={cn("w-5 h-5 transition-transform", step === s.id && "scale-110")} />}

                                            {/* Glow effect for active step */}
                                            {step === s.id && (
                                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/20 blur-md pointer-events-none" />
                                            )}
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-semibold text-neutral-300 pointer-events-none">
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className={cn("p-8 sm:p-12", step === 2 ? "min-h-[260px]" : "min-h-[400px]")}>
                        {/* 1. Details */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Basic Information</h2>
                                    <p className="text-sm text-neutral-400">Enter the essential details about the property.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Property Name</label>
                                        <input type="text" placeholder="e.g. Grand View Residences" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Property Type</label>
                                            <select className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer">
                                                <option>Apartment Complex</option>
                                                <option>Condominium</option>
                                                <option>Single Family Home</option>
                                                <option>Townhouse</option>
                                                <option>Commercial Space</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Year Built</label>
                                            <input type="number" placeholder="e.g. 2018" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Full Address</label>
                                        <div className="relative">
                                            <textarea rows={3} placeholder="123 Skyline Avenue, Metro Manila..." className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium resize-none shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Units */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Unit Configuration</h2>
                                    <p className="text-sm text-neutral-400">Define the composition and layout of the asset.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                                                <Home className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Total Units</p>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" defaultValue="1" min="1" className="w-20 bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-white/20 focus:border-primary transition-colors pb-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                                                <Grid className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Floor Count</p>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" defaultValue="1" min="1" className="w-20 bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-white/20 focus:border-blue-400 transition-colors pb-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Media */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Media & Documents</h2>
                                    <p className="text-sm text-neutral-400">Add photos, highlight amenities, and upload essential asset documents.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Camera className="w-4 h-4" /> Cover Photo</label>
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="mb-2 text-sm text-neutral-300"><span className="font-semibold text-white">Click to upload</span> high-res image</p>
                                            <p className="text-xs text-neutral-500 font-medium">Must be at least 1200x800px</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" />
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Trees className="w-4 h-4" /> Key Amenities</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['PWD Friendly', 'Gym Facility', '24/7 Security', 'Parking', 'Coworking Space', 'Pet Friendly', 'Roof Deck', 'Lobby Lounge'].map((amenity, i) => (
                                            <button key={i} type="button" className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-neutral-300 hover:text-white hover:border-primary hover:bg-primary/10 transition-all focus:bg-primary focus:text-black focus:border-primary">
                                                {amenity}
                                            </button>
                                        ))}
                                        {customAmenities.map((amenity, i) => (
                                            <span key={`${amenity}-${i}`} className="px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-sm font-medium text-primary">
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <input
                                            type="text"
                                            value={customAmenity}
                                            onChange={(e) => setCustomAmenity(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddCustomAmenity();
                                                }
                                            }}
                                            placeholder="Add custom amenity (e.g. EV Charging Station)"
                                            className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomAmenity}
                                            className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-4 h-4" /> Legal Documents</label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Upload Existing File</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, DOC, DOCX</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple />
                                        </label>

                                        <div
                                            onClick={() => setIsContractBuilderOpen(true)}
                                            className="flex flex-col items-center justify-center w-full h-32 border border-primary/20 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all group overflow-hidden relative"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
                                            <div className="flex flex-col items-center justify-center relative z-10 w-full">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary transition-all group-hover:scale-110 relative">
                                                    <ClipboardList className="w-4 h-4" />
                                                    {isContractGenerated && (
                                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-black flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-black" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mb-1 text-sm text-primary font-bold">Smart Contract Builder</p>
                                                {isContractGenerated ? (
                                                    <p className="text-xs text-emerald-400 font-bold text-center px-4 bg-emerald-500/10 py-1 rounded-full border border-emerald-500/20">
                                                        Standard Lease Configured
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-primary/70 font-medium text-center px-4">Interactive form to construct your lease easily</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Verification Documents</label>
                                    <p className="text-xs text-neutral-500 font-medium">Please provide your building and business permits for admin verification before publishing.</p>

                                    <div className="grid grid-cols-3 gap-4">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Building Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>

                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Business Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>

                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Occupancy Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Review */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.2)] mb-2 inline-flex relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
                                    <Building2 className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">Submit for Verification</h2>
                                    <p className="text-neutral-400 max-w-md mx-auto">
                                        Your asset profile is complete. Once submitted, our admins will verify your business and building permits before your asset goes live and is ready for tenant onboarding.
                                    </p>
                                </div>

                                <div className="w-full max-w-sm bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-sm text-neutral-400">Name</span>
                                        <span className="font-semibold text-white">Grand View Residences</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-sm text-neutral-400">Units</span>
                                        <span className="font-semibold text-white">45 Units</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-400">Status</span>
                                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">Pending Admin Verification</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-6 sm:px-12 sm:py-8 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className={cn(
                                "px-6 py-3 rounded-xl font-bold transition-all text-sm sm:text-base",
                                step === 1 ? "opacity-0 pointer-events-none" : "text-white hover:bg-white/10"
                            )}
                        >
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className={cn(
                                "px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center gap-2 hover:scale-105",
                                step === 4 ? "bg-amber-500 hover:bg-amber-500/90 text-black shadow-[rgba(245,158,11,0.3)] hover:shadow-[rgba(245,158,11,0.5)]" : "bg-primary hover:bg-primary/90 text-black"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : step === 4 ? (
                                <>Submit for Verification <CheckCircle2 className="w-4 h-4" /></>
                            ) : (
                                <>Next Step <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <SmartContractBuilderModal
                isOpen={isContractBuilderOpen}
                onClose={() => setIsContractBuilderOpen(false)}
                onSave={() => setIsContractGenerated(true)}
            />
        </div>
    );
}
