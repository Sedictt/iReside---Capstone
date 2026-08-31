"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/context/BrandContext";
import { m as motion } from "framer-motion";

export default function GlobalNotFound() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { primaryColor } = useBrand();

  const role = profile?.role || user?.user_metadata?.role || (typeof window !== "undefined" && window.location.pathname.startsWith("/landlord") ? "landlord" : "tenant");
  const isLandlord = role === "landlord" || role === "admin";
  const dashboardUrl = isLandlord ? "/landlord/dashboard" : "/tenant/dashboard";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-10 bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      
      {/* Background Subtle Mesh Grid & Radial Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[850px] rounded-full blur-[170px] opacity-20 dark:opacity-25 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: primaryColor || "var(--primary)" }}
      />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-8">
        
        {/* Clean Dynamic 3D Claymorphic Number Typography */}
        <div className="relative flex items-center justify-center select-none py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative font-black tracking-tight text-[130px] sm:text-[200px] md:text-[240px] leading-none"
            style={{
              fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
            }}
          >
            {/* 3D Soft Shadow Base */}
            <span 
              className="absolute inset-0 translate-y-3 sm:translate-y-5 blur-sm opacity-20 dark:opacity-40"
              style={{ color: primaryColor || "var(--primary)" }}
              aria-hidden="true"
            >
              404
            </span>

            {/* Gradient Knockout Body */}
            <span 
              className="relative inline-block bg-gradient-to-b from-foreground via-foreground to-muted-foreground/60 dark:from-white dark:via-neutral-100 dark:to-neutral-500 bg-clip-text text-transparent drop-shadow-sm"
            >
              404
            </span>
          </motion.div>
        </div>

        {/* Text Header & Subtitle */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="space-y-3 -mt-6 sm:-mt-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Oops! Page not found.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </motion.div>

        {/* Actions matching reference image & brand preferences */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
          className="w-full flex flex-col items-center gap-4 pt-1"
        >
          {/* Primary Pill Button using Brand Theme */}
          <Link
            href={dashboardUrl}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-white font-black text-sm sm:text-base transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 hover:opacity-95"
            style={{ 
              backgroundColor: primaryColor || "var(--primary)",
            }}
          >
            <Home className="size-5" />
            <span>Return to Dashboard</span>
          </Link>

          {/* Secondary Link: Go Back */}
          <button
            onClick={() => router.back()}
            className="text-xs sm:text-sm md:text-base font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 cursor-pointer py-1.5 group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
