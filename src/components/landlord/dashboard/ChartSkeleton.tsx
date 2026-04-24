import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function ChartSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-2 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full gap-8">
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-48 rounded-full" />
                        <Skeleton className="h-3 w-64 rounded-full opacity-60" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-24 rounded-2xl" />
                        <Skeleton className="h-10 w-24 rounded-2xl" />
                        <Skeleton className="h-10 w-24 rounded-2xl" />
                    </div>
                </div>

                <div className="flex-1 flex items-end gap-3 px-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                            <Skeleton 
                                className="w-full rounded-t-2xl" 
                                style={{ 
                                    height: `${Math.floor(Math.random() * 50) + 30}%`,
                                    opacity: 0.3 + (i * 0.05)
                                }} 
                            />
                            <Skeleton className="h-3 w-12 rounded-full opacity-40" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-4 px-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-3xl border border-white/5 bg-white/5 p-4 space-y-3">
                            <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
