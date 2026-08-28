"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EBookReader } from "@/components/landlord/docs/EBookReader";
import { DocAudience } from "@/lib/docs/docsData";

export default function TenantInteractiveManualPage() {
  const router = useRouter();
  const [audience, setAudience] = useState<DocAudience>("tenant");

  return (
    <div className="h-screen w-full bg-zinc-950 text-foreground overflow-hidden flex flex-col">
      <EBookReader
        audience={audience}
        onAudienceChange={setAudience}
        defaultBackHref="/tenant/dashboard"
      />
    </div>
  );
}
