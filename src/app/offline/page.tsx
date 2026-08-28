"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, BookOpen, Home, PhoneCall } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-background relative p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full rounded-3xl neumorphic-panel p-6 sm:p-8 space-y-6 text-center border border-border/50 shadow-2xl">
        <div className="flex justify-center">
          <Logo className="h-10 w-auto" />
        </div>

        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <WifiOff className="size-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            You Are Currently Offline
          </h1>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            iReside Turnkey instance is running in local offline mode. You can continue viewing cached property details, leases, and local documentation.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleRetry}
            className="w-full h-12 rounded-xl neumorphic-primary font-black text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <RefreshCw className="size-4" />
            Retry Connection
          </button>

          <Link
            href="/"
            className="w-full h-12 rounded-xl neumorphic-extruded font-black text-sm text-foreground flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
          >
            <Home className="size-4 text-primary" />
            Go to Cached Dashboard
          </Link>

          <Link
            href="/landlord/docs"
            className="w-full h-12 rounded-xl neumorphic-inset font-bold text-xs text-muted-foreground flex items-center justify-center gap-2 hover:text-foreground transition-colors"
          >
            <BookOpen className="size-4" />
            Open Offline Handover Manuals
          </Link>
        </div>

        <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
          <PhoneCall className="size-3.5 text-primary" />
          Emergency? Contact your property manager directly.
        </div>
      </div>
    </div>
  );
}
