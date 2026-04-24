import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function FeaturedPropertySkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-2 shadow-2xl shadow-black/30 backdrop-blur-xl",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            <Skeleton className="h-48 w-full rounded-none opacity-40" />
            <div className="p-8 flex flex-col gap-6">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4 rounded-full" />
                    <Skeleton className="h-3 w-1/2 rounded-full opacity-60" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 rounded-2xl bg-white/5 p-4">
                        <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="space-y-3 rounded-2xl bg-white/5 p-4">
                        <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
        </div>
    );
}
