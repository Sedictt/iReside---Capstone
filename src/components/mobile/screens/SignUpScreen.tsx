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
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1);

    const isFormValid =
        fullName.trim() &&
        email.trim() &&
        password.trim() &&
        confirmPassword.trim() &&
        selectedRole &&
        agreedToTerms;

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        role: selectedRole,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Navigate to email verification screen
            navigate("emailVerification", { email: email.trim() });
        } catch (err: any) {
            setError(err.message || "Something went wrong during sign up.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatError = (msg: string) => {
        if (msg.includes("at least one character of each")) {
            return (
                <div className={styles.errorList}>
                    <p>Password must include:</p>
                    <ul>
                        <li>At least one lowercase letter</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                    </ul>
                </div>
            );
        }
        return msg;
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
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
                        <div className={styles.inputWrapper}>
                            <User className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Email</label>
                        <div className={styles.inputWrapper}>
                            <Mail className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                    </div>

                    {/* Confirm Password */}
                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Confirm Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} />
                            <input
                                className={styles.input}
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                    </div>

                    {/* Error Message */}
                    {error && <div className={styles.errorMessage}>{formatError(error)}</div>}

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
