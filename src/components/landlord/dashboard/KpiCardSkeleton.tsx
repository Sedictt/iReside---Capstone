import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function KpiCardSkeleton({ className }: { className?: string }) {
    return (
        <div 
            className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-surface-2 p-1 shadow-2xl shadow-black/20 backdrop-blur-xl", 
                className
            )}
        >
            <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-surface-3 p-6 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 w-full space-y-5">
                    {/* Title Area */}
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-3 rounded-full" />
                        <Skeleton className="h-3 w-24 rounded-full" />
                    </div>

                    {/* Value Area */}
                    <Skeleton className="h-10 w-32 rounded-2xl" />

                    {/* Change Area */}
                    <Skeleton className="h-6 w-28 rounded-full" />
                </div>

                {/* Chart Section Area */}
                <div className="relative h-28 w-full mt-8 flex items-end gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton 
                            key={i} 
                            className="flex-1 rounded-t-lg" 
                            style={{ 
                                height: `${Math.floor(Math.random() * 60) + 20}%`,
                                opacity: 0.4 + (i * 0.05)
                            }} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
