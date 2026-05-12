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

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
            </div>

            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Create Account</h1>
                <p className={styles.headerSub}>
                    Join iReside to find your perfect home or manage your properties.
                </p>
            </div>

            {/* Form */}
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

                {/* Role Selection */}
                <div className={styles.roleSection}>
                    <span className={styles.roleSectionLabel}>
                        How will you use iReside?
                    </span>

                    <div className={styles.roleCards}>
                        {/* Tenant Card */}
                        <div
                            className={`${styles.roleCard} ${selectedRole === "tenant" ? styles.roleCardActive : ""
                                }`}
                            onClick={() => setSelectedRole("tenant")}
                        >
                            <div
                                className={`${styles.roleIconBox} ${selectedRole === "tenant"
                                        ? styles.roleIconActive
                                        : styles.roleIconDefault
                                    }`}
                            >
                                <Home />
                            </div>
                            <span className={styles.roleTitle}>Looking for a home</span>
                            <span className={styles.roleSub}>
                                Search, apply, and manage your rental
                            </span>
                        </div>

                        {/* Landlord Card */}
                        <div
                            className={`${styles.roleCard} ${selectedRole === "landlord" ? styles.roleCardActive : ""
                                }`}
                            onClick={() => setSelectedRole("landlord")}
                        >
                            <div
                                className={`${styles.roleIconBox} ${selectedRole === "landlord"
                                        ? styles.roleIconActive
                                        : styles.roleIconDefault
                                    }`}
                            >
                                <Building2 />
                            </div>
                            <span className={styles.roleTitle}>I own properties</span>
                            <span className={styles.roleSub}>
                                Manage tenants, payments, and units
                            </span>
                        </div>
                    </div>

                    <p className={styles.roleHint}>
                        You can <span>switch roles anytime</span> in your profile settings
                    </p>
                </div>

                {/* Error Message */}
                {error && <div className={styles.errorMessage}>{error}</div>}

                {/* Terms */}
                <div className={styles.termsRow}>
                    <div
                        className={`${styles.checkbox} ${agreedToTerms ? styles.checkboxChecked : ""
                            }`}
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        {agreedToTerms && <Check />}
                    </div>
                    <p className={styles.termsText}>
                        I agree to the{" "}
                        <span className={styles.termsLink}>Terms of Service</span> and{" "}
                        <span className={styles.termsLink}>Privacy Policy</span>
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
