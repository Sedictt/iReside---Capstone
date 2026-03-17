"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";

type ProfileAvatarUploaderProps = {
    initialAvatarUrl: string | null;
    fullName: string;
    className?: string;
};

export function ProfileAvatarUploader({ initialAvatarUrl, fullName, className }: ProfileAvatarUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
    const [isUploading, setIsUploading] = useState(false);

    const handlePickFile = () => {
        if (isUploading) return;
        inputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });

            const payload = (await response.json()) as { avatarUrl?: string; error?: string };

            if (!response.ok || !payload.avatarUrl) {
                throw new Error(payload.error || "Failed to upload profile image.");
            }

            setAvatarUrl(payload.avatarUrl);
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error) {
            console.error(error);
            setAvatarUrl(initialAvatarUrl);
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploading(false);
        }
    };

    return (
        <div className={className}>
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow"></div>
            <div className="absolute inset-1 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl transition-colors">
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={fullName}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                        <User size={32} className="text-neutral-500" />
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            <button
                type="button"
                onClick={handlePickFile}
                disabled={isUploading}
                className="absolute bottom-1 right-1 h-7 w-7 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg z-20 disabled:opacity-60"
                aria-label="Upload profile photo"
                title={isUploading ? "Uploading..." : "Change profile photo"}
            >
                <Camera className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
