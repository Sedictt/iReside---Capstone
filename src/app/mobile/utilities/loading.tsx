export default function UtilitiesLoading() {
    return (
        <div className="flex flex-col min-h-full px-4 pt-2.5 pb-6 space-y-3 animate-pulse select-none">
            {/* Property Selector Skeleton */}
            <div className="h-14 w-full bg-slate-200 dark:bg-white/10 rounded-[1.75rem]" />

            {/* 4-Tab Bar Skeleton */}
            <div className="h-[54px] w-full rounded-[1.5rem] bg-slate-200 dark:bg-white/10" />

            {/* Unified Month & Summary Card Skeleton */}
            <div className="h-[108px] w-full rounded-[1.5rem] bg-slate-200 dark:bg-white/10" />

            {/* Search & Filter Pills Skeleton */}
            <div className="h-11 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-11 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
                ))}
            </div>

            {/* Room Card Skeletons */}
            {[0, 1].map((idx) => (
                <div
                    key={idx}
                    className="rounded-[1.5rem] bg-slate-200/80 dark:bg-white/10 border border-slate-300/30 dark:border-white/10 p-4 space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <div className="h-4 w-24 bg-slate-300 dark:bg-white/15 rounded" />
                            <div className="h-3 w-32 bg-slate-300/70 dark:bg-white/10 rounded" />
                        </div>
                        <div className="h-6 w-24 bg-slate-300 dark:bg-white/15 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="h-[76px] bg-slate-300/60 dark:bg-white/10 rounded-xl" />
                        <div className="h-[76px] bg-slate-300/60 dark:bg-white/10 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
