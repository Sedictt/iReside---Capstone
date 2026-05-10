import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function OperationalSnapshotSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-2 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4">
                        <Skeleton className="size-12 rounded-2xl bg-white/5 animate-pulse" />
                        <div className="space-y-2">
                            <Skeleton className="size-40 rounded-full opacity-40" />
                            <Skeleton className="h-10 w-64 rounded-2xl" />
                        </div>
                    </div>
                    <Skeleton className="size-14 rounded-2xl" />
                </div>

                <div className="mt-8 space-y-3">
                    <Skeleton className="h-4 w-full rounded-full opacity-40" />
                    <Skeleton className="h-4 w-[90%] rounded-full opacity-40" />
                    <Skeleton className="h-4 w-[75%] rounded-full opacity-40" />
                </div>

                <div className="mt-10 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-3xl border border-white/5 bg-white/5 p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-3">
                                    <Skeleton className="h-3 w-20 rounded-full opacity-60" />
                                    <Skeleton className="h-8 w-24 rounded-full" />
                                </div>
                                <Skeleton className="size-10 rounded-xl" />
                            </div>
                            <Skeleton className="size-32 rounded-full opacity-40" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
