export default function CalendarLoading() {
    return (
        <div className="flex flex-col min-h-full p-4 space-y-4 animate-pulse select-none">
            {/* Header / Selector Skeleton */}
            <div className="flex items-center justify-between gap-2">
                <div className="h-10 flex-1 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="size-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Week Strip Skeleton */}
            <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />

            {/* Filter Tabs Skeleton */}
            <div className="h-9 w-full rounded-xl bg-slate-200 dark:bg-white/10" />

            {/* Agenda Cards Skeleton */}
            <div className="space-y-3 pt-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/30 dark:border-white/10 p-3.5 flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-slate-300 dark:bg-white/15 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-36 bg-slate-300 dark:bg-white/15 rounded" />
                            <div className="h-3 w-24 bg-slate-300 dark:bg-white/15 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
