"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";

export default function LandlordDocsPageRoute() {
  const router = useRouter();

  return (
    <div className="h-screen w-full bg-zinc-950 text-foreground overflow-hidden flex flex-col">
      <DocumentationHub
        onNavigateTab={(tabId) => {
          router.push(`/landlord/settings?tab=${tabId}`);
        }}
      />
    </div>
  );
}
