"use client";

import { useEffect, useState } from "react";
import { 
    FileText, 
    ShieldCheck, 
    Download, 
    Eye, 
    Clock, 
    Search,
    Fingerprint,
    Building2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
    id: string;
    name: string;
    description: string;
    url: string;
    type: string;
    updatedAt: string;
}

interface VerificationInfo {
    status: string;
    verificationStatus: string;
    verifiedAt: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [verification, setVerification] = useState<VerificationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetch("/api/landlord/documents");
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.error || "Failed to fetch documents");
                
                setDocuments(data.documents);
                setVerification(data.verification);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "Identity": return Fingerprint;
            case "Business": return Building2;
            case "Property": return FileText;
            default: return FileText;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Accessing Vault...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8 pb-20">
            <div className="mx-auto max-w-6xl space-y-12">
                
                {/* ─── Hero Header ─── */}
                <header className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-neutral-900 to-neutral-950 p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-xl">
                            <ShieldCheck className="h-12 w-12 text-primary" strokeWidth={1} />
                        </div>
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                            </span>
                            Secure Document Vault
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black tracking-tighter text-white md:text-6xl">
                                Verify & Manage <br />
                                <span className="text-primary">Credentials.</span>
                            </h1>
                            <p className="max-w-xl text-lg font-medium leading-relaxed text-neutral-400">
                                Your compliance records and legal documents are encrypted and stored securely. These credentials establish your trust status on the platform.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    
                    {/* ─── Document List ─── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">Verified Documents</h2>
                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{documents.length} Records</span>
                        </div>

                        <div className="grid gap-4">
                            {documents.map((doc) => {
                                const Icon = getIcon(doc.type);
                                return (
                                    <div 
                                        key={doc.id}
                                        className="group relative flex items-center gap-6 rounded-[2rem] border border-white/5 bg-neutral-900/40 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-neutral-900/60"
                                    >
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                                            <Icon className="h-7 w-7 text-neutral-500 transition-colors group-hover:text-primary" strokeWidth={1.5} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-white truncate">{doc.name}</h3>
                                                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-neutral-400">
                                                    {doc.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-500 truncate">{doc.description}</p>
                                            <div className="flex items-center gap-4 pt-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                                    <Clock className="h-3 w-3" />
                                                    Uploaded {new Date(doc.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                            <a 
                                                href={doc.url} 
                                                download 
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── Verification Sidebar ─── */}
                    <aside className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/5 bg-neutral-900/60 p-8 space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Trust Status</h2>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-bold">Account Verification</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl border",
                                            verification?.status === "approved" 
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                                                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                        )}>
                                            {verification?.status === "approved" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Platform Status</p>
                                            <p className="text-lg font-black text-white capitalize">{verification?.status || "Pending"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl border",
                                            verification?.verificationStatus === "verified" 
                                                ? "border-primary/20 bg-primary/10 text-primary" 
                                                : "border-neutral-800 bg-neutral-900 text-neutral-600"
                                        )}>
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Identity Status</p>
                                            <p className="text-lg font-black text-white capitalize">{verification?.verificationStatus?.replace('_', ' ') || "Unverified"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="bg-neutral-800/30 rounded-2xl p-4 border border-white/5">
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Security Notice</p>
                                        <p className="text-xs text-neutral-400 leading-relaxed italic">
                                            "All sensitive documents are processed through encrypted channels. For security, original ID files are only accessible to verified platform administrators."
                                        </p>
                                    </div>
                                </div>
                                
                                <button className="w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5">
                                    Request Re-verification
                                </button>
                            </div>
                        </div>

                        {/* External Help Card */}
                        <div className="rounded-[2rem] border border-white/5 bg-primary/5 p-6 border-primary/20">
                            <div className="flex items-center gap-3 mb-3 text-primary">
                                <Search className="h-4 w-4" strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Public Records</span>
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                                Verify your business status directly via the Valenzuela City Business Databank.
                            </p>
                            <a 
                                href="https://bd.valenzuela.gov.ph/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                                Open Databank <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </aside>
                </div>

            </div>
        </div>
    );
}
