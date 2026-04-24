"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Copy, Check, Trash2, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'signed';
  signed_file_url: string | null;
  created_at: string;
}

export default function ConsultationDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('consultation_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch documents');
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('consultation-documents')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('consultation-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('consultation_documents')
        .insert([{
          file_name: file.name,
          file_url: publicUrl,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      toast.success('Document uploaded and prepared');
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const copySigningLink = (id: string) => {
    const url = `${window.location.origin}/sign/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Signing link copied to clipboard');
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from('consultation_documents')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document removed');
      fetchDocuments();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase">
              Consultation Manager
            </div>
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Document Dashboard
            </h1>
            <p className="text-zinc-500 font-medium max-w-md">
              Prepare, track, and manage documents for your technical adviser.
            </p>
          </div>

          <label className="group relative">
            <div className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-3 text-sm font-bold shadow-[0_0_30px_-10px_rgba(79,70,229,0.5)] cursor-pointer">
              {isUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
              {isUploading ? 'Uploading...' : 'Prepare New Document'}
            </div>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 text-zinc-700">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-2">No documents prepared</h3>
            <p className="text-zinc-500">Upload your first PDF to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/30 transition-all backdrop-blur-xl flex flex-col justify-between h-full overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all" />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      doc.status === 'signed' 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {doc.status}
                    </div>
                    <button onClick={() => deleteDocument(doc.id)} className="p-2 text-zinc-700 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-black truncate text-zinc-100 mb-1">{doc.file_name}</h3>
                    <p className="text-xs text-zinc-500 font-medium">Prepared {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {doc.status === 'pending' ? (
                    <button
                      onClick={() => copySigningLink(doc.id)}
                      className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 transition-all flex items-center justify-center gap-3 text-sm font-bold group/btn"
                    >
                      <Copy className="w-4 h-4 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                      Copy Signing Link
                    </button>
                  ) : (
                    <a
                      href={doc.signed_file_url || '#'}
                      target="_blank"
                      className="w-full py-4 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 transition-all flex items-center justify-center gap-3 text-sm font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Download Signed PDF
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
