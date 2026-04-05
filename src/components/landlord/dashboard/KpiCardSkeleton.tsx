export function KpiCardSkeleton() {
    return (
        <div className="relative flex animate-pulse flex-col gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3 w-24 rounded bg-muted"></div>
                    <div className="h-7 w-20 rounded bg-muted"></div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted"></div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-3 w-32 rounded bg-muted"></div>
            </div>
            <div className="h-12 w-full rounded bg-muted/70"></div>
        </div>
    );
}
