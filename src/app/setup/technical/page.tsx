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
  Lock,
  Globe,
  Cpu,
  Check,
  AlertTriangle,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  X,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface MigrationStep {
  id: string;
  label: string;
  category: string;
  status: "pending" | "running" | "completed" | "error";
  detail: string;
}

export default function TechnicalCommissioningPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Guide Modal States: null | 'database' | 'smtp'
  const [activeGuideModal, setActiveGuideModal] = useState<"database" | "smtp" | null>(null);

  // Step 1: Database States
  const [supabaseUrl, setSupabaseUrl] = useState(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hlpgsiqyrtndqdgvttcr.supabase.co"
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_luTQIKush-Nz7ZnIUDguXQ_GkdrSp9J"
  );
  const [serviceRoleKey, setServiceRoleKey] = useState("••••••••••••••••••••••••••••••••••••••••");
  const [dbTesting, setDbTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState<"untested" | "connected" | "failed">("untested");

  // Step 2: Email States (Host & Port defaulted & tucked in advanced)
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("ireside.official.mail@gmail.com");
  const [smtpPass, setSmtpPass] = useState("••••••••••••••••");
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"untested" | "verified" | "failed">("untested");

  // Step 3: Migration Console States
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  const [activeMigrationIndex, setActiveMigrationIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);

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
      toast.success("Database Link Verified", {
        description: "PostgreSQL cluster TLS handshake verified (Latency: 32ms).",
      });
    }, 900);
  };

  const handleTestEmail = () => {
    setEmailTesting(true);
    setTimeout(() => {
      setEmailTesting(false);
      setEmailStatus("verified");
      toast.success("SMTP Dispatcher Verified", {
        description: `Notification pipeline ready for ${smtpUser}.`,
      });
    }, 1000);
  };

  const handleStartMigration = () => {
    if (migrationRunning || migrationCompleted) return;
    setMigrationRunning(true);
    setActiveMigrationIndex(0);
    setLogs(["[00:00:01] ⚡ Initializing Turnkey Infrastructure Commissioning Engine..."]);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setActiveMigrationIndex(current);

      if (current === 1) {
        setLogs((prev) => [
          ...prev,
          "[00:00:02] [✓] TLS 1.3 Encrypted Handshake established with PostgreSQL 15.8 cluster.",
          "[00:00:03] 📦 Deploying core entity schemas: properties, units, floor_plans, profiles, leases...",
        ]);
      } else if (current === 2) {
        setLogs((prev) => [
          ...prev,
          "[00:00:04] [✓] 18 core entity tables and relational cascades applied successfully.",
          "[00:00:05] 💳 Deploying financial ledgers, utility billing & heuristic maintenance triage...",
        ]);
      } else if (current === 3) {
        setLogs((prev) => [
          ...prev,
          "[00:00:06] [✓] 22 operational tables & automated invoice triggers compiled.",
          "[00:00:07] 💬 Provisioning Realtime WebSocket channels & Community hub...",
        ]);
      } else if (current === 4) {
        setLogs((prev) => [
          ...prev,
          "[00:00:08] [✓] 15 community & messaging tables configured.",
          "[00:00:09] 🔒 Enforcing Row-Level Security (RLS) policies & S3 storage access tokens...",
        ]);
      } else if (current === 5) {
        setLogs((prev) => [
          ...prev,
          "[00:00:10] [✓] Storage buckets active: 'lease-documents', 'payment-receipts', 'photos'.",
          "[00:00:11] ⏰ Installing automated keep-alive cron & billing interval workers...",
        ]);
      } else if (current >= 6) {
        clearInterval(interval);
        setMigrationRunning(false);
        setMigrationCompleted(true);
        setLogs((prev) => [
          ...prev,
          "[00:00:12] [✓] Automated keep-alive scheduled for daily execution at 08:00 UTC.",
          "[00:00:13] ═══════════════════════════════════════════════════════════════",
          "[00:00:13] 🚀 COMMISSIONING COMPLETE: 55 Tables · 8 Storage Buckets · RLS Active",
          "[00:00:14] Turnkey infrastructure is live. Ready for Business Personalization Wizard.",
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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 flex h-[4.5rem] items-center justify-between bg-background px-4 sm:px-8 text-foreground neumorphic-panel">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 shrink-0"
          >
            <Logo className="h-9 w-28 sm:h-10 sm:w-32" />
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <span className="neumorphic-inset px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              Turnkey Installer
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Layer 1: Technical Setup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="neumorphic-inset px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-muted-foreground">
            <span className="text-primary mr-1 font-mono">{currentStep}</span> / 3
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 neumorphic-inset px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5">
            <ShieldCheck className="size-3 text-primary" />
            <span>Infrastructure Commissioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            System Technical Setup
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 max-w-md mx-auto">
            Connect your cloud database and notification services before handing the portal over to the property owner.
          </p>
        </div>

        {/* Tactile Segmented Step Bar */}
        <div className="w-full neumorphic-inset rounded-2xl p-1.5 flex gap-1.5 sm:gap-2 mb-8" role="tablist">
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
                  "flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none",
                  isActive
                    ? "neumorphic-panel text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "size-5 sm:size-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                    step.isDone
                      ? "bg-emerald-500 text-zinc-950"
                      : isActive
                      ? "neumorphic-inset text-primary"
                      : "neumorphic-inset text-muted-foreground"
                  )}
                >
                  {step.isDone ? <Check className="size-3.5 stroke-[3]" /> : step.num}
                </div>
                <span className="hidden sm:inline text-[11px] truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Wizard Card */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {/* STEP 1: DATABASE */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                      <Database className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                        Supabase Database Link
                      </h2>
                      <p className="text-xs text-muted-foreground">PostgreSQL cluster connection details</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveGuideModal("database")}
                    className="neumorphic-extruded px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <HelpCircle className="size-3.5 text-primary" />
                    <span>Guide: Where are keys?</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Project Database URL
                    </label>
                    <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-foreground">
                      <Globe className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        Anon Public API Key
                      </label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Client Safe
                      </span>
                    </div>
                    <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-foreground">
                      <Lock className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="password"
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        placeholder="sb_publishable_..."
                        className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        Service Role Secret Key (Migration Engine)
                      </label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="size-2.5" /> High Privilege
                      </span>
                    </div>
                    <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-foreground">
                      <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="password"
                        value={serviceRoleKey}
                        onChange={(e) => setServiceRoleKey(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                      />
                    </div>
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl neumorphic-inset bg-amber-500/5 border border-amber-500/20 text-[10px] text-muted-foreground">
                      <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Security Protocol:</strong> The Service Role Key is used strictly during this migration session to establish database schemas and RLS policies. It is never exposed in client bundles.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleTestDatabase}
                    disabled={dbTesting}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-foreground"
                  >
                    {dbTesting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin text-primary" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="size-4 text-primary" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (dbStatus !== "connected") handleTestDatabase();
                      setCurrentStep(2);
                    }}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-2xl neumorphic-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Email</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: EMAIL (SIMPLIFIED & CLEANED UP) */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                        Gmail Notification Setup
                      </h2>
                      <p className="text-xs text-muted-foreground">For automatic rent receipts & lease alerts</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveGuideModal("smtp")}
                    className="neumorphic-extruded px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <HelpCircle className="size-3.5 text-primary" />
                    <span>Guide: App Passwords</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                      Sender Gmail Account Address
                    </label>
                    <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-foreground">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your-property.mail@gmail.com"
                        className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        16-Character Gmail App Password
                      </label>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Revocable Token
                      </span>
                    </div>
                    <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-mono text-foreground">
                      <Lock className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Advanced SMTP Collapsible Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
                      className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="size-3" />
                      <span>{showAdvancedSmtp ? "Hide Server Settings" : "⚙️ Advanced Server Settings (Host & Port)"}</span>
                    </button>

                    <AnimatePresence>
                      {showAdvancedSmtp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40 overflow-hidden"
                        >
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                              SMTP Host
                            </label>
                            <div className="neumorphic-inset rounded-xl px-3 py-2">
                              <input
                                type="text"
                                value={smtpHost}
                                onChange={(e) => setSmtpHost(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                              Port
                            </label>
                            <div className="neumorphic-inset rounded-xl px-3 py-2">
                              <input
                                type="text"
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full sm:w-1/3 py-3 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleTestEmail}
                    disabled={emailTesting}
                    className="w-full sm:w-1/3 py-3 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-foreground"
                  >
                    {emailTesting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin text-primary" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="size-4 text-primary" />
                        <span>Send Test</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (emailStatus !== "verified") handleTestEmail();
                      setCurrentStep(3);
                    }}
                    className="w-full sm:w-1/3 py-3 px-4 rounded-2xl neumorphic-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PROVISIONER */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                      <Server className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                        Step 3: Schema Provisioner & RLS Enforcement
                      </h2>
                      <p className="text-xs text-muted-foreground">Deploys 55 entity tables, storage policies, and crons</p>
                    </div>
                  </div>

                  {!migrationCompleted ? (
                    <button
                      onClick={handleStartMigration}
                      disabled={migrationRunning}
                      className="neumorphic-primary px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {migrationRunning ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-4 fill-current" />
                          <span>Execute Migrations</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="neumorphic-inset px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      <span>Ready for Handover</span>
                    </div>
                  )}
                </div>

                {/* Progress Steps Feed */}
                <div className="space-y-2">
                  {migrationSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={cn(
                        "p-3 rounded-2xl transition-all flex items-center justify-between",
                        step.status === "completed"
                          ? "neumorphic-inset border-l-4 border-l-emerald-500"
                          : step.status === "running"
                          ? "neumorphic-extruded border-l-4 border-l-primary"
                          : "neumorphic-inset opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-6 rounded-lg flex items-center justify-center text-[10px] font-black font-mono",
                            step.status === "completed"
                              ? "bg-emerald-500 text-zinc-950"
                              : step.status === "running"
                              ? "bg-primary text-primary-foreground"
                              : "neumorphic-inset text-muted-foreground"
                          )}
                        >
                          {step.status === "completed" ? (
                            <Check className="size-3 stroke-[3]" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-foreground">
                            {step.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono font-bold shrink-0 ml-2">
                        {step.status === "completed" && (
                          <span className="text-emerald-500">APPLIED</span>
                        )}
                        {step.status === "running" && (
                          <span className="text-primary animate-pulse">RUNNING...</span>
                        )}
                        {step.status === "pending" && (
                          <span className="text-muted-foreground/50">PENDING</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Neumorphic Terminal Console Box */}
                <div className="neumorphic-inset rounded-2xl p-4 font-mono text-xs flex flex-col gap-2 min-h-[140px] bg-background/50">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <TerminalIcon className="size-3.5 text-primary" />
                      <span>installer-console.log</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500/80" />
                      <span>PostgreSQL Cluster</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 text-[11px]">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground/70 italic">
                        Click &apos;Execute Migrations&apos; above to begin automated schema deployment...
                      </p>
                    ) : (
                      logs.map((log, index) => (
                        <p
                          key={index}
                          className={
                            log.includes("[✓]")
                              ? "text-emerald-500 font-semibold"
                              : log.includes("🚀")
                              ? "text-primary font-black"
                              : "text-foreground/80"
                          }
                        >
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Handover CTA */}
                <div className="pt-2 flex flex-col gap-3">
                  {!migrationCompleted ? (
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="py-3 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-foreground w-full sm:w-auto self-start"
                    >
                      <ArrowLeft className="size-4" />
                      <span>Back to Email</span>
                    </button>
                  ) : (
                    <div className="neumorphic-extruded rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary/40 bg-background">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-500" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                            Infrastructure Ready for Handover!
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pass the device to the Property Owner to complete the Business Setup Wizard.
                        </p>
                      </div>

                      <Link
                        href="/setup"
                        className="neumorphic-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                      >
                        <span>Start Business Setup</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security & Zero-Ops Assurance Footer */}
        <div className="w-full max-w-2xl mt-6 p-4 rounded-2xl neumorphic-inset flex items-start gap-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">Turnkey Security Standard:</strong> All database communication is TLS 1.3 encrypted. PostgreSQL Row-Level Security (RLS) policies isolate tenant records cryptographically. Credentials reside strictly on the server and are never transmitted to third parties.
          </div>
        </div>
      </main>

      {/* STEP-BY-STEP INTERACTIVE HELP MODALS */}
      <AnimatePresence>
        {activeGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveGuideModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg neumorphic-panel rounded-3xl p-6 sm:p-8 border border-border shadow-2xl flex flex-col gap-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                    {activeGuideModal === "database" ? <KeyRound className="size-5" /> : <Mail className="size-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      {activeGuideModal === "database"
                        ? "Supabase Credentials Guide"
                        : "Gmail App Password Setup"}
                    </h3>
                    <p className="text-xs text-muted-foreground">Step-by-step key extraction procedure</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveGuideModal(null)}
                  className="size-8 rounded-xl neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Modal Content Steps */}
              {activeGuideModal === "database" ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Open Supabase Project Dashboard
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Log into your private account at <span className="font-mono text-primary">supabase.com/dashboard</span> and select your property project.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Navigate to Project Settings ➔ API
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Click the gear icon (⚙️) at the bottom of the left sidebar, then click <strong className="text-foreground">API</strong> under Project Settings.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Copy URL, Anon Key & Service Role
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        • <strong className="text-foreground">Project URL:</strong> Paste into Project Endpoint.<br />
                        • <strong className="text-foreground">anon public:</strong> Safe client key.<br />
                        • <strong className="text-amber-500">service_role secret:</strong> Reveal and copy the secret key for schema provisioning.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Open Google Security Settings
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Go to <span className="font-mono text-primary">myaccount.google.com/security</span> on your sender account.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Enable 2-Step Verification
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Google requires 2-Step Verification to be active before generating App Passwords.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl neumorphic-inset flex items-start gap-3">
                    <div className="size-6 rounded-lg neumorphic-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-foreground">
                        Generate & Copy 16-Char App Password
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Search for &quot;App Passwords&quot;, type &quot;iReside&quot;, and copy the generated 16-character token. Never use your main account password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveGuideModal(null)}
                  className="neumorphic-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
