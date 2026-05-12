"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { AvatarPicker } from "./AvatarPicker";
import { useAuth } from "@/hooks/useAuth";

type ProfileAvatarUploaderProps = {
    initialAvatarUrl: string | null;
    avatarBgColor?: string | null;
    fullName: string;
    className?: string;
};

export function ProfileAvatarUploader({ initialAvatarUrl, avatarBgColor, fullName, className, onProfileUpdate }: ProfileAvatarUploaderProps & { onProfileUpdate?: () => void }) {
    const router = useRouter();
    const { profile } = useAuth();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
    // Local state for immediate feedback
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(initialAvatarUrl);
    const [currentBgColor, setCurrentBgColor] = useState(avatarBgColor);

    // Sync with props when server-side data re-fetches
    useEffect(() => {
        setCurrentAvatarUrl(initialAvatarUrl);
    }, [initialAvatarUrl]);

    useEffect(() => {
        setCurrentBgColor(avatarBgColor);
    }, [avatarBgColor]);

    // Also sync with auth context for maximum reactivity
    useEffect(() => {
        if (profile?.avatar_url !== undefined) {
            setCurrentAvatarUrl(profile.avatar_url);
        }
        if (profile?.avatar_bg_color !== undefined) {
            setCurrentBgColor(profile.avatar_bg_color);
        }
    }, [profile]);

    const handleProfileUpdate = () => {
        // Trigger a server-side refresh to sync the Server Component page
        router.refresh();
        // Propagate update event
        onProfileUpdate?.();
    };

    return (
        <div className={className}>
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
            <div 
                className="absolute inset-1 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl transition-all duration-500 flex items-center justify-center"
                style={{ backgroundColor: currentBgColor || '#171717' }}
            >
                {currentAvatarUrl ? (
                    <Image
                        src={currentAvatarUrl}
                        alt={fullName}
                        fill
                        sizes="128px"
                        className="object-cover"
                    />
                ) : (
                    <span className="text-4xl font-black text-white">
                        {(fullName || "C").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("")}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="absolute bottom-1 right-1 size-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg z-20"
                aria-label="Change profile appearance"
                title="Change profile appearance"
            >
                <Camera size={20} />
            </button>

            {/* Avatar Picker Modal */}
            {isPickerOpen && (
                <AvatarPicker 
                    isOpen={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    currentAvatarUrl={currentAvatarUrl}
                    currentBgColor={currentBgColor || '#171717'}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
        </div>
    );
}
