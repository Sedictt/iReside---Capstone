"use client";

import React, { useState } from "react";
import { DocAudience } from "@/lib/docs/docsData";
import { EBookReader } from "@/components/landlord/docs/EBookReader";
import { cn } from "@/lib/utils";

interface DocumentationHubProps {
  onNavigateTab?: (tabId: string) => void;
  className?: string;
}

export function DocumentationHub({ onNavigateTab, className }: DocumentationHubProps) {
  const [audience, setAudience] = useState<DocAudience>("user");

  return (
    <div className={cn("w-full space-y-4", className)}>
      <EBookReader
        audience={audience}
        onAudienceChange={setAudience}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}
