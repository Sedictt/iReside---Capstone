"use client";

import { useState } from 'react';
import { Edit3, Check, X, Loader2, Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MAX_BIO_LENGTH, validateBio } from '@/lib/validation/profile';
import { cn } from '@/lib/utils';

export default function EditableBio({
    initialBio,
    isOwner = true,
}: {
    initialBio: string;
    isOwner?: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio);
    const [tempBio, setTempBio] = useState(initialBio);
    const [saving, setSaving] = useState(false);

    const bioValidation = validateBio(tempBio);
    const isOverLimit = tempBio.length > MAX_BIO_LENGTH;

    const handleSave = async () => {
        if (saving) return;

        if (!bioValidation.isValid || isOverLimit) {
            toast.error(bioValidation.error || `Bio cannot exceed ${MAX_BIO_LENGTH} characters.`);
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const trimmedBio = tempBio.trim();

            const { error: profileError } = await supabase
                .from("profiles")
                .update({ bio: trimmedBio })
                .eq("id", user.id);

            if (profileError) throw profileError;

            setBio(trimmedBio);
            setTempBio(trimmedBio);
            setIsEditing(false);
            toast.success("Bio updated successfully");
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (e) {
            console.error("Failed to save bio:", e);
            toast.error("Failed to update bio. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2">
                <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    maxLength={MAX_BIO_LENGTH}
                    className={cn(
                        "w-full bg-background border rounded-[1.5rem] p-4 text-sm text-foreground focus:outline-none transition-colors resize-none neumorphic-inset",
                        isOverLimit ? "border-rose-500/80 focus:border-rose-500" : "border-border focus:border-primary/50"
                    )}
                    rows={4}
                    placeholder="Tell potential tenants or landlords about yourself..."
                />
                <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                        {isOverLimit && (
                            <span className="text-xs text-rose-500 flex items-center gap-1">
                                <AlertCircle size={12} /> Exceeds maximum length
                            </span>
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] font-mono tracking-wider",
                        tempBio.length >= MAX_BIO_LENGTH ? "text-rose-500 font-bold" : tempBio.length >= MAX_BIO_LENGTH - 50 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                        {tempBio.length} / {MAX_BIO_LENGTH}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || isOverLimit}
                        className="flex items-center gap-2 neumorphic-primary px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Save Bio
                    </button>
                    <button
                        onClick={() => {
                            setTempBio(bio);
                            setIsEditing(false);
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 neumorphic-extruded text-muted-foreground hover:text-foreground px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition cursor-pointer"
                    >
                        <X size={14} />
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (!bio) {
        if (!isOwner) return null;

        return (
            <button
                onClick={() => setIsEditing(true)}
                className="mt-2 flex items-center gap-3 text-[10px] font-black text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest border border-dashed border-border rounded-2xl px-6 py-4 hover:bg-muted/40 w-full justify-center"
            >
                <Plus size={16} />
                Introduce yourself (Add Bio)
            </button>
        );
    }

    return (
        <div className="mt-2 relative group">
            <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl pr-8">
                {bio}
            </p>
            {isOwner && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -top-1 -right-1 p-2 rounded-full neumorphic-extruded text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Edit Bio"
                >
                    <Edit3 size={14} />
                </button>
            )}
        </div>
    );
}
