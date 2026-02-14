import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen bg-slate-900 text-slate-50">
            {/* Left Panel - Branding (Hidden on mobile) */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-800 p-12 lg:flex">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0 bg-blue-900/20" />
                <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2573&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />

                {/* Content */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        iReside
                    </Link>
                </div>

                <div className="relative z-10 max-w-lg space-y-6">
                    <h1 className="text-5xl font-bold leading-tight tracking-tight">
                        Welcome back to your space
                    </h1>
                    <p className="text-lg text-slate-300">
                        Securely access your dashboard, manage properties, and handle requests with ease.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-400">
                    © {new Date().getFullYear()} iReside Inc. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex w-full flex-col justify-center bg-slate-900 p-8 lg:w-1/2 lg:p-12 xl:p-24">
                <div className="mx-auto w-full max-w-md space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Log in</h2>
                        <p className="text-slate-400">Enter your credentials to access your account.</p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300" htmlFor="password">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                        >
                            Sign In
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-750 hover:text-white">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-750 hover:text-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.35 1.04 1.37 4.54 1.34 6.16-0.7zm-2.09-17.72c-1.35.08-2.45 1-2.9 2.22 1.35.1 2.52-1.02 2.9-2.22zm2.06 13.91c.21-.13.39-.29.54-.48-.68-.82-.54-2.27.31-3.04.59-.53 1.5-.72 2.13-.39 0 0 .15.08.2.1-1.39-4.22-4.14-5-5.59-5.18-.89-.06-1.74.24-2.31.51-.57.27-1.12.21-1.63-.09-1.01-.59-2.25-.42-3.32.25-1.07.67-1.68 1.83-1.68 1.83-.87 2.22-.05 5.56 1.48 7.77.77 1.11 1.86 1.67 2.61 1.63.75-.04 1.25-.44 1.67-.68.42-.24.78-.23 1.26.01.48.24 1.09.43 1.61.35.53-.08 1.48-.46 2.04-1.25z" />
                            </svg>
                            Apple
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/" className="font-medium text-primary hover:underline">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
