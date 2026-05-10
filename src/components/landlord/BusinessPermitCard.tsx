"use client";

import { Award, Building2, CheckCircle2, Info, ShieldCheck, Loader2, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

type BusinessPermitCardProps = {
    businessName: string | null;
    permitUrl: string | null;
    className?: string;
};

export function BusinessPermitCard({ businessName, permitUrl, className }: BusinessPermitCardProps) {
    const [uploading, setUploading] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/profile/permit", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload");
            }

            // Smoothly refresh the server components to show the new data
            router.refresh();
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload permit photo. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (!businessName && !permitUrl) {
        return (
            <div className={cn("bg-black/40 border border-dashed border-white/10 rounded-3xl p-12 text-center", className)}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
                <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Building2 className="text-[#6d9838]" size={32} />
                </div>
                <h4 className="text-2xl font-display font-semibold text-white mb-2 tracking-tight">Business Verification</h4>
                <p className="text-sm text-neutral-500 mb-8 max-w-sm mx-auto">Complete your professional profile by uploading your business permit to build trust with potential tenants.</p>
                <button 
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="text-[11px] font-bold tracking-widest uppercase px-10 py-3.5 rounded-xl bg-[#6d9838] text-white hover:bg-[#5a7d2e] transition-all shadow-xl shadow-[#6d9838]/20 disabled:opacity-50"
                >
                    {uploading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Start Verification"}
                </button>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden group", className)}>
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#6d9838]/20 to-[#89b84f]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-[#171717]/80 border border-neutral-800 rounded-3xl p-8 md:p-12 backdrop-blur-xl h-full">
                {/* Header & Action Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="size-16 bg-[#6d9838]/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#6d9838]/20 shadow-inner">
                            <Building2 size={32} className="text-[#6d9838]" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-display font-semibold text-white mb-1 tracking-tight">{businessName || "Registered Business"}</h3>
                            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-500">Official Business Identification</p>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                        <button 
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-[#6d9838] hover:bg-[#5a7d2e] text-white text-[11px] font-bold tracking-widest uppercase transition-all shadow-xl shadow-[#6d9838]/20 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    Update Document
                                    <Maximize2 size={16} className="opacity-50 group-hover/btn:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Permit Display Area - Prominent & Centered */}
                <div className="relative group/permit max-w-4xl mx-auto">
                    {permitUrl ? (
                        <div 
                            onClick={() => setShowLightbox(true)}
                            className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 group-hover/permit:scale-[1.01] group-hover/permit:border-[#6d9838]/30 cursor-zoom-in"
                        >
                            <img 
                                src={permitUrl} 
                                alt="Business Permit" 
                                className="w-full h-auto object-cover filter brightness-95 contrast-105 group-hover/permit:brightness-100 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/permit:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-full transform scale-90 group-hover/permit:scale-100 transition-transform duration-500">
                                    <Maximize2 size={32} className="text-white" />
                                </div>
                                <div className="absolute bottom-8 left-8">
                                    <p className="text-xs font-bold text-white tracking-widest uppercase bg-[#6d9838] px-4 py-1.5 rounded-full shadow-lg shadow-[#6d9838]/20">Authentic Document</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-[21/9] bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center gap-6 group-hover:border-[#6d9838]/30 transition-colors">
                            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <Award size={40} className="text-neutral-700" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-neutral-400">No Permit Photo Uploaded</p>
                                <p className="text-[11px] text-neutral-600 uppercase tracking-[0.2em] mt-2">Upload a high-resolution copy for verification</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Floating Decoration */}
                    <div className="absolute -bottom-6 -right-6 size-24 bg-black border border-neutral-800 rounded-full flex items-center justify-center shadow-2xl z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <Award size={32} className="text-[#6d9838]" />
                    </div>
                </div>

                {/* Aesthetic Detail */}
                <div className="absolute -bottom-10 -left-10 opacity-[0.03] pointer-events-none">
                    <Building2 size={320} className="text-white" />
                </div>
            </div>

            {/* Lightbox Overlay */}
            {showLightbox && permitUrl && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setShowLightbox(false)}
                >
                    <button 
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-6 right-6 size-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all z-20"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="relative max-w-5xl w-full max-h-full overflow-hidden flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={permitUrl} 
                            alt="Permit Lightbox" 
                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                            <p className="text-white font-bold text-lg">{businessName || "Business Permit"}</p>
                            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mt-1">Official Document Preview</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

