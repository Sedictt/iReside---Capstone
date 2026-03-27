export function KpiCardSkeleton() {
    return (
        <div className="relative flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-[#111] shadow-sm animate-pulse">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-24 bg-white/10 rounded"></div>
                    <div className="h-7 w-20 bg-white/10 rounded"></div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/10"></div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-3 w-32 bg-white/10 rounded"></div>
            </div>
            <div className="h-12 w-full bg-white/5 rounded"></div>
        </div>
    );
}
