"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignaturePad } from "@/components/landlord/applications/SignaturePad";
import { verifySigningToken } from "@/lib/jwt";
import { FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface LeaseDetails {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  terms: Record<string, any> | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
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

        // Verify lease ID matches token
        if (tokenResult.payload.leaseId !== leaseId) {
          setError("Lease ID mismatch");
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lease");
      } finally {
        setLoading(false);
      }
    };

    void verifyAndFetchLease();
  }, [leaseId, token]);

  const handleSignature = async (signatureDataUrl: string) => {
    if (!leaseId || !token) return;

    try {
      setSigning(true);
      setError(null);

      const response = await fetch(`/api/tenant/leases/${leaseId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_signature: signatureDataUrl,
          signing_token: token,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign lease");
      }

      setSuccess(true);

      // Redirect to tenant dashboard after 2 seconds
      setTimeout(() => {
        router.push("/tenant/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign lease");
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading lease details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unable to Load Lease</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/tenant/dashboard")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-green-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lease Signed Successfully!</h1>
          <p className="text-muted-foreground">
            Your lease is now active. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Sign Your Lease Agreement</h1>
          <p className="text-muted-foreground">
            Please review the lease terms below and sign to activate your lease
          </p>
        </div>

        {/* Lease Details Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Property Information */}
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold text-foreground mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-semibold text-foreground">{lease.unit.property.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-semibold text-foreground">{lease.unit.name}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold text-foreground">{lease.unit.property.address}</p>
              </div>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Lease Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Lease Start Date</p>
                <p className="font-semibold text-foreground">{formatDate(lease.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease End Date</p>
                <p className="font-semibold text-foreground">{formatDate(lease.end_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-semibold text-foreground text-lg">{formatCurrency(lease.monthly_rent)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposit</p>
                <p className="font-semibold text-foreground text-lg">{formatCurrency(lease.security_deposit)}</p>
              </div>
            </div>

            {/* Additional Terms */}
            {lease.terms && (
              <div className="mt-6 space-y-4">
                {lease.terms.house_rules && Array.isArray(lease.terms.house_rules) && lease.terms.house_rules.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">House Rules</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {lease.terms.house_rules.map((rule: string, index: number) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {lease.terms.amenities && Array.isArray(lease.terms.amenities) && lease.terms.amenities.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Amenities</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {lease.terms.amenities.map((amenity: string, index: number) => (
                        <li key={index}>{amenity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Landlord Information */}
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold text-foreground mb-4">Landlord Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{lease.landlord.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold text-foreground">{lease.landlord.email}</p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Your Signature</h2>
            <p className="text-sm text-muted-foreground mb-6">
              By signing below, you agree to the terms and conditions of this lease agreement.
            </p>
            <SignaturePad
              onSave={handleSignature}
              width={800}
              height={200}
              className="max-w-full"
            />
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            If you have any questions about this lease, please contact your landlord at{" "}
            <a href={`mailto:${lease.landlord.email}`} className="text-primary hover:underline">
              {lease.landlord.email}
            </a>
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {signing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground font-semibold">Signing your lease...</p>
          </div>
        </div>
      )}
    </div>
  );
}
