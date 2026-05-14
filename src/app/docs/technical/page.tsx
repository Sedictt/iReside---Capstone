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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardHover = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -8, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function TechnicalDocPage() {
  return (
    <div className="relative space-y-32 pb-32 pt-12 overflow-hidden selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="absolute left-1/2 top-0 -z-10 h-[1000px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(109,152,56,0.08)_0,transparent_70%)]" />
      <div className="absolute -left-40 top-1/4 -z-10 size-96 rounded-full bg-blue-500/5 blur-[120px] animate-pulse" />
      <div className="absolute -right-40 top-3/4 -z-10 size-96 rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Hero Section */}
      <section className="relative px-4 sm:px-0">
        <m.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-black tracking-widest uppercase text-primary backdrop-blur-sm">
            <ShieldCheck className="size-4 animate-pulse" />
            Core Engineering & Architecture
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-text-high sm:text-8xl lg:text-[100px] leading-[0.9]">
            The <span className="text-primary italic">Engine</span> <br />
            of iReside
          </h1>
          <p className="max-w-2xl text-xl leading-relaxed text-text-medium/80 font-medium">
            A deep-dive into the distributed systems, security layers, and AI pipelines that power 
            the iReside multi-tenant property management ecosystem.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface-1/50 px-4 py-2 backdrop-blur-md">
              <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black uppercase text-text-medium">Next.js 16 Edge Ready</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface-1/50 px-4 py-2 backdrop-blur-md">
              <div className="size-2 rounded-full bg-blue-500" />
              <span className="text-xs font-black uppercase text-text-medium">Supabase RLS Enabled</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-divider bg-surface-1/50 px-4 py-2 backdrop-blur-md">
              <div className="size-2 rounded-full bg-orange-500" />
              <span className="text-xs font-black uppercase text-text-medium">Llama 3.1 RAG Active</span>
            </div>
          </div>
        </m.div>
      </section>

      {/* 1. Core Architecture Philosophies */}
      <section id="architecture" className="scroll-mt-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-text-high">Architecture Blueprint</h2>
            <p className="max-w-xl text-text-medium">Our system is designed with a "Security First, UX Second" philosophy, ensuring data integrity without compromising speed.</p>
          </div>
          <div className="text-right">
            <span className="text-8xl font-black text-primary/10">01</span>
          </div>
        </div>

        <m.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {[
            {
              title: "Distributed Multi-Tenancy",
              desc: "Each property operates as a logically isolated cluster. We use schema-level and row-level separation to ensure 100% data privacy.",
              icon: Layers,
              gradient: "from-blue-500/20 to-cyan-500/0",
              accent: "text-blue-500"
            },
            {
              title: "Event-Driven Sync",
              desc: "Using PostgreSQL Change Data Capture (CDC) and Webhooks, every interaction is broadcast to connected clients in <200ms.",
              icon: Zap,
              gradient: "from-primary/20 to-primary/0",
              accent: "text-primary"
            },
            {
              title: "Stateless API Design",
              desc: "Our Next.js API routes are designed for the edge, ensuring low-latency processing regardless of geographic location.",
              icon: Server,
              gradient: "from-purple-500/20 to-pink-500/0",
              accent: "text-purple-500"
            }
          ].map((card, i) => (
            <m.div 
              key={i}
              variants={fadeInUp}
              whileHover="hover"
              initial="initial"
              className="group relative overflow-hidden rounded-[2.5rem] border border-divider bg-surface-1/50 p-10 backdrop-blur-md"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", card.gradient)} />
              <div className={cn("relative mb-8 flex size-16 items-center justify-center rounded-2xl bg-surface-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", card.accent)}>
                <card.icon className="size-8" />
              </div>
              <div className="relative space-y-4">
                <h3 className="text-2xl font-black text-text-high">{card.title}</h3>
                <p className="text-text-medium/80 leading-relaxed">{card.desc}</p>
              </div>
            </m.div>
          ))}
        </m.div>
      </section>

      {/* 2. Database & Data Isolation (RLS) */}
      <section id="database" className="scroll-mt-32 space-y-16">
        <div className="rounded-[3rem] border border-divider bg-[#0a0a0a] p-8 sm:p-16 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 -z-0 opacity-10 blur-2xl">
            <Database className="size-[500px] text-primary" />
          </div>
          
          <div className="relative z-10 grid gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-primary">
                Data Sovereignty
              </div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">Row-Level Security (RLS) Enforcement</h2>
              <p className="text-lg text-white/60 leading-relaxed">
                Security is handled at the database core. We don't just filter data in the code; 
                we filter it at the SQL engine level. This makes data leakage physically impossible 
                even if the application logic is compromised.
              </p>
              
              <div className="space-y-6">
                {[
                  { label: "Landlord Isolation", text: "Landlords can only access rows linked to their workspace UUID." },
                  { label: "Tenant Privacy", text: "Tenants can only see their own payment history and active leases." },
                  { label: "System Hardening", text: "No direct DB access; all queries pass through authenticated Supabase clients." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <span className="font-black text-white">{item.label}:</span>{" "}
                      <span className="text-white/50">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="size-5 text-primary" />
                    <span className="font-mono text-sm font-bold text-white/40 uppercase">PostgreSQL Policy Example</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-500/50" />
                    <div className="size-3 rounded-full bg-yellow-500/50" />
                    <div className="size-3 rounded-full bg-green-500/50" />
                  </div>
                </div>
                <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-blue-300">
                  {`CREATE POLICY "Landlords can manage properties"
ON properties
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Enforced globally across all queries`}
                </pre>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-primary/10 p-6 border border-primary/20">
                <Info className="size-6 text-primary shrink-0" />
                <p className="text-sm text-white/80">
                  <span className="font-black">Note:</span> This architecture ensures compliance with GDPR and local data protection standards by default.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. iRis Intelligence Pipeline (RAG) */}
      <section id="iris" className="scroll-mt-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-text-high">iRis: Intelligence Layer</h2>
            <p className="max-w-xl text-text-medium">Our AI doesn't hallucinate. It retrieves ground-truth data before generating every response.</p>
          </div>
          <div className="text-right">
            <span className="text-8xl font-black text-primary/10">02</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border border-divider bg-surface-2 group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black tracking-widest text-text-disabled uppercase">Pipeline Status</div>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-black text-text-high">RAG FLOW ACTIVE</span>
                      </div>
                    </div>
                    <Cpu className="size-10 text-primary animate-spin-slow" />
                  </div>
                  
                  {/* Visual Representation of RAG */}
                  <div className="flex items-center justify-center gap-4 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-16 rounded-2xl bg-surface-1 border border-divider flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="size-8 text-text-medium" />
                      </div>
                      <span className="text-[10px] font-black text-text-disabled">USER QUERY</span>
                    </div>
                    <ArrowRight className="size-6 text-primary animate-pulse" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Search className="size-10 text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase">RETRIEVAL</span>
                    </div>
                    <ArrowRight className="size-6 text-primary animate-pulse" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-16 rounded-2xl bg-surface-1 border border-divider flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <MessageSquare className="size-8 text-text-medium" />
                      </div>
                      <span className="text-[10px] font-black text-text-disabled">RESPONSE</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-mono text-text-disabled">0x7F...9A2B | SYSTEM_STABLE</div>
                    <div className="flex gap-2">
                      <div className="h-1 w-8 rounded-full bg-primary" />
                      <div className="h-1 w-4 rounded-full bg-primary/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-divider bg-surface-1 p-8 space-y-3">
                <div className="size-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Globe className="size-5" />
                </div>
                <h4 className="font-black text-text-high">Context Awareness</h4>
                <p className="text-sm text-text-medium leading-relaxed">iRis identifies the user's role, property rules, and lease status before processing queries.</p>
              </div>
              <div className="rounded-3xl border border-divider bg-surface-1 p-8 space-y-3">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Database className="size-5" />
                </div>
                <h4 className="font-black text-text-high">Vector Search (pgvector)</h4>
                <p className="text-sm text-text-medium leading-relaxed">We use semantic embeddings to find the most relevant clauses in complex digital handbooks.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-[2.5rem] border border-divider bg-surface-1 p-10 space-y-6">
              <h3 className="text-2xl font-black text-text-high tracking-tight">The Retrieval Process</h3>
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-divider">
                {[
                  { step: "Tokenization", desc: "User input is converted into high-dimensional vectors." },
                  { step: "Similarity Search", desc: "Top-k relevant chunks are retrieved from pgvector." },
                  { step: "Prompt Injection", desc: "Context is injected into a secure Llama 3.1 prompt." },
                  { step: "Generation", desc: "A factual, grounded response is streamed to the UI." }
                ].map((item, i) => (
                  <div key={i} className="relative pl-10">
                    <div className="absolute left-0 top-1 size-7 rounded-full bg-surface-1 border-2 border-primary flex items-center justify-center text-[10px] font-black text-primary z-10">
                      {i + 1}
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-black text-text-high text-sm">{item.step}</h5>
                      <p className="text-xs text-text-medium/70 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 flex items-center gap-6">
              <Zap className="size-10 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Benchmark</div>
                <div className="text-2xl font-black text-text-high">~1.2s Latency</div>
                <p className="text-xs text-text-medium">From query to first token stream.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Technology Stack Deep-Dive */}
      <section id="stack" className="scroll-mt-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-text-high">Full Stack Ecosystem</h2>
            <p className="max-w-xl text-text-medium">A curated selection of high-performance tools engineered for the modern web.</p>
          </div>
          <div className="text-right">
            <span className="text-8xl font-black text-primary/10">03</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Next.js 16", cat: "CORE FRAMEWORK", color: "text-black dark:text-white", icon: Globe, desc: "App Router & React Server Components for optimal performance." },
            { name: "Supabase", cat: "INFRASTRUCTURE", color: "text-emerald-500", icon: Database, desc: "PostgreSQL, Auth, Real-time & Edge Functions." },
            { name: "Groq AI", cat: "INTELLIGENCE", color: "text-orange-500", icon: Cpu, desc: "Ultra-fast inference using Llama 3.1 70B & 8B models." },
            { name: "Tailwind 4", cat: "DESIGN SYSTEM", color: "text-cyan-500", icon: Box, desc: "Modern utility-first styling with zero runtime overhead." },
            { name: "Framer Motion", cat: "EXPERIENCE", color: "text-purple-500", icon: Activity, desc: "Fluid, physics-based animations and transitions." },
            { name: "TypeScript", cat: "RELIABILITY", color: "text-blue-500", icon: Code2, desc: "Strict type-safety across the entire stack." },
            { name: "Playwright", cat: "QUALITY", color: "text-red-500", icon: CheckCircle2, desc: "End-to-end automated testing and browser verification." },
            { name: "PWA Engine", cat: "MOBILE READY", color: "text-pink-500", icon: Smartphone, desc: "Offline support and native-app installability." }
          ].map((tech, i) => (
            <m.div
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="group relative flex flex-col justify-between rounded-[2rem] border border-divider bg-surface-1/50 p-8 transition-all hover:border-primary/30 hover:shadow-2xl backdrop-blur-sm"
            >
              <div className="space-y-4">
                <div className={cn("inline-flex size-12 items-center justify-center rounded-2xl bg-surface-2 transition-transform duration-500 group-hover:rotate-6", tech.color)}>
                  <tech.icon className="size-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-disabled">{tech.cat}</div>
                  <div className="text-xl font-black text-text-high">{tech.name}</div>
                </div>
                <p className="text-xs text-text-medium/70 leading-relaxed">{tech.desc}</p>
              </div>
              <div className="mt-6 flex h-1.5 w-8 rounded-full bg-divider group-hover:w-full group-hover:bg-primary transition-all duration-500" />
            </m.div>
          ))}
        </div>
      </section>

      {/* 5. API Reference & Structure */}
      <section id="api" className="scroll-mt-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-text-high">API & Data Interface</h2>
            <p className="max-w-xl text-text-medium">Secure, versioned, and RESTful endpoints for cross-platform integration.</p>
          </div>
          <div className="text-right">
            <span className="text-8xl font-black text-primary/10">04</span>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2.5rem] border border-divider bg-[#0d1117] font-mono text-sm shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-4">
                <div className="flex items-center gap-3">
                  <Webhook className="size-4 text-primary" />
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Endpoint: POST /api/iris/chat</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-500/30" />
                  <div className="size-2.5 rounded-full bg-yellow-500/30" />
                  <div className="size-2.5 rounded-full bg-green-500/30" />
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">Request Payload</div>
                  <pre className="text-blue-300">
                    {`{
  "message": "When is my rent due?",
  "history": [ ... ]
}`}
                  </pre>
                </div>
                <div className="h-px bg-white/5" />
                <div className="space-y-2">
                  <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">Response Stream</div>
                  <pre className="text-emerald-400">
                    {`{
  "response": "Your rent is due on the 5th...",
  "meta": { "latency": "840ms" }
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-divider bg-surface-1 p-10">
              <h3 className="mb-6 text-xl font-black text-text-high">Route Map</h3>
              <div className="space-y-4">
                {[
                  { route: "/api/admin", role: "Admin", desc: "Platform monitoring & verification." },
                  { route: "/api/auth", role: "Public", desc: "Session lifecycle & credential management." },
                  { route: "/api/landlord", role: "Landlord", desc: "Lease creation, unit management & analytics." },
                  { route: "/api/tenant", role: "Tenant", desc: "Payment submission & maintenance reporting." },
                  { route: "/api/iris", role: "Authenticated", desc: "AI interaction & knowledge retrieval." }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-2 p-4 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="size-2 rounded-full bg-primary" />
                      <div>
                        <div className="font-mono text-sm font-bold text-text-high">{item.route}</div>
                        <div className="text-xs text-text-medium/60">{item.desc}</div>
                      </div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase text-primary">
                      {item.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex-1 rounded-[2.5rem] border border-divider bg-surface-1 p-12 text-center flex flex-col items-center justify-center space-y-6">
              <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Code2 className="size-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-text-high tracking-tight">API Access Tier</h3>
                <p className="text-text-medium max-w-xs mx-auto">Access to the iReside API is strictly restricted to authenticated application clients and authorized third-party integrations.</p>
              </div>
              <Button className="h-14 rounded-2xl px-10 font-black text-lg bg-primary hover:bg-primary-dark transition-all shadow-xl shadow-primary/20" asChild>
                <Link href="/docs/support/contact">
                  Request Developer Key <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
            
            <div className="rounded-[2.5rem] border border-divider bg-surface-1/50 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <Lock className="size-6 text-orange-500" />
                <h4 className="font-black text-text-high">Security Protocol</h4>
              </div>
              <p className="text-sm text-text-medium leading-relaxed">
                All requests require a valid <span className="font-mono font-bold text-text-high">JWT Bearer Token</span>. 
                CSRF protection is enforced on all state-mutating requests. Rate limiting is 
                applied at the Edge Layer (Vercel/Supabase).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Lifecycle of a Lease (Logic Flow) */}
      <section id="lifecycle" className="scroll-mt-32 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-text-high">Business Logic: Lease Lifecycle</h2>
            <p className="max-w-xl text-text-medium">The underlying state machine that governs the rental relationship.</p>
          </div>
          <div className="text-right">
            <span className="text-8xl font-black text-primary/10">05</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-8">
          <div className="min-w-[800px] flex items-center justify-between px-12">
            {[
              { status: "Draft", desc: "Lease created by landlord", icon: FileText, color: "bg-text-disabled" },
              { status: "Pending", desc: "Waiting for tenant sign", icon: Eye, color: "bg-blue-500" },
              { status: "Active", desc: "Lease in effect", icon: RefreshCcw, color: "bg-primary" },
              { status: "Ending", desc: "Notice period active", icon: History, color: "bg-orange-500" },
              { status: "Expired", desc: "Lease concluded", icon: Lock, color: "bg-red-500" }
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-4 w-40 text-center">
                  <div className={cn("size-16 rounded-full flex items-center justify-center text-white shadow-xl group", item.color)}>
                    <item.icon className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-text-high">{item.status}</h5>
                    <p className="text-[10px] text-text-medium/70 leading-tight">{item.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 bg-divider mx-4 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-divider" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="pt-16 border-t border-divider">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-surface-2 flex items-center justify-center">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <div>
              <div className="text-lg font-black text-text-high tracking-tight">iReside Engineering</div>
              <div className="text-sm text-text-medium italic">Confidential Technical Document v2.4.0</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="rounded-xl px-6" asChild>
              <Link href="/docs">Back to Documentation</Link>
            </Button>
            <Button className="rounded-xl px-6 bg-text-high text-white hover:bg-black transition-colors" asChild>
              <Link href="/docs/support/contact">Report Vulnerability</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

function History(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
