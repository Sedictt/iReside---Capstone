"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSignature } from "lucide-react";

type PendingLease = {
    id: string;
    propertyName: string | null;
    unitName: string | null;
    signingUrl: string;
};

/**
 * Prompts a tenant whose lease is still waiting for their signature to sign it.
 * Until they sign, the lease isn't active, so the rest of the portal reports
 * "no active lease"; this gives them the way forward from inside the portal.
 */
export function PendingLeaseSignatureBanner() {
    const [lease, setLease] = useState<PendingLease | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch("/api/tenant/lease/signing-link")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled) setLease(data?.lease ?? null);
            })
            .catch(() => {
                if (!cancelled) setLease(null);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (!lease) return null;

    const place = [lease.propertyName, lease.unitName].filter(Boolean).join(" · ");

    return (
        <div className="pointer-events-auto mt-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                    <FileSignature className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">Your lease is waiting for your signature</p>
                    <p className="text-xs text-muted-foreground">
                        {place ? `${place}. ` : ""}Your lease becomes active once you sign it. Until then, some pages will show that you have no active lease.
                    </p>
                </div>
            </div>
            <Link
                href={lease.signingUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                Review &amp; sign
                <ArrowRight className="size-4" />
            </Link>
        </div>
    );
}
