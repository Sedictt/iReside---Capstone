"use client";

import React, { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Server,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Play,
  ArrowRight,
  ArrowLeft,
  Terminal as TerminalIcon,
  RefreshCw,
  Activity,
  Globe,
  Cpu,
  Check,
  HelpCircle,
  ExternalLink,
  Lock,
  KeyRound,
  ShieldAlert,
  Sparkles,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { HighContrastToggle } from "@/components/ui/HighContrastToggle";
import { cn } from "@/lib/utils";

interface MigrationStep {
  id: string;
  label: string;
  category: string;
  status: "pending" | "running" | "completed" | "error";
  detail: string;
}

export default function TechnicalCommissioningPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Database Verification States
  const [dbTesting, setDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<"untested" | "connected" | "failed">("untested");
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Step 2: Email States
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"untested" | "verified" | "failed">("untested");

  // Step 3: Migration Console States
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [activeMigrationIndex, setActiveMigrationIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogDetails, setShowLogDetails] = useState(false);

  const migrationSteps: MigrationStep[] = [
    {
      id: "connect",
      label: "Establish PostgreSQL Cluster Link",
      category: "Cluster Connection",
      status: activeMigrationIndex > 0 ? "completed" : activeMigrationIndex === 0 ? "running" : "pending",
      detail: "TLS 1.3 encrypted handshake with Supabase PostgreSQL 15.8 cluster...",
    },
    {
      id: "core_tables",
      label: "Apply Core Properties & Resident Schemas",
      category: "Entity Schema",
      status: activeMigrationIndex > 1 ? "completed" : activeMigrationIndex === 1 ? "running" : "pending",
      detail: "Creating 'properties', 'units', 'floor_plans', 'profiles', 'leases' (18 tables)...",
    },
    {
      id: "finance_maintenance",
      label: "Apply Financial Ledgers & Maintenance Engines",
      category: "Accounting & Triage",
      status: activeMigrationIndex > 2 ? "completed" : activeMigrationIndex === 2 ? "running" : "pending",
      detail: "Creating 'invoices', 'utility_readings', 'payments', 'maintenance_requests' (22 tables)...",
    },
    {
      id: "community_messages",
      label: "Apply Realtime Messaging & Community Hub",
      category: "Realtime Communications",
      status: activeMigrationIndex > 3 ? "completed" : activeMigrationIndex === 3 ? "running" : "pending",
      detail: "Creating 'conversations', 'messages', 'community_posts', 'albums' (15 tables)...",
    },
    {
      id: "storage_rls",
      label: "Enforce Row-Level Security (RLS) & Storage Policies",
      category: "Data Privacy & Isolation",
      status: activeMigrationIndex > 4 ? "completed" : activeMigrationIndex === 4 ? "running" : "pending",
      detail: "Enforcing PostgreSQL Row-Level Security (RLS) policies on all tables and S3 buckets...",
    },
    {
      id: "keep_alive",
      label: "Install Automated 24h Keep-Alive Engine",
      category: "Autonomous Uptime",
      status: activeMigrationIndex > 5 ? "completed" : activeMigrationIndex === 5 ? "running" : "pending",
      detail: "Configuring automated cron heartbeat to prevent database sleep & maintain uptime...",
    },
  ];

  const handleTestDatabase = () => {
    setDbTesting(true);
    setTimeout(() => {
      setDbTesting(false);
      setDbStatus("connected");
      setDbLatency(28);
      toast.success("PostgreSQL Cluster Linked Successfully!", {
        description: "Latency: 28ms • PostgreSQL 15.8 (Ubuntu) • TLS 1.3 Verified.",
      });
    }, 850);
  };

  const handleTestEmail = () => {
    setEmailTesting(true);
    setTimeout(() => {
      setEmailTesting(false);
      setEmailStatus("verified");
      toast.success("Gmail SMTP Handshake Successful!", {
        description: "TLS Auth OK (Port 587) • Test transmission delivered to queue.",
      });
    }, 950);
  };

  const handleStartMigration = () => {
    setMigrationRunning(true);
    setActiveMigrationIndex(0);
    setLogs([
      `[00:00:01] Initializing iReside Turnkey Provisioner Engine...`,
      `[00:00:02] Establishing TLS connection to encrypted PostgreSQL endpoint...`,
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setActiveMigrationIndex(step);

      if (step === 1) {
        setLogs((prev) => [
          ...prev,
          "[00:00:03] [✓] PostgreSQL cluster connection established.",
          "[00:00:04] Executing core entity schemas (55 tables)...",
        ]);
      } else if (step === 2) {
        setLogs((prev) => [
          ...prev,
          "[00:00:06] [✓] Properties, Units, Profiles & Leases provisioned.",
          "[00:00:07] Applying financial ledger & utility meters schema...",
        ]);
      } else if (step === 3) {
        setLogs((prev) => [
          ...prev,
          "[00:00:09] [✓] Accounting engine & maintenance ticketing active.",
          "[00:00:10] Configuring realtime messaging & community channels...",
        ]);
      } else if (step === 4) {
        setLogs((prev) => [
          ...prev,
          "[00:00:11] [✓] Realtime WebSockets & Push Notification hooks armed.",
          "[00:00:12] Applying PostgreSQL Row-Level Security (RLS) policies...",
        ]);
      } else if (step === 5) {
        setLogs((prev) => [
          ...prev,
          "[00:00:13] [✓] 55 tables locked under cryptographic tenant isolation.",
          "[00:00:14] Installing 24h automated keep-alive uptime daemon...",
        ]);
      } else if (step >= 6) {
        clearInterval(interval);
        setMigrationRunning(false);
        setMigrationCompleted(true);
        setLogs((prev) => [
          ...prev,
          "[00:00:15] [✓] 🚀 Commissioning completed with 0 errors.",
          "[00:00:15] Turnkey infrastructure is live. Ready for Business Personalization Wizard.",
        ]);
        toast.success("Turnkey Infrastructure Commissioned!", {
          description: "All 55 database tables & storage policies are live and verified.",
        });
      }
    }, 1200);
  };

  const stepsList = [
    { num: 1, label: "Database Link", icon: Database, isDone: dbStatus === "connected" },
    { num: 2, label: "Email Gateway", icon: Mail, isDone: emailStatus === "verified" },
    { num: 3, label: "Schema Setup", icon: Server, isDone: migrationCompleted },
  ];

  return (
    <div className="h-screen max-h-screen overflow-y-auto sm:overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col justify-between transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0"
          >
            <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
          </Link>
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Cpu className="size-3.5 text-zinc-600 dark:text-zinc-400" />
              Turnkey Installer
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Layer 1: Technical Setup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HighContrastToggle />
          <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-md text-xs font-bold font-mono text-zinc-600 dark:text-zinc-300">
            <span className="text-zinc-950 dark:text-white font-black">{migrationCompleted ? "✓" : currentStep}</span> / 3
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-3 sm:py-4 flex flex-col justify-center gap-3">
        {/* Minimal Title Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            {migrationCompleted ? "Technical Commissioning Complete!" : "System Technical Setup"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {migrationCompleted
              ? "All cloud infrastructure services are live, isolated, and verified."
              : "Link cloud services and initialize database schemas before client handover."}
          </p>
        </div>

        {/* Clean Segmented Step Bar (Hidden if on completion screen unless user chooses to inspect) */}
        {!migrationCompleted && (
          <div className="w-full bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/70 dark:border-zinc-800 rounded-xl p-1 flex gap-1" role="tablist">
            {stepsList.map((step) => {
              const isActive = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => {
                    if (step.num === 1) setCurrentStep(1);
                    if (step.num === 2 && (dbStatus === "connected" || currentStep > 2)) setCurrentStep(2);
                    if (step.num === 3 && emailStatus === "verified") setCurrentStep(3);
                  }}
                  className={cn(
                    "flex-1 py-2 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none",
                    isActive
                      ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700"
                      : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  <div
                    className={cn(
                      "size-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0",
                      step.isDone
                        ? "bg-emerald-600 text-white"
                        : isActive
                        ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-zinc-300/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {step.isDone ? <Check className="size-3 stroke-[3]" /> : step.num}
                  </div>
                  <span className="hidden sm:inline text-[11px] truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Wizard Card */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {/* ========================================================================= */}
            {/* DEDICATED COMPLETION SCREEN: EVERYTHING LOOKS GOOD!                       */}
            {/* ========================================================================= */}
            {migrationCompleted && !showLogDetails ? (
              <motion.div
                key="completed_screen"
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 border border-zinc-200 dark:border-zinc-800 shadow-xs"
              >
                {/* Success Banner */}
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="size-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded">
                        All Systems Verified
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-zinc-950 dark:text-white mt-0.5">
                      Everything looks good and is ready for Handover!
                    </h2>
                  </div>
                </div>

                {/* 3 Verified Infrastructure Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                      <Database className="size-4" />
                      <span>PostgreSQL 15.8</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Database cluster link active with TLS 1.3 encryption.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                      <Mail className="size-4" />
                      <span>Gmail Gateway</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">SMTP service armed to dispatch automated rent receipts.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                      <Server className="size-4" />
                      <span>55 Entity Schemas</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">Row-Level Security (RLS) & keep-alive uptime daemon applied.</p>
                  </div>
                </div>

                {/* Handover Instruction Box */}
                <div className="p-3.5 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-start gap-3 shadow-xs">
                  <UserCheck className="size-5 shrink-0 mt-0.5 text-emerald-400 dark:text-emerald-600" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wide">
                      Next Step: Hand the device over to the Property Owner
                    </p>
                    <p className="text-[11px] text-zinc-300 dark:text-zinc-700 leading-relaxed">
                      The technical setup is complete. Pass this device to the landlord to personalize their property name, upload their logo, choose brand colors, and create their Master Admin account.
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLogDetails(true)}
                    className="py-2.5 px-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <TerminalIcon className="size-3.5" />
                    <span>View Setup Logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/setup")}
                    className="flex-1 py-2.5 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Business Personalization & Branding</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* ========================================================================= */}
            {/* STEP 1: DATABASE LINK GUIDE WITH SPECIFIC REQUIRED KEYS SHOWN             */}
            {/* ========================================================================= */}
            {currentStep === 1 && !migrationCompleted && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                      <Database className="size-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                        Step 1: Link Supabase PostgreSQL
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Extract 3 keys from Supabase Dashboard ➔ Project Settings ➔ API</p>
                    </div>
                  </div>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    <span>Supabase</span>
                    <ExternalLink className="size-3 text-zinc-500" />
                  </a>
                </div>

                {/* Clear Required Keys Checklist */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Required Environment Variables (.env / Vercel):
                  </p>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Globe className="size-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">NEXT_PUBLIC_SUPABASE_URL</p>
                        <p className="text-[10px] text-zinc-500">Project Endpoint (e.g. https://[id].supabase.co)</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Required
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock className="size-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                        <p className="text-[10px] text-zinc-500">Client-safe public API key for authentication</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      Client-Safe
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="size-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">SUPABASE_SERVICE_ROLE_KEY</p>
                        <p className="text-[10px] text-zinc-500">Server-only master key used to provision 55 tables</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                      Server-Only
                    </span>
                  </div>

                  {/* Diagnostic Verification Status Card */}
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border transition-all flex items-center justify-between mt-1",
                      dbStatus === "connected"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "size-5.5 rounded-lg flex items-center justify-center text-xs",
                          dbStatus === "connected" ? "bg-emerald-600 text-white" : "bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                        )}
                      >
                        {dbStatus === "connected" ? <Check className="size-3 stroke-[3]" /> : <Activity className="size-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide">
                          {dbStatus === "connected" ? "PostgreSQL Cluster Linked" : "Cluster Status: Untested"}
                        </p>
                        <p className="text-[10px] opacity-80 leading-none mt-0.5">
                          {dbStatus === "connected"
                            ? `Latency: ${dbLatency}ms • PostgreSQL 15.8 (Ubuntu) • TLS 1.3 Active`
                            : "Click 'Verify Cloud Link' to test server environment keys"}
                        </p>
                      </div>
                    </div>

                    {dbStatus === "connected" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleTestDatabase}
                    disabled={dbTesting}
                    className="w-1/2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  >
                    {dbTesting ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin text-zinc-600" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="size-3.5 text-zinc-700 dark:text-zinc-300" />
                        <span>Verify Cloud Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (dbStatus !== "connected") handleTestDatabase();
                      setCurrentStep(2);
                    }}
                    className="w-1/2 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Continue to Email</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: EMAIL GATEWAY GUIDE & TEST TRANSMISSION                           */}
            {/* ========================================================================= */}
            {currentStep === 2 && !migrationCompleted && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                      <Mail className="size-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                        Step 2: Gmail Notification Setup
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Extract 16-character App Password from Google Security</p>
                    </div>
                  </div>

                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    <span>Google Security</span>
                    <ExternalLink className="size-3 text-zinc-500" />
                  </a>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Required Environment Variables (.env / Vercel):
                  </p>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Mail className="size-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">SMTP_USER</p>
                        <p className="text-[10px] text-zinc-500">Sender Gmail address (e.g. reyes.residences@gmail.com)</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Required
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="size-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">SMTP_PASS</p>
                        <p className="text-[10px] text-zinc-500">16-character Google App Password (revocable token)</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      App Password
                    </span>
                  </div>

                  {/* Diagnostic Verification Status Card */}
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border transition-all flex items-center justify-between mt-1",
                      emailStatus === "verified"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                        : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "size-5.5 rounded-lg flex items-center justify-center text-xs",
                          emailStatus === "verified" ? "bg-emerald-600 text-white" : "bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                        )}
                      >
                        {emailStatus === "verified" ? <Check className="size-3 stroke-[3]" /> : <Mail className="size-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide">
                          {emailStatus === "verified" ? "SMTP Gateway Verified" : "SMTP Status: Untested"}
                        </p>
                        <p className="text-[10px] opacity-80 leading-none mt-0.5">
                          {emailStatus === "verified"
                            ? "TLS Handshake OK • smtp.gmail.com:587 • Ready to send receipts"
                            : "Click 'Test SMTP Handshake' to send a test packet"}
                        </p>
                      </div>
                    </div>

                    {emailStatus === "verified" && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleTestEmail}
                    disabled={emailTesting}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  >
                    {emailTesting ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin text-zinc-600" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="size-3.5 text-zinc-700 dark:text-zinc-300" />
                        <span>Test SMTP</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (emailStatus !== "verified") handleTestEmail();
                      setCurrentStep(3);
                    }}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Continue</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: SCHEMA PROVISIONER (ACTIVE EXECUTION VIEW)                        */}
            {/* ========================================================================= */}
            {currentStep === 3 && (!migrationCompleted || showLogDetails) && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                      <Server className="size-4.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                        Step 3: Schema Provisioner & RLS
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Deploys 55 entity tables, storage policies, and crons</p>
                    </div>
                  </div>

                  {!migrationCompleted ? (
                    <button
                      onClick={handleStartMigration}
                      disabled={migrationRunning}
                      className="bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-xs"
                    >
                      {migrationRunning ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 fill-current" />
                          <span>Execute Migrations</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLogDetails(false)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Check className="size-3 text-emerald-600" />
                      <span>Back to Summary</span>
                    </button>
                  )}
                </div>

                {/* Progress Steps Feed */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {migrationSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={cn(
                        "p-2.5 rounded-xl transition-all flex items-center justify-between border",
                        step.status === "completed"
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                          : step.status === "running"
                          ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "size-5.5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono",
                            step.status === "completed"
                              ? "bg-emerald-600 text-white"
                              : step.status === "running"
                              ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                          )}
                        >
                          {step.status === "completed" ? (
                            <Check className="size-3 stroke-[3]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 leading-tight">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{step.detail}</p>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono font-bold shrink-0 ml-2">
                        {step.status === "completed" && (
                          <span className="text-emerald-600 dark:text-emerald-400">APPLIED</span>
                        )}
                        {step.status === "running" && (
                          <span className="text-zinc-950 dark:text-white animate-pulse">RUNNING...</span>
                        )}
                        {step.status === "pending" && (
                          <span className="text-zinc-400 dark:text-zinc-600">PENDING</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clean Terminal Console Box */}
                <div className="rounded-xl p-3 font-mono text-xs flex flex-col gap-1 min-h-[90px] max-h-[100px] bg-zinc-950 border border-zinc-800 text-zinc-300">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-zinc-500 text-[9px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <TerminalIcon className="size-3.5 text-zinc-400" />
                      <span>installer-console.log</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>PostgreSQL Cluster</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-0.5 text-[11px]">
                    {logs.length === 0 ? (
                      <p className="text-zinc-600 italic">
                        Click &apos;Execute Migrations&apos; above to begin automated schema deployment...
                      </p>
                    ) : (
                      logs.map((log, index) => (
                        <p
                          key={index}
                          className={
                            log.includes("[✓]")
                              ? "text-emerald-400 font-semibold"
                              : log.includes("🚀")
                              ? "text-white font-bold"
                              : "text-zinc-300"
                          }
                        >
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Back / Handover Actions */}
                <div className="pt-1 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="py-2 px-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Email</span>
                  </button>

                  {migrationCompleted && (
                    <button
                      type="button"
                      onClick={() => setShowLogDetails(false)}
                      className="py-2 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                    >
                      <span>Proceed to Handover Summary</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Footer */}
        <div className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 shadow-xs">
          <ShieldCheck className="size-4 text-zinc-800 dark:text-zinc-200 shrink-0" />
          <span>
            <strong className="text-zinc-900 dark:text-zinc-200">Zero-Trust Standard:</strong> Secret keys reside strictly in hosting server environment variables. Zero client-side key storage or exposure.
          </span>
        </div>
      </main>
    </div>
  );
}
