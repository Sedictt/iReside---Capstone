"use client";

import { Building2, FileText, UploadCloud, Trash2, Loader2, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";

type BusinessPermitCardProps = {
    businessName: string | null;
    permitUrl: string | null;
    className?: string;
};

export function BusinessPermitCard({ businessName, permitUrl, className }: BusinessPermitCardProps) {
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = handleMediaSelection(e, {
            preset: "image",
            notify: (message, description) => toast.error(message, { description }),
        });
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/profile/permit", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to upload permit document");
            }

            toast.success("Business permit uploaded successfully");
            router.refresh();
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.error(error.message || "Failed to upload permit photo. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemove = async () => {
        if (uploading || removing) return;
        const confirmed = window.confirm("Are you sure you want to remove your uploaded business permit?");
        if (!confirmed) return;

        setRemoving(true);
        try {
            const res = await fetch("/api/profile/permit", {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to remove permit");
            }

            toast.success("Business permit removed successfully");
            router.refresh();
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error: any) {
            console.error("Remove failed:", error);
            toast.error(error.message || "Failed to remove permit document");
        } finally {
            setRemoving(false);
        }
    };

    if (!businessName && !permitUrl) {
        return (
            <div className={cn("neumorphic-panel border-2 border-dashed border-border rounded-3xl p-8 md:p-12 text-center", className)}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept={MEDIA_ACCEPT_STRINGS.image}
                />
                <div className="size-16 neumorphic-inset rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="text-primary" size={32} />
                </div>
                <div className="flex items-center justify-center gap-2.5 mb-2">
                    <h4 className="text-2xl font-display font-black text-foreground tracking-tight">Business Permit</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        Optional
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                    You can optionally upload a copy of your business or registration permit to display on your profile for prospective tenants.
                </p>
                <button 
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2.5 text-[11px] font-black tracking-widest uppercase px-10 py-3.5 rounded-xl neumorphic-primary transition-all disabled:opacity-50 cursor-pointer"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={16} />
                            <span>Upload Business Permit (Optional)</span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden group", className)}>
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative neumorphic-panel rounded-3xl p-8 md:p-12 h-full">
                {/* Header & Action Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="size-16 neumorphic-inset-card rounded-2xl flex items-center justify-center shrink-0">
                            <Building2 size={30} className="text-primary" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5 mb-1">
                                <h3 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-tight">
                                    {businessName || "Business Permit"}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                                    Optional
                                </span>
                            </div>
                            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-muted-foreground">
                                Business Permit Document
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept={MEDIA_ACCEPT_STRINGS.image}
                        />
                        {permitUrl && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={uploading || removing}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl neumorphic-extruded text-muted-foreground hover:text-red-500 text-[11px] font-black tracking-widest uppercase transition-all disabled:opacity-50 cursor-pointer"
                                title="Remove uploaded permit"
                            >
                                {removing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                <span>Remove</span>
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={handleUploadClick}
                            disabled={uploading || removing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl neumorphic-primary text-[11px] font-black tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn cursor-pointer"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={16} />
                                    <span>{permitUrl ? "Replace Document" : "Upload Document"}</span>
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
                            className="relative rounded-[2rem] overflow-hidden border border-border shadow-2xl transition-all duration-700 group-hover/permit:scale-[1.01] group-hover/permit:border-primary/30 cursor-zoom-in"
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
                                    <p className="text-xs font-black text-foreground tracking-widest uppercase bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-border/40">
                                        Uploaded Document
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-[21/9] neumorphic-inset border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center gap-4 group-hover:border-primary/30 transition-colors">
                            <div className="size-16 rounded-full neumorphic-inset-card flex items-center justify-center">
                                <FileText size={32} className="text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-foreground">No Permit Photo Uploaded</p>
                                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mt-1.5">
                                    Uploading a business permit is completely optional
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Floating Decoration */}
                    <div className="absolute -bottom-6 -right-6 size-24 neumorphic-extruded border border-border rounded-full flex items-center justify-center shadow-2xl z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <FileText size={28} className="text-primary" />
                    </div>
                </div>

                {/* Aesthetic Detail */}
                <div className="absolute -bottom-10 -left-10 opacity-[0.03] pointer-events-none">
                    <Building2 size={320} className="text-foreground" />
                </div>
            </div>

            {/* Lightbox Overlay */}
            {showLightbox && permitUrl && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setShowLightbox(false)}
                >
                    <button 
                        type="button"
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-6 right-6 size-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all z-20 cursor-pointer"
                        aria-label="Close Preview"
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
                            <p className="text-white font-black text-lg">{businessName || "Business Permit"}</p>
                            <p className="text-neutral-400 text-[10px] uppercase tracking-widest mt-1">Document Preview</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
