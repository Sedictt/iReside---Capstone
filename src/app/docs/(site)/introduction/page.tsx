import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Building2, Home, Server, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS_EDITION, MANUAL_TITLES, getArticlesForAudience } from "@/lib/docs/docsData";

export const metadata: Metadata = {
  title: "Introduction | iReside Docs",
  description: "What iReside is, who it is for, and how the tenant, landlord, and technical manuals are organised.",
};

const MANUAL_CARDS = [
  { audience: "tenant" as const, icon: Home, href: "/docs?manual=tenant", portalHref: "/tenant/docs" },
  { audience: "landlord" as const, icon: Building2, href: "/docs?manual=landlord", portalHref: "/landlord/docs" },
  { audience: "it" as const, icon: Server, href: "/docs?manual=it", portalHref: "/docs/technical" },
];

export default function IntroductionPage() {
  return (
    <div className="space-y-16 pb-16">
      <section className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Edition {DOCS_EDITION}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-text-high sm:text-5xl">Introduction</h1>
        <p className="max-w-3xl text-xl leading-relaxed text-text-medium">
          This site collects everything you need to run or live in a property managed with iReside. Start with the
          manual for your role, then use the guides in the sidebar for longer walkthroughs.
        </p>
      </section>

      <section id="what-is-ireside" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-black text-text-high">What is iReside?</h2>
        <p className="leading-relaxed text-text-medium">
          iReside is a private property management platform for individual landlords and their tenants. A landlord
          registers a building, lays out its units, invites applicants, issues digital leases, bills rent and submetered
          utilities, and verifies payments. Tenants sign their lease, pay through GCash or in person, report repairs,
          book facilities, and message their landlord, all from one portal or the mobile app.
        </p>
      </section>

      <section id="who-is-this-for" className="scroll-mt-24 space-y-6">
        <h2 className="text-2xl font-black text-text-high">Who is this for?</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {MANUAL_CARDS.map(({ audience, icon: Icon, href, portalHref }) => {
            const manual = MANUAL_TITLES[audience];
            const topics = getArticlesForAudience(audience).length;
            return (
              <div key={audience} className="flex flex-col rounded-2xl border border-divider bg-surface-1 p-6 transition-colors hover:border-primary/30">
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black text-text-high">{manual.short}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-medium">{manual.tagline}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-disabled">{topics} topics</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-full bg-primary text-white hover:bg-primary-dark" asChild>
                    <Link href={href}>
                      Read interactive <ArrowRight className="ml-1.5 size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full border-divider" asChild>
                    <Link href={portalHref}>{audience === "it" ? "Technical site" : "Open in portal"}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-text-medium">
          Signed-in tenants always open the tenant manual. Landlords can read all three.
        </p>
      </section>

      <section id="features" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-black text-text-high">Platform features</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Property, floor, and unit setup with a visual unit map",
            "Invite links, application screening, and tenant provisioning",
            "Digital lease signing with landlord countersignature",
            "Automatic monthly invoices with submetered electricity and water",
            "GCash and in-person payment verification with official receipts",
            "Maintenance tickets with photos, priorities, and repair tracking",
            "Facility bookings, announcements, polls, and albums",
            "Direct messaging with automatic masking of sensitive details",
            "Analytics, CSV exports, and a document vault",
            "Windows, Android, and web access with two-factor authentication",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-medium">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link href="/docs/features" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Explore the feature overview <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </section>

      <section id="how-it-works" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-black text-text-high">How it works</h2>
        <ol className="space-y-3">
          {[
            ["Landlord sets up", "Register the property, lay out units, configure GCash and utility tariffs."],
            ["Applicant applies", "The landlord shares an invite link or lobby QR code; the applicant submits details and documents."],
            ["Lease is signed", "On approval the tenant receives credentials and a signing link; the landlord countersigns."],
            ["Billing runs monthly", "Invoices are generated on the first of the month and paid through GCash or in person."],
            ["Everyday operations", "Repairs, bookings, announcements, and messages run through the same portal."],
          ].map(([title, body], index) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-divider bg-surface-1 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-black text-primary">
                {index + 1}
              </span>
              <div>
                <p className="font-bold text-text-high">{title}</p>
                <p className="text-sm text-text-medium">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-divider bg-surface-1 p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="size-6 text-primary" aria-hidden="true" />
          <div>
            <p className="font-bold text-text-high">Prefer a book?</p>
            <p className="text-sm text-text-medium">The interactive manual can be read page by page and downloaded as PDF.</p>
          </div>
        </div>
        <Button className="rounded-xl bg-primary px-6 font-black text-white hover:bg-primary-dark" asChild>
          <Link href="/docs">
            Open the interactive manual <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
