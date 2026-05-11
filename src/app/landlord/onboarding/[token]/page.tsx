"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Eye, 
    EyeOff, 
    CheckCircle2,
    CheckCircle,
    Loader2, 
    Building2, 
    User, 
    Lock,
    ImageIcon,
    Camera,
    ShieldCheck,
    Grid,
    Layers,
    Download,
    Upload,
    Users,
    ArrowRight,
    Zap,
    Settings,
    X,
    FileText,
    Maximize2,
    FilePlus,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { LeaseData } from "@/types/lease";
import { generateLeasePdf } from "@/lib/lease-pdf";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import html2canvas from "html2canvas";
import { LucideIcon } from "lucide-react";

interface OnboardingData {
    email: string;
    fullName: string;
    phone: string;
    propertyName: string;
    propertyAddress: string;
}

type Step = "password" | "property" | "profile" | "complete";

const STEPS: { id: Step; label: string; icon: any }[] = [
    { id: "password", label: "Password", icon: Lock },
    { id: "property", label: "Property", icon: Building2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "complete", label: "Complete", icon: CheckCircle2 },
];

export default function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const { get: searchGet } = useSearchParams();
    const isPreview = searchGet("preview") === "true";
    const [token, setToken] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [currentStep, setCurrentStep] = useState<Step>("password");
    const [data, setData] = useState<OnboardingData | null>(null);
    
    // Form states
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [showLightbox, setShowLightbox] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Property Configuration
    const [propertyPhoto, setPropertyPhoto] = useState<string | null>(null);
    const [totalUnits, setTotalUnits] = useState(1);
    const [totalFloors, setTotalFloors] = useState(1);
    const [headLimit, setHeadLimit] = useState<number | "none">(4);
    const [utilityBilling, setUtilityBilling] = useState<"included_in_rent" | "separate_metered" | "mixed">("included_in_rent");
    const [amenities, setAmenities] = useState<string[]>([]);
    const [baseRent, setBaseRent] = useState(0);
    const [contractMode, setContractMode] = useState<"upload" | "generate">("generate");
    const [contractFile, setContractFile] = useState<string | null>(null);
    const [onboardingStartDate, setOnboardingStartDate] = useState("");
    const [onboardingEndDate, setOnboardingEndDate] = useState("");
    const [buildingRules, setBuildingRules] = useState<string[]>(["No Smoking", "No Pets", "No Loud Music after 10PM"]);
    const [newRule, setNewRule] = useState("");
    
    // Profile Identity
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [profileBgColor, setProfileBgColor] = useState("#171717");
    const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File too large", {
                    description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
                });
                e.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPropertyPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File too large", {
                    description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
                });
                e.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error("File too large", {
                    description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
                });
                e.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string);
                setProfileBgColor("#171717");
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        setOnboardingStartDate(new Date().toISOString().split('T')[0]);
        setOnboardingEndDate(new Date(Date.now() + 31536000000).toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        const resolveParams = async () => {
            const { token: resolvedToken } = await params;
            setToken(resolvedToken);

            if (isPreview) {
                const mockData: OnboardingData = {
                    email: "preview@example.com",
                    fullName: "Preview Landlord",
                    phone: "09123456789",
                    propertyName: "Sample Property",
                    propertyAddress: "123 Preview Lane, Metro Manila"
                };
                setData(mockData);
                setFullName(mockData.fullName);
                setPhone(mockData.phone);
                setLoading(false);
                setCurrentStep("property"); // Start at property step for easier previewing
                return;
            }
            
            try {
                const response = await fetch(`/api/landlord/onboarding/${resolvedToken}`);
                const result = await response.json();
                
                if (!response.ok) {
                    if (result.expired) {
                        setError("Your onboarding link has expired. Please request a new one from the admin.");
                    } else if (result.alreadyCompleted) {
                        router.push("/login?message=onboarding-complete");
                    } else {
                        setError(result.error || "Invalid onboarding link");
                    }
                } else {
                    setData(result);
                    setFullName(result.fullName || "");
                    setPhone(result.phone || "");
                }
            } catch (err) {
                setError("Failed to load onboarding data");
            } finally {
                setLoading(false);
            }
        };
        
        resolveParams();
    }, [params, router, isPreview]);

    // Load persisted state from localStorage when email is available
    useEffect(() => {
        if (!data?.email) return;
        const saved = localStorage.getItem(`onboarding_progress_${data.email}`);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Don't restore currentStep - always start fresh from password
                // to ensure password is always entered
                if (state.fullName) setFullName(state.fullName);
                if (state.phone) setPhone(state.phone);
                if (state.totalUnits) setTotalUnits(state.totalUnits);
                if (state.totalFloors) setTotalFloors(state.totalFloors);
                if (state.utilityBilling) setUtilityBilling(state.utilityBilling);
                if (state.baseRent) setBaseRent(state.baseRent);
                if (state.amenities) setAmenities(state.amenities);
                if (state.headLimit) setHeadLimit(state.headLimit);
                if (state.profilePhoto) setProfilePhoto(state.profilePhoto);
                if (state.profileBgColor) setProfileBgColor(state.profileBgColor);
                if (state.coverPhoto) setCoverPhoto(state.coverPhoto);
                if (state.password) setPassword(state.password);
                if (state.confirmPassword) setConfirmPassword(state.confirmPassword);
            } catch (err) {
                console.error("Failed to load persisted state");
            }
        }
    }, [data?.email]);

    // Persist state to localStorage
    useEffect(() => {
        if (!data?.email || currentStep === "complete") return;
        const state = {
            currentStep,
            fullName,
            phone,
            totalUnits,
            totalFloors,
            utilityBilling,
            baseRent,
            amenities,
            headLimit,
            profilePhoto,
            profileBgColor,
            coverPhoto,
            password,
            confirmPassword
        };
        localStorage.setItem(`onboarding_progress_${data.email}`, JSON.stringify(state));
    }, [
        data?.email, 
        currentStep, 
        fullName, 
        phone, 
        totalUnits, 
        totalFloors, 
        utilityBilling, 
        baseRent, 
        amenities, 
        headLimit,
        profilePhoto,
        profileBgColor,
        coverPhoto,
        password,
        confirmPassword
    ]);

    const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        
        if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
        if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
        return { score, label: "Strong", color: "bg-green-500" };
    };

    const validatePassword = () => {
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            toast.error("Password must contain at least one uppercase letter");
            return false;
        }
        if (!/[0-9]/.test(password)) {
            toast.error("Password must contain at least one number");
            return false;
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            toast.error("Password must contain at least one special character");
            return false;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === "password") {
            if (!validatePassword()) return;
            setCurrentStep("property");
        } else if (currentStep === "property") {
            setCurrentStep("profile");
        } else if (currentStep === "profile") {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!fullName || !phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!password || password.length < 8) {
            toast.error("Please go back to Step 1 and set a valid password");
            setCurrentStep("password");
            return;
        }

        if (!validatePassword()) {
            setCurrentStep("password");
            return;
        }

        setSubmitting(true);
        
        try {
            const response = await fetch(`/api/landlord/onboarding/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password,
                    fullName,
                    phone,
                    propertyConfig: {
                        propertyPhoto,
                        profilePhoto,
                        profileBgColor,
                        coverPhoto,
                        totalUnits,
                        totalFloors,
                        headLimit,
                        utilityBilling,
                        baseRent,
                        amenities,
                        house_rules: buildingRules,
                        contractMode
                    }
                }),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                toast.error(result.error || "Failed to complete onboarding");
                return;
            }
            
            setCurrentStep("complete");
            if (data?.email) {
                localStorage.removeItem(`onboarding_progress_${data.email}`);
            }
            toast.success("Account created successfully!");
            
            // Redirect after a short delay
            setTimeout(() => {
                router.push("/login?message=onboarding-success");
            }, 2000);
            
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <Loader2 className="size-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 text-center bg-white/[0.02] border border-white/12 rounded-3xl">
                    <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="size-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Link Invalid</h2>
                    <p className="text-white/60 mb-6">{error}</p>
                    <Link 
                        href="/login" 
                        className="inline-block w-full py-4 bg-primary text-white/87 rounded-xl font-bold hover:bg-primary-dark transition-all"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (currentStep === "complete") {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
                <div className="max-w-md w-full p-10 text-center bg-white/[0.02] border border-white/12 rounded-3xl backdrop-blur-xl">
                    <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(109,152,56,0.2)] mb-6">
                        <CheckCircle className="size-12 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-semibold text-white mb-2">All Set!</h2>
                    <p className="text-white/60 mb-6">
                        Your landlord account has been created. Redirecting you to login...
                    </p>
                    <Loader2 className="size-6 animate-spin text-primary mx-auto" />
                </div>
            </div>
        );
    }

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="min-h-screen bg-[#121212] text-white/87 font-sans overflow-x-hidden relative">
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-primary/10 blur-[150px] pointer-events-none opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none opacity-40" />
            
            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-white/12 bg-[#121212]/80 backdrop-blur-xl">
                <Logo theme="dark" className="h-10 w-36" />
            </header>

            <main className={`mx-auto px-6 py-12 relative z-10 transition-all duration-700 ${currentStep === "property" ? "max-w-4xl" : "max-w-xl"}`}>
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="relative flex justify-between items-center mb-4">
                        <div className="absolute left-[5%] top-[1.25rem] -translate-y-1/2 w-[90%] h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                            />
                        </div>
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = idx <= currentStepIndex;
                            const isCurrent = step.id === currentStep;
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center relative z-10">
                                    <div className={`
                                        size-10 rounded-full flex items-center justify-center transition-all
                                        ${isActive ? "bg-primary text-black" : "bg-white/10 text-white/30"}
                                        ${isCurrent ? "ring-4 ring-primary/30" : ""}
                                    `}>
                                        <Icon className="size-4" />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${isActive ? "text-primary" : "text-white/30"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white/[0.02] border border-white/12 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                    {currentStep === "password" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3">
                                    <Lock className="size-3 text-primary" />
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Secure Authentication</span>
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white">Create Credentials</h2>
                                <p className="text-white/50 text-sm mt-1">Establish your administrative access</p>
                            </div>
                            
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl shadow-2xl">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label htmlFor="admin-identity" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 px-1">
                                            Administrative Identity
                                        </label>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                                            <CheckCircle2 className="size-3 text-primary" />
                                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Verified Link</span>
                                        </div>
                                    </div>
                                    <input 
                                        id="admin-identity"
                                        type="text" 
                                        value={data?.email || ""}
                                        disabled
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/40 cursor-not-allowed font-medium"
                                    />
                                    <p className="text-[10px] text-white/20 mt-3 flex items-start gap-2 px-1">
                                        <Lock className="size-3 mt-0.5" />
                                        <span>This email is cryptographically linked to your registration and cannot be modified.</span>
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    <label htmlFor="password" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 px-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <input 
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="e.g. MyPass@2024"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white focus:border-primary/50 focus:bg-primary/5 transition-all outline-none font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                    
                                    <div className="pt-2 grid grid-cols-2 gap-y-2 gap-x-4">
                                        {[
                                            { label: "8+ characters", met: password.length >= 8 },
                                            { label: "Uppercase", met: /[A-Z]/.test(password) },
                                            { label: "Number", met: /[0-9]/.test(password) },
                                            { label: "Special char", met: /[^A-Za-z0-9]/.test(password) },
                                        ].map((req, i) => (
                                            <div key={req.label} className="flex items-center gap-2">
                                                <div className={`size-3.5 rounded-full flex items-center justify-center border transition-all duration-500 ${req.met ? "bg-primary border-primary text-black" : "border-white/10 text-transparent"}`}>
                                                    <CheckCircle2 className="size-2" />
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${req.met ? "text-primary" : "text-white/20"}`}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {password && (
                                        <div className="pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Entropy Strength</span>
                                                <span className={`text-[10px] font-semibold uppercase tracking-widest ${getPasswordStrength(password).color.replace('bg-', 'text-')}`}>
                                                    {getPasswordStrength(password).label}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1">
                                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                                    <div 
                                                        key={`strength-bar-${i}`}
                                                        className={`h-full flex-1 transition-all duration-700 rounded-full ${i <= getPasswordStrength(password).score ? getPasswordStrength(password).color : "bg-white/5"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <label htmlFor="confirm-password" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 px-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input 
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="e.g. MyPass@2024"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white focus:border-primary/50 transition-all font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && (
                                        <div className="flex items-center gap-2 px-1">
                                            {password === confirmPassword ? (
                                                <>
                                                    <CheckCircle2 className="size-3 text-primary" />
                                                    <span className="text-[10px] text-primary font-semibold uppercase tracking-widest">Passwords Synchronized</span>
                                                </>
                                            ) : (
                                                <p className="text-red-400 text-[10px] font-semibold uppercase tracking-widest">Mismatched credentials</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === "property" && (
                        <div className="space-y-8">
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-semibold tracking-tight text-white">Property Configuration</h2>
                                <p className="text-white/50 text-sm mt-1">Initialize your asset's operational parameters</p>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Left Column: Identity & Physical Structure */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Property Photo */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <ImageIcon className="size-3.5 text-primary" />
                                            <label htmlFor="cover-photo-input" className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Cover Identity</label>
                                        </div>
                                        <div className="relative group cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/10 transition-all aspect-[16/10] shadow-2xl">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                {propertyPhoto ? (
                                                    <Image src={propertyPhoto} alt="Property Preview" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                                ) : (
                                                    <>
                                                        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                                            <Building2 className="size-7 text-primary" />
                                                        </div>
                                                        <div className="text-center px-6">
                                                            <span className="block text-xs font-bold text-white mb-1">Upload Photo</span>
                                                            <span className="block text-[10px] text-white/30 uppercase tracking-widest">High Res Preferred</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <input id="cover-photo-input" type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                            {propertyPhoto && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20 pointer-events-none">
                                                    <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
                                                        <Camera className="size-4 text-white" />
                                                        <span className="text-xs font-bold text-white">Change Cover</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verified Identity Stack */}
                                    <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 space-y-4 backdrop-blur-md">
                                        <div className="flex items-center gap-2 px-1">
                                            <ShieldCheck className="size-3.5 text-primary" />
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Verified Identity</span>
                                        </div>
                                        <div className="grid gap-3">
                                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">Formal Name</p>
                                                <p className="text-sm font-semibold text-white truncate leading-none">{data?.propertyName}</p>
                                            </div>
                                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">Location</p>
                                                <p className="text-xs font-medium text-white/60 line-clamp-2 leading-relaxed">{data?.propertyAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Architectural Scope */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Grid className="size-4 text-primary" />
                                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Architectural Scope</h3>
                                        </div>
                                        
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="total-units" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">
                                                        <Building2 className="size-3" /> Total Units
                                                    </label>
                                                    <input
                                                        id="total-units"
                                                        type="number"
                                                        value={totalUnits || ""}
                                                        onChange={(e) => setTotalUnits(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="total-floors" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">
                                                        <Layers className="size-3" /> Total Floors
                                                    </label>
                                                    <input
                                                        id="total-floors"
                                                        type="number"
                                                        value={totalFloors || ""}
                                                        onChange={(e) => setTotalFloors(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="head-limit" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">
                                                    <Users className="size-3" /> Maximum Capacity per Unit
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="head-limit"
                                                        value={headLimit}
                                                        onChange={(e) => setHeadLimit(e.target.value === "none" ? "none" : parseInt(e.target.value))}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 appearance-none font-bold pr-10"
                                                    >
                                                        {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n} className="bg-black">{n} Person(s)</option>)}
                                                        <option value="none" className="bg-black">Unlimited Capacity</option>
                                                    </select>
                                                    <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 size-3 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Financial & Policies */}
                                <div className="lg:col-span-7 space-y-6">
                                    {/* Billing Strategy */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Zap className="size-4 text-primary" />
                                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Billing Strategy</h3>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid gap-3">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Utility Management</label>
                                                <div className="grid gap-2">
                                                    {[
                                                        { id: "included_in_rent", label: "Included in Rent", desc: "Utilities are part of the rent", popular: false },
                                                        { id: "mixed", label: "Submetered", desc: "You bill tenants for usage", popular: true },
                                                        { id: "separate_metered", label: "Direct to Provider", desc: "Tenants pay utility companies", popular: false },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setUtilityBilling(opt.id as any)}
                                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${utilityBilling === opt.id ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`size-2.5 rounded-full ${utilityBilling === opt.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" : "bg-white/10"}`} />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-sm font-semibold tracking-tight ${utilityBilling === opt.id ? "text-primary" : "text-white"}`}>{opt.label}</p>
                                                                        {opt.popular && (
                                                                            <span className="text-[7px] font-semibold uppercase tracking-widest bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">Most Popular</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{opt.desc}</p>
                                                                </div>
                                                            </div>
                                                            {utilityBilling === opt.id && <CheckCircle2 className="size-5 text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Strategy Explanation Card */}
                                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="flex gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                        <HelpCircle className="size-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">How this works</h4>
                                                        <p className="text-xs text-white/60 font-medium leading-relaxed">
                                                            {utilityBilling === "included_in_rent" && "The utility cost is part of the rent. Your tenants do not pay anything extra for their water or electricity usage."}
                                                            {utilityBilling === "separate_metered" && "Tenants have their own separate accounts and meters. They receive and pay their own bills directly to the utility company."}
                                                            {utilityBilling === "mixed" && "The property has one main bill that you pay. You use submeters to bill tenants for their specific usage through iReside."}
                                                        </p>
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <div className="size-1 rounded-full bg-primary" />
                                                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                                                                {utilityBilling === "included_in_rent" && "Best for: Simple rent setups"}
                                                                {utilityBilling === "separate_metered" && "Best for: Standard houses or apartments"}
                                                                {utilityBilling === "mixed" && "Best for: Multi unit buildings with one main meter"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Standard Base Rent (PHP)</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-xl font-semibold text-primary/40 group-focus-within:text-primary transition-colors">₱</div>
                                                    <input 
                                                        type="text" 
                                                        value={baseRent === 0 ? "" : baseRent.toLocaleString('en-US')}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/,/g, "");
                                                            const num = parseInt(val) || 0;
                                                            setBaseRent(num);
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-2xl font-semibold text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Settings className="size-4 text-primary" />
                                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Amenities</h3>
                                            </div>
                                            <span className="text-[10px] font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{amenities.length} Selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                "Wi-Fi", "Gym", "Pool", "Laundry", "Parking", 
                                                "Security", "CCTV", "Garden", "Elevator"
                                            ].map((amenity) => (
                                                <button
                                                    key={amenity}
                                                    onClick={() => {
                                                        if (amenities.includes(amenity)) setAmenities(prev => prev.filter(a => a !== amenity));
                                                        else setAmenities(prev => [...prev, amenity]);
                                                    }}
                                                    className={`px-4 py-3 rounded-2xl text-[10px] font-semibold uppercase tracking-widest border transition-all text-center ${amenities.includes(amenity) ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-white/30 hover:text-white/50"}`}
                                                >
                                                    {amenity}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Building Rules - Spans 12 columns */}
                                <div className="lg:col-span-12">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="size-4 text-primary" />
                                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Building Rules & Conduct</h3>
                                            </div>
                                            <span className="text-[10px] font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{buildingRules.length} Defined</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    value={newRule}
                                                    onChange={(e) => setNewRule(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newRule.trim()) {
                                                            setBuildingRules([...buildingRules, newRule.trim()]);
                                                            setNewRule("");
                                                        }
                                                    }}
                                                    placeholder="Define a new property rule..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-primary/50 transition-all placeholder:text-white/10 outline-none"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if (newRule.trim()) {
                                                            setBuildingRules([...buildingRules, newRule.trim()]);
                                                            setNewRule("");
                                                        }
                                                    }}
                                                    className="px-6 py-2 bg-primary text-black rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    Add Rule
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {buildingRules.map((rule, index) => (
                                                    <div 
                                                        key={rule}
                                                        className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 group hover:border-primary/30 transition-all"
                                                    >
                                                        <span className="text-xs font-bold text-white/80">{rule}</span>
                                                        <button 
                                                            onClick={() => setBuildingRules(buildingRules.filter((_, i) => i !== index))}
                                                            className="text-white/20 hover:text-red-400 transition-colors"
                                                        >
                                                            <X className="size-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Preview - Span 5 */}
                                <div className="lg:col-span-5">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <FileText className="size-4 text-primary" />
                                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Final Validation</h3>
                                        </div>
                                        
                                        <div
                                            onClick={() => {
                                                if (contractMode === "generate") {
                                                    setShowLightbox(true);
                                                } else {
                                                    document.getElementById('contract-upload-input')?.click();
                                                }
                                            }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (contractMode === "generate") { setShowLightbox(true); } else { document.getElementById('contract-upload-input')?.click(); }}}}
                                            tabIndex={0}
                                            role="button"
                                            className="relative group cursor-pointer aspect-[16/11] rounded-[2rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/40"
                                        >
                                            <input 
                                                id="contract-upload-input"
                                                type="file" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > MAX_FILE_SIZE) {
                                                            toast.error("File too large", {
                                                                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
                                                            });
                                                            e.target.value = "";
                                                            return;
                                                        }
                                                        setContractFile(file.name);
                                                        toast.success(`Contract linked: ${file.name}`);
                                                    }
                                                }}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-black/60 pointer-events-none" />
                                            
                                            {contractMode === "generate" ? (
                                                <>
                                                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                                        <FileText className="size-8 text-primary" />
                                                    </div>
                                                    <div className="text-center px-4 relative z-10">
                                                        <span className="block text-xs font-semibold text-white uppercase tracking-widest mb-1">Contract Preview</span>
                                                        <span className="block text-[8px] text-white/30 uppercase tracking-widest font-semibold">Digital Agreement v2.1</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={`size-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 duration-500 ${contractFile ? "bg-primary/20 border-primary/40" : "bg-white/5 border-white/10"}`}>
                                                        {contractFile ? <CheckCircle2 className="size-8 text-primary" /> : <Upload className="size-8 text-white/20" />}
                                                    </div>
                                                    <div className="text-center px-4">
                                                        <span className={`block text-xs font-semibold uppercase tracking-widest ${contractFile ? "text-primary" : "text-white/40"}`}>
                                                            {contractFile ? "Upload Complete" : "Click to Upload"}
                                                        </span>
                                                        {contractFile && <span className="block text-[8px] text-white/30 uppercase tracking-widest font-bold mt-1 truncate max-w-[150px] mx-auto">{contractFile}</span>}
                                                    </div>
                                                </>
                                            )}

                                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="bg-white text-black px-5 py-2.5 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    {contractMode === "generate" ? <Maximize2 className="size-4" /> : <Upload className="size-4" />}
                                                    <span className="text-[10px] font-semibold uppercase tracking-widest">
                                                        {contractMode === "generate" ? "Review & Export" : (contractFile ? "Change Document" : "Upload File")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lease Strategy - Span 7 */}
                                <div className="lg:col-span-7">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6 h-full">
                                        <div className="flex items-center gap-2">
                                            <Lock className="size-4 text-primary" />
                                            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Execution Strategy</h3>
                                        </div>
                                        
                                        <div className="grid gap-5">
                                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                                {[
                                                    { id: "generate", label: "Smart Draft" },
                                                    { id: "upload", label: "Own Document" }
                                                ].map((mode) => (
                                                    <button 
                                                        key={mode.id}
                                                        onClick={() => setContractMode(mode.id as any)}
                                                        className={`flex-1 py-4 text-[10px] font-semibold uppercase tracking-widest rounded-xl transition-all ${contractMode === mode.id ? "bg-primary text-black shadow-lg shadow-primary/10" : "text-white/30 hover:text-white/50"}`}
                                                    >
                                                        {mode.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex-1 flex items-center justify-center text-center">
                                                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                                                    {contractMode === "generate" 
                                                        ? "Instantiate a standard iReside digital agreement dynamically bound to your specific rules and parameters." 
                                                        : "Your proprietary lease documentation will be securely archived and linked to this property asset."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lightbox Modal */}
                            {showLightbox && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowLightbox(false)} />
                                    
                                    <div className="relative w-full max-w-4xl max-h-full aspect-[3/4] md:aspect-auto bg-[#1A1A1A] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                                        {/* Lightbox Header */}
                                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#1A1A1A]/50 backdrop-blur-md sticky top-0 z-30">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <FileText className="size-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white uppercase tracking-widest">Lease Agreement Preview</h4>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Draft Version • iReside Standard Protocol</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {contractMode === "generate" && (
                                                    <>
                                                        <button 
                                                            disabled={exporting}
                                                            onClick={async () => {
                                                                const element = document.getElementById('contract-preview-container');
                                                                if (!element) return;
                                                                setExporting(true);
                                                                try {
                                                                    const domtoimage = (await import("dom-to-image")).default;
                                                                    const dataUrl = await domtoimage.toPng(element, {
                                                                        quality: 1,
                                                                        bgcolor: '#ffffff',
                                                                        width: element.clientWidth * 2,
                                                                        height: element.clientHeight * 2,
                                                                        style: {
                                                                            transform: 'scale(2)',
                                                                            transformOrigin: 'top left'
                                                                        }
                                                                    });
                                                                    
                                                                    const { jsPDF } = await import("jspdf");
                                                                    const imgWidth = 210;
                                                                    const pageHeight = 297;
                                                                    const imgHeight = (element.clientHeight * imgWidth) / element.clientWidth;
                                                                    let heightLeft = imgHeight;
                                                                    
                                                                    const doc = new jsPDF('p', 'mm', 'a4');
                                                                    let position = 0;
                                                                    
                                                                    // Add the first page
                                                                    doc.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
                                                                    heightLeft -= pageHeight;
                                                                    
                                                                    // Add subsequent pages if content overflows
                                                                    while (heightLeft > 0) {
                                                                        position = heightLeft - imgHeight; // Calculate top position for the next chunk
                                                                        doc.addPage();
                                                                        doc.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
                                                                        heightLeft -= pageHeight;
                                                                    }
                                                                    
                                                                    doc.save(`Lease_Draft_${data?.propertyName?.replace(/\s+/g, '_') || 'Property'}.pdf`);
                                                                    toast.success("PDF Exported Successfully");
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    toast.error("Failed to export PDF");
                                                                } finally {
                                                                    setExporting(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-3.5" />}
                                                            Export PDF
                                                        </button>

                                                        <button 
                                                            disabled={exporting}
                                                            onClick={async () => {
                                                                const element = document.getElementById('contract-preview-container');
                                                                if (!element) return;
                                                                setExporting(true);
                                                                try {
                                                                    const domtoimage = (await import("dom-to-image")).default;
                                                                    const dataUrl = await domtoimage.toPng(element, {
                                                                        quality: 1,
                                                                        bgcolor: '#ffffff',
                                                                        width: element.clientWidth * 2,
                                                                        height: element.clientHeight * 2,
                                                                        style: {
                                                                            transform: 'scale(2)',
                                                                            transformOrigin: 'top left'
                                                                        }
                                                                    });
                                                                    const a = document.createElement('a');
                                                                    a.href = dataUrl;
                                                                    a.download = `Lease_Preview_${data?.propertyName?.replace(/\s+/g, '_') || 'Property'}.png`;
                                                                    a.click();
                                                                    toast.success("Photo Saved Successfully");
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    toast.error("Failed to save photo");
                                                                } finally {
                                                                    setExporting(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/60 hover:text-white transition-all text-[10px] font-semibold uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            <ImageIcon className="size-3.5" />
                                                            Save Photo
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => setShowLightbox(false)}
                                                    className="size-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
                                                >
                                                    <X className="size-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lightbox Body (Preview Content) */}
                                        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar bg-zinc-900/50">
                                            {contractMode === "generate" ? (
                                                <div id="contract-preview-container" className="max-w-4xl mx-auto shadow-2xl">
                                                    <LeaseDocument 
                                                        id="TEMP-0001"
                                                        start_date={onboardingStartDate}
                                                        end_date={onboardingEndDate}
                                                        monthly_rent={baseRent}
                                                        security_deposit={baseRent} // Mock 1 month deposit
                                                        signed_at={null}
                                                        signed_document_url={null}
                                                        unit={{
                                                            id: "mock-unit",
                                                            name: "Unit 101",
                                                            floor: 1,
                                                            sqft: 25,
                                                            beds: 1,
                                                            baths: 1,
                                                            property: {
                                                                id: "mock-prop",
                                                                name: data?.propertyName || "New Property",
                                                                address: data?.propertyAddress || "123 Street Name",
                                                                city: "Metro Manila",
                                                                images: propertyPhoto ? [propertyPhoto] : [],
                                                                house_rules: [
                                                                    utilityBilling === "included_in_rent" ? "strategy:inclusive" : "strategy:exclusive",
                                                                    ...buildingRules
                                                                ],
                                                                amenities: amenities.map((a, i) => ({
                                                                    id: `a-${i}`,
                                                                    name: a,
                                                                    type: "Standard",
                                                                    description: "Available for all residents",
                                                                    price_per_unit: 0,
                                                                    unit_type: "Fixed",
                                                                    capacity: 1,
                                                                    icon_name: "Star",
                                                                    location_details: "Main Lobby",
                                                                    status: "Active"
                                                                }))
                                                            }
                                                        }}
                                                        landlord={{
                                                            id: "landlord-id",
                                                            full_name: fullName || "Landlord Name",
                                                            avatar_url: profilePhoto || "",
                                                            avatar_bg_color: profileBgColor || "#10B981",
                                                            phone: phone || "000-000-0000"
                                                        }}
                                                        tenant={{
                                                            full_name: "Prospective Tenant"
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center py-20 gap-6">
                                                    <div className="size-24 bg-white/5 rounded-[2rem] border border-white/10 border-dashed flex items-center justify-center">
                                                        <FilePlus className="size-10 text-white/10" />
                                                    </div>
                                                    <div className="text-center max-w-sm">
                                                        <h5 className="text-lg font-semibold text-white uppercase tracking-widest mb-2">Awaiting Documentation</h5>
                                                        <p className="text-xs text-white/30 font-medium leading-relaxed">
                                                            Custom lease agreements can be uploaded via your administrative dashboard immediately after completing this onboarding flow.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === "profile" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-3">
                                    <User className="size-3 text-primary" />
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Operator Profile</span>
                                </div>
                                <h2 className="text-3xl font-semibold tracking-tight text-white">Final Details</h2>
                                <p className="text-white/50 text-sm mt-1">Complete your administrative identity</p>
                            </div>
                            
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                                {/* Cover Photo Section */}
                                <div className="relative h-40 group cursor-pointer bg-white/5 border-b border-white/5">
                                    {coverPhoto ? (
                                        <Image src={coverPhoto} alt="Cover" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                            <ImageIcon className="size-6 text-white/10" />
                                            <span className="text-[9px] font-semibold text-white/20 uppercase tracking-widest">Set Cover Banner</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        onChange={handleCoverPhotoChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                        accept="image/*"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px] pointer-events-none">
                                        <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
                                            <Camera className="size-4 text-white" />
                                            <span className="text-[10px] font-semibold text-white uppercase tracking-widest">Change Cover</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Photo & Details Wrapper */}
                                <div className="p-8 pt-0 -mt-12 relative z-10">
                                    <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                                        {/* Profile Photo */}
                                        <div
                                            onClick={() => setIsAvatarPickerOpen(true)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsAvatarPickerOpen(true); }}}
                                            tabIndex={0}
                                            role="button"
                                            className="relative group shrink-0 cursor-pointer"
                                        >
                                            <div 
                                                className="size-32 rounded-[2.5rem] border-4 border-[#121212] overflow-hidden shadow-2xl relative transition-transform duration-500 group-hover:scale-105"
                                                style={{ backgroundColor: profileBgColor }}
                                            >
                                                {profilePhoto ? (
                                                    <Image src={profilePhoto} alt="Profile" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-4xl font-semibold text-white/20">
                                                            {(fullName || "C").split(" ").filter(Boolean).slice(0, 1).map(p => p[0]?.toUpperCase()).join("")}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                                    <Camera className="size-6 text-white" />
                                                </div>
                                            </div>
                                            
                                            <div className="absolute -bottom-1 -right-1 size-8 bg-primary text-black rounded-full border-4 border-[#121212] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                                <Camera className="size-3" />
                                            </div>
                                        </div>

                                        <div className="flex-1 pb-2">
                                            <h3 className="text-xl font-semibold text-white uppercase tracking-widest leading-none mb-1">
                                                {fullName || "New Landlord"}
                                            </h3>
                                            <p className="text-[10px] font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck className="size-3" />
                                                Authorized Operator
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label htmlFor="full-name" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 px-1">
                                                Full Legal Name
                                            </label>
                                            <div className="relative group">
                                                <input 
                                                    id="full-name"
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="As shown on official ID"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary/50 transition-all outline-none font-bold"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <label htmlFor="admin-contact" className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 px-1">
                                                Administrative Contact
                                            </label>
                                            <div className="relative group">
                                                <input 
                                                    id="admin-contact"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="+63 9xx xxx xxxx"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-primary/50 transition-all outline-none font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-white/20 mt-6 flex items-start gap-2 px-1 leading-relaxed border-t border-white/5 pt-6">
                                        <ShieldCheck className="size-3 mt-0.5 text-primary/40" />
                                        <span>Your profile configuration establishes your legal and administrative presence within the iReside network. Ensure all contact data is accurate for billing and emergency dispatch.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-4 mt-8">
                        {currentStep !== "password" && (
                            <button
                                onClick={() => {
                                    const idx = STEPS.findIndex(s => s.id === currentStep);
                                    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
                                }}
                                className="flex-1 py-4 bg-white/5 text-white/60 rounded-xl font-bold hover:bg-white/10 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={submitting}
                            className="flex-1 py-4 bg-primary text-black rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    {currentStep === "profile" ? "Complete Setup" : "Continue"} 
                                    <ArrowRight className="size-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

            <AvatarPicker 
                isOpen={isAvatarPickerOpen}
                onClose={() => setIsAvatarPickerOpen(false)}
                currentAvatarUrl={profilePhoto}
                currentBgColor={profileBgColor}
                onSelect={(url, color) => {
                    setProfilePhoto(url);
                    setProfileBgColor(color);
                }}
            />
        </div>
    );
}