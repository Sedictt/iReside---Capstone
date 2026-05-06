import React from "react";
import Link from "next/link";
import { 
  Building2, 
  Map, 
  FileText, 
  Wallet, 
  MessageSquare, 
  Wrench, 
  ShieldCheck,
  CheckCircle,
  LayoutGrid,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Core Features - iReside Documentation",
  description: "Learn about the core platform capabilities of iReside like the Unit Map, Document Manager, Financial Hub, Communication, and Maintenance.",
};

export default function FeaturesPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Header */}
      <section className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Platform Capabilities
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-text-high sm:text-5xl">
          Core Features of <span className="text-primary">iReside</span>
        </h1>
        <p className="text-xl text-text-medium max-w-3xl leading-relaxed">
          iReside goes beyond basic property management, providing specialized tools
          engineered specifically for private landlords and their tenants to organize
          their transactions directly.
        </p>
      </section>

      {/* Unit Map - The Hero Feature */}
      <section id="unit-map" className="scroll-mt-24 space-y-8 rounded-3xl border border-divider bg-surface-1 p-8 lg:p-12 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 text-primary font-semibold">
              <Map className="h-5 w-5" />
              <span>Signature Feature</span>
            </div>
            <h2 className="text-3xl font-bold text-text-high">Interactive Unit Map</h2>
            <p className="text-lg text-text-medium leading-relaxed">
              Visualize your entire property layout at a glance. The Unit Map feature transforms standard, text-based property lists into an interactive, visual grid that mirrors your actual building layout.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex gap-3">
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                  <CheckCircle className="h-full w-full" />
                </div>
                <span className="text-text-medium"><strong>Visual Organization:</strong> Represent properties spatially to match reality. Easily identify which unit is adjacent to which.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                  <CheckCircle className="h-full w-full" />
                </div>
                <span className="text-text-medium"><strong>Instant Status Indicators:</strong> Color-coded blocks immediately reveal which units are vacant, occupied, or pending maintenance.</span>
              </li>
              <li className="flex gap-3">
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center p-1">
                  <CheckCircle className="h-full w-full" />
                </div>
                <span className="text-text-medium"><strong>Quick Actions:</strong> Click any unit block to instantly access lease details, tenant information, and open requests.</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 rounded-xl border border-divider bg-surface-2 p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <img 
              src="/section-cards/unit-map.png" 
              alt="Interactive Unit Map visualization showing property layout with color-coded units" 
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
            <p className="text-sm text-text-medium italic">Visual representation of the intuitive Unit Map layout</p>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="grid gap-8 sm:grid-cols-2">
        {/* Document & Lease */}
        <div id="document-manager" className="scroll-mt-24 space-y-4 rounded-2xl border border-divider bg-surface-1 p-8 hover:border-primary/30 transition-colors">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-text-high">Document & Lease Manager</h3>
          <p className="text-text-medium leading-relaxed">
            Move away from disorganized file folders. Keep all essential records securely centralized and easy to reference.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Step-by-step guided lease generation and signing via verification checks.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Digital document storage for important artifacts like contracts and IDs.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Clear boundaries on privacy; data is only revealed to corresponding matched parties.</span>
            </li>
          </ul>
        </div>

        {/* Financial Hub */}
        <div id="financial-hub" className="scroll-mt-24 space-y-4 rounded-2xl border border-divider bg-surface-1 p-8 hover:border-primary/30 transition-colors">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-text-high">Financial Hub & Analytics</h3>
          <p className="text-text-medium leading-relaxed">
            Always know your financial positioning with straightforward tracking tools built for private rentals.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Track recurring payment deadlines, eliminating forgotten dates.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Create digital receipts automatically to minimize disputes or double entries.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Visualize expenses against revenue dynamically in clear dashboards.</span>
            </li>
          </ul>
        </div>

        {/* Communication System */}
        <div id="communication" className="scroll-mt-24 space-y-4 rounded-2xl border border-divider bg-surface-1 p-8 hover:border-primary/30 transition-colors">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-text-high">In-App Chat Messaging</h3>
          <p className="text-text-medium leading-relaxed">
            Centralized communication ensures zero lost texts, preserving a clean history between landlords and tenants.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>A professional boundary separating tenancy discussions from personal chat apps.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Real-time instant messaging built directly into the platform workflow.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Attachment and media support for sharing pictures of premises or receipts.</span>
            </li>
          </ul>
        </div>

        {/* Maintenance Tracking */}
        <div id="maintenance" className="scroll-mt-24 space-y-4 rounded-2xl border border-divider bg-surface-1 p-8 hover:border-primary/30 transition-colors">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-text-high">Maintenance Ticketing</h3>
          <p className="text-text-medium leading-relaxed">
            Stop losing track of repair requests. Tenants can report issues immediately with photo evidence while landlords maintain an organized queue.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Tenants open maintenance requests with categorized urgency and image uploads.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Landlords track issues across multiple states: Pending, In Progress, or Resolved.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>Easily cross-reference expenses incurred during repair directly on the dashboard.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Verification Safety note */}
      <section className="rounded-2xl bg-zinc-950 dark:bg-black border border-zinc-800 p-8 text-white">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex px-4 py-4 rounded-full bg-zinc-800 shrink-0">
            <ShieldCheck className="h-8 w-8 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Verified Landlords for Safe Transacting</h3>
            <p className="text-zinc-400">
              In iReside, to maintain the safety of the ecosystem, landlord users undergo screening administered completely by platform administrators. Once proven verified, landlords have the authority to manage their own custom standards and manually screen tenants under their criteria—giving private owners full autonomy while blocking malicious actors from entering the system.
            </p>
          </div>
        </div>
      </section>

      {/* Nav footer */}
      <div className="flex items-center justify-end pt-8">
        <Button className="bg-primary hover:bg-primary-dark text-white" asChild>
          <Link href="/docs/getting-started/quick-start">
            Continue to Quick Start <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}