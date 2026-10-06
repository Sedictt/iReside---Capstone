export default function MobileGlobalLoading() {
    return (
        <div className="flex flex-col min-h-full p-4 space-y-4 animate-pulse select-none">
            {/* Top Bar Skeleton */}
            <div className="flex items-center justify-between py-2">
                <div className="h-6 w-28 bg-slate-200 dark:bg-white/10 rounded-lg" />
                <div className="size-8 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Hero Card Skeleton */}
            <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-200/40 dark:from-white/10 dark:to-white/5 border border-slate-300/40 dark:border-white/10 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-300 dark:bg-white/15 rounded" />
                    <div className="h-5 w-40 bg-slate-300 dark:bg-white/15 rounded-lg" />
                </div>
                <div className="flex justify-between items-center">
                    <div className="h-3 w-24 bg-slate-300 dark:bg-white/15 rounded" />
                    <div className="h-6 w-16 bg-slate-300 dark:bg-white/15 rounded-full" />
                </div>
            </div>

            {/* Quick Actions Grid Skeleton */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-2">
                        <div className="size-11 rounded-2xl bg-slate-200 dark:bg-white/10" />
                        <div className="h-2.5 w-12 bg-slate-200 dark:bg-white/10 rounded" />
                    </div>
                ))}
            </div>

            {/* Content Feed Cards Skeleton */}
            <div className="space-y-3 pt-2">
                <div className="h-24 w-full rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center">
                        <div className="h-4 w-32 bg-slate-300 dark:bg-white/15 rounded" />
                        <div className="h-3 w-16 bg-slate-300 dark:bg-white/15 rounded" />
                    </div>
                    <div className="h-3 w-full bg-slate-200 dark:bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-slate-200 dark:bg-white/10 rounded" />
                </div>

                <div className="h-28 w-full rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center">
                        <div className="h-4 w-28 bg-slate-300 dark:bg-white/15 rounded" />
                        <div className="h-5 w-20 bg-slate-300 dark:bg-white/15 rounded-lg" />
                    </div>
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
            </div>
        </div>
    );
}
