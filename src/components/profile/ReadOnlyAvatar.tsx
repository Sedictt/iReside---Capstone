'use client'

import Image from 'next/image'

type ReadOnlyAvatarProps = {
    avatarUrl: string | null
    avatarBgColor: string | null
    fullName: string
    size?: number
    className?: string
}

export function ReadOnlyAvatar({
    avatarUrl,
    avatarBgColor,
    fullName,
    size = 176,
    className = ""
}: ReadOnlyAvatarProps) {
    const initials = (fullName || "C")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? "")
        .join("") || "C";

    return (
        <div
            className={`relative rounded-full overflow-hidden border-2 border-white/20 shadow-2xl ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: avatarBgColor || '#6d9838'
            }}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={fullName}
                    fill
                    sizes={`${size}px`}
                    className="object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black text-white">
                        {initials}
                    </span>
                </div>
            )}
        </div>
    );
}