"use client";

import React from "react";
import { DocumentationHub } from "@/components/landlord/docs/DocumentationHub";

/** Landlords can read every manual, including the tenant manual, to support their tenants. */
export default function LandlordDocsPageRoute() {
  return <DocumentationHub initialAudience="landlord" defaultBackHref="/landlord/dashboard" />;
}
