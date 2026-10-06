export default function LandlordPropertiesLoading() {
    return (
        <div className="flex flex-col min-h-full p-4 space-y-4 animate-pulse select-none">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-white/10 rounded-md" />
                    <div className="h-3 w-48 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
                <div className="size-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-4 gap-2">
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Search Skeleton */}
            <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Filter Tabs Skeleton */}
            <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Cards Skeleton */}
            <div className="space-y-4 pt-1">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/30 dark:border-white/10 overflow-hidden space-y-3">
                        <div className="h-28 w-full bg-slate-300 dark:bg-white/15" />
                        <div className="p-3.5 space-y-2.5">
                            <div className="h-4 w-40 bg-slate-300 dark:bg-white/15 rounded" />
                            <div className="h-2 w-full bg-slate-300/60 dark:bg-white/10 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
