"use client";

import { useState } from 'react';
import { Edit3, Check, X, Loader2 } from 'lucide-react';
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
            // Since bio isn't in profiles table, update user metadata
            const { error: metadataError } = await supabase.auth.updateUser({
                data: { bio: tempBio }
            });

            if (metadataError) throw metadataError;
            
            setBio(tempBio);
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save bio:", e);
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="mt-4 max-w-xl animate-in fade-in slide-in-from-top-2">
                <textarea
                    autoFocus
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6d9838] resize-none pb-4"
                    rows={3}
                    placeholder="Write a short bio about yourself..."
                />
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-[#6d9838] hover:bg-[#5a7d2e] text-white px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-sm drop-shadow-md"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                        Save
                    </button>
                    <button
                        onClick={() => {
                            setTempBio(bio);
                            setIsEditing(false);
                        }}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-medium transition"
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
                className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest border border-dashed border-white/20 rounded-full px-4 py-2 hover:bg-white/5"
            >
                <Edit3 size={12} />
                Add a bio
            </button>
        );
    }

    return (
        <div className="mt-4 relative group w-fit">
            <p className="text-sm text-white/80 max-w-xl leading-relaxed drop-shadow-md pb-6 md:pb-0 md:pr-24">
                {bio}
            </p>
            {isOwner && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 left-0 md:top-0 md:bottom-auto md:right-0 md:left-auto flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 uppercase tracking-widest bg-black/20 md:bg-transparent px-2 py-1 md:p-1 rounded"
                    aria-label="Edit Bio"
                >
                    <Edit3 size={12} />
                    Edit Bio
                </button>
            )}
        </div>
    );
}
