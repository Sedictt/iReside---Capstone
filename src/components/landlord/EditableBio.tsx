"use client";

import { useState } from 'react';
import { Edit3, Check, X, Loader2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

    const supabase = createClient();

    const handleSave = async () => {
        setSaving(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Update profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ bio: tempBio })
                .eq("id", user.id);

            if (profileError) throw profileError;

            // Also update user metadata for consistency
            const { error: metadataError } = await supabase.auth.updateUser({
                data: { bio: tempBio }
            });

            if (metadataError) throw metadataError;
            
            setBio(tempBio);
            setIsEditing(false);
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (e) {
            console.error("Failed to save bio:", e);
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2">
                <textarea
                    autoFocus
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-4 text-sm text-white focus:outline-none focus:border-[#6d9838]/50 transition-colors resize-none"
                    rows={4}
                    placeholder="Tell potential tenants about yourself and your property management style..."
                />
                <div className="flex items-center gap-3 mt-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#6d9838] hover:bg-[#5a7d2e] text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition shadow-lg shadow-[#6d9838]/20 disabled:opacity-50"
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
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition"
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
                className="mt-2 flex items-center gap-3 text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-widest border border-dashed border-white/10 rounded-2xl px-6 py-4 hover:bg-white/5 w-full justify-center"
            >
                <Plus size={16} />
                Introduce yourself (Add Bio)
            </button>
        );
    }

    return (
        <div className="mt-2 relative group">
            <p className="text-sm text-white/70 leading-relaxed max-w-2xl pr-8">
                {bio}
            </p>
            {isOwner && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -top-1 -right-1 p-2 rounded-full bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Edit Bio"
                >
                    <Edit3 size={14} />
                </button>
            )}
        </div>
    );
}
