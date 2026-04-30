"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { AvatarPicker } from "./AvatarPicker";

type ProfileAvatarUploaderProps = {
    initialAvatarUrl: string | null;
    avatarBgColor?: string | null;
    fullName: string;
    className?: string;
};

export function ProfileAvatarUploader({ initialAvatarUrl, avatarBgColor, fullName, className }: ProfileAvatarUploaderProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    return (
        <div className={className}>
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
            <div 
                className="absolute inset-1 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl transition-all duration-500 flex items-center justify-center"
                style={{ backgroundColor: avatarBgColor || '#171717' }}
            >
                {initialAvatarUrl ? (
                    <Image
                        src={initialAvatarUrl}
                        alt={fullName}
                        fill
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
                className="absolute bottom-1 right-1 h-10 w-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg z-20"
                aria-label="Change profile appearance"
                title="Change profile appearance"
            >
                <Camera size={20} />
            </button>

            {/* Avatar Picker Modal */}
            <AvatarPicker 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                currentAvatarUrl={initialAvatarUrl}
                currentBgColor={avatarBgColor || '#171717'}
            />
        </div>
    );
}
