"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function LandlordPaymentsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = params ? `/landlord/invoices?${params}` : "/landlord/invoices";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <LoadingSpinner className="size-8 text-primary animate-spin" />
      <p className="text-sm font-bold text-muted-foreground">Redirecting to Billing & Invoices...</p>
    </div>
  );
}

export default function LandlordPaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <LoadingSpinner className="size-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">Loading Finance Hub...</p>
      </div>
    }>
      <LandlordPaymentsRedirect />
    </Suspense>
  );
}
