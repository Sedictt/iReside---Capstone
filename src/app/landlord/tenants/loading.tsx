import { Building2 } from "lucide-react";

export default function TenantsLoading() {
    return (
        <div className="mx-auto min-h-screen max-w-7xl space-y-8 px-6 py-8 text-foreground animate-in fade-in duration-500 sm:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/35 p-8 shadow-sm">
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-4">
                        <div className="h-6 w-32 rounded-full bg-muted animate-pulse" />
                        <div className="h-12 w-64 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-4 w-96 rounded-lg bg-muted/60 animate-pulse" />
                    </div>
                    <div className="h-11 w-32 rounded-xl bg-muted animate-pulse" />
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/95 p-2 shadow-sm sm:flex-row">
                <div className="h-12 flex-1 rounded-xl bg-muted/40 animate-pulse" />
                <div className="hidden h-8 w-px bg-border sm:block" />
                <div className="flex gap-2 p-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-9 w-20 rounded-lg bg-muted/50 animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="relative flex flex-col justify-between rounded-[2rem] border border-border bg-card/60 p-6 shadow-sm overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-shimmer" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="h-6 w-16 rounded-lg bg-muted animate-pulse" />
                            <div className="h-7 w-24 rounded-full bg-muted/60 animate-pulse" />
                        </div>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="mb-4 h-24 w-24 rounded-full bg-muted animate-pulse" />
                            <div className="mb-2 h-6 w-40 rounded-xl bg-muted animate-pulse" />
                            <div className="h-4 w-48 rounded-lg bg-muted/50 animate-pulse" />
                            <div className="mt-6 h-10 w-full rounded-full bg-muted/40 animate-pulse" />
                        </div>

                        <div className="mb-6 flex flex-col gap-3 border-t border-border pt-6">
                            <div className="h-12 w-full rounded-2xl bg-muted/30 animate-pulse" />
                            <div className="h-12 w-full rounded-2xl bg-muted/30 animate-pulse" />
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-muted/40 animate-pulse" />
                                <div className="h-10 w-10 rounded-xl bg-muted/40 animate-pulse" />
                            </div>
                            <div className="h-10 w-24 rounded-xl bg-muted/50 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
