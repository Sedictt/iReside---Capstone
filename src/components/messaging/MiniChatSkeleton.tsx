"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface MiniChatSkeletonProps {
    className?: string;
    loading?: boolean;
}

export function MiniChatSkeleton({ className, loading = true }: MiniChatSkeletonProps) {
    const fixtureContent = (
        <div className={cn("flex flex-col gap-3.5 p-2 w-full", className)}>
            {/* Timestamp / Date divider */}
            <div className="flex justify-center my-1">
                <Skeleton className="h-4 w-20 rounded-full opacity-60" />
            </div>

            {/* Incoming Message 1 */}
            <div className="flex items-start gap-2 max-w-[85%]">
                <Skeleton className="size-6 rounded-full shrink-0 mt-1 opacity-70" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="rounded-2xl rounded-tl-sm bg-muted/40 border border-border/40 p-3 space-y-1.5 shadow-sm">
                        <Skeleton className="h-3 w-36 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md opacity-80" />
                    </div>
                    <Skeleton className="h-2 w-10 rounded-full opacity-50 ml-1" />
                </div>
            </div>

            {/* Outgoing Message 1 */}
            <div className="flex items-end gap-1.5 self-end max-w-[80%] flex-col">
                <div className="rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/20 p-3 space-y-1.5 shadow-sm w-full">
                    <Skeleton className="h-3 w-40 rounded-md bg-primary/30" />
                    <Skeleton className="h-3 w-28 rounded-md bg-primary/25" />
                </div>
                <div className="flex items-center gap-1 mr-1">
                    <Skeleton className="h-2 w-12 rounded-full opacity-50" />
                    <Skeleton className="size-2 rounded-full opacity-50" />
                </div>
            </div>

            {/* Incoming Message 2 (Short) */}
            <div className="flex items-start gap-2 max-w-[75%]">
                <Skeleton className="size-6 rounded-full shrink-0 mt-1 opacity-70" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="rounded-2xl rounded-tl-sm bg-muted/40 border border-border/40 p-2.5 space-y-1 shadow-sm">
                        <Skeleton className="h-3 w-28 rounded-md" />
                    </div>
                    <Skeleton className="h-2 w-10 rounded-full opacity-50 ml-1" />
                </div>
            </div>

            {/* Outgoing Message 2 (Quick response) */}
            <div className="flex items-end gap-1.5 self-end max-w-[65%] flex-col">
                <div className="rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/20 p-2.5 shadow-sm w-full">
                    <Skeleton className="h-3 w-20 rounded-md bg-primary/30" />
                </div>
                <Skeleton className="h-2 w-10 rounded-full opacity-50 mr-1" />
            </div>
        </div>
    );

    return (
        <Skeleton
            name="mini-chat-box"
            loading={loading}
            fixture={fixtureContent}
            className="w-full"
        >
            {fixtureContent}
        </Skeleton>
    );
}
