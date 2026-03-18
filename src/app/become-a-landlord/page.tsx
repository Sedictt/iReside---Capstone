"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ChevronRight, User, Phone, ShieldCheck, Upload, FileText, Camera, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function BecomeLandlordContent() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        phone: profile?.phone || "",
        identityDocument: null as File | null,
        ownershipDocument: null as File | null,
        livenessDocument: null as File | null,
        agreedToTerms: false,
    });

    useEffect(() => {
        // Redirection logic
        if (!loading && !user) {
            router.push("/login?redirect=/become-a-landlord");
        }
        if (!loading && profile?.role === 'landlord') {
            router.push("/landlord/dashboard");
        }
        if (profile?.phone && step === 1 && !formData.phone) {
            setFormData(prev => ({ ...prev, phone: profile.phone! }));
        }
    }, [user, profile, loading, router]);

    const handleUpgrade = async () => {
        setSubmitting(true);
        setError(null);

        if (!formData.identityDocument || !formData.ownershipDocument || !formData.livenessDocument) {
             setError("Please make sure all required documents are uploaded.");
             setSubmitting(false);
             return;
        }

        try {
            const uploadData = new FormData();
            uploadData.append("phone", formData.phone);
            uploadData.append("identityDocument", formData.identityDocument);
            uploadData.append("ownershipDocument", formData.ownershipDocument);
            uploadData.append("livenessDocument", formData.livenessDocument);

            const response = await fetch("/api/landlord-applications", {
                method: "POST",
                body: uploadData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit application.");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading || !user || profile?.role === 'landlord') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary/30">
            {/* LEFT PANEL */}
            <div className="relative hidden w-[45%] flex-col overflow-hidden lg:flex">
                <img
                    src="/hero-images/apartment-01.png"
                    alt="Luxury modern building"
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a]/95 to-black/20" />
                <div className="absolute inset-0 bg-black/10" />

                <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                            iReside
                        </span>
                    </div>

                    <div className="flex flex-col flex-1 max-w-md">
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
                            List. Manage. Grow.
                        </h1>
                        <p className="text-lg text-neutral-400 mb-16">
                            Join our verified network of property owners. Gain access to premium management tools and find reliable tenants securely.
                        </p>
                        
                        {/* Vertical Stepper */}
                        <div className="space-y-0 mt-4 relative">
                            {/* Line connecting steps */}
                            <div className="absolute left-6 top-8 bottom-12 w-[2px] bg-neutral-800 -ml-[1px]" />
                            
                            {/* Step 1 */}
                            <div className="flex gap-6 relative pb-10">
                                <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold z-10 transition-all duration-500 shadow-xl
                                 ${step === 1 ? 'border-primary bg-[#0a0a0a] text-primary shadow-primary/20' : step > 1 ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-800 bg-[#0a0a0a] text-neutral-600'}`}>
                                    {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                                </div>
                                <div className="pt-2.5">
                                    <h3 className={`font-bold text-lg transition-colors ${step >= 1 ? 'text-white' : 'text-neutral-500'}`}>Contact Details</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Verify your identity profile</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-6 relative pb-10">
                                <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold z-10 transition-all duration-500 shadow-xl
                                 ${step === 2 ? 'border-primary bg-[#0a0a0a] text-primary shadow-primary/20' : step > 2 ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-800 bg-[#0a0a0a] text-neutral-600'}`}>
                                    {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                                </div>
                                <div className="pt-2.5">
                                    <h3 className={`font-bold text-lg transition-colors ${step >= 2 ? 'text-white' : 'text-neutral-500'}`}>Verify Documents</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Proof of ownership & ID</p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-6 relative">
                                <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold z-10 transition-all duration-500 shadow-xl
                                 ${step === 3 && !success ? 'border-primary bg-[#0a0a0a] text-primary shadow-primary/20' : success ? 'border-primary bg-primary/10 text-primary shadow-primary/20' : 'border-neutral-800 bg-[#0a0a0a] text-neutral-600'}`}>
                                    {success ? <CheckCircle2 className="h-5 w-5" /> : "3"}
                                </div>
                                <div className="pt-2.5">
                                    <h3 className={`font-bold text-lg transition-colors ${step >= 3 ? 'text-white' : 'text-neutral-500'}`}>Review & Submit</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Finalize your application</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-12">
                        <Link href="/tenant/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - WIZARD */}
            <div className="flex w-full flex-col justify-center px-6 lg:w-[55%] xl:w-[55%] items-center relative py-12">
                
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="lg:hidden absolute top-6 flex items-center justify-between w-full px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight">iReside</span>
                    </div>
                    <Link href="/tenant/dashboard" className="text-xs font-semibold text-neutral-400">Cancel</Link>
                </div>

                <div className="w-full max-w-[500px] relative z-10">
                    
                    {error && (
                        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!success && (
                        <div className="mb-10 lg:hidden flex gap-2 w-full mt-8">
                           <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-neutral-800'}`} />
                           <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-neutral-800'}`} />
                           <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-neutral-800'}`} />
                        </div>
                    )}

                    {success ? (
                        <div className="flex flex-col items-center justify-center text-center py-6 animate-in zoom-in-95 duration-500">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full" />
                                <div className="h-28 w-28 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center relative shadow-inner">
                                    <CheckCircle2 className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">Application Sent</h2>
                            <p className="text-neutral-400 text-lg max-w-sm mx-auto mb-8">
                                Your documents have been securely transmitted to our administrative team for review.
                            </p>
                            
                            <div className="p-6 rounded-[24px] bg-primary/10 border border-primary/20 w-full mb-8 text-left flex gap-4 items-start">
                                <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
                                <div>
                                    <h4 className="font-bold text-white text-base">Under Review</h4>
                                    <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed">
                                        Approval usually takes 1-2 business days. You will receive an email confirmation once your portal is unlocked.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/tenant/dashboard')}
                                className="w-full rounded-2xl border border-neutral-700 bg-[#171717] text-white py-4.5 font-bold shadow-md hover:bg-neutral-800 hover:text-white transition-all active:scale-[0.98]"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-3">
                                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Contact Info</h2>
                                        <p className="text-neutral-400 text-lg">Verify the primary contact details for your landlord profile.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-600" />
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={profile?.full_name || ""}
                                                    className="w-full rounded-2xl bg-[#171717] border border-neutral-800 pl-12 pr-4 py-4 text-neutral-400 cursor-not-allowed opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Email Address</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={profile?.email || ""}
                                                className="w-full rounded-2xl bg-[#171717] border border-neutral-800 px-5 py-4 text-neutral-400 cursor-not-allowed opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-300 ml-1">Phone Number <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="+63 912 345 6789"
                                                    className="w-full rounded-2xl bg-[#0a0a0a] border border-neutral-700 hover:border-neutral-600 focus:border-primary focus:ring-4 focus:ring-primary/10 pl-12 pr-4 py-4 text-white placeholder-neutral-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (formData.phone) setStep(2);
                                            else setError("Please enter your phone number.");
                                        }}
                                        className="w-full group rounded-2xl bg-primary text-white py-4 font-bold tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        Continue to Documents <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-3">
                                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Verification</h2>
                                        <p className="text-neutral-400 text-lg">Upload official documents to secure your property listings.</p>
                                        <div className="flex items-center gap-2 mt-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                                            <p className="text-xs text-emerald-300 font-medium">Your information is encrypted and securely stored. It will not be shared publicly.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {/* ID Document */}
                                        <div className={`relative overflow-hidden rounded-2xl border ${formData.identityDocument ? 'border-primary/50 bg-primary/5' : 'border-neutral-700 bg-[#171717]'} p-1.5 transition-all`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0a0a0a] rounded-[10px] gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${formData.identityDocument ? 'bg-primary/10 text-primary' : 'bg-neutral-800 text-neutral-400'}`}>
                                                        <Upload className="h-6 w-6" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-white">Government ID</h4>
                                                        <p className="text-xs text-neutral-400 truncate max-w-[200px]">{formData.identityDocument ? formData.identityDocument.name : "Passport, Driver's License"}</p>
                                                    </div>
                                                </div>
                                                <label className={`cursor-pointer rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors text-center shrink-0 ${formData.identityDocument ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                                                    {formData.identityDocument ? 'Change' : 'Browse'}
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFormData({...formData, identityDocument: e.target.files?.[0] || null})} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Ownership Document */}
                                        <div className={`relative overflow-hidden rounded-2xl border ${formData.ownershipDocument ? 'border-primary/50 bg-primary/5' : 'border-neutral-700 bg-[#171717]'} p-1.5 transition-all`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0a0a0a] rounded-[10px] gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${formData.ownershipDocument ? 'bg-primary/10 text-primary' : 'bg-neutral-800 text-neutral-400'}`}>
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-white">Proof of Ownership</h4>
                                                        <p className="text-xs text-neutral-400 truncate max-w-[200px]">{formData.ownershipDocument ? formData.ownershipDocument.name : "Deed or Tax forms"}</p>
                                                    </div>
                                                </div>
                                                <label className={`cursor-pointer rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors text-center shrink-0 ${formData.ownershipDocument ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                                                    {formData.ownershipDocument ? 'Change' : 'Browse'}
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFormData({...formData, ownershipDocument: e.target.files?.[0] || null})} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Liveness Document */}
                                        <div className={`relative overflow-hidden rounded-2xl border ${formData.livenessDocument ? 'border-primary/50 bg-primary/5' : 'border-neutral-700 bg-[#171717]'} p-1.5 transition-all`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0a0a0a] rounded-[10px] gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${formData.livenessDocument ? 'bg-primary/10 text-primary' : 'bg-neutral-800 text-neutral-400'}`}>
                                                        <Camera className="h-6 w-6" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-white">Selfie Check</h4>
                                                        <p className="text-xs text-neutral-400 truncate max-w-[200px]">{formData.livenessDocument ? formData.livenessDocument.name : "Clear selfie holding ID"}</p>
                                                    </div>
                                                </div>
                                                <label className={`cursor-pointer rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors text-center shrink-0 ${formData.livenessDocument ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}>
                                                    {formData.livenessDocument ? 'Change' : 'Capture'}
                                                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => setFormData({...formData, livenessDocument: e.target.files?.[0] || null})} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => setStep(1)}
                                            disabled={submitting}
                                            className="rounded-2xl border border-neutral-700 bg-[#0a0a0a] px-8 py-4 font-bold text-neutral-300 hover:bg-[#171717] transition-all hover:text-white disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!formData.identityDocument || !formData.ownershipDocument || !formData.livenessDocument) {
                                                    setError("Please provide all three verification documents to proceed.");
                                                } else {
                                                    setError(null);
                                                    setStep(3);
                                                }
                                            }}
                                            disabled={submitting}
                                            className="flex-1 group rounded-2xl bg-primary text-white py-4 font-bold tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Review Application <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-3">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-2 border border-primary/20">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Final Step</h2>
                                        <p className="text-neutral-400 text-lg">Review and agree to our terms before submitting.</p>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-[#171717] border border-neutral-700 space-y-4 shadow-inner">
                                        <div className="flex items-start gap-4">
                                            <input 
                                                type="checkbox" 
                                                id="terms" 
                                                checked={formData.agreedToTerms}
                                                onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})}
                                                className="mt-1 h-5 w-5 shrink-0 rounded-[6px] border-neutral-600 bg-[#0a0a0a] text-primary focus:ring-primary focus:ring-offset-[#0a0a0a] cursor-pointer" 
                                            />
                                            <label htmlFor="terms" className="text-neutral-300 cursor-pointer text-sm leading-relaxed">
                                                I confirm that all uploaded documents are authentic and accurate. I agree to the iReside <span className="text-primary hover:opacity-80 hover:underline">Terms of Service</span>, <span className="text-primary hover:opacity-80 hover:underline">Landlord Agreement</span>, and <span className="text-primary hover:opacity-80 hover:underline">Privacy Policy</span>.
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={submitting}
                                            className="rounded-2xl border border-neutral-700 bg-[#0a0a0a] px-8 py-4 font-bold text-neutral-300 hover:bg-[#171717] transition-all hover:text-white disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleUpgrade}
                                            disabled={submitting || !formData.agreedToTerms}
                                            className="flex-1 group rounded-2xl bg-primary text-white py-4 font-bold tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>Submit Application <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BecomeLandlordPage() {
    return (
        <AuthProvider>
            <BecomeLandlordContent />
        </AuthProvider>
    );
}
