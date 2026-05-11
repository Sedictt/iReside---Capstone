"use client";

import { useState } from "react";
import { Facebook, Twitter, Linkedin, Instagram, Globe, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Socials = {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
};

type SocialLinksEditorProps = {
    initialSocials: Socials;
    onSave: (newSocials: Socials) => Promise<void>;
};

export function SocialLinksEditor({ initialSocials, onSave }: SocialLinksEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [socials, setSocials] = useState<Socials>(initialSocials);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(socials);
            setIsEditing(false);
            toast.success("Social links updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update social links");
        } finally {
            setIsSaving(false);
        }
    };

    const updateSocial = (key: keyof Socials, value: string) => {
        setSocials(prev => ({ ...prev, [key]: value }));
    };

    if (!isEditing) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-4">
                    {socials.facebook && (
                        <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Facebook size={20} />
                        </a>
                    )}
                    {socials.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Twitter size={20} />
                        </a>
                    )}
                    {socials.linkedin && (
                        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Linkedin size={20} />
                        </a>
                    )}
                    {socials.instagram && (
                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Instagram size={20} />
                        </a>
                    )}
                    {!socials.facebook && !socials.twitter && !socials.linkedin && !socials.instagram && (
                        <p className="text-xs text-neutral-500 italic">No social links added yet</p>
                    )}
                </div>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all opacity-40 hover:opacity-100"
                >
                    Edit Socials
                </button>
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold tracking-widest uppercase text-white">Edit Social Links</h4>
                <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                    <label htmlFor="facebook-url" className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                        <Facebook size={12} className="text-[#1877F2]" /> Facebook URL
                    </label>
                    <input 
                        id="facebook-url"
                        type="url" 
                        value={socials.facebook || ""} 
                        onChange={(e) => updateSocial("facebook", e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6d9838]/50 transition-colors"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="twitter-url" className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                        <Twitter size={12} className="text-[#1DA1F2]" /> Twitter URL
                    </label>
                    <input 
                        id="twitter-url"
                        type="url" 
                        value={socials.twitter || ""} 
                        onChange={(e) => updateSocial("twitter", e.target.value)}
                        placeholder="https://twitter.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6d9838]/50 transition-colors"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="linkedin-url" className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                        <Linkedin size={12} className="text-[#0A66C2]" /> LinkedIn URL
                    </label>
                    <input 
                        id="linkedin-url"
                        type="url" 
                        value={socials.linkedin || ""} 
                        onChange={(e) => updateSocial("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6d9838]/50 transition-colors"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="instagram-url" className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                        <Instagram size={12} className="text-[#E4405F]" /> Instagram URL
                    </label>
                    <input 
                        id="instagram-url"
                        type="url" 
                        value={socials.instagram || ""} 
                        onChange={(e) => updateSocial("instagram", e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#6d9838]/50 transition-colors"
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-[#6d9838] hover:bg-[#5a7d2e] text-white py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-[#6d9838]/20 disabled:opacity-50"
            >
                {isSaving ? "Saving..." : <><Save size={14} /> Save Social Links</>}
            </button>
        </div>
    );
}

