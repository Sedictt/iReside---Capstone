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
                className={`w-full h-full bg-gradient-to-br from-muted via-surface-2 to-surface-3 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 ${className}`}
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
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>
    );
}