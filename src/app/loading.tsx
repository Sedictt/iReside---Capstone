import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="xl" />
                <p className="text-sm font-medium text-slate-400 animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
