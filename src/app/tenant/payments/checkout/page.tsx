"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Smartphone,
    Wallet,
    Landmark,
    ShieldCheck,
    Receipt,
    Hourglass,
    Upload,
    Sparkles,
    Check,
    ChevronRight,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PaymentMethod = "ewallet" | "cash";

export default function CheckoutPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<"pending" | "successful">("pending");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    useEffect(() => {
        if (step === 3 && selectedMethod === 'cash') {
            const interval = setInterval(() => {
                const status = localStorage.getItem('pendingInPersonPayment');
                if (status === 'completed') {
                    setPaymentStatus('successful');
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        } else if (step === 3) {
            setPaymentStatus('successful');
        }
    }, [step, selectedMethod]);

    const handleNext = () => {
        if (step === 1 && selectedMethod) setStep(2);
        else if (step === 2) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep((prev) => prev - 1 as 1 | 2 | 3);
        else router.push("/tenant/payments");
    };

    const handleProcessPayment = () => {
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            if (selectedMethod === 'cash') {
                localStorage.setItem('pendingInPersonPayment', 'true');
            }
            setStep(3);
        }, 2000);
    };

    const totalAmount = 18500 + (selectedMethod === 'ewallet' && step === 2 ? 25 : 0);

    return (
        <div className="min-h-screen pb-20 relative selection:bg-primary/30 text-foreground">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6 animate-in fade-in duration-700">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all bg-card hover:bg-muted px-4 py-1.5 rounded-full border border-border shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Secure SSL Checkout</span>
                    </div>
                </div>

                {/* Title & Progress Tracker (Full Width Header) */}
                <div className="space-y-6 mb-8 flex flex-col items-center text-center">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-muted-foreground mb-2">
                            Checkout
                        </h1>
                        <p className="text-muted-foreground text-sm">Complete your payment for <span className="text-foreground font-medium">October 2026</span></p>
                    </div>

                    {/* Refined Progress Bar */}
                    <div className="relative pt-1 pb-4 w-full max-w-3xl">
                        <div className="absolute left-0 top-[14px] w-full h-1 bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-700 ease-in-out"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />
                        </div>
                        <div className="relative flex justify-between z-10 w-full">
                            {[
                                { step: 1, label: "Method", desc: "Select option" },
                                { step: 2, label: "Details", desc: "Verify info" },
                                { step: 3, label: "Success", desc: "Confirmation" }
                            ].map((s) => (
                                <div key={s.step} className="flex flex-col items-center gap-2 bg-background/90 px-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-xl",
                                        step > s.step ? "bg-primary text-black shadow-primary/20 scale-95" :
                                            step === s.step ? "bg-primary text-black ring-4 ring-primary/20 shadow-primary/30 scale-110" :
                                                "bg-card border border-border text-muted-foreground"
                                    )}>
                                        {step > s.step ? <Check className="w-4 h-4" /> : s.step}
                                    </div>
                                    <div className="text-center absolute -bottom-4 w-24">
                                        <div className={cn(
                                            "text-xs font-semibold transition-colors duration-300",
                                            step >= s.step ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {s.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 pt-0">
                    {/* Left Column: Form & Steps */}
                    <div className="flex-1 space-y-6">

                        {/* Step 1: Payment Method */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 fade-in delay-150 fill-mode-both">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-card border border-border shadow-sm">
                                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Select a payment method</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {[
                                        { id: "ewallet", icon: Smartphone, label: "GCash", desc: "Instant transfer via app", color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400", bgIcon: "bg-blue-500/10", borderActive: "border-blue-500", glowActive: "shadow-blue-500/20" },
                                        { id: "cash", icon: Wallet, label: "In-Person", desc: "Pay directly to landlord", color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400", bgIcon: "bg-emerald-500/10", borderActive: "border-emerald-500", glowActive: "shadow-emerald-500/20" }
                                    ].map((method) => {
                                        const MethodIcon = method.icon;
                                        return (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                                                className={cn(
                                                    "group relative flex flex-col items-start p-6 text-left transition-all duration-300 overflow-hidden rounded-2xl border",
                                                    selectedMethod === method.id
                                                        ? `bg-gradient-to-br ${method.color} ${method.borderActive} shadow-lg ${method.glowActive} scale-[1.02]`
                                                        : "bg-card border-border hover:border-primary/20 hover:bg-muted/40 shadow-sm"
                                                )}
                                            >
                                                {/* Hover Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex items-center justify-between w-full mb-6 relative z-10">
                                                    <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-500", selectedMethod === method.id ? method.bgIcon : "bg-muted")}>
                                                        <MethodIcon className={cn("w-6 h-6", selectedMethod === method.id ? method.iconColor : "text-muted-foreground")} />
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                        selectedMethod === method.id ? method.borderActive : "border-border"
                                                    )}>
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                                            selectedMethod === method.id ? `bg-current ${method.iconColor}` : "bg-transparent scale-0"
                                                        )} />
                                                    </div>
                                                </div>
                                                <div className="relative z-10">
                                                    <h3 className="text-xl font-bold text-foreground mb-1">{method.label}</h3>
                                                    <p className="text-sm text-muted-foreground">{method.desc}</p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Details */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 fade-in fill-mode-both">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-card border border-border shadow-sm">
                                        {selectedMethod === 'ewallet' ? <Smartphone className="w-5 h-5 text-blue-400" /> : <Wallet className="w-5 h-5 text-emerald-400" />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Payment Details</h2>
                                </div>

                                {selectedMethod === 'ewallet' && (
                                    <div className="space-y-8">
                                        <div className="relative overflow-hidden bg-gradient-to-b from-card to-background border border-border rounded-3xl p-8 backdrop-blur-md shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
                                            {/* Decorative Elements */}
                                            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />

                                            <div className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto relative z-10">
                                                {/* QR Section */}
                                                <div className="flex flex-col items-center w-full group">
                                                    <div className="bg-muted inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-border backdrop-blur-md shrink-0">
                                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                                        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">Scan to Pay</span>
                                                    </div>
                                                    <div className="w-full rounded-3xl p-1 relative shadow-2xl shadow-blue-500/20 overflow-hidden bg-gradient-to-bl from-blue-400/20 via-primary/20 to-purple-500/20">
                                                        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-0" />
                                                        <div className="relative z-10 w-full aspect-square bg-white rounded-[1.3rem] overflow-hidden border border-border flex items-center justify-center p-4 shadow-inner">
                                                            <img
                                                                src="/gcash-qr.png"
                                                                alt="GCash QR Code Form"
                                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement?.classList.add('p-6');
                                                                    if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = '<div class="text-blue-400 text-sm text-center flex flex-col items-center gap-3 w-full"><svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Please save QR image as<br/>public/gcash-qr.png</span></div>';
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Manual Send Section below QR */}
                                                <div className="w-full bg-muted/35 border border-border rounded-2xl p-5 text-center backdrop-blur-sm flex flex-col items-center">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Or Send Manually</p>
                                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/52/GCash_logo.svg" alt="GCash" className="h-6 w-auto object-contain bg-white rounded-md px-2 py-1 shadow-sm" />
                                                        <p className="font-mono text-xl font-bold tracking-wider text-foreground">0917 123 4567</p>
                                                    </div>
                                                    <p className="text-sm font-medium text-blue-400 mt-2">Juan Dela Cruz</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h3 className="text-lg font-semibold text-foreground">Upload Transfer Receipt</h3>
                                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-3xl cursor-pointer bg-card/70 hover:bg-muted/40 hover:border-primary/50 transition-all duration-300 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                                {receiptFile ? (
                                                    <div className="flex flex-col items-center gap-3 z-10 animate-in zoom-in-95 duration-300">
                                                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                            <CheckCircle2 className="w-7 h-7" />
                                                        </div>
                                                        <span className="text-base font-semibold text-emerald-400">{receiptFile.name}</span>
                                                        <span className="text-xs text-muted-foreground">Click to change file</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                                                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110 transition-all duration-500">
                                                            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-muted-foreground font-medium">PNG, JPG or JPEG (MAX. 5MB)</p>
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setReceiptFile(e.target.files[0]);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {selectedMethod === 'cash' && (
                                    <div className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl p-10 text-center">
                                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full mx-auto p-4 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 relative">
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                                            <Wallet className="w-10 h-10" />
                                        </div>
                                        <div className="max-w-md mx-auto space-y-4">
                                            <h3 className="font-extrabold text-foreground text-3xl">Pay In-Person</h3>
                                            <p className="text-muted-foreground text-lg leading-relaxed">
                                                Prepare the exact amount of <span className="font-bold text-foreground">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> and hand it directly to your landlord or property manager.
                                            </p>
                                            <div className="pt-4 flex items-center justify-center gap-2 text-emerald-400/80 text-sm">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span>Session will track confirmation live</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Success or Pending */}
                        {step === 3 && (
                            <div className="relative rounded-3xl border border-border bg-card/95 p-8 sm:p-14 backdrop-blur-md animate-in zoom-in-95 duration-700 text-center flex flex-col items-center overflow-hidden shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                                {paymentStatus === "pending" ? (
                                    <>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
                                        <div className="w-24 h-24 bg-gradient-to-b from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mb-8 relative z-10 border border-amber-500/30">
                                            <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20 duration-1000" />
                                            <Hourglass className="w-10 h-10 text-amber-400 animate-pulse" />
                                        </div>
                                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground mb-4 z-10">Awaiting Confirmation</h2>
                                        <p className="text-muted-foreground mb-10 max-w-md text-lg z-10">
                                            Your landlord has been notified. Hand the cash amount to them directly. This screen will update automatically once confirmed.
                                        </p>
                                        <div className="w-full max-w-sm bg-background/90 backdrop-blur-xl border border-border rounded-3xl p-8 z-10 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.25)]">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Amount Due</span>
                                                <span className="text-4xl font-black text-amber-400 tracking-tight">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
                                        <div className="w-24 h-24 bg-gradient-to-b from-emerald-400/20 to-emerald-600/20 rounded-full flex items-center justify-center mb-8 relative z-10 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 duration-1000" />
                                            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                        </div>
                                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground mb-4 z-10">Payment Successful!</h2>
                                        <p className="text-muted-foreground mb-10 max-w-md text-lg z-10">
                                            Thank you! We've sent a detailed electronic receipt to your email address and updated your account balance.
                                        </p>

                                        <div className="w-full max-w-md bg-background/90 backdrop-blur-xl border border-border rounded-3xl p-8 text-left mb-10 z-10 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.25)] space-y-5">
                                            <div className="flex justify-between items-center pb-5 border-b border-border">
                                                <span className="text-sm font-medium text-muted-foreground">Amount Paid</span>
                                                <span className="text-2xl font-black text-foreground">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Reference No.</span>
                                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">TXN-8842-991A</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-muted-foreground">Date & Time</span>
                                                <span className="text-sm font-semibold text-foreground">{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md z-10">
                                            <button className="flex-1 bg-card hover:bg-muted text-foreground font-bold py-4 px-6 rounded-2xl transition-all border border-border flex items-center justify-center gap-2 hover:border-primary/20 shadow-sm">
                                                <Receipt className="w-5 h-5" />
                                                Get Receipt
                                            </button>
                                            <Link href="/tenant/dashboard" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] duration-300">
                                                Return Home
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Summary (Sticky) */}
                    <div className="lg:w-[400px] w-full shrink-0">
                        <div className="sticky top-24 rounded-3xl border border-border bg-card/95 backdrop-blur-xl overflow-hidden shadow-[0_24px_70px_-36px_rgba(15,23,42,0.28)] relative">
                            {/* Shiny Top Edge */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

                            {/* Receipt Header */}
                            <div className="p-6 border-b border-border flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Payment Summary</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Auto-generated Invoice</p>
                                </div>
                            </div>

                            {/* Receipt Body */}
                            <div className="px-6 py-8">
                                <div className="space-y-6 mb-8 relative">
                                    <div className="flex items-start justify-between group">
                                        <div>
                                            <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Base Rent</p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Unit 304 • October</p>
                                        </div>
                                        <span className="text-base font-bold text-foreground">₱18,000.00</span>
                                    </div>
                                    <div className="flex items-start justify-between group">
                                        <div>
                                            <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Water Utility</p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Est. 12m³</p>
                                        </div>
                                        <span className="text-base font-bold text-foreground">₱500.00</span>
                                    </div>

                                    {selectedMethod === 'ewallet' && step === 2 && (
                                        <div className="flex items-start justify-between pt-6 border-t border-dashed border-border animate-in slide-in-from-top-2 fade-in group duration-500">
                                            <div>
                                                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">Convenience Fee</p>
                                                <p className="text-sm text-muted-foreground font-medium mt-0.5">Fixed rate</p>
                                            </div>
                                            <span className="text-base font-bold text-foreground">₱25.00</span>
                                        </div>
                                    )}
                                </div>

                                {/* Total Area with cutouts */}
                                <div className="pt-8 border-t-2 border-dashed border-border mb-8 relative">
                                    {/* Receipt Cutout details */}
                                    <div className="absolute -left-9 -top-3 w-6 h-6 bg-card rounded-full border border-border border-r-transparent border-b-transparent -rotate-45" />
                                    <div className="absolute -right-9 -top-3 w-6 h-6 bg-card rounded-full border border-border border-l-transparent border-b-transparent rotate-45" />

                                    <div className="flex bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-4 rounded-2xl border border-primary/20 items-center justify-between shadow-inner">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Due</span>
                                            <span className="text-[10px] text-primary/60 font-medium">Includes all fees</span>
                                        </div>
                                        <span className="text-2xl font-black text-primary tracking-tight">
                                            ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                {step < 3 && (
                                    <button
                                        onClick={step === 1 ? handleNext : handleProcessPayment}
                                        disabled={(step === 1 && !selectedMethod) || isProcessing || (step === 2 && selectedMethod === 'ewallet' && !receiptFile)}
                                        className={cn(
                                            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group text-lg",
                                            (step === 1 && !selectedMethod) || isProcessing || (step === 2 && selectedMethod === 'ewallet' && !receiptFile)
                                                ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                                                : "bg-primary text-black hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                                        )}
                                    >
                                        {/* Shine effect for active button */}
                                        {(!((step === 1 && !selectedMethod) || isProcessing || (step === 2 && selectedMethod === 'ewallet' && !receiptFile))) && (
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] duration-1000 transition-transform ease-out" />
                                        )}

                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
                                                <span className="tracking-wide">Processing...</span>
                                            </>
                                        ) : step === 1 ? (
                                            <>
                                                Continue to Details <ChevronRight className="w-5 h-5 ml-1" />
                                            </>
                                        ) : (
                                            <>
                                                Confirm Payment <CheckCircle2 className="w-5 h-5 ml-1 opacity-80" />
                                            </>
                                        )}
                                    </button>
                                )}

                                {step === 1 && (
                                    <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground bg-muted/40 py-2 rounded-xl border border-border">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Secure Payments</span>
                                    </div>
                                )}

                                {/* Trust Badges */}
                                <div className="flex items-center justify-center gap-6 mt-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                    {/* Logos for trust - placeholder styled like real logos */}
                                    <div className="font-bold text-sm tracking-tight flex items-center gap-1">
                                        <Lock className="w-4 h-4" /> SSL Secured
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-neutral-600" />
                                    <div className="font-bold text-sm tracking-tight">Verified Property</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
