"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number; // duration in ms
    prefix?: string;
    suffix?: string;
    className?: string;
}

export default function AnimatedCounter({
    value,
    duration = 1500,
    prefix = "",
    suffix = "",
    className = "",
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        let animationFrameId: number;

        const easeOutQuad = (t: number) => t * (2 - t);

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);

            // Apply easing
            const easedProgress = easeOutQuad(percentage);
            
            // Calculate current value
            const currentVal = Math.floor(easedProgress * value);
            countRef.current = currentVal;
            setCount(currentVal);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            startTimeRef.current = null;
        };
    }, [value, duration]);

    // Format number with commas
    const formattedCount = new Intl.NumberFormat("en-US").format(count);

    return (
        <span className={className}>
            {prefix}{formattedCount}{suffix}
        </span>
    );
}
