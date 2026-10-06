export default function CommunityLoading() {
    return (
        <div className="flex flex-col min-h-full p-4 space-y-4 animate-pulse select-none">
            {/* Header / Selector Skeleton */}
            <div className="flex items-center justify-between gap-2">
                <div className="h-10 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="size-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Search Skeleton */}
            <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Tabs Skeleton */}
            <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Posts Skeleton */}
            <div className="space-y-3 pt-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/30 dark:border-white/10 p-4 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="size-10 rounded-full bg-slate-300 dark:bg-white/15" />
                            <div className="space-y-1">
                                <div className="h-3 w-28 bg-slate-300 dark:bg-white/15 rounded" />
                                <div className="h-2.5 w-16 bg-slate-300 dark:bg-white/15 rounded" />
                            </div>
                        </div>
                        <div className="h-4 w-44 bg-slate-300 dark:bg-white/15 rounded" />
                        <div className="h-8 w-full bg-slate-300/60 dark:bg-white/10 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
