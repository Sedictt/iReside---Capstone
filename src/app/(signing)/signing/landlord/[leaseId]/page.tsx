"use client";

import { useEffect, useState, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { generateLeasePdf } from "@/lib/lease-pdf";
import { CheckCircle2, AlertCircle, FileText, Shield, ArrowLeft, PenTool } from "lucide-react";
import { useAppToast } from "@/hooks/useAppToast";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Dynamic import for DigitalSigner to avoid SSR errors with pdfjs-dist
const DigitalSigner = dynamic(
  () => import("@/components/shared/DigitalSigner/DigitalSigner").then(mod => mod.DigitalSigner),
  { ssr: false }
);

interface LeaseDetails {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  terms: any;
  tenant_signature: string;
  tenant_signed_at: string;
  unit: {
    name: string;
    property: {
      name: string;
      address: string;
      contract_template?: any;
    };
  };
  landlord: {
    full_name: string;
    email: string;
  };
  tenant: {
    full_name: string;
    email: string;
  };
}

function LandlordSigningContent({ params }: { params: Promise<{ leaseId: string }> }) {
  const { push } = useRouter();
  const { get } = useSearchParams();
  const resolvedParams = use(params);
  const leaseId = resolvedParams.leaseId;
  const token = get("token");
  
  const toast = useAppToast();
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [leasePdf, setLeasePdf] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!leaseId || !token) {
        setError("Missing lease ID or signing token.");
        setLoading(false);
        return;
    }

    const verifyAndFetchLease = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch lease details with token for verification
        const response = await fetch(`/api/landlord/leases/${leaseId}?token=${token}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch lease details");
        }

        const leaseData = await response.json();
        setLease(leaseData);

        // Generate PDF
        const pdfBlob = await generateLeasePdf({
            id: leaseData.id,
            startDate: new Date(leaseData.start_date).toLocaleDateString(),
            endDate: new Date(leaseData.end_date).toLocaleDateString(),
            monthlyRent: leaseData.monthly_rent,
            securityDeposit: leaseData.security_deposit,
            property: leaseData.unit.property,
            unit: leaseData.unit,
            landlord: { name: leaseData.landlord.full_name, email: leaseData.landlord.email },
            tenant: { name: leaseData.tenant.full_name, email: leaseData.tenant.email },
            terms: leaseData.terms,
            tenantSignature: leaseData.tenant_signature,
            tenantSignedAt: leaseData.tenant_signed_at
        });
        setLeasePdf(pdfBlob);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lease");
      } finally {
        setLoading(false);
      }
    };

    void verifyAndFetchLease();
  }, [leaseId, token]);

  const handleSigned = async (signedBlob: Blob, signatureDataUrl?: string) => {
    if (!leaseId || !token || !signatureDataUrl) {
      toast.error("Signature data is missing. Please try signing again.");
      return;
    }

    try {
      const response = await fetch(`/api/landlord/leases/${leaseId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          landlord_signature: signatureDataUrl,
          signing_token: token,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to countersign lease");
      }

      setSuccess(true);
      toast.success("Lease countersigned and activated!");

      // Redirect after delay
      setTimeout(() => {
        push("/landlord/dashboard");
      }, 3000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to countersign lease");
    }
  };

  return loading ? (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative size-24 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PenTool className="size-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tighter uppercase text-white italic">Validating Agreement</h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">Preparing for Countersign</p>
        </div>
      </div>
    </div>
  ) : error ? (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-white/5 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl backdrop-blur-3xl"
      >
        <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto ring-1 ring-red-500/20">
          <AlertCircle className="size-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Access Denied</h1>
          <p className="text-zinc-500 font-medium leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => push("/landlord/dashboard")}
          className="group w-full bg-white text-black hover:bg-primary hover:text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
        >
          <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          Return to Dashboard
        </button>
      </motion.div>
    </div>
  ) : success ? (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-white/5 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl backdrop-blur-3xl"
      >
        <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/20">
          <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Lease Activated</h1>
          <p className="text-zinc-500 font-medium leading-relaxed">
            The agreement is now legally binding. Both parties have signed.
          </p>
        </div>
        <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 flex items-center gap-4">
           <Shield className="size-8 text-primary shrink-0" />
           <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Legal Enforcement</p>
              <p className="text-xs text-white font-medium">Digital signatures finalized and archived.</p>
           </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 animate-pulse">Redirecting to Dashboard...</p>
      </motion.div>
    </div>
  ) : (!lease || !leasePdf) ? null : (
    <DigitalSigner 
        initialFile={leasePdf}
        onSigned={handleSigned}
        title={`Countersign Lease: ${lease.tenant.full_name}`}
        primaryActionLabel="Countersign & Activate"
    />
  );
}

export default function LandlordLeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative size-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-white italic">Loading Environment</h2>
        </div>
      </div>
    }>
      <LandlordSigningContent params={params} />
    </Suspense>
  );
}
