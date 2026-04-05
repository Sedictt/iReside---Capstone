export function FeaturedPropertySkeleton() {
    return (
        <div className="h-full w-full animate-pulse overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm">
            <div className="h-48 w-full bg-muted"></div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="h-5 w-3/4 rounded bg-muted"></div>
                    <div className="h-3 w-1/2 rounded bg-muted"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <div className="h-3 w-16 rounded bg-muted"></div>
                        <div className="h-6 w-20 rounded bg-muted"></div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="h-3 w-16 rounded bg-muted"></div>
                        <div className="h-6 w-20 rounded bg-muted"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
