"use client";

import { useEffect, useState, Suspense, use, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { generateLeasePdf, exportLeaseDocumentElementToPdf } from "@/lib/lease-pdf";
import { LeaseDocument, type LeaseDocumentProps } from "@/components/lease/LeaseDocument";
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
  signed_document_url?: string;
  unit: {
    name: string;
    property: {
      name: string;
      address: string;
      city?: string;
      contract_template?: any;
      house_rules?: string[];
      amenities?: any[];
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
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const leaseId = resolvedParams.leaseId;
  const token = searchParams?.get("token");
  
  const toast = useAppToast();
  const [lease, setLease] = useState<LeaseDetails | null>(null);
  const [leasePdf, setLeasePdf] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formattedLeaseData: LeaseDocumentProps | null = useMemo(() => {
    if (!lease) return null;
    return {
      id: lease.id,
      status: lease.status,
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: Number(lease.monthly_rent || 0),
      security_deposit: Number(lease.security_deposit || 0),
      terms: lease.terms,
      tenant_signature: lease.tenant_signature,
      tenant_signed_at: lease.tenant_signed_at,
      unit: {
        name: lease.unit?.name || "Unit",
        property: {
          name: lease.unit?.property?.name || "Residential Property",
          address: lease.unit?.property?.address || "Address not specified",
          city: lease.unit?.property?.city || "",
          house_rules: lease.unit?.property?.house_rules || lease.unit?.property?.contract_template?.answers?.house_rules,
          amenities: lease.unit?.property?.amenities || lease.unit?.property?.contract_template?.answers?.amenities,
        },
      },
      landlord: {
        full_name: lease.landlord?.full_name || "Landlord",
        email: lease.landlord?.email || "",
      },
      tenant: {
        full_name: lease.tenant?.full_name || "Tenant",
        email: lease.tenant?.email || "",
      },
    };
  }, [lease]);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lease");
        setLoading(false);
      }
    };

    void verifyAndFetchLease();
  }, [leaseId, token]);

  // Generate identical high-fidelity PDF from LeaseDocument
  useEffect(() => {
    if (!lease || leasePdf) return;

    const generateDoc = async () => {
      try {
        // If stored document exists and valid, try to fetch it first
        if (lease.signed_document_url) {
          try {
            const pdfResponse = await fetch(lease.signed_document_url);
            if (pdfResponse.ok) {
              const fetchedBlob = await pdfResponse.blob();
              setLeasePdf(fetchedBlob);
              setLoading(false);
              return;
            }
          } catch {
            // Fallback to local render
          }
        }

        // Wait for DOM mount & font layout
        await new Promise((r) => setTimeout(r, 200));
        const el = document.getElementById("landlord-signing-lease-document");
        let pdfBlob: Blob | null = null;
        if (el) {
          try {
            pdfBlob = await exportLeaseDocumentElementToPdf(el);
          } catch (captureErr) {
            console.warn("[landlord-sign] DOM capture fallback:", captureErr);
          }
        }

        if (!pdfBlob) {
          const formatFullDate = (d?: string) => {
            if (!d) return "N/A";
            try {
              return new Date(d).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
            } catch {
              return d;
            }
          };

          pdfBlob = await generateLeasePdf({
            id: lease.id,
            startDate: formatFullDate(lease.start_date),
            endDate: formatFullDate(lease.end_date),
            monthlyRent: lease.monthly_rent,
            securityDeposit: lease.security_deposit,
            property: lease.unit.property,
            unit: lease.unit,
            landlord: { name: lease.landlord.full_name, email: lease.landlord.email },
            tenant: { name: lease.tenant.full_name, email: lease.tenant.email },
            terms: lease.terms,
            tenantSignature: lease.tenant_signature,
            tenantSignedAt: lease.tenant_signed_at,
          });
        }

        setLeasePdf(pdfBlob);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate agreement document");
      } finally {
        setLoading(false);
      }
    };

    void generateDoc();
  }, [lease, leasePdf]);

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

  return (
    <>
      {/* Hidden offscreen document for generating identical pixel-perfect PDF */}
      {formattedLeaseData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "816px",
            backgroundColor: "#ffffff",
            visibility: "visible",
            pointerEvents: "none",
            zIndex: -9999,
          }}
          aria-hidden="true"
        >
          <LeaseDocument
            containerId="landlord-signing-lease-document"
            disableAnimation={true}
            className="shadow-none border-none max-w-none w-[816px] p-8 sm:p-10"
            {...formattedLeaseData}
          />
        </div>
      )}

      {loading ? (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center space-y-6">
            <div className="relative size-24 mx-auto">
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PenTool className="size-10 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground italic">Validating Agreement</h2>
              <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em]">Preparing for Countersign</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] flex items-center justify-center p-4">
          <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900 dark:border-white/5"
          >
            <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto ring-1 ring-red-500/20">
              <AlertCircle className="size-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Access Denied</h1>
              <p className="text-muted-foreground font-medium leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => push("/landlord/dashboard")}
              className="group w-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      ) : success ? (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] flex items-center justify-center p-4">
          <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900 dark:border-white/5"
          >
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/20">
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Lease Activated</h1>
              <p className="text-muted-foreground font-medium leading-relaxed">
                The agreement is now legally binding. Both parties have signed.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-2xl border border-border flex items-center gap-4">
               <Shield className="size-8 text-primary shrink-0" />
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Enforcement</p>
                  <p className="text-xs text-foreground font-medium">Digital signatures finalized and archived.</p>
               </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 animate-pulse">Redirecting to Dashboard...</p>
          </motion.div>
        </div>
      ) : (!lease || !leasePdf) ? null : (
        <DigitalSigner 
            initialFile={leasePdf}
            onSigned={handleSigned}
            title={`Countersign Lease: ${lease.tenant.full_name}`}
            primaryActionLabel="Countersign & Activate"
        />
      )}
    </>
  );
}

export default function LandlordLeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative size-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-black tracking-tighter uppercase text-foreground italic">Loading Environment</h2>
        </div>
      </div>
    }>
      <LandlordSigningContent params={params} />
    </Suspense>
  );
}
