"use client";

import React from "react";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";

/**
 * Tenant manual. Tenants are limited to this manual: the middleware redirects
 * them here from /docs and /landlord/docs, and the reader hides the other manuals.
 */
export default function TenantInteractiveManualPage() {
  return (
    <DocumentationHub
      initialAudience="tenant"
      allowedAudiences={["tenant"]}
      defaultBackHref="/tenant/dashboard"
      showWrittenGuidesLink={false}
    />
  );
}
