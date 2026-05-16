"use client";

import { useState } from "react";
import {
    Building2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    Chrome,
    ArrowLeft,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginScreen.module.css";

// Simple Facebook icon since Lucide doesn't have one
function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

export default function LoginScreen() {
    const { navigate, goBack, setRole } = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) return;
        setIsLoading(true);
        setError(null);

        // --- HARDCODED TEST ACCOUNTS BYPASS ---
        if (password === "password") {
            const testEmail = email.toLowerCase().trim();
            if (testEmail === "tenant@ireside.com") {
                setRole("tenant"); navigate("tenantHome"); return;
            } else if (testEmail === "landlord@ireside.com") {
                setRole("landlord"); navigate("landlordHome"); return;
            }
        }
        // --------------------------------------

        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Navigate to appropriate dashboard based on user metadata role
            const userRole = data.user?.user_metadata?.role || "tenant";
            setRole(userRole as "tenant" | "landlord");
            
            if (userRole === "landlord") {
                navigate("landlordHome");
            } else {
                navigate("tenantHome");
            }
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const devBypass = (bypassRole: "tenant" | "landlord") => {
        setRole(bypassRole);
        if (bypassRole === "landlord") navigate("landlordHome");
        else navigate("tenantHome");
    };

    return (
        <div className={styles.container}>
            {/* Top Bar with Back Button */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={() => navigate("roleSelection")}>
                    <ArrowLeft />
                </button>
            </div>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.brandMark}>
                    <Building2 />
                </div>
                <h1 className={styles.headerTitle}>Welcome Back</h1>
                <p className={styles.headerSub}>Sign in to your iReside account</p>
            </div>

            {/* Form */}
            <div className={styles.form}>
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
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
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

                {/* Remember Me + Forgot Password */}
                <div className={styles.optionsRow}>
                    <div
                        className={styles.rememberMe}
                        onClick={() => setRememberMe(!rememberMe)}
                    >
                        <div
                            className={`${styles.checkbox} ${rememberMe ? styles.checkboxChecked : ""
                                }`}
                        >
                            {rememberMe && <Check />}
                        </div>
                        <span className={styles.rememberLabel}>Remember me</span>
                    </div>

                    <button className={styles.forgotPassword} type="button">
                        Forgot password?
                    </button>
                </div>

                {/* Error Message */}
                {error && <div className={styles.errorMessage}>{error}</div>}

                {/* Login Button */}
                <button 
                    className={styles.loginButton} 
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Log In"}
                </button>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.dividerText}>or continue with</span>
                <div className={styles.dividerLine} />
            </div>

            {/* Social Login */}
            <div className={styles.socialRow}>
                <button className={styles.socialButton}>
                    <Chrome className={`${styles.socialIcon} ${styles.googleIcon}`} />
                    Google
                </button>
                <button className={styles.socialButton}>
                    <FacebookIcon
                        className={`${styles.socialIcon} ${styles.facebookIcon}`}
                    />
                    Facebook
                </button>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <p className={styles.footerText}>
                    Don&apos;t have an account?{" "}
                    <button
                        className={styles.footerLink}
                        onClick={() => navigate("signup")}
                    >
                        Sign Up
                    </button>
                </p>
            </div>

        </div>
    );
}
