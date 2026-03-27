export function FeaturedPropertySkeleton() {
    return (
        <div className="h-full w-full rounded-xl border border-white/5 bg-[#111] overflow-hidden shadow-sm animate-pulse">
            <div className="h-48 w-full bg-white/10"></div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="h-5 w-3/4 bg-white/10 rounded"></div>
                    <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <div className="h-3 w-16 bg-white/10 rounded"></div>
                        <div className="h-6 w-20 bg-white/10 rounded"></div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="h-3 w-16 bg-white/10 rounded"></div>
                        <div className="h-6 w-20 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
