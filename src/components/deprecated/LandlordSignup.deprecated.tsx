/**
 * @deprecated [DEPRECATED - Turnkey Architecture]
 * Legacy multi-tenant self-serve landlord registration wizard.
 * Retained for non-destructive technical reference only.
 * Excluded from active turnkey system architecture, documentation, and diagrams.
 */
"use client";

import Image from 'next/image';
import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2, Upload, FileCheck, Check, Eye, Trash2, FileText } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveWizardState, loadWizardState, clearWizardState } from "@/lib/wizard-storage";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

export function DeprecatedLandlordSignUp() {
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
    const correctOtp = useRef("");
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

    const toastShown = useRef(false);

    useEffect(() => {
        if (toastShown.current) return;
        toastShown.current = true;

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
            if (savedState.correctOtp) correctOtp.current = savedState.correctOtp as string;
        }
    }, []);

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
                correctOtp.current = data.otp;
                toast.success("Verification code sent!");
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
            toast.error("Please enter the verification code.");
            return;
        }

        if (verificationCode !== correctOtp.current) {
            toast.error("Invalid verification code.");
            return;
        }

        setOtpVerified(true);
        toast.success("Email verified successfully!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < 3) {
            if (currentStep === 1 && !otpVerified) {
                toast.warning("Please verify your email first.");
                return;
            }
            setCurrentStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSubmitted(true);
    };

    return submitted ? (
        <div className="flex min-h-screen bg-[#121212] text-white/87 font-sans items-center justify-center p-6">
            <div className="max-w-md w-full p-8 text-center space-y-6 bg-white/[0.02] border border-white/12 rounded-3xl">
                <CheckCircle2 className="size-16 text-primary mx-auto" />
                <h2 className="text-2xl font-black">Application Submitted</h2>
                <Link href="/login" className="inline-block w-full py-3 bg-primary text-white rounded-xl font-bold">
                    Return to Login
                </Link>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white p-6 items-center justify-center">
            <p className="text-sm text-white/60">This registration wizard has been deprecated in the Turnkey architecture.</p>
            <Link href="/login" className="mt-4 px-6 py-2 bg-primary rounded-xl font-bold">Go to Login</Link>
        </div>
    );
}
