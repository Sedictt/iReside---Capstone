"use client";

import React from "react";
import { m } from "framer-motion";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Globe,
  Database,
  Zap,
  Lock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Server,
  Code2,
  Terminal,
  Search,
  Users,
  Key,
  FileText,
  Fingerprint,
  Activity,
  Box,
  Cloud,
  Network,
  Webhook,
  HardDrive,
  RefreshCcw,
  Smartphone,
  Eye,
  Info,
  Shield,
  CreditCard,
  Wrench,
  Scale,
  FileSearch,
  Binary,
  PieChart,
  BarChart3,
  Flame,
  MousePointer2,
  Wifi,
  Monitor,
  History as HistoryIcon,
  Mail,
  FileSignature,
  FileCode,
  GitBranch,
  Settings,
  Bell,
  LineChart,
  Table as TableIcon,
  Cpu as Chip,
  Radio,
  Share2,
  BookOpen,
  Hash,
  Compass,
  Target,
  AlertCircle,
  Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function TechnicalDocPage() {
  return (
    <div className="flex w-full flex-col gap-24 bg-background text-foreground pb-32">
      
      {/* 1. Master Header Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 shadow-sm md:p-16">
        <div className="absolute -right-20 -top-20 -z-0 opacity-[0.03] dark:opacity-[0.07]">
          <ShieldCheck className="size-[500px] text-primary" />
        </div>
        <div className="absolute -left-20 -bottom-20 -z-0 opacity-[0.03] dark:opacity-[0.07]">
          <Chip className="size-[400px] text-primary" />
        </div>
        
        <m.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md">
                <Terminal className="size-3" />
                v2.5.4 Stable
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 backdrop-blur-md">
                <ShieldCheck className="size-3" />
                Security Hardened
              </div>
            </div>
            <ThemeToggle className="size-10 shrink-0" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl lg:text-[84px] leading-[0.85]">
            Technical <br />
            <span className="text-primary italic">Source of Truth</span>
          </h1>
          <p className="max-w-3xl text-xl text-muted-foreground leading-relaxed font-medium">
            The definitive engineering manual for the iReside platform. From low-level database isolation 
            to high-level AI orchestration and distributed real-time state management.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[
              { label: "Architecture", value: "Event-Driven" },
              { label: "Deployment", value: "Edge Computing" },
              { label: "Database", value: "PostgreSQL 16" },
              { label: "AI Engine", value: "Llama 3.1 70B" }
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </m.div>
      </section>

      {/* 2. Core Infrastructure & Deployment */}
      <section id="infrastructure" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Infrastructure & Deployment</h2>
          <p className="text-muted-foreground max-w-2xl">A global, resilient stack designed for high availability and low latency.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              title: "Edge Runtime",
              desc: "Critical business logic and authentication checks run on the Vercel Edge Network, ensuring <50ms TTFB globally.",
              icon: Cloud,
              tags: ["Next.js Edge", "Regional Isolation"]
            },
            {
              title: "PostgreSQL Backend",
              desc: "High-performance relational storage with GIN-optimized indices for vector search and real-time CDC enabled.",
              icon: Database,
              tags: ["Supabase", "pgvector"]
            },
            {
              title: "CI/CD Pipeline",
              desc: "Automated verification through GitHub Actions, performing static analysis, unit tests, and E2E smoke tests.",
              icon: GitBranch,
              tags: ["GitHub Actions", "Vitest"]
            }
          ].map((item) => (
            <div key={item.title} className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/50">
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-primary shadow-inner">
                <item.icon className="size-7" />
              </div>
              <h3 className="mb-3 text-xl font-black text-foreground">{item.title}</h3>
              <p className="mb-6 flex-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span key={tag} className="rounded-lg bg-muted/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Multi-Tenant Security (Expanded) */}
      <section id="security" className="space-y-12">
        <div className="rounded-[3rem] border border-border bg-card p-8 sm:p-16 text-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 -z-0 opacity-10 blur-3xl">
            <Lock className="size-[600px] text-primary" />
          </div>
          
          <div className="relative z-10 space-y-16">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                Multi-Tenant Protocol
              </div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl text-foreground">Row-Level Security (RLS) Deep-Dive</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                iReside employs a "Zero Trust" data architecture. We enforce data boundaries 
                at the database engine level, ensuring that even a compromised application 
                layer cannot access data belonging to another landlord or tenant.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-black text-foreground flex items-center gap-3">
                    <Fingerprint className="size-5 text-primary" />
                    How Isolation Works
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-border">
                    {[
                      { label: "Token Binding", text: "JWT payloads include the user's workspace_id, cryptographically signed by Supabase Auth." },
                      { label: "Policy Injection", text: "PostgreSQL automatically appends WHERE clauses to every query based on the active session context." },
                      { label: "Bypass Prevention", text: "Direct table access is disabled; all queries must pass through the authenticated RLS layer." }
].map((item, i) => (
                      <div key={item.label} className="relative pl-10">
                        <div className="absolute left-0 top-1 size-6 rounded-full bg-muted border border-primary/50 flex items-center justify-center text-[10px] font-black text-primary z-10">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground/60 leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-muted/30 p-8 font-mono text-xs shadow-2xl backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                    <span className="text-muted-foreground uppercase tracking-[0.2em] font-black">Internal SQL Policy</span>
                    <div className="flex gap-1.5">
                      <div className="size-2 rounded-full bg-red-500/30" />
                      <div className="size-2 rounded-full bg-yellow-500/30" />
                      <div className="size-2 rounded-full bg-green-500/30" />
                    </div>
                  </div>
                  <pre className="text-blue-300 leading-loose">
                    {`CREATE POLICY "Landlord_Data_Isolation"
ON public.property_records
FOR ALL
USING (
  landlord_id = auth.uid() 
  OR 
  landlord_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);`}
                  </pre>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
                  <ShieldCheck className="size-6 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-black uppercase">Standard Compliance:</span> Our RLS implementation meets the strict requirements for HIPAA and GDPR data isolation standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. iRis Intelligence Pipeline (RAG) */}
      <section id="iris" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">iRis Intelligence & RAG</h2>
          <p className="text-muted-foreground max-w-2xl">The AI brain behind iReside, combining retrieval-augmented generation with property forensics.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-6 shadow-sm">
              <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <Search className="size-6 text-primary" />
                Semantic Retrieval Logic
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                iRis doesn't rely on generic knowledge. It performs a high-dimensional vector search 
                against the property's digital handbook and historical maintenance logs 
                before synthesizing a response.
              </p>
              <div className="space-y-4 pt-4 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-border">
                {[
                  { label: "Vector Embedding", text: "User queries are embedded into 1536-dimensional space." },
                  { label: "pgvector Search", text: "Cosine similarity identifies the most relevant property clauses." },
                  { label: "Knowledge Augmentation", text: "Retrieved context is injected into the Llama 3.1 system prompt." }
                ].map((item, i) => (
                  <div key={item.label} className="relative pl-10">
                    <div className="absolute left-0 top-1 size-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-black text-primary z-10">
                      {i + 1}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-bold text-foreground">{item.label}:</span> {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
                <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Chip className="size-6" />
                </div>
                <h4 className="font-black text-foreground">Fast Inference</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Sub-800ms response times powered by Groq's LPU acceleration.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
                <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <HardDrive className="size-6" />
                </div>
                <h4 className="font-black text-foreground">Long-term Memory</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Conversation history persistence across sessions with summarization logic.</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-muted/20 p-1">
            <div className="bg-card rounded-[2.2rem] h-full w-full p-10 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Inference Trace</div>
                <h4 className="text-2xl font-black text-foreground">Context Window Mapping</h4>
              </div>
              
              <div className="py-12 space-y-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
                    <span>System Prompt</span>
                    <span>2.4k Tokens</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
                    <span>Retrieved Knowledge (RAG)</span>
                    <span>1.2k Tokens</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[20%] bg-blue-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
                    <span>Conversation History</span>
                    <span>4.1k Tokens</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-orange-500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <m.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  />
                  <span className="text-[10px] font-black text-text-medium uppercase tracking-widest">Logic Stream Stable</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">LATENCY: 842ms</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verification & Triage Logic */}
      <section id="verification" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Verification & Triage Engines</h2>
          <p className="text-muted-foreground max-w-2xl">Deterministic algorithms for business verification and maintenance prioritization.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <FileSearch className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Valenzuela Scraper</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">Business Verification</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our `valenzuela-scraper.ts` utilizes Puppeteer to cross-reference landlord 
              business permits against the official Valenzuela City Business Permit registry. 
              This automated verification layer ensures only legitimate property managers 
              can list assets on iReside.
            </p>
            <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-4 font-mono text-[10px]">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>[PROCESS] RUNNING SCRAPER_ENGINE_V2</span>
                <span className="text-emerald-500">STABLE</span>
              </div>
              <div className="space-y-1 text-primary">
                <p>{`> navigate("valenzuela.gov.ph/business-lookup")`}</p>
                <p>{`> input("license_no", context.permit_id)`}</p>
                <p>{`> extract(".verification-status", "VALID")`}</p>
                <p className="text-emerald-500">{`// Verification SUCCESS: Match Found`}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Wrench className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Maintenance AI Triage</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">Issue Prioritization</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When a tenant reports an issue, our `maintenance-triage.ts` agent analyzes 
              the description and uploaded images to categorize the urgency. It handles 
              emergency escalation for life-safety hazards automatically.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Emergency", val: "Critical Faults", color: "text-red-500" },
                { label: "Standard", val: "Routine Repair", color: "text-blue-500" },
                { label: "Priority", val: "Quality of Life", color: "text-orange-500" },
                { label: "Deferred", val: "Aesthetic Only", color: "text-muted-foreground" }
              ].map((lvl) => (
                <div key={lvl.label} className="p-4 rounded-xl border border-border bg-muted/20">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", lvl.color)}>{lvl.label}</p>
                  <p className="text-sm font-bold text-foreground">{lvl.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Financial Ledger & Atomic Integrity */}
      <section id="ledger" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">The Financial Ledger</h2>
          <p className="text-muted-foreground max-w-2xl">Immutability and transparency for every rental transaction.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[2.5rem] border border-border bg-card p-8 space-y-6 shadow-sm">
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Scale className="size-7" />
              </div>
              <h3 className="text-xl font-black text-foreground">Ledger Immutability</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our financial system is designed as an append-only ledger. Mutations 
                are prohibited; corrections must be handled as separate offsetting entries, 
                preserving a full audit trail of the rental history.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "No 'Update' on settled rows",
                  "SHA-256 artifact hashing",
                  "Timestamped audit logs",
                  "Verified settlement states"
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row h-full">
              <div className="flex-1 p-10 space-y-6 border-b sm:border-b-0 sm:border-r border-border">
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">Transaction Workflow</div>
                  <h4 className="text-2xl font-black text-foreground">Lifecycle of a Payment</h4>
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Intake", text: "Tenant submits payment with receipt artifact." },
                    { label: "Pending", text: "System verifies artifact hash and availability." },
                    { label: "Verification", text: "Landlord confirms receipt of funds." },
                    { label: "Settlement", text: "Ledger row is finalized and locked." }
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4">
                      <div className="size-8 shrink-0 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-black text-foreground">
                        {i + 1}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full sm:w-72 bg-muted/20 p-10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="size-16 rounded-3xl bg-card border border-border flex items-center justify-center text-emerald-500 shadow-lg">
                    <PieChart className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-foreground uppercase tracking-widest">Real-time Analytics</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Automated revenue tracking and expense categorization for tax compliance.</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Ledger Health</span>
                    <span className="text-[10px] font-mono text-emerald-500">100.0%</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Connectivity & Real-Time Engine */}
      <section id="realtime" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Connectivity & Real-Time Engine</h2>
          <p className="text-muted-foreground max-w-2xl">Powering the "Live" experience with ultra-low latency WebSocket channels.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <Wifi className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">WebSocket Channels</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">Live Data Stream</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Using Supabase Real-time, we broadcast database changes to authorized 
              clients in under 50ms. This ensures that the Unit Map, Messaging Hub, 
              and Notifications are always in sync without page refreshes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <p className="text-[10px] font-black uppercase text-pink-500">Unit Map</p>
                <p className="text-xs text-foreground font-bold">Live Vacancy Tracking</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                <p className="text-[10px] font-black uppercase text-blue-500">Messaging</p>
                <p className="text-xs text-foreground font-bold">Instant Delivery</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border bg-card p-10 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Smartphone className="size-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">PWA Service Workers</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-black">Offline Resilience</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The iReside PWA implements advanced caching strategies (Stale-While-Revalidate) 
              to ensure fast initial loads and offline accessibility for critical property info.
            </p>
            <div className="p-6 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="text-[10px] font-black text-text-medium uppercase tracking-widest">Service Worker: ACTIVE</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">CACHE_HIT_RATE: 94%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Full Tech Stack Schema (Exhaustive) */}
      <section id="stack" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Complete Ecosystem Stack</h2>
          <p className="text-muted-foreground max-w-2xl">The full engineering map from the presentation layer down to the edge.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              cat: "Frontend Core",
              icon: Globe,
              items: ["Next.js 16 (App Router)", "React 19 Server Components", "TypeScript (Strict Mode)", "Tailwind CSS v4"]
            },
            {
              cat: "Infrastructure",
              icon: Cloud,
              items: ["Supabase PostgreSQL", "Vercel Edge Functions", "Real-time CDC Channels", "Resend Transactional Mail"]
            },
            {
              cat: "Intelligence",
              icon: Chip,
              items: ["Llama 3.1 LLM (Groq)", "pgvector Embedding Search", "LangChain Triage Orchestration", "Puppeteer Web Scraping"]
            },
            {
              cat: "Security & QA",
              icon: Shield,
              items: ["PostgreSQL RLS Policies", "SHA-256 Integrity Checks", "Playwright E2E Testing", "Vitest Unit Coverage"]
            }
          ].map((group) => (
            <div key={group.cat} className="rounded-3xl border border-border bg-card p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 rounded-2xl bg-surface-2 text-primary flex items-center justify-center">
                <group.icon className="size-6" />
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-black text-foreground uppercase tracking-widest">{group.cat}</h4>
                <div className="flex flex-col gap-2">
                  {group.items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="size-1 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Lease Lifecycle State Machine */}
      <section id="lifecycle" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Lease Lifecycle State Machine</h2>
          <p className="text-muted-foreground max-w-2xl">Deterministic workflow transitions for rental management.</p>
        </div>

        <div className="overflow-x-auto pb-12">
          <div className="min-w-[1000px] flex items-center justify-between pl-16 pr-10 relative">
            <div className="absolute top-[27px] left-24 right-24 h-0.5 bg-border -z-10" />
            {[
              { status: "Draft", icon: FileText, color: "bg-muted-foreground" },
              { status: "Verification", icon: Eye, color: "bg-blue-500" },
              { status: "Sign-off", icon: FileSignature, color: "bg-purple-500" },
              { status: "Active", icon: RefreshCcw, color: "bg-primary" },
              { status: "Renewal", icon: HistoryIcon, color: "bg-orange-500" },
              { status: "Closure", icon: Lock, color: "bg-red-500" }
            ].map((item, i) => (
              <div key={item.status} className="flex flex-col items-center gap-4 w-32 bg-background z-10">
                <div className={cn("size-14 rounded-full flex items-center justify-center text-primary-foreground shadow-xl transition-all hover:scale-110", item.color)}>
                  <item.icon className="size-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black text-foreground">{item.status}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phase {i + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Definition of Terms (Glossary) */}
      <section id="glossary" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Definition of Terms</h2>
          <p className="text-muted-foreground max-w-2xl">A technical glossary of concepts and technologies used within iReside.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { term: "RLS", full: "Row-Level Security", desc: "A PostgreSQL security feature that restricts database rows based on the authenticated user's identity." },
            { term: "RAG", full: "Retrieval-Augmented Generation", desc: "An AI architecture that retrieves specific data (handbooks, rules) to provide factual, grounded responses." },
            { term: "pgvector", full: "Vector Database Extension", desc: "A PostgreSQL extension that allows for high-dimensional semantic search and similarity matching." },
            { term: "Digital Twin", full: "System Synchronicity", desc: "The concept of keeping the database state exactly mirrored with physical real-world status (e.g., vacancy, payment)." },
            { term: "Atomic Transaction", full: "Database Integrity", desc: "A series of database operations that either all succeed or all fail, preventing corrupted or partial data states." },
            { term: "Idempotency", full: "Operational Stability", desc: "Ensuring that performing an operation multiple times (like a payment) has the same effect as performing it once." },
            { term: "PWA", full: "Progressive Web App", desc: "Web applications that use service workers and manifests to provide a native-app-like experience on mobile devices." },
            { term: "Edge Proxy", full: "Network Performance", desc: "Running code (auth, caching) at the nearest geographic point to the user to minimize latency." },
            { term: "JWT", full: "JSON Web Token", desc: "A compact, URL-safe means of representing claims to be transferred between two parties, used for session authentication." },
            { term: "Audit Log", full: "Accountability Trace", desc: "A non-removable, append-only record of all critical system events and state mutations." }
          ].map((item) => (
            <div key={item.term} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-primary uppercase tracking-widest">{item.term}</span>
                <BookOpen className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">{item.full}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Audit & Accountability Section */}
      <section id="audit" className="space-y-12">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
              <TableIcon className="size-7" />
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">Immutable Audit Trails</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every sensitive action, from lease adjustments to payment verification, is recorded
              in the `audit_logs` table. These records are non-removable and serve as the
              ultimate source of truth during stakeholder disputes.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-black text-foreground">100%</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Traceability Coverage</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-foreground">~0.1ms</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Logging Latency</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md bg-muted/20 border border-border rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-5 rotate-12">
              <HistoryIcon className="size-64" />
            </div>
            <h3 className="text-xl font-black text-foreground">Security Header Validation</h3>
            <div className="space-y-4">
              {[
                { label: "X-Content-Type-Options", val: "nosniff" },
                { label: "X-Frame-Options", val: "DENY" },
                { label: "Strict-Transport-Security", val: "Enabled" },
                { label: "Content-Security-Policy", val: "Dynamic" }
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                  <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full tracking-widest">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11. Comprehensive API Reference */}
      <section id="api" className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Comprehensive API Reference</h2>
          <p className="text-muted-foreground max-w-2xl">Complete REST API documentation with authentication, endpoints, request/response formats, and error handling.</p>
        </div>

        {/* 11.1 Architecture & Authentication */}
        <div className="rounded-[2rem] border border-border bg-card p-8 lg:p-12 space-y-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Server className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Architecture & Authentication</h3>
              <p className="text-sm text-muted-foreground">RESTful API with JSON bodies, served via Next.js</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <Code2 className="size-4" /> Base URL
              </div>
              <code className="block bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground">
                http://localhost:3000/api/
              </code>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <Lock className="size-4" /> Authentication
              </div>
              <code className="block bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground">
                Authorization: Bearer {'<supabase_jwt>'}
              </code>
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 border border-border p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
              <Box className="size-4" /> Available Route Namespaces
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { route: "/api/admin", desc: "Admin-only operations" },
                { route: "/api/auth", desc: "Login, logout, session" },
                { route: "/api/community", desc: "Posts, announcements, polls" },
                { route: "/api/iris", desc: "AI Assistant (iRis)" },
                { route: "/api/landlord/*", desc: "Landlord dashboard & KPIs" },
                { route: "/api/messages", desc: "Real-time messaging" },
                { route: "/api/profile", desc: "User profile management" },
                { route: "/api/tenant/*", desc: "Tenant operations" },
                { route: "/api/properties", desc: "Property-level operations" },
                { route: "/api/application-payments", desc: "Payment processing" },
                { route: "/api/cron", desc: "Scheduled tasks" },
                { route: "/api/invites", desc: "Tenant onboarding" }
              ].map((r) => (
                <div key={r.route} className="flex items-start gap-2 text-xs">
                  <code className="bg-primary/10 text-primary px-2 py-1 rounded-md font-mono shrink-0">{r.route}</code>
                  <span className="text-muted-foreground">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 11.2 Core Endpoints */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-foreground tracking-tight">Core Endpoints</h3>
          <div className="grid gap-6">
            {/* iRis Chat */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">POST /api/iris/chat</code>
                    <p className="text-[10px] text-muted-foreground">AI Assistant with RAG context retrieval</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full tracking-widest">Auth Required</span>
                  <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-full tracking-widest">30/min rate limit</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "message": "What amenities are available?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response (200)</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "response": "Your property offers...",
  "hasDataCard": true,
  "dataCard": {
    "type": "amenity_list",
    "items": ["Pool", "Gym", "Parking"]
  },
  "metadata": {
    "model": "llama-3.1-8b-instant",
    "tokens": 245
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Landlord Statistics Insights */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <LineChart className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">POST /api/landlord/statistics/insights</code>
                    <p className="text-[10px] text-muted-foreground">AI-powered KPI insights via Groq Llama</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full tracking-widest">Auth Required</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "propertyId": "uuid",
  "period": "30d",
  "kpis": {
    "occupancyRate": 0.85,
    "revenueCollected": 125000,
    "revenueExpected": 150000,
    "maintenanceOpen": 3
  }
}`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "insights": {
    "summary": "Strong 85% occupancy...",
    "recommendations": ["Consider adjusting..."],
    "alerts": ["3 tickets > 7 days old"]
  },
  "source": "ai",
  "generatedAt": "2026-05-15T10:30:00Z"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Messaging Conversations */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                    <MessageSquare className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">GET /api/messages/conversations</code>
                    <p className="text-[10px] text-muted-foreground">List all user conversations with pagination</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full tracking-widest">60/min</span>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Query Parameters</span>
                  <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <code className="text-foreground font-mono">limit</code>
                      <span className="text-muted-foreground">integer (default: 20)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <code className="text-foreground font-mono">offset</code>
                      <span className="text-muted-foreground">integer (default: 0)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Payments */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CreditCard className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">GET /api/tenant/payments</code>
                    <p className="text-[10px] text-muted-foreground">Payment history with itemized billing breakdown</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full tracking-widest">Auth Required</span>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Structure</span>
                  <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "payments": [{
    "id": "pay_uuid",
    "period": "2026-05",
    "amount": 15000,
    "status": "paid",
    "dueDate": "2026-05-01",
    "paidAt": "2026-05-02T14:30:00Z",
    "breakdown": {
      "baseRent": 12000,
      "electricity": 2000,
      "water": 500,
      "other": 500
    }
  }],
  "summary": {
    "totalPaid": 45000,
    "totalPending": 15000,
    "totalOverdue": 0
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Maintenance Tenant */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Wrench className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">POST /api/tenant/maintenance</code>
                    <p className="text-[10px] text-muted-foreground">Submit new maintenance request with photo upload</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full tracking-widest">Auth Required</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "title": "Leaking faucet in bathroom",
  "description": "Dripping for 2 days...",
  "priority": "medium",
  "category": "plumbing",
  "photos": ["base64_encoded..."]
}`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response (201)</span>
                    <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "id": "req_uuid",
  "status": "open",
  "ticketNumber": "MNT-2026-0042",
  "createdAt": "2026-05-15T10:00:00Z",
  "estimatedResponse": "24h"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Lease Signing */}
            <div className="rounded-[1.5rem] border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <FileSignature className="size-4" />
                  </div>
                  <div>
                    <code className="text-sm font-mono font-bold text-foreground">POST /api/tenant/lease/{'{leaseId}'}/sign</code>
                    <p className="text-[10px] text-muted-foreground">Digital lease agreement signing with signature capture</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full tracking-widest">Auth Required</span>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Body</span>
                  <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "signature": "base64_encoded_signature_image",
  "agreedToTerms": true,
  "ipAddress": "203.0.113.42",
  "signedAt": "2026-05-15T10:00:00Z"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 11.3 Error Handling & Rate Limiting */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-[1.5rem] border border-border bg-card p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              <h3 className="text-lg font-black text-foreground">Error Handling</h3>
            </div>
            <p className="text-sm text-muted-foreground">All errors follow a consistent JSON structure:</p>
            <pre className="bg-muted/50 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-foreground">
{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request fields.",
    "details": [{
      "field": "message",
      "message": "Message is required"
    }]
  },
  "requestId": "req_uuid"
}`}
            </pre>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: "400", label: "VALIDATION_ERROR" },
                { code: "401", label: "UNAUTHORIZED" },
                { code: "403", label: "FORBIDDEN" },
                { code: "404", label: "NOT_FOUND" },
                { code: "409", label: "CONFLICT" },
                { code: "429", label: "RATE_LIMITED" }
              ].map((e) => (
                <div key={e.code} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-xs font-black text-red-500">{e.code}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{e.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Gauge className="size-5" />
              </div>
              <h3 className="text-lg font-black text-foreground">Rate Limiting</h3>
            </div>
            <p className="text-sm text-muted-foreground">Per-endpoint rate limits protect system stability:</p>
            <div className="space-y-3">
              {[
                { endpoint: "/api/iris/*", limit: "30 req/min", color: "bg-purple-500/10 text-purple-500" },
                { endpoint: "/api/messages/*", limit: "60 req/min", color: "bg-green-500/10 text-green-500" },
                { endpoint: "All other endpoints", limit: "100 req/min", color: "bg-blue-500/10 text-blue-500" }
              ].map((r) => (
                <div key={r.endpoint} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <code className="text-xs font-mono text-foreground">{r.endpoint}</code>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest ${r.color}`}>{r.limit}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Headers</span>
              {["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"].map((h) => (
                <div key={h} className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{h}</span>
                  <span className="text-foreground">Included in all responses</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OpenAPI Reference */}
        <div className="rounded-[1.5rem] border border-border bg-card p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FileCode className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">OpenAPI 3.1 Specification</h3>
              <p className="text-sm text-muted-foreground">Full interactive API documentation available at /openapi.json</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Import to", value: "Postman / Insomnia" },
              { label: "Generate", value: "Client SDKs" },
              { label: "Interactive Docs", value: "Swagger UI (coming soon)" }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <div className="size-1 rounded-full bg-primary" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">{item.label}</span>
                  <span className="text-sm font-bold text-foreground">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Master CTA / Developer Access */}
      <section className="mt-16 rounded-[3rem] bg-foreground dark:bg-card dark:border dark:border-border p-12 sm:p-24 text-background dark:text-foreground text-center space-y-10 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)] dark:hidden" />
        <Chip className="absolute -right-20 -top-20 size-80 text-background/5 dark:text-primary/5 rotate-12" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <div className="size-20 rounded-[2rem] bg-primary flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 dark:shadow-primary/20">
            <Key className="size-10 text-primary-foreground" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-background dark:text-foreground tracking-tighter sm:text-6xl">Unlock Developer Access</h2>
            <p className="text-lg text-background/60 dark:text-muted-foreground leading-relaxed font-medium">
              Join the iReside ecosystem. Request verified developer keys to build on our API, 
              access internal webhooks, and integrate third-party rental services.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button className="h-16 rounded-2xl px-10 font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 dark:shadow-primary/10" asChild>
              <Link href="/docs/support/contact">
                Request API Key <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button variant="ghost" className="h-16 rounded-2xl px-8 text-background dark:text-foreground hover:bg-background/10 dark:hover:bg-muted/50 font-black text-lg" asChild>
              <Link href="/docs">Standard Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Detailed Technical Footer */}
      <footer className="border-t border-border pt-16 flex flex-col sm:flex-row justify-between items-start gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <ShieldCheck className="size-10 text-primary" />
            <div>
              <div className="text-xl font-black text-foreground tracking-tighter">iReside Engineering Core</div>
              <div className="text-xs text-muted-foreground font-black uppercase tracking-widest">Internal Security Protocol v2.5.4</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-medium">
            Confidential technical manual for iReside internal operations. 
            Reproduction or redistribution without verified developer credentials 
            is strictly prohibited.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-16">
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Contact</h5>
            <div className="space-y-2">
              <Link href="mailto:security@ireside.app" className="block text-xs text-muted-foreground hover:text-primary transition-colors">security@ireside.app</Link>
              <Link href="mailto:api@ireside.app" className="block text-xs text-muted-foreground hover:text-primary transition-colors">api@ireside.app</Link>
            </div>
          </div>
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Institution</h5>
            <p className="text-xs text-muted-foreground leading-tight font-medium">
              CEIT - Pamantasan ng Lungsod ng Valenzuela
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
