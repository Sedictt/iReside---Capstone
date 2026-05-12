'use client'

import Image from 'next/image'

type ReadOnlyCoverProps = {
    coverUrl: string | null
    fullName: string
    className?: string
}

export function ReadOnlyCover({
    coverUrl,
    fullName,
    className = ""
}: ReadOnlyCoverProps) {
    if (!coverUrl) {
        // Default gradient background
        return (
            <div
                className={`w-full h-full bg-gradient-to-br from-[#6d9838]/20 via-[#171717] to-[#0a0a0a] ${className}`}
            />
        );
    }

    return (
        <div className={`relative w-full h-full ${className}`}>
            <Image
                src={coverUrl}
                alt={`${fullName}'s cover`}
                fill
                sizes="100vw"
                className="object-cover"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
        </div>
    );
}