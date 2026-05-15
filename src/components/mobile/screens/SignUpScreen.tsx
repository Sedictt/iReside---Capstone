"use client";

import { useState } from "react";
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    Home,
    Building2,
    ArrowRight,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./SignUpScreen.module.css";

type RoleOption = "tenant" | "landlord" | null;

export default function SignUpScreen() {
    const { navigate, goBack } = useNavigation();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleOption>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [step, setStep] = useState<1 | 2>(1);

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const isFormValid = agreedToTerms && selectedRole; // Only disable if checkbox or role is missing

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        const newErrors: Record<string, string> = {};

        // 1. Check for empty fields
        if (!fullName.trim()) newErrors.fullName = "Full name is required.";
        if (!email.trim()) newErrors.email = "Email is required.";
        if (!password.trim()) newErrors.password = "Password is required.";
        if (!confirmPassword.trim()) newErrors.confirmPassword = "Confirm your password.";

        // 2. Check email format (if not empty)
        if (email.trim() && !validateEmail(email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        // 3. Check password match (if not empty)
        if (password.trim() && confirmPassword.trim() && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        // If there are any validation errors, stop here
        if (Object.keys(newErrors).length > 0) return;

        setIsLoading(true);

        try {
            // Call our new custom Send OTP API
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error?.includes("registered")) {
                    setErrors({ email: "This email is already registered." });
                } else {
                    alert(data.error || "Failed to send code");
                }
                setIsLoading(false);
                return;
            }

            // Navigate to verification screen with user data for final creation
            navigate("emailVerification", { 
                email: email.trim(),
                registrationData: {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password,
                    role: selectedRole
                }
            });
        } catch (err: any) {
            alert("Something went wrong during sign up.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setErrors({}); // Clear errors when going back
        } else {
            goBack();
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ArrowLeft />
                </button>
            </div>

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>
                    {step === 1 ? "Choose your role" : "Create Account"}
                </h1>
                <p className={styles.headerSub}>
                    {step === 1 
                        ? "Are you registering as a tenant or a landlord?" 
                        : `Signing up as a ${selectedRole}. Please enter your details below.`}
                </p>
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
                <div className={styles.roleSelectionContent}>
                    <div className={styles.roleCards}>
                        {/* Tenant Card */}
                        <div
                            className={`${styles.roleCard} ${selectedRole === "tenant" ? styles.roleCardActive : ""}`}
                            onClick={() => {
                                setSelectedRole("tenant");
                                setStep(2);
                            }}
                        >
                            <div className={`${styles.roleIconBox} ${selectedRole === "tenant" ? styles.roleIconActive : styles.roleIconDefault}`}>
                                <Home />
                            </div>
                            <span className={styles.roleTitle}>Tenant</span>
                        </div>

                        {/* Landlord Card */}
                        <div
                            className={`${styles.roleCard} ${selectedRole === "landlord" ? styles.roleCardActive : ""}`}
                            onClick={() => {
                                setSelectedRole("landlord");
                                setStep(2);
                            }}
                        >
                            <div className={`${styles.roleIconBox} ${selectedRole === "landlord" ? styles.roleIconActive : styles.roleIconDefault}`}>
                                <Building2 />
                            </div>
                            <span className={styles.roleTitle}>Landlord</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Account Details */}
            {step === 2 && (
                <div className={styles.form}>
                    {/* Full Name */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Full Name</label>
                        <div className={`${styles.inputWrapper} ${errors.fullName ? styles.inputWrapperError : ""}`}>
                            <User className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                                }}
                                autoComplete="name"
                            />
                        </div>
                        {errors.fullName && (
                            <span className={styles.inlineError}>{errors.fullName}</span>
                        )}
                    </div>

                    {/* Email */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Email</label>
                        <div className={`${styles.inputWrapper} ${errors.email ? styles.inputWrapperError : ""}`}>
                            <Mail className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                }}
                                autoComplete="email"
                            />
                        </div>
                        {errors.email && (
                            <span className={styles.inlineError}>{errors.email}</span>
                        )}
                    </div>

                    {/* Password */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Password</label>
                        <div className={`${styles.inputWrapper} ${errors.password ? styles.inputWrapperError : ""}`}>
                            <Lock className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                                }}
                                autoComplete="new-password"
                            />
                            <button
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        {errors.password && (
                            <span className={styles.inlineError}>{errors.password}</span>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Confirm Password</label>
                        <div className={`${styles.inputWrapper} ${errors.confirmPassword ? styles.inputWrapperError : ""}`}>
                            <Lock className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                                }}
                                autoComplete="new-password"
                            />
                            <button
                                className={styles.passwordToggle}
                                onClick={() => setShowConfirm(!showConfirm)}
                                type="button"
                            >
                                {showConfirm ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className={styles.inlineError}>{errors.confirmPassword}</span>
                        )}
                    </div>

                    {/* Error Message */}
                    {/* (Global box removed as requested) */}

                    {/* Terms */}
                    <div className={styles.termsRow}>
                        <div
                            className={`${styles.checkbox} ${agreedToTerms ? styles.checkboxChecked : ""}`}
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                        >
                            {agreedToTerms && <Check />}
                        </div>
                        <p className={styles.termsText}>
                            I agree to the <span className={styles.termsLink}>Terms of Service</span> and <span className={styles.termsLink}>Privacy Policy</span>
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                        {!isLoading && <ArrowRight />}
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className={styles.footer}>
                <p className={styles.footerText}>
                    Already have an account?{" "}
                    <button
                        className={styles.footerLink}
                        onClick={() => navigate("login")}
                    >
                        Log In
                    </button>
                </p>
            </div>
        </div>
    );
}
