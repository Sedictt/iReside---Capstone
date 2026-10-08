"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";
import type { ManualAudience } from "@/lib/docs/docsData";

const AUDIENCES: ManualAudience[] = ["tenant", "landlord", "it"];

const parseAudience = (value: string | null): ManualAudience =>
  AUDIENCES.includes(value as ManualAudience) ? (value as ManualAudience) : "landlord";

/**
 * Public interactive manual. Signed-in tenants never reach this page: the
 * middleware sends them to /tenant/docs, which only offers the tenant manual.
 */
function PublicManual() {
  const searchParams = useSearchParams();
  const initialAudience = parseAudience(searchParams.get("manual"));
  const initialSearchQuery = searchParams.get("q")?.trim() ?? "";

  return (
    <DocumentationHub
      initialAudience={initialAudience}
      defaultBackHref="/docs/introduction"
      initialSearchQuery={initialSearchQuery}
    />
  );
}

export default function PublicDocsPageRoute() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-zinc-100" aria-busy="true" />}>
      <PublicManual />
    </Suspense>
  );
}
