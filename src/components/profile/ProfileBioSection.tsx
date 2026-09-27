"use client";

import { useState, useEffect } from "react";
import { User, Edit3, Check, X, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProfileBioSectionProps {
    initialBio: string;
    isOwner?: boolean;
    placeholder?: string;
    userId?: string;
}

export function ProfileBioSection({
    initialBio,
    isOwner = true,
    placeholder = "Tell others about yourself and your property management style...",
    userId,
}: ProfileBioSectionProps) {
    const router = useRouter();
    const { profile, refreshProfile } = useAuth();
    const [bio, setBio] = useState(initialBio || "");
    const [tempBio, setTempBio] = useState(initialBio || "");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sync with props when server component data updates
    useEffect(() => {
        if (initialBio !== undefined) {
            setBio(initialBio);
            setTempBio(initialBio);
        }
    }, [initialBio]);

    const hasBio = Boolean(bio && bio.trim().length > 0);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        const cleanBio = tempBio.trim();

        try {
            const supabase = createClient();
            const targetId = userId || profile?.id;

            if (!targetId) {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) throw new Error("No user found");

                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({ bio: cleanBio })
                    .eq("id", user.id);

                if (profileError) throw profileError;
            } else {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({ bio: cleanBio })
                    .eq("id", targetId);

                if (profileError) throw profileError;
            }

            setBio(cleanBio);
            setTempBio(cleanBio);
            setIsEditing(false);
            toast.success("Bio updated successfully");

            // Non-blocking refresh and events
            void refreshProfile().catch(() => {});
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("profile-updated", {
                        detail: { bio: cleanBio, hasBio: Boolean(cleanBio.length > 0) },
                    })
                );
            }
            router.refresh();
        } catch (e: any) {
            console.error("Failed to save bio:", e);
            toast.error(e?.message || "Failed to update bio. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div id="profile-bio-section" className="neumorphic-panel rounded-[3rem] p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="relative size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center shrink-0">
                    <User size={20} className="text-primary" />
                    {!hasBio && isOwner && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full size-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-display font-black tracking-tight">Bio</h2>
                    {!hasBio && isOwner && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-red-500/15 text-red-500 border border-red-500/20">
                            Required
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-4xl">
                {isEditing ? (
                    <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2">
                        <textarea
                            value={tempBio}
                            onChange={(e) => setTempBio(e.target.value)}
                            className="w-full bg-background border border-border rounded-[1.5rem] p-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none neumorphic-inset"
                            rows={4}
                            placeholder={placeholder}
                            autoFocus
                        />
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 neumorphic-primary px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>Save Bio</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTempBio(bio);
                                    setIsEditing(false);
                                }}
                                disabled={saving}
                                className="flex items-center gap-2 neumorphic-extruded text-muted-foreground hover:text-foreground px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition cursor-pointer"
                            >
                                <X size={14} />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                ) : !hasBio ? (
                    isOwner ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="mt-2 flex items-center gap-3 text-[10px] font-black text-red-500 dark:text-red-400 hover:text-foreground transition-all uppercase tracking-widest border border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-2xl px-6 py-4 w-full justify-center relative cursor-pointer group shadow-sm"
                            title="Add your bio (Required for profile setup)"
                        >
                            <span className="relative flex size-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                            </span>
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            <span>Introduce yourself (Add Bio — Required)</span>
                        </button>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No bio provided yet.</p>
                    )
                ) : (
                    <div className="mt-2 relative group">
                        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl pr-8 whitespace-pre-line">
                            {bio}
                        </p>
                        {isOwner && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTempBio(bio);
                                    setIsEditing(true);
                                }}
                                className="absolute -top-1 -right-1 p-2 rounded-full neumorphic-extruded text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                aria-label="Edit Bio"
                            >
                                <Edit3 size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
