"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArrowLeft, Mail, ArrowRight } from "lucide-react";
import { useNavigation } from "../navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./EmailVerificationScreen.module.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function EmailVerificationScreen() {
    const { goBack, setRole, screenParams } = useNavigation();
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
    const [canResend, setCanResend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const email = (screenParams.email as string) || "your email address";
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 300);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) {
            setCanResend(true);
            return;
        }
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Handle OTP input change
    const handleChange = useCallback(
        (index: number, value: string) => {
            // Only allow digits
            const digit = value.replace(/\D/g, "").slice(-1);
            const newOtp = [...otp];
            newOtp[index] = digit;
            setOtp(newOtp);

            // Auto-advance to next input
            if (digit && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [otp]
    );

    // Handle backspace
    const handleKeyDown = useCallback(
        (index: number, e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace" && !otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
            }
        },
        [otp]
    );

    // Handle paste
    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault();
            const pastedData = e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LENGTH);

            if (pastedData) {
                const newOtp = [...otp];
                pastedData.split("").forEach((char, i) => {
                    if (i < OTP_LENGTH) newOtp[i] = char;
                });
                setOtp(newOtp);

                // Focus the next empty or last input
                const nextEmpty = newOtp.findIndex((v) => !v);
                const focusIndex = nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty;
                inputRefs.current[focusIndex]?.focus();
            }
        },
        [otp]
    );

    // Handle resend
    const handleResend = () => {
        if (!canResend) return;
        setCountdown(RESEND_COOLDOWN);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
    };

    // Handle verify
    const handleVerify = async () => {
        const code = otp.join("");
        if (code.length !== OTP_LENGTH) return;

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'signup',
            });

            if (verifyError) throw verifyError;

            // Success! Get user role and navigate
            const userRole = data.user?.user_metadata?.role || "tenant";
            setRole(userRole as "tenant" | "landlord");
        } catch (err: any) {
            setError(err.message || "Invalid or expired verification code.");
        } finally {
            setIsLoading(false);
        }
    };

    const isComplete = otp.every((digit) => digit !== "");

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
            </div>

            {/* Animated Icon */}
            <div className={styles.iconArea}>
                <div className={styles.iconCircle}>
                    <Mail />
                </div>
                <div className={`${styles.sparkle} ${styles.sparkle1}`} />
                <div className={`${styles.sparkle} ${styles.sparkle2}`} />
                <div className={`${styles.sparkle} ${styles.sparkle3}`} />
            </div>

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Verify Your Email</h1>
                <p className={styles.headerSub}>
                    We sent a 6-digit code to{" "}
                    <span className={styles.headerEmail}>{email}</span>. Enter
                    the code below to verify.
                </p>
            </div>

            {/* Error Message */}
            {error && <p className={styles.errorMessage} style={{ 
                color: '#ef4444', 
                fontSize: '13px', 
                textAlign: 'center', 
                marginBottom: '16px',
                fontWeight: '600'
            }}>{error}</p>}

            {/* OTP Inputs */}
            <div className={styles.otpRow}>
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        className={`${styles.otpInput} ${digit ? styles.otpFilled : ""}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        placeholder="·"
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        autoComplete="one-time-code"
                    />
                ))}
            </div>

            {/* Verify Button */}
            <button
                className={styles.verifyButton}
                onClick={handleVerify}
                disabled={!isComplete || isLoading}
            >
                {isLoading ? "Verifying..." : "Verify & Continue"}
                {!isLoading && <ArrowRight />}
            </button>

            {/* Resend Area */}
            <div className={styles.resendArea}>
                {canResend ? (
                    <button className={styles.resendButton} onClick={handleResend}>
                        Resend Code
                    </button>
                ) : (
                    <p className={styles.resendText}>
                        Resend code in{" "}
                        <span className={styles.resendTimer}>0:{countdown.toString().padStart(2, "0")}</span>
                    </p>
                )}
                <button className={styles.changeEmail} onClick={goBack}>
                    Change email address
                </button>
            </div>
        </div>
    );
}
