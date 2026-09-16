"use client";

import React, { useState } from "react";
import { DocAudience } from "@/lib/docs/docsData";
import { EBookReader } from "@/components/landlord/docs/EBookReader";
import { cn } from "@/lib/utils";

interface DocumentationHubProps {
  initialAudience?: DocAudience;
  onNavigateTab?: (tabId: string) => void;
  className?: string;
  defaultBackHref?: string;
}

export function DocumentationHub({
  initialAudience = "landlord",
  onNavigateTab,
  className,
  defaultBackHref,
}: DocumentationHubProps) {
  const [audience, setAudience] = useState<DocAudience>(initialAudience);

  // Derive default back href if not explicitly provided
  const resolvedBackHref =
    defaultBackHref ||
    (initialAudience === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard");

  return (
    <div className={cn("w-full space-y-4", className)}>
      <EBookReader
        audience={audience}
        onAudienceChange={setAudience}
        onNavigateTab={onNavigateTab}
        defaultBackHref={resolvedBackHref}
      />
    </div>
  );
}
