"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ChevronRight,
    ChevronLeft,
    User,
    Briefcase,
    FileText,
    ShieldCheck,
    Upload,
    CheckCircle2,
    Info,
    Calendar,
    MapPin,
    Home,
    ArrowRight,
    Sparkles,
    Shield,
    Lock,
    Zap,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { properties, Property } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import PropertyDetailModal from "@/components/PropertyDetailModal";

export default function RentApplicationPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;
    const property = properties.find((p) => p.id === propertyId) || properties[0];

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "Jane",
        lastName: "Cooper",
        email: "jane.cooper@example.com",
        phone: "+63 912 345 6789",
        currentAddress: "123 Maple Street, Quezon City",
        occupation: "Senior UX Designer",
        employer: "Creative Tech Solutions",
        monthlyIncome: "85000",
        moveInDate: "2024-03-15",
        leaseTerm: "12 months",
        unit: "Unit 201 (2nd Floor)",
        notes: "",
    });

    const steps = [
        { id: 1, title: "Personal Details", icon: User, desc: "Your basic identity and contact information" },
        { id: 2, title: "Employment", icon: Briefcase, desc: "Verify your source of income and professional background" },
        { id: 3, title: "Documents", icon: FileText, desc: "Upload necessary proofs for your application" },
        { id: 4, title: "Review & Submit", icon: ShieldCheck, desc: "Final check and official submission" },
    ];

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2500));
        setIsSubmitting(false);
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <div className="min-h-[85vh] relative flex flex-col items-center justify-center p-6 overflow-hidden">
                {/* Background Blobs for Success */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    className="relative z-10 text-center max-w-2xl px-8 py-16 rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl"
                >
                    <motion.div
                        initial={{ rotate: -10, scale: 0.5 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-10"
                    >
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white leading-tight">
                        Application <br /><span className="text-primary italic">Successfully</span> Sent
                    </h1>

                    <p className="text-white/60 text-lg mb-12 leading-relaxed">
                        Excellent Choice! Your application for <span className="text-white font-semibold">{property.name}</span> is now being reviewed by the team. We usually respond within 24 hours.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/tenant/applications"
                            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/5"
                        >
                            <Zap className="h-4 w-4" />
                            Track Progress
                        </Link>
                        <Link
                            href="/search"
                            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center justify-center gap-3 backdrop-blur-md active:scale-95"
                        >
                            Find More Homes
                            <ArrowRight className="h-4 w-4 opacity-50" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            {/* Ambient Animated Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -40, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-4 lg:py-6">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Panel: Context & Navigation */}
                    <div className="w-full lg:w-[380px] space-y-6 flex-shrink-0">
                        {/* Header Section */}
                        <div className="space-y-4">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-colors group"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Return to Listing
                            </button>
                            <h1 className="text-4xl font-extrabold text-white tracking-tighter leading-none">
                                Application <br />
                                <span className="text-primary italic">Process</span>
                            </h1>
                            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                                Complete these steps to secure your future home at {property.name}.
                            </p>
                        </div>

                        {/* Progress Stepper - Refined */}
                        <div className="space-y-3">
                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-500 cursor-default overflow-hidden group",
                                            isActive ? "bg-white/10 border-white/20 shadow-xl shadow-black/20" :
                                                isCompleted ? "bg-primary/5 border-primary/20 opacity-80" :
                                                    "bg-white/[0.02] border-white/5 opacity-40 hover:opacity-60"
                                        )}
                                    >
                                        {/* Background Glow for active */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                                        )}

                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                                            isActive ? "bg-primary text-black scale-105 shadow-[0_0_20px_rgba(109,152,56,0.5)]" :
                                                isCompleted ? "bg-primary/20 text-primary" :
                                                    "bg-white/5 text-white/40"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0">
                                            <p className={cn(
                                                "text-sm font-bold transition-colors leading-tight",
                                                isActive ? "text-white" : "text-white/60"
                                            )}>
                                                {step.title}
                                            </p>
                                            <p className="text-[10px] text-white/40 mt-1 truncate max-w-[180px]">
                                                {isActive ? "Currently editing" : step.desc}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(109,152,56,1)]"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Property Snapshot */}
                        <div
                            onClick={() => setIsDetailsModalOpen(true)}
                            className="rounded-[2.5rem] bg-card/60 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl group cursor-pointer hover:border-primary/50 transition-all"
                        >
                            <div className="relative h-32 overflow-hidden">
                                <Image
                                    src={property.images[0]}
                                    alt={property.name}
                                    fill
                                    className="object-cover grayscale-[0.2] transition-transform duration-1000 group-hover:scale-110 group-hover:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    <div className="bg-primary/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-2 shadow-lg">
                                        AVAILABLE NOW
                                    </div>
                                    <h3 className="text-xl font-extrabold text-white truncate">{property.name}</h3>
                                    <p className="text-xs text-white/70 flex items-center gap-1.5 mt-1">
                                        <MapPin className="h-3 w-3" />
                                        {property.address}
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-none">Monthly Rent</p>
                                    <p className="text-lg font-black text-white">{property.price}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-none">Refundable</p>
                                    <p className="text-lg font-black text-primary">₱25K</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Flow Panel */}
                    <div className="flex-1">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-white/10 rounded-[3.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]"
                        >
                            {/* Decorative Background Icons */}
                            <div className="absolute -top-10 -right-10 opacity-[0.03] select-none">
                                {(() => {
                                    const Icon = steps[currentStep - 1].icon;
                                    return <Icon className="h-80 w-80 rotate-12" />;
                                })()}
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                <header className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                            {(() => {
                                                const Icon = steps[currentStep - 1].icon;
                                                return <Icon className="h-5 w-5" />;
                                            })()}
                                        </div>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Step {currentStep} of 4</span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                                        {currentStep === 1 && "Personal Identity"}
                                        {currentStep === 2 && "Career & Finance"}
                                        {currentStep === 3 && "Verification Vault"}
                                        {currentStep === 4 && "Final Proclamation"}
                                    </h2>
                                    <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
                                        {steps[currentStep - 1].desc}. Accuracy in this section accelerates the landlord approval window.
                                    </p>
                                </header>

                                {/* Form Content */}
                                <div className="space-y-6 flex-1">
                                    {currentStep === 1 && (
                                        <div className="flex flex-col gap-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField label="First Name" value={formData.firstName} onChange={(v: string) => setFormData({ ...formData, firstName: v })} placeholder="e.g. Jane" />
                                                <FormField label="Last Name" value={formData.lastName} onChange={(v: string) => setFormData({ ...formData, lastName: v })} placeholder="e.g. Cooper" />
                                                <FormField label="Email" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} type="email" placeholder="email@example.com" />
                                                <FormField label="Phone" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} placeholder="+63 900 000 0000" />
                                                <div className="md:col-span-2">
                                                    <FormField label="Desired Move-in" value={formData.moveInDate} onChange={(v: string) => setFormData({ ...formData, moveInDate: v })} type="date" />
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <UnitSelector
                                                    label="Select Your Apartment Residence"
                                                    value={formData.unit}
                                                    onChange={(v: string) => setFormData({ ...formData, unit: v })}
                                                    onSeeMore={() => setIsUnitModalOpen(true)}
                                                    propertyId={propertyId}
                                                    options={PROPERTY_UNITS[propertyId] || PROPERTY_UNITS["1"]}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Modal is now moved to the root level to avoid clipping */}

                                    {currentStep === 2 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="md:col-span-2">
                                                <FormField label="Current Vocation" value={formData.occupation} onChange={(v: string) => setFormData({ ...formData, occupation: v })} placeholder="e.g. Senior Creative Director" />
                                            </div>
                                            <FormField label="Company Name" value={formData.employer} onChange={(v: string) => setFormData({ ...formData, employer: v })} placeholder="e.g. Apple Inc." />
                                            <FormField label="Monthly Gross (₱)" value={formData.monthlyIncome} onChange={(v: string) => setFormData({ ...formData, monthlyIncome: v })} type="number" placeholder="0.00" />

                                            <div className="md:col-span-2 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4 shadow-inner">
                                                <Shield className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-blue-400/90 tracking-tight">Your data is safe with us</p>
                                                    <p className="text-xs text-blue-300/60 leading-relaxed font-medium">
                                                        We value your privacy. Your financial details are kept secure and are only shared with the landlord to process your application.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <UploadCard title="Government ID" desc="Passport or Driver's License" required />
                                            <UploadCard title="Proof of Income" desc="Latest 3 months of Payslips" required />
                                            <UploadCard title="Credit History" desc="TransUnion or CIBI Report" />
                                            <UploadCard title="Personal Logo/Avatar" desc="Optional for profile display" />
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="space-y-8 pb-4">
                                            {/* Summary Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                <SummaryItem label="Applicant" value={`${formData.firstName} ${formData.lastName}`} icon={User} />
                                                <SummaryItem label="Selected Unit" value={formData.unit} icon={Home} />
                                                <SummaryItem label="Planned Move" value={formData.moveInDate} icon={Calendar} />
                                            </div>

                                            {/* Compliance Notice */}
                                            <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 relative group hover:bg-white/[0.05] transition-all">
                                                <div className="flex items-start gap-6">
                                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-lg">
                                                        <Lock className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-white font-bold text-lg">Data Privacy & Consent</h4>
                                                        <p className="text-white/40 text-sm leading-relaxed">
                                                            I hereby declare that all information provided is accurate. I authorize iReside and the management of <span className="text-white font-medium">{property.name}</span> to conduct a standard credit background and employment verification.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-primary/10 border border-primary/20">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 shadow-lg">
                                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Everything looks good!</h4>
                                                    <p className="text-xs text-white/40 font-medium">Your application is complete and ready for the landlord's review.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Navigation */}
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className={cn(
                                            "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 hover:bg-white/5",
                                            currentStep === 1 ? "opacity-0 pointer-events-none" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                        className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary-dark text-black font-extrabold text-base transition-all shadow-[0_10px_30px_rgba(109,152,56,0.3)] flex items-center gap-3 disabled:opacity-50 active:scale-[0.98] relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-5 w-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                {currentStep === 4 ? "Submit Official Application" : "Continue Process"}
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Footer Seals */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-8 opacity-30 group">
                            <Seal icon={ShieldCheck} label="Bank-Level Encryption" />
                            <Seal icon={Lock} label="DPA Compliance" />
                            <Seal icon={Zap} label="Instant Verification" />
                        </div>
                    </div>
                </div>
            </div>

            <UnitSelectionModal
                isOpen={isUnitModalOpen}
                onClose={() => setIsUnitModalOpen(false)}
                value={formData.unit}
                onChange={(v: string) => setFormData({ ...formData, unit: v })}
                options={PROPERTY_UNITS[propertyId] || PROPERTY_UNITS["1"]}
            />

            <PropertyDetailModal
                property={property as Property}
                isLiked={isLiked}
                onLike={() => setIsLiked(!isLiked)}
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
            />
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────

// ── Unit Inventory Data ──────────────────────────────────────────────

const PROPERTY_UNITS: Record<string, any[]> = {
    "1": [ // Skyline Lofts
        { id: "101", name: "Unit 101", floor: "1st Floor", status: "Available", price: "-₱1,500" },
        { id: "201", name: "Unit 201", floor: "2nd Floor", status: "Available", price: "+₱0" },
        { id: "305", name: "Unit 305", floor: "3rd Floor", status: "Available", price: "+₱1,200" },
        { id: "412", name: "Unit 412", floor: "4th Floor", status: "Limited", price: "+₱2,000" },
        { id: "508", name: "Unit 508", floor: "5th Floor", status: "Available", price: "+₱4,500" }
    ],
    "2": [ // The Garden Residences
        { id: "G1", name: "Unit G1", floor: "Ground Floor", status: "Available", price: "+₱0" },
        { id: "G2", name: "Unit G2", floor: "Ground Floor", status: "Limited", price: "+₱500" },
        { id: "T3", name: "Unit T3", floor: "Top Floor", status: "Available", price: "+₱1,000" }
    ],
    "3": [ // Metro Studio B
        { id: "B1", name: "Unit B1", floor: "Basement", status: "Available", price: "+₱0" },
        { id: "B4", name: "Unit B4", floor: "2nd Floor", status: "Available", price: "+₱300" }
    ],
    "4": [ // Lakeside Villa
        { id: "V1", name: "Villa 1", floor: "Main Wing", status: "Available", price: "+₱0" },
        { id: "V3", name: "Villa 3", floor: "East Wing", status: "Limited", price: "+₱2,500" }
    ],
    "5": [ // Downtown Apartment
        { id: "D101", name: "Unit 101", floor: "1st Floor", status: "Available", price: "+₱0" },
        { id: "D105", name: "Unit 105", floor: "1st Floor", status: "Available", price: "+₱800" },
        { id: "D203", name: "Unit 203", floor: "2nd Floor", status: "Available", price: "+₱1,500" }
    ]
};

function UnitSelector({ label, value, onChange, options, onSeeMore, propertyId }: any) {
    const selectedUnit = options.find((opt: any) => value.startsWith(opt.name));
    const isSelected = !!selectedUnit;

    return (
        <div className="group">
            <div className={cn(
                "relative flex items-center p-1 pl-6 rounded-[2rem] border transition-all duration-700 overflow-hidden",
                isSelected
                    ? "bg-white/[0.03] border-primary/30"
                    : "bg-white/[0.02] border-white/5"
            )}>
                {/* Status Indicator removed */}

                <div className="flex items-center gap-6 flex-1 py-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700",
                        isSelected
                            ? "bg-primary text-black rotate-[360deg] shadow-[0_10px_30px_rgba(109,152,56,0.3)]"
                            : "bg-white/5 text-white/10"
                    )}>
                        <Home className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Residence Configuration</p>
                        {isSelected ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-white tracking-tighter">
                                    {selectedUnit.name}
                                </span>
                                <span className="text-xs font-bold text-primary italic">
                                    {selectedUnit.floor}
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-white/20 italic">No residence selected yet...</p>
                        )}
                    </div>
                </div>

                <div className="pr-1 gap-2 flex items-center">
                    {isSelected && (
                        <div className="hidden sm:flex flex-col items-end mr-4">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Pricing Adjust.</p>
                            <p className="text-[10px] font-black text-primary">{selectedUnit.price}</p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onSeeMore}
                        className={cn(
                            "h-14 px-10 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.15em] transition-all relative overflow-hidden group/btn flex items-center gap-3",
                            isSelected
                                ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                                : "bg-primary text-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <span className="relative z-10">{isSelected ? "Change Detail" : "Assign Unit"}</span>
                        {!isSelected && <ArrowRight className="h-4 w-4 relative z-10 animate-bounce-x" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UnitSelectionModal({ isOpen, onClose, value, onChange, options }: any) {
    const floors = Array.from(new Set(options.map((opt: any) => opt.floor)));
    const [selectedFloor, setSelectedFloor] = useState<string>(floors[0] as string);

    useEffect(() => {
        if (isOpen && floors.length > 0 && !selectedFloor) {
            setSelectedFloor(floors[0] as string);
        }
    }, [isOpen, floors, selectedFloor]);

    const filteredOptions = options.filter((opt: any) => opt.floor === selectedFloor);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] overflow-hidden z-[101] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[80vh] md:h-[600px]"
                    >
                        {/* Sidebar Selector */}
                        <div className="w-full md:w-[240px] bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col shrink-0">
                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-8 px-2">Level Gallery</h4>
                            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
                                {floors.map((floor: any) => (
                                    <button
                                        key={floor}
                                        onClick={() => setSelectedFloor(floor)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group/floor",
                                            selectedFloor === floor
                                                ? "bg-primary text-black font-black shadow-[0_10px_20px_rgba(109,152,56,0.3)]"
                                                : "text-white/40 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full transition-all",
                                            selectedFloor === floor ? "bg-black" : "bg-white/10 group-hover/floor:bg-primary"
                                        )} />
                                        <span className="text-xs uppercase tracking-widest">{floor}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <header className="p-8 pb-4 flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tighter">
                                        Unit <span className="text-primary italic">Selection</span>
                                    </h3>
                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                                        Showing Units on <span className="text-white">{selectedFloor}</span>
                                    </p>
                                </div>
                                <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white/40 hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedFloor}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                    >
                                        {filteredOptions.map((opt: any) => {
                                            const isSelected = value.includes(opt.name);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onChange(`${opt.name} (${opt.floor})`);
                                                        onClose();
                                                    }}
                                                    className={cn(
                                                        "relative flex flex-col items-start p-6 rounded-[2.5rem] border transition-all duration-500 text-left group/unit overflow-hidden",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary"
                                                            : "bg-white/[0.01] border-white/5 hover:border-white/20 hover:bg-white/[0.03]"
                                                    )}
                                                >
                                                    <div className="relative z-10 w-full">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="space-y-1">
                                                                <p className={cn("text-xl font-black tracking-tight", isSelected ? "text-primary" : "text-white")}>
                                                                    {opt.name}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter italic">
                                                                    Modern Architecture
                                                                </p>
                                                            </div>
                                                            <span className={cn(
                                                                "text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter",
                                                                opt.status === "Available" ? "bg-primary text-black" : "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                                            )}>
                                                                {opt.status}
                                                            </span>
                                                        </div>
                                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                                <span className="text-[10px] font-black text-white/60 tracking-widest">{opt.price}</span>
                                                            </div>
                                                            <ArrowRight className={cn("h-4 w-4 transition-all duration-500 opacity-0 -translate-x-2 group-hover/unit:opacity-100 group-hover/unit:translate-x-0", isSelected ? "text-primary opacity-100 translate-x-0" : "text-white/20")} />
                                                        </div>
                                                    </div>

                                                    {/* Selection Glow */}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: any) {
    return (
        <div className="group space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 group-focus-within:text-primary transition-colors">
                {label}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/[0.06] transition-all font-bold text-white placeholder:text-white/10 text-sm"
                />
                {/* Accent Line */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent group-focus-within:via-primary/50 transition-all duration-500" />
            </div>
        </div>
    );
}

function UploadCard({ title, desc, required }: any) {
    return (
        <div className="group relative border-2 border-dashed border-white/5 hover:border-primary/50 rounded-3xl p-5 transition-all bg-white/[0.01] cursor-pointer hover:bg-primary/[0.02] flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-black transition-all duration-300 shadow-xl">
                <Upload className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-[10px] text-white/40 mt-0.5 font-medium">{desc}</p>
            {required && (
                <div className="mt-3 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-400 uppercase tracking-tighter">
                    Required Action
                </div>
            )}
        </div>
    );
}

function CheckItem({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">{label}</span>
        </div>
    );
}

function SummaryItem({ label, value, icon: Icon }: any) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2 opacity-50">
                <Icon className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{value}</p>
        </div>
    );
}

function Seal({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </div>
    );
}
