"use client";

import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2, Upload, FileCheck, Check, Eye, Trash2, FileText } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { saveWizardState, loadWizardState, clearWizardState } from "@/lib/wizard-storage";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

export default function SignUpPage() {
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(1);

    // Controlled inputs to preserve state across step unmounting
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    
    const [verificationCode, setVerificationCode] = useState("");
    const [correctOtp, setCorrectOtp] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [propertyAddress, setPropertyAddress] = useState("");

    const [idFile, setIdFile] = useState<File | null>(null);
    const [permitFile, setPermitFile] = useState<File | null>(null);
    const [permitCardFile, setPermitCardFile] = useState<File | null>(null);
    const [ownershipFile, setOwnershipFile] = useState<File | null>(null);

    // Previews (not persisted in localStorage as they are blobs)
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [permitPreview, setPermitPreview] = useState<string | null>(null);
    const [permitCardPreview, setPermitCardPreview] = useState<string | null>(null);
    const [ownershipPreview, setOwnershipPreview] = useState<string | null>(null);

    // Initialization: Load from localStorage
    useEffect(() => {
        const savedState = loadWizardState();
        if (savedState) {
            if (savedState.currentStep) setCurrentStep(savedState.currentStep as number);
            if (savedState.fullName) setFullName(savedState.fullName as string);
            if (savedState.phone) setPhone(savedState.phone as string);
            if (savedState.email) setEmail(savedState.email as string);
            if (savedState.otpVerified) setOtpVerified(savedState.otpVerified as boolean);
            if (savedState.propertyName) setPropertyName(savedState.propertyName as string);
            if (savedState.propertyAddress) setPropertyAddress(savedState.propertyAddress as string);
            if (savedState.otpSent) setOtpSent(savedState.otpSent as boolean);
            if (savedState.correctOtp) setCorrectOtp(savedState.correctOtp as string);
            
            toast.info("Progress restored", {
                description: "We've loaded your previous registration progress."
            });
        }
    }, []);

    // Persistence: Save to localStorage whenever important state changes
    useEffect(() => {
        const stateToSave = {
            currentStep,
            fullName,
            phone,
            email,
            otpSent,
            otpVerified,
            correctOtp,
            propertyName,
            propertyAddress
        };
        saveWizardState(stateToSave);
    }, [currentStep, fullName, phone, email, otpSent, otpVerified, correctOtp, propertyName, propertyAddress]);

    // Handle File Uploads with Previews
    const handleFileChange = (file: File | null, setter: (f: File | null) => void, previewSetter: (s: string | null) => void) => {
        if (file && file.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
            });
            return;
        }

        setter(file);
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            previewSetter(url);
        } else {
            previewSetter(null);
        }
    };
    const handleSendOTP = async () => {
        if (!email) {
            toast.error("Please enter your email address first.");
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch("/api/auth/registration-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (data.success) {
                setOtpSent(true);
                setCorrectOtp(data.otp);
                toast.success("Verification code sent!", {
                    description: "A 6-digit code has been sent to your email address."
                });
            } else {
                toast.error(data.error || "Failed to send verification code.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while sending the verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        if (!verificationCode) {
            toast.error("Code required", {
                description: "Please enter the verification code sent to your email."
            });
            return;
        }

        if (verificationCode !== correctOtp) {
            toast.error("Invalid code", {
                description: "Incorrect verification code. Please check your email and try again."
            });
            return;
        }

        setOtpVerified(true);
        toast.success("Email verified successfully!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (currentStep < 3) {
            if (currentStep === 1 && !otpVerified) {
                toast.warning("Verification required", {
                    description: "Please verify your email before proceeding to the next step."
                });
                return;
            }
            setCurrentStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Validate at least 3 of 4 documents
        const files = [idFile, permitFile, permitCardFile, ownershipFile].filter((f): f is File => f !== null);
        const filesCount = files.length;

        if (filesCount < 3) {
            toast.error("Incomplete documentation", {
                description: `Please upload at least 3 of the 4 required documents to proceed. (Current: ${filesCount}/4)`
            });
            return;
        }

        // Secondary file size validation
        const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            toast.error("File size limit exceeded", {
                description: `Some files exceed the ${MAX_FILE_SIZE_MB}MB limit. Please remove or replace them before submitting.`
            });
            return;
        }

        // Submit the application
        setLoading(true);
        
        try {
            // Prepare file data as base64
            const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            const idFileData = idFile ? { name: idFile.name, type: idFile.type, data: await fileToBase64(idFile) } : undefined;
            const permitFileData = permitFile ? { name: permitFile.name, type: permitFile.type, data: await fileToBase64(permitFile) } : undefined;
            const permitCardFileData = permitCardFile ? { name: permitCardFile.name, type: permitCardFile.type, data: await fileToBase64(permitCardFile) } : undefined;
            const ownershipFileData = ownershipFile ? { name: ownershipFile.name, type: ownershipFile.type, data: await fileToBase64(ownershipFile) } : undefined;

            const response = await fetch("/api/auth/landlord-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: {
                        fullName,
                        phone,
                        email,
                        emailVerified: otpVerified,
                        propertyName,
                        propertyAddress,
                        idFile: idFileData,
                        permitFile: permitFileData,
                        permitCardFile: permitCardFileData,
                        ownershipFile: ownershipFileData,
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Failed to submit application");
                return;
            }

            setSubmitted(true);
            clearWizardState(); // Success!
            toast.success("Application submitted successfully!");
            
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("An error occurred while submitting your application");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen bg-[#121212] text-white/87 font-sans items-center justify-center relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
                <div className="max-w-md w-full p-10 text-center space-y-6 bg-white/[0.02] border border-white/12 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl">
                    <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-[0_0_30px_rgba(109,152,56,0.2)]">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-extrabold tracking-tight">Application Submitted</h2>
                        <p className="text-white/60 font-medium leading-relaxed">
                            Your landlord registration has been submitted successfully. Our system administrator will review your documents and verify your application shortly.
                        </p>
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium text-white/80">
                            Registration updates will be sent to <strong className="text-white font-bold">{email || "your email"}</strong>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Link href="/login" className="inline-block w-full py-4 bg-primary text-white/87 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/25">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100svh] flex flex-col bg-[#121212] text-white/87 font-sans relative selection:bg-primary/30 overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-primary/10 blur-[150px] pointer-events-none opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none opacity-40" />
            
            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-white/12 bg-[#121212]/80 backdrop-blur-xl shrink-0">
                <Logo theme="dark" className="h-10 w-36 md:h-12 md:w-44 lg:w-48" />
                <Link href="/login" className="text-sm font-bold text-white/60 hover:text-white/87 transition-colors">
                    Back to Login
                </Link>
            </header>

            <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
                <div className="my-auto w-full flex flex-col pb-8">
                {/* Hero Title Area */}
                <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs sm:text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(109,152,56,0.15)] mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Partner Portal
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 drop-shadow-sm pb-1">
                        Landlord Registration
                    </h1>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-xl mx-auto mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100 shrink-0">
                    <div className="relative flex justify-between items-center">
                        <div className="absolute left-[5%] top-[1.25rem] -translate-y-1/2 w-[90%] h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 ease-out" 
                                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                            />
                        </div>
                        
                        {[
                            { step: 1, label: "Personal" },
                            { step: 2, label: "Property" },
                            { step: 3, label: "Documents" }
                        ].map((s) => (
                            <div key={s.step} className="relative flex flex-col items-center gap-2 z-10 w-24">
                                <div className={`size-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 relative z-10 ${
                                    currentStep > s.step 
                                        ? "bg-primary border-primary text-[#121212] shadow-[0_0_20px_rgba(109,152,56,0.4)] scale-110" 
                                        : currentStep === s.step 
                                            ? "bg-[#1E1E1E] border-primary text-primary shadow-[0_0_20px_rgba(109,152,56,0.2)] scale-110" 
                                            : "bg-[#1E1E1E] border-white/12 text-white/60"
                                }`}>
                                    {currentStep > s.step ? <Check className="size-5" /> : s.step}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 relative z-10 text-center ${
                                    currentStep >= s.step ? "text-white/87" : "text-white/40"
                                }`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative flex-1 flex flex-col justify-between">
                    
                    {/* STEP 1: Personal Details */}
                    {currentStep === 1 && (
                    <section className="bg-[#1E1E1E]/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.05)] relative group transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col justify-center">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-white/87 tracking-tight">Personal Details</h2>
                            <p className="text-sm text-white/60 mt-1 font-medium">We need this to create your administrative profile.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 group/input">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-focus-within/input:text-primary transition-colors ml-1">Full Legal Name</label>
                                <input value={fullName} onChange={e => setFullName(e.target.value)} required type="text" placeholder="e.g. Jane Doe" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/87 placeholder-white/20 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                            </div>
                            <div className="space-y-1.5 group/input">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-focus-within/input:text-primary transition-colors ml-1">Phone Number</label>
                                <input value={phone} onChange={e => setPhone(e.target.value)} required type="tel" placeholder="+1 (555) 000-0000" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/87 placeholder-white/20 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                            </div>
                            
                            {/* Email Verification Row spans 2 cols on md */}
                            <div className="md:col-span-2 space-y-1.5 group/input">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-focus-within/input:text-primary transition-colors ml-1">Email Address</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required 
                                        type="email" 
                                        placeholder="jane@example.com" 
                                        disabled={otpVerified}
                                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/87 placeholder-white/20 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" 
                                    />
                                    {!otpVerified && (
                                        <button 
                                            type="button" 
                                            onClick={handleSendOTP}
                                            disabled={loading}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all whitespace-nowrap text-white/87 active:scale-95 shadow-sm disabled:opacity-50"
                                        >
                                            {otpSent ? "Resend Code" : "Verify Email"}
                                        </button>
                                    )}
                                </div>
                                
                                {otpSent && !otpVerified && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                                        <div className="relative flex-1 max-w-[180px]">
                                            <input 
                                                type="text" 
                                                placeholder="000000" 
                                                maxLength={6}
                                                value={verificationCode}
                                                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                                                className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-white tracking-[0.75em] font-mono text-xl text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:tracking-normal placeholder:text-white/20" 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleVerifyOTP}
                                            className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold transition-all hover:bg-primary/90 active:scale-95 whitespace-nowrap shadow-[0_0_15px_rgba(109,152,56,0.3)]"
                                        >
                                            Verify Code
                                        </button>
                                    </div>
                                )}
                                
                                {otpVerified && (
                                    <div className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in pt-2 ml-1">
                                        <div className="p-1 bg-primary/20 rounded-full">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        Email verified successfully
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    )}

                    {/* STEP 2: Property Info */}
                    {currentStep === 2 && (
                    <section className="bg-[#1E1E1E]/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.05)] relative group transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col justify-center">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-white/87 tracking-tight">Primary Property</h2>
                            <p className="text-sm text-white/60 mt-1 font-medium">Details of the first property you wish to manage.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5 group/input">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-focus-within/input:text-primary transition-colors ml-1">Property Name</label>
                                <input value={propertyName} onChange={e => setPropertyName(e.target.value)} required type="text" placeholder="e.g. The Grand Residences" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/87 placeholder-white/20 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                            </div>
                            <div className="space-y-1.5 group/input">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-focus-within/input:text-primary transition-colors ml-1">Complete Address</label>
                                <textarea value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} required rows={2} placeholder="123 Main St, Suite 400..." className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/87 placeholder-white/20 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-base font-medium leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"></textarea>
                            </div>
                        </div>
                    </section>
                    )}

                    {/* STEP 3: Documents */}
                    {currentStep === 3 && (
                    <section className="bg-[#1E1E1E]/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.05)] relative group transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col justify-center">
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-2xl font-semibold text-white/87 tracking-tight">Identity & Credentials</h2>
                            <p className="text-sm text-white/60 mt-1 font-medium">Upload clear, legible copies to ensure swift approval.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* Valid ID */}
                            <div className={`relative rounded-2xl border border-dashed p-3 text-center transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-h-[140px] group/upload hover:z-50 ${idFile ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(109,152,56,0.15)]' : 'border-white/20 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'}`}>
                                <input 
                                    type="file" 
                                    title="" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, setIdFile, setIdPreview)}
                                />
                                {idFile ? (
                                    <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none">
                                        {idPreview ? (
                                            <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden border border-white/10 group-hover/upload:scale-105 transition-transform duration-500">
                                                <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-500/20 rounded-full mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <FileCheck className="h-8 w-8 text-amber-500" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white/87 block truncate w-full px-2 text-center">{idFile.name}</span>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIdFile(null);
                                                setIdPreview(null);
                                            }}
                                            className="mt-2 p-1.5 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/40 transition-colors pointer-events-auto"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* CSS ID Illustration */}
                                        <div className="relative w-28 h-16 bg-[#f8f9fa] rounded-lg shadow-lg overflow-hidden mx-auto mb-4 group-hover/upload:scale-110 transition-transform duration-500 border border-zinc-200">
                                            <div className="absolute top-0 left-0 w-full h-3 bg-emerald-600"></div>
                                            <div className="absolute top-[2px] left-1/2 -translate-x-1/2 text-[3px] text-white/87 font-bold tracking-widest uppercase">Republic ID</div>
                                            
                                            <div className="absolute top-5 left-2 w-5 h-7 bg-zinc-200 border border-zinc-300 rounded-sm overflow-hidden flex flex-col items-center justify-end">
                                                <div className="w-2.5 h-2.5 bg-zinc-400 rounded-full absolute top-1"></div>
                                                <div className="w-4 h-3 bg-zinc-400 rounded-t-full"></div>
                                            </div>
                                            
                                            <div className="absolute top-5 left-9 space-y-1">
                                                <div className="w-10 h-1 bg-zinc-800 rounded-full"></div>
                                                <div className="w-14 h-[3px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-8 h-[3px] bg-zinc-300 rounded-full"></div>
                                            </div>
                                            
                                            <div className="absolute bottom-2 left-9 space-y-1">
                                                <div className="w-12 h-[3px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-6 h-[3px] bg-zinc-300 rounded-full"></div>
                                            </div>
                                            
                                            <div className="absolute top-1/2 right-2 -translate-y-1/2 size-8 border-[2px] border-emerald-500/20 rounded-full flex items-center justify-center">
                                                <div className="size-5 border-[1px] border-emerald-500/20 rounded-full"></div>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-white/87 block">Valid ID</span>
                                        <span className="text-xs text-white/60 mt-2">PDF, JPG up to 5MB</span>
                                        
                                        {/* Tooltip for accepted IDs */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-4 bg-[#1e2330] text-left text-xs text-white/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/12 opacity-0 invisible group-hover/upload:opacity-100 group-hover/upload:visible transition-all duration-300 z-[60] w-64 pointer-events-none translate-y-2 group-hover/upload:translate-y-0">
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 bg-[#1e2330] border-b border-r border-white/12 rotate-45"></div>
                                            <span className="font-bold text-white/87 block mb-2 text-sm">Accepted Valid IDs:</span>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>Passport</li>
                                                <li>Driver&apos;s License</li>
                                                <li>National ID / PhilID</li>
                                                <li>UMID / SSS ID</li>
                                                <li>Voter&apos;s ID</li>
                                                <li>PRC ID</li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Business Permit (Paper) */}
                            <div className={`relative rounded-2xl border border-dashed p-3 text-center transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-h-[140px] group/upload hover:z-50 ${permitFile ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(109,152,56,0.15)]' : 'border-white/20 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'}`}>
                                <input 
                                    type="file" 
                                    title=""
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, setPermitFile, setPermitPreview)}
                                />
                                {permitFile ? (
                                    <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none">
                                        {permitPreview ? (
                                            <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden border border-white/10 group-hover/upload:scale-105 transition-transform duration-500">
                                                <img src={permitPreview} alt="Permit Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-500/20 rounded-full mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <FileCheck className="h-8 w-8 text-amber-500" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white/87 block truncate w-full px-2 text-center">{permitFile.name}</span>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPermitFile(null);
                                                setPermitPreview(null);
                                            }}
                                            className="mt-2 p-1.5 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/40 transition-colors pointer-events-auto"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* CSS Business Permit (Paper) Illustration */}
                                        <div className="relative w-20 h-28 bg-[#f8fafe] rounded-sm shadow-lg overflow-hidden mx-auto mb-4 group-hover/upload:scale-110 transition-transform duration-500 border-[3px] border-double border-blue-900/20 p-2 flex flex-col items-center">
                                            <div className="size-6 rounded-full border border-blue-800/30 flex items-center justify-center mb-1">
                                                <div className="size-3 bg-blue-800/20 rounded-full"></div>
                                            </div>
                                            <div className="text-[4px] font-black text-blue-900 text-center uppercase tracking-widest leading-tight">City<br/>Permit</div>
                                            <div className="w-10 h-[1px] bg-blue-900/30 mt-1 mb-1.5"></div>
                                            
                                            <div className="w-full space-y-1 mt-1">
                                                <div className="w-full h-1 bg-zinc-300 rounded-full"></div>
                                                <div className="w-full h-1 bg-zinc-300 rounded-full"></div>
                                                <div className="w-3/4 h-1 bg-zinc-300 rounded-full mx-auto"></div>
                                            </div>
                                            
                                            <div className="mt-auto w-full flex justify-between items-end px-1 pb-1">
                                                <div className="size-4 bg-yellow-400/80 rotate-45 border border-yellow-500/50 shadow-sm flex items-center justify-center">
                                                    <div className="size-2 border border-yellow-600/50 rotate-45"></div>
                                                </div>
                                                <div className="w-8 h-[2px] bg-blue-900/50 rounded-full"></div>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-white/87 block">Business Permit (Paper)</span>
                                        <span className="text-xs text-white/60 mt-2">PDF, JPG up to 5MB</span>
                                    </>
                                )}
                            </div>

                            {/* Business Permit (Card) */}
                            <div className={`relative rounded-2xl border border-dashed p-3 text-center transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-h-[140px] group/upload hover:z-50 ${permitCardFile ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(109,152,56,0.15)]' : 'border-white/20 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'}`}>
                                <input 
                                    type="file" 
                                    title=""
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, setPermitCardFile, setPermitCardPreview)}
                                />
                                {permitCardFile ? (
                                    <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none">
                                        {permitCardPreview ? (
                                            <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden border border-white/10 group-hover/upload:scale-105 transition-transform duration-500">
                                                <img src={permitCardPreview} alt="Card Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-500/20 rounded-full mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <FileCheck className="h-8 w-8 text-amber-500" />
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-white/87 block truncate w-full px-2 text-center">{permitCardFile.name}</span>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPermitCardFile(null);
                                                setPermitCardPreview(null);
                                            }}
                                            className="mt-2 p-1.5 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/40 transition-colors pointer-events-auto"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* CSS Business Permit Card Illustration */}
                                        <div className="relative w-32 h-20 bg-white rounded-lg shadow-lg overflow-hidden mx-auto mb-4 group-hover/upload:scale-110 transition-transform duration-500 border border-zinc-200">
                                            <div className="absolute top-0 left-0 w-20 h-10 bg-gradient-to-br from-blue-700 to-blue-500" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                                            <div className="absolute bottom-0 right-0 w-24 h-8 bg-gradient-to-tl from-cyan-500 to-blue-500" style={{ clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }}></div>
                                            
                                            <div className="absolute top-1.5 left-2 flex flex-col z-10 text-left">
                                                <span className="text-[3px] font-bold text-white/60 leading-none">City Government</span>
                                                <span className="text-[5px] font-black text-blue-800 leading-none mt-[1px]">BUSINESS PERMIT</span>
                                                <span className="text-[4px] font-black text-blue-600 leading-none mt-[1px]">2026</span>
                                            </div>
                                            
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[18px] font-black text-blue-900 tracking-tighter w-full text-center drop-shadow-sm">
                                                C-09241
                                            </div>
                                            
                                            <div className="absolute bottom-1.5 left-2 z-10 flex items-center gap-1">
                                                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-[0.5px] border-amber-500 flex items-center justify-center shadow-sm">
                                                    <div className="size-2 rounded-full border border-amber-600/50"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="w-4 h-[1.5px] bg-blue-400 rounded-full mb-[1px]"></div>
                                                    <div className="w-6 h-[2px] bg-red-400 rounded-full"></div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute bottom-1.5 right-6 z-10 flex items-center gap-1">
                                                <div className="w-3.5 h-3.5 bg-white border border-zinc-300 p-[1px] rounded-sm shadow-sm">
                                                    <div className="w-full h-full bg-zinc-800 grid grid-cols-2 gap-[0.5px] p-[0.5px]">
                                                        <div className="bg-white"></div><div className="bg-white"></div>
                                                        <div className="bg-white"></div><div className="bg-white"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-white/87 block">Business Permit (Card)</span>
                                        <span className="text-xs text-white/60 mt-2">PDF, JPG up to 5MB</span>
                                        <span className="text-[10px] text-amber-500 mt-2 font-bold flex items-center justify-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full"><Eye className="size-3"/> Publicly Visible</span>
                                    </>
                                )}
                            </div>

                            {/* Proof of Ownership */}
                            <div className={`relative rounded-2xl border border-dashed p-3 text-center transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-h-[140px] group/upload hover:z-50 ${ownershipFile ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(109,152,56,0.15)]' : 'border-white/20 bg-white/[0.02] hover:border-primary/40 hover:bg-white/[0.04]'}`}>
                                    <input 
                                        type="file" 
                                        title=""
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, setOwnershipFile, setOwnershipPreview)}
                                    />
                                    {ownershipFile ? (
                                        <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none">
                                            {ownershipPreview ? (
                                                <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden border border-white/10 group-hover/upload:scale-105 transition-transform duration-500">
                                                    <img src={ownershipPreview} alt="Ownership Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Image</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-amber-500/20 rounded-full mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                    <FileCheck className="h-8 w-8 text-amber-500" />
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-white/87 block truncate w-full px-2 text-center">{ownershipFile.name}</span>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOwnershipFile(null);
                                                    setOwnershipPreview(null);
                                                }}
                                                className="mt-2 p-1.5 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/40 transition-colors pointer-events-auto"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                    <>
                                        {/* CSS Proof of Ownership Illustration */}
                                        <div className="relative w-20 h-24 bg-[#fdfbf7] rounded-sm shadow-lg overflow-hidden mx-auto mb-4 group-hover/upload:scale-110 transition-transform duration-500 border border-zinc-300 p-2.5 flex flex-col">
                                            <div className="absolute top-1 left-1 right-1 h-[2px] border-t border-b border-amber-700/30"></div>
                                            <div className="text-[4px] font-black text-amber-900 text-center uppercase tracking-widest mt-1">Title of Deed</div>
                                            <div className="w-4 h-[1px] bg-amber-700/50 mx-auto mt-[1px] mb-1.5"></div>
                                            
                                            <div className="space-y-1 flex-1">
                                                <div className="w-full h-[2px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-5/6 h-[2px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-full h-[2px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-4/6 h-[2px] bg-zinc-300 rounded-full"></div>
                                                <div className="w-full h-[2px] bg-zinc-300 rounded-full"></div>
                                            </div>
                                            
                                            <div className="mt-auto flex justify-between items-end">
                                                <div className="size-4 rounded-full bg-red-700/80 border border-red-800 shadow-sm flex items-center justify-center">
                                                    <div className="size-2 rounded-full border border-red-900/30"></div>
                                                </div>
                                                <div className="flex flex-col items-end gap-[1px]">
                                                    <div className="w-8 h-[1px] bg-blue-900/40 rounded-full -rotate-2"></div>
                                                    <div className="w-10 h-[0.5px] bg-zinc-400"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-base font-bold text-white/87 block">Proof of Ownership</span>
                                        <span className="text-xs text-white/60 mt-2">PDF, JPG up to 5MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                    )}

                    {/* Navigation Buttons Area */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between max-w-2xl mx-auto mt-auto">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentStep(s => s - 1);
                                }}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/87 font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
                            >
                                Back
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={
                                loading || 
                                (currentStep === 1 && !otpVerified) ||
                                (currentStep === 3 && [idFile, permitFile, permitCardFile, ownershipFile].filter(Boolean).length < 3)
                            }
                            className={`group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-black py-3.5 px-6 font-bold text-sm transition-all duration-300 hover:bg-zinc-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${currentStep === 1 ? "sm:w-full" : "sm:flex-1"}`}
                        >
                            <span className="relative z-10 flex items-center gap-2 tracking-tight">
                                {loading ? "Processing..." : currentStep === 3 ? "Submit Application" : "Continue"}
                                {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />}
                            </span>
                            <div className="absolute inset-0 -translate-x-full rotate-[45deg] bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        </button>
                    </div>

                    {/* Terms checkbox only on step 3 */}
                    {currentStep === 3 && (
                        <div className="flex items-start gap-3 bg-[#1E1E1E]/40 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <input
                                required
                                type="checkbox"
                                id="terms"
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-offset-[#121212] cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-[11px] font-medium text-white/60 cursor-pointer select-none leading-relaxed">
                                I verify that the information provided is accurate. I agree to the <a href="#" className="text-white/87 font-bold hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="text-white/87 font-bold hover:text-primary transition-colors">Privacy Policy</a>.
                            </label>
                        </div>
                    )}
                </form>
                </div>
            </main>
            
            <style jsx global>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(200%) rotate(45deg);
                    }
                }
            `}</style>
        </div>
    );
}

