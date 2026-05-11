"use client";

import { useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const { replace } = useRouter();
  const { toString } = useSearchParams();
  const { leaseId } = use(params);

  useEffect(() => {
    if (leaseId) {
      const search = toString();
      replace(`/signing/tenant/${leaseId}${search ? `?${search}` : ""}`);
    }
  }, [leaseId, replace, toString]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-center">
      <div className="space-y-6">
        <div className="relative size-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase italic text-white tracking-tighter">Transferring to Secure Portal</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Entering Isolated Environment</p>
        </div>
      </div>
    </div>
  );
}
