"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { signIn } from "@/lib/supabase/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
    email?: string;
    password?: string;
}

interface LoginFormProps {
    redirectTo?: string;
    showRemember?: boolean;
    showForgotPassword?: boolean;
}

export function LoginForm({
    redirectTo,
    showRemember = true,
    showForgotPassword = true,
}: LoginFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [attempts, setAttempts] = useState(0);

    function validate(email: string, password: string): FieldErrors {
        const errors: FieldErrors = {};
        if (!email.trim()) {
            errors.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }
        if (!password) {
            errors.password = "Password is required.";
        }
        return errors;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);
        const email = (formData.get("email") as string) || "";
        const password = (formData.get("password") as string) || "";

        const validationErrors = validate(email, password);
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            return;
        }

        setLoading(true);

        const result = await signIn(formData);

        if (result?.error) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(result.error);
            setLoading(false);
        } else if (result?.url) {
            router.push(redirectTo ?? result.url);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="space-y-5">
                <div className="space-y-2">
                    <label
                        className="text-xs font-bold uppercase tracking-wide text-slate-200"
                        htmlFor="email"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@email.com"
                        className={`w-full rounded-lg border bg-slate-800/50 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                            fieldErrors.email
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : "border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                    />
                    {fieldErrors.email && (
                        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {fieldErrors.email}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label
                        className="text-xs font-bold uppercase tracking-wide text-slate-200"
                        htmlFor="password"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className={`w-full rounded-lg border bg-slate-800/50 px-4 py-3.5 text-slate-100 placeholder-slate-500 pr-12 focus:outline-none focus:ring-1 transition-all ${
                                fieldErrors.password
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {fieldErrors.password && (
                        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {fieldErrors.password}
                        </p>
                    )}
                </div>
            </div>

            {(showRemember || showForgotPassword) && (
                <div className="flex items-center justify-between">
                    {showRemember && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <label
                                htmlFor="remember"
                                className="cursor-pointer select-none text-sm text-slate-300 hover:text-white"
                            >
                                Remember me
                            </label>
                        </div>
                    )}
                    {showForgotPassword && (
                        <a
                            href="/forgot-password"
                            className="text-sm font-semibold text-blue-500 hover:text-blue-400"
                        >
                            Forgot password?
                        </a>
                    )}
                    {!showForgotPassword && <div />}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Log In"}
            </button>

            {attempts >= 3 && showForgotPassword && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400 text-center">
                    Having trouble signing in? Try the{" "}
                    <a href="/forgot-password" className="font-bold text-amber-300 underline hover:text-amber-200">
                        Forgot Password
                    </a>{" "}
                    feature to reset your password.
                </div>
            )}
        </form>
    );
}