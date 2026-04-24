"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CheckCircle2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const ConsultationTool = dynamic(() => import('../../admin/consultation-tool/ConsultationTool'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center justify-center font-sans">
      <div className="relative mb-8">
        <div className="w-20 h-20 border-2 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 w-20 h-20 border-t-2 border-indigo-500 rounded-full animate-spin" />
      </div>
      <h2 className="text-2xl font-black tracking-tighter uppercase text-indigo-400">Loading Viewer</h2>
      <p className="text-zinc-500 text-sm mt-2 font-medium uppercase tracking-widest">Preparing high-fidelity environment</p>
    </div>
  )
});

export default function SignPage() {
  const { id } = useParams();
  const [docData, setDocData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    const { data, error } = await supabase
      .from('consultation_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Document not found or link expired');
    } else {
      setDocData(data);
      if (data.status === 'signed') {
        setIsFinished(true);
      }
    }
    setIsLoading(false);
  };

  const handleSigned = async (signedUrl: string) => {
    const { error } = await supabase
      .from('consultation_documents')
      .update({
        status: 'signed',
        signed_file_url: signedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update document status');
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) return null;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8 border border-emerald-500/20"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase">Document Signed</h1>
        <p className="text-zinc-500 max-w-sm font-medium mb-10 leading-relaxed">
          Thank you for your technical consultation. Your signature has been embedded and saved to our secure storage.
        </p>
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center gap-4 max-w-xs w-full">
           <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
             <FileText className="w-6 h-6" />
           </div>
           <div className="text-left">
             <div className="text-sm font-bold truncate max-w-[150px]">{docData?.file_name}</div>
             <div className="text-[10px] text-zinc-500 font-black uppercase">Signed & Sealed</div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <ConsultationTool 
      fileUrl={docData?.file_url} 
      onSigned={handleSigned}
    />
  );
}
