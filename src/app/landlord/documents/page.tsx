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
    ExternalLink,
    X,
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaseDocument } from "@/components/lease/LeaseDocument";

interface Document {
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    updatedAt: string;
    isTemplate?: boolean;
    templateData?: any;
}

interface VerificationInfo {
    status: string;
    verificationStatus: string;
    verifiedAt: string;
}

interface LandlordProfile {
    full_name: string;
    avatar_url: string;
    avatar_bg_color: string;
    phone: string;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [verification, setVerification] = useState<VerificationInfo | null>(null);
    const [profile, setProfile] = useState<LandlordProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Document | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetch("/api/landlord/documents");
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.error || "Failed to fetch documents");
                
                setDocuments(data.documents);
                setVerification(data.verification);
                setProfile(data.profile);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const getIcon = (category: string) => {
        switch (category) {
            case "Identity": return Fingerprint;
            case "Business": return Building2;
            case "Property": return FileText;
            case "Lease": return ShieldCheck;
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

    const registrationDocs = documents.filter(d => d.category !== "Lease");
    const leaseDocs = documents.filter(d => d.category === "Lease");

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
                                Your compliance records, property deeds, and legal lease agreements are encrypted and stored securely.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    
                    {/* ─── Document Sections ─── */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Registration Credentials */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                    <Fingerprint className="h-5 w-5 text-primary" />
                                    Identity & Compliance
                                </h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{registrationDocs.length} Records</span>
                            </div>

                            <div className="grid gap-4">
                                {registrationDocs.map((doc) => {
                                    const Icon = getIcon(doc.category);
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
                                                        {doc.category}
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
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lease Agreements */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Lease Contracts
                                </h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{leaseDocs.length} Active</span>
                            </div>

                            <div className="grid gap-4">
                                {leaseDocs.length > 0 ? leaseDocs.map((doc) => {
                                    const Icon = getIcon(doc.category);
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
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-primary">
                                                        OFFICIAL
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-500 truncate">{doc.description}</p>
                                                <div className="flex items-center gap-4 pt-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                                        <Clock className="h-3 w-3" />
                                                        Ref: {doc.id.slice(0, 8)} • {new Date(doc.updatedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {doc.isTemplate ? (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedTemplate(doc);
                                                            setShowPreview(true);
                                                        }}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                    >
                                                        <Maximize2 className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="rounded-[2rem] border border-dashed border-white/10 bg-neutral-900/20 p-12 text-center">
                                        <FileText className="h-10 w-10 text-neutral-700 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">No Active Lease Contracts</p>
                                        <p className="text-xs text-neutral-600 mt-1">Contracts will appear here once properties are listed and tenants sign.</p>
                                    </div>
                                )}
                            </div>
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
            {/* ─── Preview Modal ─── */}
            {showPreview && selectedTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowPreview(false)} />
                    
                    <div className="relative w-full max-w-4xl max-h-full bg-neutral-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-widest">Digital Agreement Preview</h4>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Smart Template • Secure Protocol v2.1</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowPreview(false)}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-12 bg-neutral-950/50 custom-scrollbar">
                            <div className="max-w-3xl mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white">
                                <LeaseDocument 
                                    id="PREVIEW-MODE"
                                    start_date={new Date().toISOString().split('T')[0]}
                                    end_date={new Date(Date.now() + 31536000000).toISOString().split('T')[0]}
                                    monthly_rent={selectedTemplate.templateData?.base_rent_amount || 0}
                                    security_deposit={selectedTemplate.templateData?.base_rent_amount || 0}
                                    signed_at={null}
                                    signed_document_url={null}
                                    unit={{
                                        id: "preview-unit",
                                        name: "Unit 101",
                                        floor: 1,
                                        sqft: 25,
                                        beds: 1,
                                        baths: 1,
                                        property: {
                                            id: "preview-prop",
                                            name: selectedTemplate.name.replace("Contract Template - ", ""),
                                            address: "Property Address Sample",
                                            city: "Metro Manila",
                                            images: [],
                                            house_rules: selectedTemplate.templateData?.customClauses?.map((c: any) => `${c.title}: ${c.description}`) || [],
                                            amenities: []
                                        }
                                    } as any}
                                    landlord={{
                                        id: "landlord-id",
                                        full_name: profile?.full_name || "Landlord",
                                        avatar_url: profile?.avatar_url || "",
                                        avatar_bg_color: profile?.avatar_bg_color || "#10B981",
                                        phone: profile?.phone || "000-000-0000"
                                    }}
                                    tenant={{
                                        full_name: "Prospective Tenant"
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
