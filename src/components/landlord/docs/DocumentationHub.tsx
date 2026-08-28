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

  return (
    <div className={cn("w-full space-y-4", className)}>
      <EBookReader
        audience={audience}
        onAudienceChange={setAudience}
        onNavigateTab={onNavigateTab}
        defaultBackHref={defaultBackHref}
      />
    </div>
  );
}
