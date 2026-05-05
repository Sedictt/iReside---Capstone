import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Rocket, 
  Users, 
  Shield, 
  MessageSquare, 
  Zap, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  const categories = [
    {
      title: "For Tenants",
      description: "Learn how to accept invitations, complete verification, and manage your tenancy.",
      icon: Users,
      href: "/docs/tenant/applications",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "For Landlords",
      description: "Master tenant invitations, digital screening, and automated management.",
      icon: Shield,
      href: "/docs/landlord/screening",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Platform Features",
      description: "Explore the secure, invite-only ecosystem designed for private property management.",
      icon: Rocket,
      href: "/docs/getting-started/quick-start",
      color: "bg-amber-500/10 text-amber-500",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-high sm:text-5xl">
          Welcome to <span className="text-primary">iReside Docs</span>
        </h1>
        <p className="text-xl text-text-medium max-w-2xl leading-relaxed">
          The comprehensive guide to mastering the modern property management platform. 
          Manage your properties and tenancies with confidence and clarity.
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button className="bg-primary hover:bg-primary-dark text-white h-12 px-8 text-lg font-semibold rounded-xl" asChild>
            <Link href="/docs/getting-started/quick-start">
              Get Started <Rocket className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" className="h-12 px-8 text-lg font-semibold rounded-xl border-divider hover:bg-surface-2" asChild>
            <Link href="/docs/support/faq">
              Search FAQ
            </Link>
          </Button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link 
            key={category.title} 
            href={category.href}
            className="group relative flex flex-col gap-4 rounded-2xl border border-divider bg-surface-1 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.color}`}>
              <category.icon className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-text-high group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-text-medium leading-relaxed">
                {category.description}
              </p>
            </div>
            <div className="mt-auto flex items-center text-sm font-semibold text-primary">
              Learn more <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      {/* Why iReside? Section */}
      <section className="rounded-3xl bg-surface-2/50 border border-divider p-8 lg:p-12">
        <div className="mb-10 text-center space-y-2">
          <h2 className="text-3xl font-bold text-text-high tracking-tight">Built for Reliability & Speed</h2>
          <p className="text-text-medium">Everything you need to manage properties with confidence.</p>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-2">
          {[
            {
              title: "Secure Verification",
              description: "End-to-end identity and financial verification for all users.",
              icon: Shield
            },
            {
              title: "Real-time Communication",
              description: "Integrated chat with instant notifications for maintenance and payments.",
              icon: MessageSquare
            },
            {
              title: "Automated Payments",
              description: "Never miss a rent cycle with automated scheduling and receipting.",
              icon: Zap
            },
            {
              title: "Smart Compliance",
              description: "Localized contracts and legal templates built directly into the flow.",
              icon: CheckCircle2
            }
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border border-divider">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-text-high">{feature.title}</h4>
                <p className="text-sm text-text-medium leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community / Support Footer */}
      <section className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-divider bg-primary p-8 text-white sm:flex-row">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Still have questions?</h3>
          <p className="text-white/80">Our support team is here to help you 24/7.</p>
        </div>
        <Button className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-xl font-bold" asChild>
          <Link href="/docs/support/contact">
            Contact Support
          </Link>
        </Button>
      </section>
    </div>
  );
}
