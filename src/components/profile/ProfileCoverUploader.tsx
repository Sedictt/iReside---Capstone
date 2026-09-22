"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";

type ProfileCoverUploaderProps = {
    initialCoverUrl: string | null;
    fullName: string;
    className?: string;
};

export function ProfileCoverUploader({ initialCoverUrl, fullName, className }: ProfileCoverUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
    const [isUploading, setIsUploading] = useState(false);

    const handlePickFile = () => {
        if (isUploading) return;
        inputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = handleMediaSelection(event, {
            preset: "image",
            notify: (message, description) => toast.error(message, { description }),
        });

        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setCoverUrl(previewUrl);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/profile/cover", {
                method: "POST",
                body: formData,
            });

            const payload = (await response.json()) as { coverUrl?: string; error?: string };

            if (!response.ok || !payload.coverUrl) {
                throw new Error(payload.error || "Failed to upload cover image.");
            }

            setCoverUrl(payload.coverUrl);
            toast.success("Cover photo updated");
            
            // Sync Server Component
            router.refresh();
            
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload cover photo");
            setCoverUrl(initialCoverUrl);
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("relative w-full h-full group", className)}>
            {/* Background Image */}
            <div className="absolute inset-0">
                {coverUrl ? (
                    <Image
                        src={coverUrl}
                        alt={`${fullName}'s cover photo`}
                        fill
                        sizes="100vw"
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s]"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted via-surface-2 to-surface-3 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={MEDIA_ACCEPT_STRINGS.image}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />

            {/* Direct Edit Buttons */}
            <div className="absolute top-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    type="button"
                    onClick={handlePickFile}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/80 backdrop-blur-md text-[10px] font-black tracking-widest uppercase transition-all duration-300 shadow-xl disabled:opacity-50 cursor-pointer"
                >
                    <Camera className="size-3.5" />
                    {isUploading ? "Uploading..." : "Change Cover"}
                </button>
            </div>

            {!coverUrl && !isUploading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <UploadCloud className="size-8 text-muted-foreground" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Upload Cover Photo</span>
                    </div>
                </div>
            )}
        </div>
    );
}

