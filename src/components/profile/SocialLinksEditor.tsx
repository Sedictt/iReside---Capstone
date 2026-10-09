"use client";

import { useState } from "react";
import { Facebook, Twitter, Linkedin, Instagram, Globe, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import { validateSocialHandleOrUrl } from "@/lib/validation/landlord-settings";

const socialRule = (platform: "facebook" | "twitter" | "linkedin" | "instagram", value: string) => {
    const check = validateSocialHandleOrUrl(platform, value);
    return check.isValid ? undefined : check.error;
};

const SOCIAL_URL_MAX_LENGTH = 255;

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

    // Same rule as the settings form and profile API: an http(s) link or a plain handle.
    const form = useFormValidation(
        {
            facebook: socials.facebook ?? "",
            twitter: socials.twitter ?? "",
            linkedin: socials.linkedin ?? "",
            instagram: socials.instagram ?? "",
        },
        {
            facebook: (value) => socialRule("facebook", value),
            twitter: (value) => socialRule("twitter", value),
            linkedin: (value) => socialRule("linkedin", value),
            instagram: (value) => socialRule("instagram", value),
        },
    );

    const handleSave = async () => {
        if (isSaving) return;
        if (!form.validateAll()) return;
        setIsSaving(true);
        try {
            const trimmed = Object.fromEntries(
                Object.entries(socials).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
            ) as Socials;
            await onSave(trimmed);
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
                    {!socials.facebook && !socials.twitter && !socials.linkedin && !socials.instagram && (
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
                <div className="space-y-1.5">
                    <label htmlFor="facebook-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Facebook size={12} className="text-[#1877F2]" /> Facebook URL
                    </label>
                    <input maxLength={SOCIAL_URL_MAX_LENGTH}
                        {...form.fieldProps("facebook")}
                        id="facebook-url"
                        type="url" 
                        inputMode="url"
                        value={socials.facebook || ""} 
                        onChange={(e) => updateSocial("facebook", e.target.value)}
                        placeholder="https://facebook.com/..."
                        className={cn("w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors", form.errorFor("facebook") && fieldErrorClass)}
                    />
                    <FieldError id={form.errorId("facebook")} message={form.errorFor("facebook")} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="twitter-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Twitter size={12} className="text-[#1DA1F2]" /> Twitter URL
                    </label>
                    <input maxLength={SOCIAL_URL_MAX_LENGTH}
                        {...form.fieldProps("twitter")}
                        id="twitter-url"
                        type="url" 
                        inputMode="url"
                        value={socials.twitter || ""} 
                        onChange={(e) => updateSocial("twitter", e.target.value)}
                        placeholder="https://twitter.com/..."
                        className={cn("w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors", form.errorFor("twitter") && fieldErrorClass)}
                    />
                    <FieldError id={form.errorId("twitter")} message={form.errorFor("twitter")} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="linkedin-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Linkedin size={12} className="text-[#0A66C2]" /> LinkedIn URL
                    </label>
                    <input maxLength={SOCIAL_URL_MAX_LENGTH}
                        {...form.fieldProps("linkedin")}
                        id="linkedin-url"
                        type="url" 
                        inputMode="url"
                        value={socials.linkedin || ""} 
                        onChange={(e) => updateSocial("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className={cn("w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors", form.errorFor("linkedin") && fieldErrorClass)}
                    />
                    <FieldError id={form.errorId("linkedin")} message={form.errorFor("linkedin")} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="instagram-url" className="text-[9px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                        <Instagram size={12} className="text-[#E4405F]" /> Instagram URL
                    </label>
                    <input maxLength={SOCIAL_URL_MAX_LENGTH}
                        {...form.fieldProps("instagram")}
                        id="instagram-url"
                        type="url" 
                        inputMode="url"
                        value={socials.instagram || ""} 
                        onChange={(e) => updateSocial("instagram", e.target.value)}
                        placeholder="https://instagram.com/..."
                        className={cn("w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors", form.errorFor("instagram") && fieldErrorClass)}
                    />
                    <FieldError id={form.errorId("instagram")} message={form.errorFor("instagram")} />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 neumorphic-primary py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50 cursor-pointer"
            >
                {isSaving ? "Saving..." : <><Save size={14} /> Save Social Links</>}
            </button>
        </div>
    );
}

