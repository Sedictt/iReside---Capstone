"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LANDLORD_PRODUCT_TOUR_STEPS,
    type LandlordProductTourState,
} from "@/lib/landlord-product-tour";
import { 
    CheckCircle2, 
    ChevronRight, 
    Play, 
    RefreshCcw, 
    ArrowLeft, 
    Building2, 
    MapPinned, 
    Users, 
    Wallet 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandlordTourPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tourState, setTourState] = useState<LandlordProductTourState | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadTourState = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/landlord/tour?start=0", { cache: "no-store" });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Failed to load tour state");
            setTourState(payload.state);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tour state");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTourState();
    }, []);

    const startTour = async (source: string = "manual") => {
        setSubmitting(true);
        try {
            const response = await fetch(`/api/landlord/tour?start=1&source=${source}`, { cache: "no-store" });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Failed to start tour");
            
            const firstStep = LANDLORD_PRODUCT_TOUR_STEPS[payload.state.current_step_index];
            router.push(firstStep.route);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start tour");
            setSubmitting(false);
        }
    };

    const replayTour = async () => {
        setSubmitting(true);
        try {
            const response = await fetch("/api/landlord/tour/replay", { method: "POST" });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Failed to replay tour");
            
            const firstStep = LANDLORD_PRODUCT_TOUR_STEPS[0];
            router.push(firstStep.route);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to replay tour");
            setSubmitting(false);
        }
    };

    const getStepIcon = (id: string) => {
        switch (id) {
            case "welcome": return <Play className="h-5 w-5" />;
            case "unit_map": return <MapPinned className="h-5 w-5" />;
            case "properties_portfolio": return <Building2 className="h-5 w-5" />;
            case "tenant_management": return <Users className="h-5 w-5" />;
            case "finance_hub": return <Wallet className="h-5 w-5" />;
            default: return <ChevronRight className="h-5 w-5" />;
        }
    };

    const hardResetTour = async () => {
        if (!confirm("This will completely wipe your tour progress and history. Are you sure?")) return;
        setSubmitting(true);
        try {
            const response = await fetch("/api/landlord/tour", { method: "DELETE" });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Failed to reset tour");
            
            setTourState(null);
            setError(null);
            alert("Tour progress wiped successfully.");
            await loadTourState();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reset tour");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading tour details...</p>
                </div>
            </div>
        );
    }

    const currentStepIndex = tourState?.current_step_index ?? 0;
    const isCompleted = tourState?.status === "completed";
    const isInProgress = tourState?.status === "in_progress";

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="mx-auto max-w-4xl">
                <button 
                    onClick={() => router.push("/landlord/dashboard")}
                    className="mb-8 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <div className="grid gap-12 lg:grid-cols-[1fr,320px]">
                    <div className="space-y-10">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                Guided Experience
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">Getting Started Guide</h1>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Master the iReside platform with our step-by-step walkthrough. We&apos;ll show you how to manage your units, track your portfolio, and automate your finances.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {LANDLORD_PRODUCT_TOUR_STEPS.map((step, idx) => {
                                const isPast = idx < currentStepIndex || isCompleted;
                                const isCurrent = idx === currentStepIndex && isInProgress && !isCompleted;
                                
                                return (
                                    <div 
                                        key={step.id}
                                        className={cn(
                                            "flex items-start gap-4 rounded-3xl border p-6 transition-all",
                                            isCurrent ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card/50",
                                            isPast ? "opacity-60" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                            isPast ? "bg-emerald-500/10 text-emerald-500" : 
                                            isCurrent ? "bg-primary text-black" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isPast ? <CheckCircle2 className="h-5 w-5" /> : getStepIcon(step.id)}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-foreground">{step.title}</h3>
                                            <p className="text-sm text-muted-foreground">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="sticky top-12 rounded-[2.5rem] border border-border bg-card p-8 shadow-xl">
                            <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-3xl font-black text-foreground">
                                    {isCompleted ? LANDLORD_PRODUCT_TOUR_STEPS.length : currentStepIndex}
                                    <span className="ml-1 text-base font-bold text-muted-foreground">/ {LANDLORD_PRODUCT_TOUR_STEPS.length}</span>
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-primary">
                                    {isCompleted ? "COMPLETED" : isInProgress ? "IN PROGRESS" : "NOT STARTED"}
                                </div>
                            </div>
                            
                            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div 
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(isCompleted ? LANDLORD_PRODUCT_TOUR_STEPS.length : currentStepIndex) / LANDLORD_PRODUCT_TOUR_STEPS.length * 100}%` }}
                                />
                            </div>

                            <div className="mt-10 space-y-3">
                                {(!isInProgress || isCompleted) ? (
                                    <button 
                                        disabled={submitting}
                                        onClick={() => isCompleted ? void replayTour() : void startTour()}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                                    >
                                        {isCompleted ? <RefreshCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        {isCompleted ? "Replay Tour" : "Start Tour"}
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <button 
                                            disabled={submitting}
                                            onClick={() => {
                                                const step = LANDLORD_PRODUCT_TOUR_STEPS[currentStepIndex];
                                                router.push(step.route);
                                            }}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            Continue Tour
                                        </button>
                                        <button 
                                            disabled={submitting}
                                            onClick={() => void replayTour()}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-card py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
                                        >
                                            <RefreshCcw className="h-3 w-3" />
                                            Reset & Start Over
                                        </button>
                                    </div>
                                )}
                                
                                <div className="pt-6 border-t border-white/10">
                                    <button 
                                        disabled={submitting}
                                        onClick={() => void hardResetTour()}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] font-black uppercase tracking-widest text-rose-400 transition-all hover:bg-rose-500/10 active:scale-95 disabled:opacity-50"
                                    >
                                        <RefreshCcw className="h-3 w-3" />
                                        Complete Progress Reset
                                    </button>
                                </div>

                                {isCompleted && (
                                    <p className="mt-4 px-4 text-center text-xs font-medium text-muted-foreground">
                                        You&apos;ve completed the guided experience. You can replay it anytime to refresh your knowledge.
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-500">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
