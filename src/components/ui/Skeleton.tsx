import { cn } from "@/lib/utils";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    shimmer?: boolean;
    name?: string;
    loading?: boolean;
    fixture?: any;
    children?: React.ReactNode;
}

export function Skeleton({ className, shimmer = true, name, loading, fixture, children, ...props }: SkeletonProps) {
    if (name) {
        return (
            <BoneyardSkeleton name={name} loading={loading ?? false} fixture={fixture}>
                {children}
            </BoneyardSkeleton>
        );
    }
    
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-md bg-muted/20",
                shimmer && "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
                className
            )}
            {...props}
        />
    );
}
