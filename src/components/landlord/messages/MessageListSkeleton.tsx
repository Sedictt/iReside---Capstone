"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface MessageListSkeletonProps {
    className?: string;
    loading?: boolean;
}

export function MessageListSkeleton({ className }: MessageListSkeletonProps) {
    return (
        <div className={cn("w-full space-y-6 animate-in fade-in duration-300 py-2", className)}>
            {/* Left-aligned incoming message with avatar */}
            <div className="flex w-full justify-start items-end gap-3">
                <Skeleton className="size-10 rounded-full shrink-0 mb-1 opacity-70" />
                <div className="flex flex-col gap-1.5 max-w-md w-full">
                    <div className="rounded-[1.5rem] rounded-bl-sm neumorphic-panel p-4 space-y-2 border border-border/40 bg-surface-1">
                        <Skeleton className="h-4 w-3/4 rounded-md opacity-80" />
                        <Skeleton className="h-4 w-1/2 rounded-md opacity-60" />
                    </div>
                    <Skeleton className="h-3 w-16 rounded-full opacity-40 ml-2" />
                </div>
            </div>

            {/* Right-aligned outgoing reply */}
            <div className="flex w-full justify-end items-end gap-3">
                <div className="flex flex-col items-end gap-1.5 max-w-md w-full">
                    <div className="rounded-[1.5rem] rounded-br-sm bg-primary/15 border border-primary/25 p-4 space-y-2 w-4/5 shadow-sm">
                        <Skeleton className="h-4 w-full rounded-md bg-primary/25" />
                        <Skeleton className="h-4 w-3/5 rounded-md bg-primary/20" />
                    </div>
                    <div className="flex items-center gap-1.5 mr-2">
                        <Skeleton className="h-3 w-14 rounded-full opacity-40" />
                        <Skeleton className="size-3 rounded-full opacity-50" />
                    </div>
                </div>
            </div>

            {/* Left-aligned message with attachment card */}
            <div className="flex w-full justify-start items-end gap-3">
                <Skeleton className="size-10 rounded-full shrink-0 mb-1 opacity-70" />
                <div className="flex flex-col gap-1.5 max-w-md w-full">
                    <div className="rounded-[1.5rem] rounded-bl-sm neumorphic-panel p-4 space-y-3 border border-border/40 bg-surface-1">
                        <Skeleton className="h-4 w-2/3 rounded-md opacity-80" />
                        {/* Attachment card skeleton */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2 border border-border/30">
                            <Skeleton className="size-10 rounded-xl shrink-0 opacity-70" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3 w-28 rounded-md opacity-70" />
                                <Skeleton className="h-2.5 w-16 rounded-md opacity-50" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-3 w-16 rounded-full opacity-40 ml-2" />
                </div>
            </div>

            {/* Right-aligned short outgoing confirmation */}
            <div className="flex w-full justify-end items-end gap-3">
                <div className="flex flex-col items-end gap-1.5 max-w-sm w-full">
                    <div className="rounded-[1.5rem] rounded-br-sm bg-primary/15 border border-primary/25 p-3.5 space-y-1 w-2/3 shadow-sm">
                        <Skeleton className="h-4 w-full rounded-md bg-primary/25" />
                    </div>
                    <div className="flex items-center gap-1.5 mr-2">
                        <Skeleton className="h-3 w-12 rounded-full opacity-40" />
                        <Skeleton className="size-3 rounded-full opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}
