"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";

export default function LandlordDocsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden p-4 sm:p-8 md:p-12">
        <div className="relative mx-auto max-w-6xl space-y-6">
          {/* Back to Dashboard Navigation */}
          <button
            onClick={() => router.push("/landlord/settings")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <div className="size-8 rounded-full neumorphic-extruded flex items-center justify-center transition-all">
              <ChevronLeft className="size-4" />
            </div>
            <span className="text-xs font-black tracking-wide">Back to Settings</span>
          </button>

          {/* Main Documentation Hub */}
          <div className="p-6 md:p-8 rounded-3xl neumorphic-panel border border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl">
            <DocumentationHub onNavigateTab={(tab) => router.push(`/landlord/settings?tab=${tab}`)} />
          </div>
        </div>
      </div>
    </div>
  );
}
