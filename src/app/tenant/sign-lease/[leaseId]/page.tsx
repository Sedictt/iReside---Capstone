"use client";

import { useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leaseId } = use(params);

  useEffect(() => {
    if (leaseId) {
      const search = searchParams.toString();
      router.replace(`/signing/tenant/${leaseId}${search ? `?${search}` : ""}`);
    }
  }, [leaseId, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-center">
      <div className="space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase italic text-white tracking-tighter">Transferring to Secure Portal</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Entering Isolated Environment</p>
        </div>
      </div>
    </div>
  );
}
