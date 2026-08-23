"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";

export default function LandlordDocsPageRoute() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Main Documentation Hub Container */}
      <div className="p-6 sm:p-8 md:p-10 rounded-3xl neumorphic-panel border border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl">
        <DocumentationHub
          onNavigateTab={(tabId) => {
            router.push(`/landlord/settings?tab=${tabId}`);
          }}
        />
      </div>
    </div>
  );
}
