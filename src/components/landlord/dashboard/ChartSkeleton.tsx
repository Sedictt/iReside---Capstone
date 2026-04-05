const BAR_HEIGHTS = ["52%", "71%", "64%", "86%", "58%", "79%", "68%", "83%", "61%", "77%", "69%", "88%"];

export function ChartSkeleton() {
    return (
        <div className="h-full w-full animate-pulse rounded-2xl border border-border bg-card/95 p-6 shadow-sm">
            <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-48 rounded bg-muted"></div>
                    <div className="flex gap-2">
                        <div className="h-8 w-16 rounded bg-muted"></div>
                        <div className="h-8 w-16 rounded bg-muted"></div>
                        <div className="h-8 w-16 rounded bg-muted"></div>
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-2">
                    {BAR_HEIGHTS.map((height, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-t bg-muted"
                            style={{ height }}
                        ></div>
                    ))}
                </div>
                <div className="flex justify-between">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-3 w-6 rounded bg-muted"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
