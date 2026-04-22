"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type AnchorHTMLAttributes,
    type PropsWithChildren,
} from "react";
import gsap from "gsap";

type TransitionContextValue = {
    navigateWithTransition: (href: string) => void;
};

const TRANSITION_COLS = 5;
const TRANSITION_ROWS = 2;

const TransitionContext = createContext<TransitionContextValue | null>(null);

type TransitionLinkProps = LinkProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
        href: string;
    };

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
    const ctx = useContext(TransitionContext);
    const pathname = usePathname();

    if (!ctx) {
        return <Link href={href} onClick={onClick} {...props} />;
    }

    return (
        <Link
            href={href}
            onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented) return;
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                if (props.target === "_blank") return;
                if (!href || href.startsWith("#")) return;
                if (href === pathname) return;

                event.preventDefault();
                ctx.navigateWithTransition(href);
            }}
            {...props}
        />
    );
}

export function PageTransitionProvider({ children }: PropsWithChildren) {
    const router = useRouter();
    const pathname = usePathname();
    const overlayRef = useRef<HTMLDivElement>(null);
    const pendingPathRef = useRef<string | null>(null);
    const transitionFromPathRef = useRef<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const getBlocks = useCallback(() => {
        const overlay = overlayRef.current;
        if (!overlay) return [] as HTMLElement[];
        return Array.from(overlay.querySelectorAll<HTMLElement>("[data-transition-block]"));
    }, []);

    const setOrigins = useCallback(() => {
        const overlay = overlayRef.current;
        if (!overlay) return;
        const topBlocks = overlay.querySelectorAll<HTMLElement>("[data-transition-row='top'] [data-transition-block]");
        const bottomBlocks = overlay.querySelectorAll<HTMLElement>("[data-transition-row='bottom'] [data-transition-block]");
        gsap.set(topBlocks, { transformOrigin: "top center" });
        gsap.set(bottomBlocks, { transformOrigin: "bottom center" });
    }, []);

    const reveal = useCallback(() => {
        const overlay = overlayRef.current;
        const blocks = getBlocks();
        if (!overlay || blocks.length === 0) return;

        setOrigins();
        gsap.set(overlay, { autoAlpha: 1, pointerEvents: "none" });
        gsap.set(blocks, { scaleY: 1 });

        gsap.to(blocks, {
            scaleY: 0,
            duration: 0.95,
            ease: "power4.inOut",
            stagger: {
                grid: [TRANSITION_ROWS, TRANSITION_COLS],
                each: 0.045,
                from: "start",
            },
            onComplete: () => {
                gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });
            },
        });
    }, [getBlocks, setOrigins]);

    const cover = useCallback(() => {
        const overlay = overlayRef.current;
        const blocks = getBlocks();
        if (!overlay || blocks.length === 0) return Promise.resolve();

        setOrigins();
        gsap.set(overlay, { autoAlpha: 1, pointerEvents: "none" });
        gsap.set(blocks, { scaleY: 0 });

        return new Promise<void>((resolve) => {
            gsap.to(blocks, {
                scaleY: 1,
                duration: 0.75,
                ease: "power4.inOut",
                stagger: {
                    grid: [TRANSITION_ROWS, TRANSITION_COLS],
                    each: 0.04,
                    from: "end",
                },
                onComplete: () => resolve(),
            });
        });
    }, [getBlocks, setOrigins]);

    const navigateWithTransition = useCallback(
        async (href: string) => {
            if (isTransitioning) return;
            transitionFromPathRef.current = pathname;
            pendingPathRef.current = href.split(/[?#]/)[0] || href;
            setIsTransitioning(true);
            await cover();
            router.push(href);
        },
        [cover, isTransitioning, pathname, router]
    );

    useEffect(() => {
        if (!isTransitioning) return;
        const pendingPath = pendingPathRef.current;
        const transitionFromPath = transitionFromPathRef.current;
        const reachedPendingPath = Boolean(pendingPath && pathname === pendingPath);
        const movedAwayFromSource = Boolean(transitionFromPath && pathname !== transitionFromPath);
        if (!reachedPendingPath && !movedAwayFromSource) return;

        let rafB = 0;
        const rafA = requestAnimationFrame(() => {
            rafB = requestAnimationFrame(() => {
                reveal();
                pendingPathRef.current = null;
                transitionFromPathRef.current = null;
                setIsTransitioning(false);
            });
        });
        return () => {
            cancelAnimationFrame(rafA);
            if (rafB) cancelAnimationFrame(rafB);
        };
    }, [isTransitioning, pathname, reveal]);

    const ctxValue = useMemo<TransitionContextValue>(
        () => ({ navigateWithTransition }),
        [navigateWithTransition]
    );

    return (
        <TransitionContext.Provider value={ctxValue}>
            <div
                ref={overlayRef}
                className="fixed inset-0 z-[999] pointer-events-none"
                style={{ opacity: 0, visibility: "hidden" }}
                aria-hidden="true"
            >
                <div className="flex h-1/2 w-full" data-transition-row="top">
                    {Array.from({ length: TRANSITION_COLS }).map((_, idx) => (
                        <div
                            key={`top-${idx}`}
                            data-transition-block
                            className="h-full flex-1 bg-black"
                            style={{ transform: "scaleY(1)" }}
                        />
                    ))}
                </div>
                <div className="flex h-1/2 w-full" data-transition-row="bottom">
                    {Array.from({ length: TRANSITION_COLS }).map((_, idx) => (
                        <div
                            key={`bottom-${idx}`}
                            data-transition-block
                            className="h-full flex-1 bg-black"
                            style={{ transform: "scaleY(1)" }}
                        />
                    ))}
                </div>
            </div>
            {children}
        </TransitionContext.Provider>
    );
}
