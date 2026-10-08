"use client";

import React, { useState } from "react";
import type { DocAudience, ManualAudience } from "@/lib/docs/docsData";
import { EBookReader } from "@/components/landlord/docs/EBookReader";
import { cn } from "@/lib/utils";

interface DocumentationHubProps {
  initialAudience?: ManualAudience;
  /** Manuals the reader may switch between. Defaults to all three. */
  allowedAudiences?: ManualAudience[];
  className?: string;
  defaultBackHref?: string;
  hideBackLink?: boolean;
  showWrittenGuidesLink?: boolean;
  initialSearchQuery?: string;
}

/**
 * Full-screen interactive manual. Wraps the e-book reader with audience state so
 * each route (public /docs, /landlord/docs, /tenant/docs) only decides which manuals
 * are available and where "back" leads.
 */
export function DocumentationHub({
  initialAudience = "landlord",
  allowedAudiences,
  className,
  defaultBackHref,
  hideBackLink,
  showWrittenGuidesLink,
  initialSearchQuery,
}: DocumentationHubProps) {
  const [audience, setAudience] = useState<DocAudience>(initialAudience);

  return (
    <div className={cn("h-screen w-full overflow-hidden bg-zinc-100 text-zinc-900", className)}>
      <EBookReader
        audience={audience}
        onAudienceChange={setAudience}
        allowedAudiences={allowedAudiences}
        defaultBackHref={defaultBackHref}
        hideBackLink={hideBackLink}
        showWrittenGuidesLink={showWrittenGuidesLink}
        initialSearchQuery={initialSearchQuery}
      />
    </div>
  );
}
