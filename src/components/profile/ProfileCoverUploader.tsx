"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

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
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
            });
            return;
        }

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
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s]"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
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
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md text-[10px] font-bold tracking-widest uppercase transition-all duration-300 shadow-xl disabled:opacity-50"
                >
                    <Camera className="size-3.5" />
                    {isUploading ? "Uploading..." : "Change Cover"}
                </button>
            </div>

            {!coverUrl && !isUploading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <UploadCloud className="size-8 text-white" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white">Upload Cover Photo</span>
                    </div>
                </div>
            )}
        </div>
    );
}

