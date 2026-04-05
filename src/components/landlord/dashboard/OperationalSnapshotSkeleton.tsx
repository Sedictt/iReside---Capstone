export function OperationalSnapshotSkeleton() {
    return (
        <div className="h-full w-full animate-pulse rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.22)] dark:border-white/5 dark:from-[#171717] dark:via-[#111111] dark:to-[#0a0a0a] dark:shadow-xl">
            <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-2">
                            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-8 w-52 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="mt-4 space-y-2">
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="mt-6 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-white/5 dark:bg-white/5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
                            </div>
                            <div className="mt-6 h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
