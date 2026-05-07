"use client";

import React from 'react';
import dynamic from "next/dynamic";
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Dynamic import for DigitalSigner to avoid SSR errors with pdfjs-dist
const DigitalSigner = dynamic(
  () => import("@/components/shared/DigitalSigner/DigitalSigner").then(mod => mod.DigitalSigner),
  { ssr: false }
);

interface ConsultationToolProps {
  fileUrl?: string;
  onSigned?: (signedUrl: string) => Promise<void>;
}

export default function ConsultationTool({ fileUrl, onSigned }: ConsultationToolProps) {
  const supabase = createClient();

  const handleSigned = async (signedBlob: Blob) => {
    try {
      const fileName = `Signed_document_${Date.now()}.pdf`;
      const { data: uploadData, error } = await supabase.storage
        .from('consultation-documents')
        .upload(`${Date.now()}_${fileName}`, signedBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('consultation-documents')
        .getPublicUrl(uploadData.path);

      if (onSigned) await onSigned(publicUrl);
      toast.success('Document finalized');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload signed document');
    }
  };

  return (
    <DigitalSigner 
      initialFile={fileUrl} 
      onSigned={handleSigned}
      title="Consultation Document"
    />
  );
}
