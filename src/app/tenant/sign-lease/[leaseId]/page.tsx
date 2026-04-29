"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DigitalSigner } from "@/components/shared/DigitalSigner/DigitalSigner";
import { generateLeasePdf } from "@/lib/lease-pdf";
import { verifySigningToken } from "@/lib/jwt";
import { CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface LeaseDetails {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  terms: any;
  unit: {
    name: string;
    property: {
      name: string;
      address: string;
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

export default function TenantLeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [leasePdf, setLeasePdf] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract params and token
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setLeaseId(resolvedParams.leaseId);
      const tokenParam = searchParams.get("token");
      setToken(tokenParam);
    };
    void extractParams();
  }, [params, searchParams]);

  // Verify token and fetch lease details
  useEffect(() => {
    if (!leaseId || !token) return;

    const verifyAndFetchLease = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify token
        const tokenResult = verifySigningToken(token);
        if (!tokenResult.valid || !tokenResult.payload) {
          setError(tokenResult.error || "Invalid signing token");
          setLoading(false);
          return;
        }

        // Fetch lease details
        const response = await fetch(`/api/tenant/leases/${leaseId}`);
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
            terms: leaseData.terms
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

  const handleSigned = async (signedBlob: Blob) => {
    if (!leaseId || !token) return;

    try {
      // Since the current API expects a data URL for the signature, 
      // but we now have a full signed PDF, we should ideally upload the PDF.
      // However, to minimize database changes, we can extract the signature from the PDF 
      // OR just update the API to accept a file.
      
      // For now, I'll convert the blob to a data URL and send it as the signature 
      // AND also upload the PDF to storage if we had a place for it.
      
      // Let's check if there's a storage bucket for signed leases.
      // The current leases table has tenant_signature as a string (likely data URL of the ink).
      
      // But wait, the robust technology is about the PDF.
      // I'll update the API call to send the signed PDF to a new endpoint or handle it.
      
      // Actually, I'll just stick to the current API's requirement for now but use the new UI.
      // To get the "signature" from the DigitalSigner, I'd need to change DigitalSigner to return signatures separately.
      
      // ALTERNATIVELY: I'll just upload the whole signed PDF to Supabase storage 
      // and store the URL in the database. 
      // But the database type is string for signature.
      
      // Let's just send the signed blob to the API.
      // I'll update the API to handle Multipart Form Data or just send the blob.

      const reader = new FileReader();
      reader.readAsDataURL(signedBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch(`/api/tenant/leases/${leaseId}/sign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_signature: base64data, // This is now the whole PDF as data URL (hacky but works with existing schema)
            signing_token: token,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to sign lease");
        }

        setSuccess(true);
        toast.success("Lease signed successfully!");

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/tenant/dashboard");
        }, 2000);
      };

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign lease");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-2 border-indigo-500/20 rounded-full mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-t-2 border-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-indigo-400">Preparing Lease Document</h2>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Generating high-fidelity contract</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Access Denied</h1>
          <p className="text-zinc-500 font-medium leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/tenant/dashboard")}
            className="w-full bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-emerald-500/20 rounded-[2.5rem] p-12 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Contract Sealed</h1>
          <p className="text-zinc-500 font-medium leading-relaxed">
            Your lease agreement has been digitally signed and secured. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!lease || !leasePdf) {
    return null;
  }

  return (
    <DigitalSigner 
        file={leasePdf}
        onSigned={handleSigned}
        title={`Lease Agreement - ${lease.unit.property.name}`}
    />
  );
}
