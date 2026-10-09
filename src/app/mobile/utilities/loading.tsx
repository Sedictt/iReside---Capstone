export default function UtilitiesLoading() {
    return (
        <div className="flex flex-col min-h-full p-4 space-y-4 animate-pulse select-none">
            {/* Header / Selector Skeleton */}
            <div className="flex items-center justify-between gap-2">
                <div className="h-10 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="size-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Month Picker Skeleton */}
            <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-3 gap-2">
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="h-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Search Skeleton */}
            <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Tabs Skeleton */}
            <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Cards Skeleton */}
            <div className="space-y-3 pt-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-36 rounded-2xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/30 dark:border-white/10 p-4 space-y-3">
                        <div className="h-4 w-28 bg-slate-300 dark:bg-white/15 rounded" />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-16 bg-slate-300/60 dark:bg-white/10 rounded-xl" />
                            <div className="h-16 bg-slate-300/60 dark:bg-white/10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
