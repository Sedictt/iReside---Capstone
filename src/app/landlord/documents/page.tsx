"use client";

import { useEffect, useState } from "react";
import { 
    FileText, 
    ShieldCheck, 
    Download, 
    Eye, 
    Clock, 
    X,
    Maximize2,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    Filter,
    Calendar,
    ArrowUpDown,
    Fingerprint,
    Building2,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { useProperty } from "@/context/PropertyContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    UserCircle2, 
    Files
} from "lucide-react";

interface Document {
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    updatedAt: string;
    status?: string;
    isTemplate?: boolean;
    templateData?: any;
    propertyId?: string;
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
    const [activeTab, setActiveTab] = useState<"compliance" | "leases">("compliance");
    const { selectedPropertyId } = useProperty();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab, selectedPropertyId, statusFilter, typeFilter]);

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
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Accessing Vault...</p>
                </div>
            </div>
        );
    }

    const registrationDocs = documents.filter(d => d.category !== "Lease");
    
    const filteredLeaseDocs = documents.filter(d => {
        if (d.category !== "Lease") return false;
        
        // Property filter
        if (selectedPropertyId && selectedPropertyId !== 'all' && d.propertyId && d.propertyId !== selectedPropertyId) return false;
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!(d.name.toLowerCase().includes(query) || 
                d.description.toLowerCase().includes(query) ||
                d.id.toLowerCase().includes(query))) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'active' && d.status !== 'active') return false;
            if (statusFilter === 'pending' && !d.status?.includes('pending')) return false;
            if (statusFilter === 'terminated' && d.status !== 'terminated' && d.status !== 'expired') return false;
        }

        // Type filter
        if (typeFilter !== 'all') {
            if (typeFilter === 'template' && !d.isTemplate) return false;
            if (typeFilter === 'lease' && d.isTemplate) return false;
        }
        
        return true;
    });

    const totalPages = Math.ceil(filteredLeaseDocs.length / itemsPerPage);
    const paginatedLeaseDocs = filteredLeaseDocs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen bg-background p-8 pb-20">
            <div className="mx-auto max-w-6xl space-y-12">
                
                {/* ─── Hero Header ─── */}
                <header className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-gradient-to-br from-neutral-900 to-neutral-950 p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="flex size-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-xl">
                            <ShieldCheck className="size-12 text-primary" strokeWidth={1} />
                        </div>
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
                            </span>
                            Secure Document Vault
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black tracking-tighter text-white md:text-6xl">
                                Professional Archive <br />
                                & <span className="text-primary">Lease Vault.</span>
                            </h1>
                            <p className="max-w-xl text-lg font-medium leading-relaxed text-neutral-400">
                                Access your executed agreements, smart contract templates, and identity records in one secure, encrypted hub.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-8">
                    
                    <div className="space-y-8">
                        {/* ─── Navigation Tabs ─── */}
                        <div className="flex items-center gap-1 border-b border-white/5">
                            <button 
                                onClick={() => setActiveTab("compliance")}
                                className={cn(
                                    "relative flex items-center gap-2 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                                    activeTab === "compliance" ? "text-primary" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <UserCircle2 className="size-4" />
                                Personal & Compliance
                                {activeTab === "compliance" && (
                                    <motion.div layoutId="docTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab("leases")}
                                className={cn(
                                    "relative flex items-center gap-2 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                                    activeTab === "leases" ? "text-primary" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <Files className="size-4" />
                                Property & Leases
                                {activeTab === "leases" && (
                                    <motion.div layoutId="docTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                        </div>

                        {/* ─── Document Content ─── */}
                        <AnimatePresence mode="wait">
                            {activeTab === "compliance" ? (
                                <motion.div 
                                    key="compliance"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12"
                                >
                                    {/* Registration Credentials */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-3">
                                                <Fingerprint className="size-5 text-primary" />
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
                                                        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                                                            <Icon className="size-7 text-neutral-500 transition-colors group-hover:text-primary" strokeWidth={1.5} />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-base font-semibold text-white truncate">{doc.name}</h3>
                                                                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-neutral-400">
                                                                    {doc.category}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-neutral-500 truncate">{doc.description}</p>
                                                            <div className="flex items-center gap-4 pt-1">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                                                    <Clock className="size-3" />
                                                                    Uploaded {new Date(doc.updatedAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <a 
                                                                href={doc.url} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                            >
                                                                <Eye className="size-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="leases"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12"
                                >
                                    {/* Lease Agreements */}
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
                                            <div className="space-y-1">
                                                <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-3">
                                                    <FileText className="size-5 text-primary" />
                                                    Lease Contracts
                                                </h2>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                                    {filteredLeaseDocs.length} Total Documents Found
                                                </p>
                                            </div>

                                            {/* Search & Filters */}
                                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                {/* Search Bar */}
                                                <div className="relative group w-full sm:w-64">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                        <SearchIcon className="size-4 text-neutral-500 transition-colors group-focus-within:text-primary" />
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        placeholder="Search records..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full h-12 bg-neutral-900/40 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/20 focus:bg-neutral-900/60 transition-all"
                                                    />
                                                </div>

                                                {/* Status Filter */}
                                                <div className="relative">
                                                    <select 
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="h-12 bg-neutral-900/40 border border-white/5 rounded-2xl px-4 text-xs font-bold text-neutral-400 focus:outline-none focus:border-primary/20 transition-all appearance-none pr-10 cursor-pointer hover:bg-neutral-900/60"
                                                    >
                                                        <option value="all">ALL STATUS</option>
                                                        <option value="active">ACTIVE ONLY</option>
                                                        <option value="pending">PENDING SIGN</option>
                                                        <option value="terminated">ARCHIVED</option>
                                                    </select>
                                                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 size-3 text-neutral-500 pointer-events-none" />
                                                </div>

                                                {/* Type Filter */}
                                                <div className="relative">
                                                    <select 
                                                        value={typeFilter}
                                                        onChange={(e) => setTypeFilter(e.target.value)}
                                                        className="h-12 bg-neutral-900/40 border border-white/5 rounded-2xl px-4 text-xs font-bold text-neutral-400 focus:outline-none focus:border-primary/20 transition-all appearance-none pr-10 cursor-pointer hover:bg-neutral-900/60"
                                                    >
                                                        <option value="all">ALL TYPES</option>
                                                        <option value="lease">EXECUTED</option>
                                                        <option value="template">TEMPLATES</option>
                                                    </select>
                                                    <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 size-3 text-neutral-500 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 min-h-[400px] content-start">
                                            {paginatedLeaseDocs.length > 0 ? (
                                                <AnimatePresence mode="popLayout">
                                                    {paginatedLeaseDocs.map((doc) => {
                                                        const Icon = getIcon(doc.category);
                                                        return (
                                                            <motion.div 
                                                                key={doc.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className="group relative flex items-center gap-6 rounded-[2rem] border border-white/5 bg-neutral-900/40 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-neutral-900/60"
                                                            >
                                                                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                                                                    <Icon className="size-7 text-neutral-500 transition-colors group-hover:text-primary" strokeWidth={1.5} />
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0 space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="text-base font-semibold text-white truncate">{doc.name}</h3>
                                                                        <span className={cn(
                                                                            "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter",
                                                                            doc.isTemplate ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"
                                                                        )}>
                                                                            {doc.isTemplate ? "TEMPLATE" : "EXECUTED"}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-neutral-500 truncate">{doc.description}</p>
                                                                    <div className="flex items-center gap-4 pt-1">
                                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                                                            <Clock className="size-3" />
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
                                                                            className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                                        >
                                                                            <Maximize2 className="size-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            <a 
                                                                                href={doc.url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                                            >
                                                                                <Eye className="size-4" />
                                                                            </a>
                                                                            <a 
                                                                                href={doc.url}
                                                                                download={`${doc.name.replace(/\s+/g, '_')}.pdf`}
                                                                                className="flex size-10 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-neutral-400 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                                            >
                                                                                <Download className="size-4" />
                                                                            </a>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            ) : (
                                                <div className="rounded-[2rem] border border-dashed border-white/10 bg-neutral-900/20 p-12 text-center h-[400px] flex flex-col items-center justify-center">
                                                    <FileText className="size-10 text-neutral-700 mx-auto mb-4" />
                                                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">No Documents Found</p>
                                                    <p className="text-xs text-neutral-600 mt-1">Select a different property or try a different search term.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-4 pt-8">
                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="flex size-12 items-center justify-center rounded-2xl border border-white/5 bg-neutral-900/40 text-neutral-400 transition-all hover:border-primary/20 hover:text-primary disabled:opacity-20 disabled:hover:border-white/5 disabled:hover:text-neutral-400"
                                                >
                                                    <ChevronLeft className="size-5" />
                                                </button>
                                                
                                                <div className="flex items-center gap-2">
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={cn(
                                                                "size-12 rounded-2xl text-[11px] font-black transition-all",
                                                                currentPage === i + 1 
                                                                    ? "bg-primary text-black shadow-lg shadow-primary/20" 
                                                                    : "border border-white/5 bg-neutral-900/40 text-neutral-500 hover:border-primary/20 hover:text-white"
                                                            )}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="flex size-12 items-center justify-center rounded-2xl border border-white/5 bg-neutral-900/40 text-neutral-400 transition-all hover:border-primary/20 hover:text-primary disabled:opacity-20 disabled:hover:border-white/5 disabled:hover:text-neutral-400"
                                                >
                                                    <ChevronRight className="size-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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
                                <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-widest">Digital Agreement Preview</h4>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Smart Template • Secure Protocol v2.1</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowPreview(false)}
                                className="size-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                            >
                                <X className="size-6" />
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

