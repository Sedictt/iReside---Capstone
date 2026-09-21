"use client";

import { useState } from "react";
import { Facebook, Twitter, Linkedin, Instagram, Globe, Save, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { validateSocialInput, normalizeSocialUrl, type SocialPlatform } from "@/lib/validation/profile";

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
    const [errors, setErrors] = useState<Partial<Record<keyof Socials, string>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const validateField = (key: keyof Socials, val: string) => {
        const res = validateSocialInput(key as SocialPlatform, val);
        setErrors(prev => ({
            ...prev,
            [key]: res.isValid ? undefined : res.error,
        }));
        return res;
    };

    const updateSocial = (key: keyof Socials, value: string) => {
        setSocials(prev => ({ ...prev, [key]: value }));
        validateField(key, value);
    };

    const handleSave = async () => {
        // Validate all fields
        const currentErrors: Partial<Record<keyof Socials, string>> = {};
        let isValid = true;
        const normalizedPayload: Socials = {};

        const fields: (keyof Socials)[] = ["facebook", "twitter", "linkedin", "instagram", "website"];
        for (const field of fields) {
            const val = socials[field]?.trim() ?? "";
            if (val) {
                const res = validateSocialInput(field as SocialPlatform, val);
                if (!res.isValid) {
                    currentErrors[field] = res.error;
                    isValid = false;
                } else if (res.normalized) {
                    normalizedPayload[field] = res.normalized;
                }
            }
        }

        setErrors(currentErrors);

        if (!isValid) {
            toast.error("Please fix invalid social links before saving.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(normalizedPayload);
            setSocials(normalizedPayload);
            setIsEditing(false);
            toast.success("Social links updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update social links");
        } finally {
            setIsSaving(false);
        }
    };

    const hasErrors = Object.values(errors).some(err => !!err);

    if (!isEditing) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-4 flex-wrap">
                    {socials.facebook && (
                        <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Facebook size={20} />
                        </a>
                    )}
                    {socials.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Twitter size={20} />
                        </a>
                    )}
                    {socials.linkedin && (
                        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Linkedin size={20} />
                        </a>
                    )}
                    {socials.instagram && (
                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Instagram size={20} />
                        </a>
                    )}
                    {socials.website && (
                        <a href={socials.website} target="_blank" rel="noopener noreferrer" className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300 hover:-translate-y-1">
                            <Globe size={20} />
                        </a>
                    )}
                    {!socials.facebook && !socials.twitter && !socials.linkedin && !socials.instagram && !socials.website && (
                        <p className="text-xs text-muted-foreground italic">No social links added yet</p>
                    )}
                </div>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full neumorphic-extruded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                    Edit Socials
                </button>
            </div>
        );
    }

    return (
        <div className="neumorphic-inset border border-border/50 rounded-3xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-300 bg-background/50">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black tracking-widest uppercase text-foreground">Edit Social Links</h4>
                <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-4 mb-6">
                {/* Facebook */}
                <div className="space-y-1.5">
                    <label htmlFor="facebook-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Facebook size={12} className="text-[#1877F2]" /> Facebook URL or Username
                    </label>
                    <input 
                        id="facebook-url"
                        type="text" 
                        value={socials.facebook || ""} 
                        onChange={(e) => updateSocial("facebook", e.target.value)}
                        onBlur={(e) => validateField("facebook", e.target.value)}
                        placeholder="facebook.com/username or @username"
                        className={cn(
                            "w-full bg-background border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none transition-colors",
                            errors.facebook ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                        )}
                    />
                    {errors.facebook && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle size={12} className="shrink-0" /> {errors.facebook}
                        </p>
                    )}
                    {!errors.facebook && socials.facebook && validateSocialInput("facebook", socials.facebook).isHandle && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            Will link to: {validateSocialInput("facebook", socials.facebook).normalized}
                        </p>
                    )}
                </div>

                {/* Twitter / X */}
                <div className="space-y-1.5">
                    <label htmlFor="twitter-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Twitter size={12} className="text-[#1DA1F2]" /> Twitter / X URL or Handle
                    </label>
                    <input 
                        id="twitter-url"
                        type="text" 
                        value={socials.twitter || ""} 
                        onChange={(e) => updateSocial("twitter", e.target.value)}
                        onBlur={(e) => validateField("twitter", e.target.value)}
                        placeholder="x.com/username or @username"
                        className={cn(
                            "w-full bg-background border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none transition-colors",
                            errors.twitter ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                        )}
                    />
                    {errors.twitter && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle size={12} className="shrink-0" /> {errors.twitter}
                        </p>
                    )}
                    {!errors.twitter && socials.twitter && validateSocialInput("twitter", socials.twitter).isHandle && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            Will link to: {validateSocialInput("twitter", socials.twitter).normalized}
                        </p>
                    )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-1.5">
                    <label htmlFor="linkedin-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Linkedin size={12} className="text-[#0A66C2]" /> LinkedIn URL or Handle
                    </label>
                    <input 
                        id="linkedin-url"
                        type="text" 
                        value={socials.linkedin || ""} 
                        onChange={(e) => updateSocial("linkedin", e.target.value)}
                        onBlur={(e) => validateField("linkedin", e.target.value)}
                        placeholder="linkedin.com/in/username or @username"
                        className={cn(
                            "w-full bg-background border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none transition-colors",
                            errors.linkedin ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                        )}
                    />
                    {errors.linkedin && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle size={12} className="shrink-0" /> {errors.linkedin}
                        </p>
                    )}
                    {!errors.linkedin && socials.linkedin && validateSocialInput("linkedin", socials.linkedin).isHandle && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            Will link to: {validateSocialInput("linkedin", socials.linkedin).normalized}
                        </p>
                    )}
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                    <label htmlFor="instagram-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Instagram size={12} className="text-[#E4405F]" /> Instagram URL or Username
                    </label>
                    <input 
                        id="instagram-url"
                        type="text" 
                        value={socials.instagram || ""} 
                        onChange={(e) => updateSocial("instagram", e.target.value)}
                        onBlur={(e) => validateField("instagram", e.target.value)}
                        placeholder="instagram.com/username or @username"
                        className={cn(
                            "w-full bg-background border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none transition-colors",
                            errors.instagram ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                        )}
                    />
                    {errors.instagram && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle size={12} className="shrink-0" /> {errors.instagram}
                        </p>
                    )}
                    {!errors.instagram && socials.instagram && validateSocialInput("instagram", socials.instagram).isHandle && (
                        <p className="text-[10px] text-muted-foreground truncate">
                            Will link to: {validateSocialInput("instagram", socials.instagram).normalized}
                        </p>
                    )}
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                    <label htmlFor="website-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Globe size={12} className="text-emerald-500" /> Website URL
                    </label>
                    <input 
                        id="website-url"
                        type="text" 
                        value={socials.website || ""} 
                        onChange={(e) => updateSocial("website", e.target.value)}
                        onBlur={(e) => validateField("website", e.target.value)}
                        placeholder="https://example.com"
                        className={cn(
                            "w-full bg-background border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none transition-colors",
                            errors.website ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                        )}
                    />
                    {errors.website && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle size={12} className="shrink-0" /> {errors.website}
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving || hasErrors}
                className="w-full flex items-center justify-center gap-2 neumorphic-primary py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isSaving ? "Saving..." : <><Save size={14} /> Save Social Links</>}
            </button>
        </div>
    );
}


