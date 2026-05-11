import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Rocket, 
  Users, 
  Shield, 
  MessageSquare, 
  Zap, 
  CheckCircle2,
  Building2,
  Lock,
  Lightbulb,
  BookOpen,
  LifeBuoy
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
      <section className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-text-high sm:text-5xl">
            Welcome to <span className="text-primary">iReside Docs</span>
          </h1>
          <p className="text-xl text-text-medium max-w-3xl leading-relaxed">
            Your complete guide to property management made simple. Whether you're a landlord screening tenants, a tenant managing your lease, or just getting started, you'll find everything you need right here.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <Button className="bg-primary hover:bg-primary-dark text-white h-12 px-8 text-lg font-bold rounded-xl" asChild>
            <Link href="/docs/getting-started/quick-start">
              Get Started <Rocket className="ml-2 size-5" />
            </Link>
          </Button>
          <Button variant="outline" className="h-12 px-8 text-lg font-bold rounded-xl border-divider hover:bg-surface-2" asChild>
            <Link href="/docs/support/faq">
              Search FAQ
            </Link>
          </Button>
        </div>
      </section>

      {/* What is iReside Section */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 id="what-is-ireside" className="text-3xl font-bold text-text-high">What is iReside?</h2>
          <p className="text-text-medium leading-relaxed max-w-3xl">
            iReside is a modern property management platform designed to make renting easier and more transparent for everyone involved. Instead of juggling spreadsheets and scattered documents, everything happens in one secure place.
          </p>
          <p className="text-text-medium leading-relaxed max-w-3xl">
            Our platform is built for private property owners and managers who want to work directly with tenants without brokers. We simplify the entire process by handling document management, payments, communication, and organization so you can focus on what matters.
          </p>
        </div>
      </section>

      {/* Who Should Use This Section */}
      <section className="space-y-6">
        <h2 id="who-is-this-for" className="text-3xl font-bold text-text-high">Who is This For?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link 
              key={category.title} 
              href={category.href}
              className="group relative flex flex-col gap-4 rounded-2xl border border-divider bg-surface-1 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div className={`flex items-center justify-center rounded-xl ${category.color}`}>
                <category.icon className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-high group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-text-medium leading-relaxed">
                  {category.description}
                </p>
              </div>
              <div className="mt-auto flex items-center text-sm font-bold text-primary">
                Learn more <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Key Features Section */}
      <section className="rounded-3xl bg-surface-2/50 border border-divider p-8 lg:p-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <h2 id="features" className="text-3xl font-bold text-text-high">Platform Capabilities</h2>
            <p className="text-lg text-text-medium leading-relaxed">
              We built iReside with practical features that solve real problems in property management. This includes our signature <strong>Unit Map</strong> visualizing your properties entirely, the <strong>Financial Hub</strong> for tracking payments, built-in <strong>Communication</strong>, and <strong>Maintenance Tracking</strong>.
            </p>
          </div>
          <div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg shadow-primary/20">
              <Link href="/docs/features">
                Explore Core Features <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 id="how-it-works" className="text-3xl font-bold text-text-high">How iReside Works</h2>
          <p className="text-text-medium max-w-3xl leading-relaxed">
            The process is straightforward and designed to be fast without cutting corners on safety.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Get Invited or Invite Others",
              description: "Landlords send invitations to tenants. Tenants accept and create their profile in minutes."
            },
            {
              step: "2", 
              title: "Complete Your Verification",
              description: "Share basic information so we can verify your identity and financial standing. Everything is encrypted and safe."
            },
            {
              step: "3",
              title: "Sign Your Lease",
              description: "Review the lease terms, sign digitally, and you're done. No paperwork, no trips to the office."
            },
            {
              step: "4",
              title: "Manage Everything",
              description: "Pay rent, request repairs, chat with your landlord or tenant, and view documents all in one place."
            },
            {
              step: "5",
              title: "Get Help When You Need It",
              description: "Have a question? Our support team is available to help with any part of your experience."
            },
            {
              step: "6",
              title: "Renew or Move Out Smoothly",
              description: "When it's time to renew the lease or move out, the process is simple and clear for everyone."
            }
          ].map((item, index) => (
            <div key={item.step} className="rounded-2xl border border-divider bg-surface-1 p-6">
              <div className="mb-4 flex items-center justify-center rounded-lg bg-primary/10">
                <span className="text-lg font-bold text-primary">{item.step}</span>
              </div>
              <h4 className="mb-2 font-bold text-text-high">{item.title}</h4>
              <p className="text-sm text-text-medium leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose iReside Section */}
      <section className="space-y-6">
        <h2 id="why-choose" className="text-3xl font-bold text-text-high">Why Choose iReside</h2>
        <div className="rounded-2xl border border-divider bg-surface-1 p-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <h4 className="mb-1 font-bold text-text-high">Your Information is Protected</h4>
                <p className="text-sm text-text-medium leading-relaxed">
                  We use industry-standard encryption to keep all your personal and financial information safe. Only the people who need to see it can access it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center rounded-lg bg-primary/10">
                <LifeBuoy className="size-5 text-teal-500" />
              </div>
              <div>
                <h4 className="mb-1 font-bold text-text-high">Built for Simplicity</h4>
                <p className="text-sm text-text-medium leading-relaxed">
                  You do not need to be tech savvy to use iReside. The interface is intuitive and straightforward, with helpful guidance every step of the way.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-blue-500" />
              </div>
              <div>
                <h4 className="mb-1 font-bold text-text-high">Direct Relationships</h4>
                <p className="text-sm text-text-medium leading-relaxed">
                  Work directly with tenants or landlords without middlemen. This means faster decisions, better communication, and more transparency for everyone.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="size-5 text-primary" />
              </div>
              <div>
                <h4 className="mb-1 font-bold text-text-high">Clear Communication</h4>
                <p className="text-sm text-text-medium leading-relaxed">
                  All agreements and terms are documented and signed digitally. Both landlords and tenants have records of everything, reducing misunderstandings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="space-y-6">
        <h2 id="get-started" className="text-3xl font-bold text-text-high">Ready to Get Started?</h2>
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8">
          <p className="mb-6 text-text-medium leading-relaxed">
            Follow these steps to begin your property management journey. Whether you are a landlord or tenant, we will guide you through the process.
          </p>
          <div className="space-y-4">
            <Link href="/docs/getting-started/quick-start" className="flex items-center gap-3 rounded-lg border border-divider bg-surface-1 p-4 transition-all hover:border-primary/50 hover:bg-surface-2">
              <Rocket className="size-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-text-high">Quick Start Guide</h4>
                <p className="text-sm text-text-medium">Get up and running in 5 minutes</p>
              </div>
              <ArrowRight className="size-4 text-primary flex-shrink-0" />
            </Link>
            <Link href="/docs/tenant/applications" className="flex items-center gap-3 rounded-lg border border-divider bg-surface-1 p-4 transition-all hover:border-primary/50 hover:bg-surface-2">
              <Users className="size-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-text-high">Tenant Guide</h4>
                <p className="text-sm text-text-medium">Learn how to apply and manage your tenancy</p>
              </div>
              <ArrowRight className="size-4 text-primary flex-shrink-0" />
            </Link>
            <Link href="/docs/landlord/screening" className="flex items-center gap-3 rounded-lg border border-divider bg-surface-1 p-4 transition-all hover:border-primary/50 hover:bg-surface-2">
              <Shield className="size-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-text-high">Landlord Guide</h4>
                <p className="text-sm text-text-medium">Find tenants and manage your properties</p>
              </div>
              <ArrowRight className="size-4 text-primary flex-shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-divider bg-primary p-8 text-white sm:flex-row">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Need Help?</h3>
          <p className="text-white/90">Our support team is available to answer your questions and help you succeed on iReside.</p>
        </div>
        <Button className="bg-white text-primary hover:bg-white/90 h-12 px-8 rounded-xl font-bold whitespace-nowrap" asChild>
          <Link href="/docs/support/contact">
            Contact Support
          </Link>
        </Button>
      </section>
    </div>
  );
}
