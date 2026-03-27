export function ChartSkeleton() {
    return (
        <div className="h-full w-full rounded-xl border border-white/5 bg-[#111] p-6 shadow-sm animate-pulse">
            <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                    <div className="h-5 w-48 bg-white/10 rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-8 w-16 bg-white/10 rounded"></div>
                        <div className="h-8 w-16 bg-white/10 rounded"></div>
                        <div className="h-8 w-16 bg-white/10 rounded"></div>
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-white/10 rounded-t"
                            style={{ height: `${Math.random() * 60 + 40}%` }}
                        ></div>
                    ))}
                </div>
                <div className="flex justify-between">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-3 w-6 bg-white/10 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
