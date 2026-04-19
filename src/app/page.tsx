"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from '@/components/theme-toggle';
import { Building, ChevronRight, ShieldCheck, ArrowRight, Home, Users, BarChart3, Clock, Lock, Zap, FileText, CheckCircle2, Sparkles, Activity, LayoutDashboard, MapPin, Receipt, PieChart, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TransitionLink } from "@/components/transitions/PageTransitionProvider";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    ScrollTrigger.config({
        limitCallbacks: true,
        ignoreMobileResize: true,
    });
}

const HOW_IT_WORKS = [
    {
        id: 1,
        title: "Private Workspace",
        desc: "Get invited to a private iReside workspace.",
        highlights: [
            "Invite-only onboarding and role-based access",
            "Property and tenant data isolated per portfolio",
            "Centralized timeline for leases, rent, and requests",
        ],
        metric: "Invite-only",
        metricLabel: "Access model",
        icon: Lock,
        color: "from-emerald-500/20",
        accent: "text-primary dark:text-primary-200"
    },
    {
        id: 2,
        title: "Quality Placement",
        desc: "Verify and place qualified tenants.",
        highlights: [
            "Guided application intake with document checks",
            "Structured screening for faster final decisions",
            "Clear approval trail for compliance confidence",
        ],
        metric: "Guided",
        metricLabel: "Placement flow",
        icon: Users,
        color: "from-teal-500/20 dark:from-teal-500/10",
        accent: "text-teal-600 dark:text-teal-400"
    },
    {
        id: 3,
        title: "Automated Ops",
        desc: "Automate rent and daily operations with iRis support.",
        highlights: [
            "Automated rent reminders and payment tracking",
            "Daily priority brief across all active units",
            "Actionable recommendations from iRis",
        ],
        metric: "Centralized",
        metricLabel: "Operations hub",
        icon: Activity,
        color: "from-zinc-500/20 dark:from-zinc-500/10",
        accent: "text-muted-foreground"
    }
];

const SHOWCASE_MODULES = [
    {
        id: "dashboard",
        title: "Operations Dashboard",
        desc: "See occupancy, income, lease status, and urgent tasks in one real-time command center.",
        href: "/modules/dashboard",
        icon: LayoutDashboard,
        color: "bg-blue-500",
        shadow: "shadow-blue-500/20",
    },
    {
        id: "map",
        title: "Unit Map",
        desc: "Visualize every property and unit at a glance to spot vacancies, turnover risk, and leasing opportunities faster.",
        href: "/modules/unit-map",
        icon: MapPin,
        color: "bg-emerald-500",
        shadow: "shadow-emerald-500/20",
    },
    {
        id: "finance",
        title: "Rent & Invoices",
        desc: "Automate billing, track payment status, and keep monthly collections predictable with less manual follow-up.",
        href: "/modules/financials",
        icon: Receipt,
        color: "bg-purple-500",
        shadow: "shadow-purple-500/20",
    }
];

const IRIS_WORKFLOWS = [
    {
        title: "Portfolio Pulse",
        detail: "Ask one question and get occupancy gaps, late-risk units, and immediate follow-ups.",
        icon: PieChart,
    },
    {
        title: "Faster Resident Replies",
        detail: "Generate clear, policy-aligned responses in seconds, then edit and send with confidence.",
        icon: MessageSquare,
    },
    {
        title: "Daily Execution Brief",
        detail: "Start each day with prioritized tasks, status flags, and recommended next actions.",
        icon: LayoutDashboard,
    },
];

const OUTCOMES = [
    {
        metric: "Focused",
        label: "Follow-up workload",
        detail: "Designed to reduce repetitive admin loops through clearer communication and reminders.",
    },
    {
        metric: "Streamlined",
        label: "Placement decisions",
        detail: "Shared visibility helps teams evaluate applicants with fewer handoff delays.",
    },
    {
        metric: "Daily",
        label: "Portfolio visibility",
        detail: "One timeline for leases, payments, and requests keeps teams aligned day to day.",
    },
    {
        metric: "Private",
        label: "Data exposure risk",
        detail: "Invite-only workflows are built to limit unnecessary public exposure.",
    },
];

export default function ScrollyTellingLandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollWrapperRef = useRef<HTMLDivElement>(null);
    const showcaseContainerRef = useRef<HTMLDivElement>(null);
    const irisSectionRef = useRef<HTMLElement>(null);
    const irisSequenceRef = useRef<HTMLImageElement>(null);
    const outcomesSectionRef = useRef<HTMLElement>(null);
    const ctaSectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let mounted = true;
        let rafId = 0;
        let frameIndex = 0;
        let lastTick = 0;
        const fps = 30;
        const startFrame = 1;
        const endFrame = 66;
        const frameCount = endFrame - startFrame + 1;
        const frameDuration = 1000 / fps;
        const framePaths = Array.from({ length: frameCount }, (_, index) => {
            const frameNo = String(startFrame + index).padStart(4, "0");
            return `/assets/happy-wave/frame_${frameNo}.png`;
        });

        if (irisSequenceRef.current) {
            irisSequenceRef.current.src = framePaths[0];
        }

        // Warm cache to reduce first-loop flicker.
        framePaths.forEach((src) => {
            const img = new Image();
            img.src = src;
        });

        const animate = (timestamp: number) => {
            if (!mounted || !irisSequenceRef.current) return;
            if (document.visibilityState !== "visible") {
                rafId = requestAnimationFrame(animate);
                return;
            }
            if (timestamp - lastTick >= frameDuration) {
                frameIndex = (frameIndex + 1) % frameCount;
                irisSequenceRef.current.src = framePaths[frameIndex];
                lastTick = timestamp;
            }
            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            mounted = false;
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    useGSAP(() => {
        const showcaseRoot = showcaseContainerRef.current;
        if (!showcaseRoot) return;

        const cards = gsap.utils.toArray<HTMLElement>(".showcase-card", showcaseRoot);
        if (cards.length === 0) return;
        const moduleBodies = cards.map((card) => card.querySelector<HTMLElement>(".module-body"));
        const moduleCtas = cards.map((card) => card.querySelector<HTMLElement>(".module-cta"));

        ScrollTrigger.getById("landing-showcase-stack")?.kill();
        gsap.set(cards, { yPercent: 100, scale: 1, opacity: 1, force3D: true, willChange: "transform" });
        gsap.set(cards[0], { yPercent: 0 });
        gsap.set(moduleBodies, { autoAlpha: 0, y: 24 });
        gsap.set(moduleCtas, { autoAlpha: 0, x: -12 });
        if (moduleBodies[0]) gsap.set(moduleBodies[0], { autoAlpha: 1, y: 0 });
        if (moduleCtas[0]) gsap.set(moduleCtas[0], { autoAlpha: 1, x: 0 });
        const segments = Math.max(cards.length - 1, 1);

        ScrollTrigger.create({
            id: "landing-showcase-stack",
            trigger: showcaseRoot,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            snap: segments > 1 ? {
                snapTo: 1 / segments,
                duration: { min: 0.15, max: 0.35 },
                delay: 0.05,
                ease: "power1.inOut",
            } : undefined,
            start: "top top",
            end: `+=${window.innerHeight * segments}`,
            anticipatePin: 1,
            refreshPriority: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const p = self.progress * segments;
                const firstReveal = gsap.utils.clamp(0, 1, 1 - p);
                if (moduleBodies[0]) {
                    gsap.to(moduleBodies[0], {
                        autoAlpha: firstReveal,
                        y: (1 - firstReveal) * 24,
                        duration: 0.18,
                        ease: "none",
                        overwrite: true,
                    });
                }
                if (moduleCtas[0]) {
                    gsap.to(moduleCtas[0], {
                        autoAlpha: firstReveal,
                        x: (1 - firstReveal) * -12,
                        duration: 0.18,
                        ease: "none",
                        overwrite: true,
                    });
                }

                for (let i = 1; i < cards.length; i++) {
                    const local = gsap.utils.clamp(0, 1, p - (i - 1));
                    gsap.set(cards[i], { yPercent: (1 - local) * 100 });
                    if (moduleBodies[i]) {
                        gsap.to(moduleBodies[i], {
                            autoAlpha: local,
                            y: (1 - local) * 24,
                            duration: 0.18,
                            ease: "none",
                            overwrite: true,
                        });
                    }
                    if (moduleCtas[i]) {
                        gsap.to(moduleCtas[i], {
                            autoAlpha: local,
                            x: (1 - local) * -12,
                            duration: 0.18,
                            ease: "none",
                            overwrite: true,
                        });
                    }
                }
            },
        });

        return () => {
            ScrollTrigger.getById("landing-showcase-stack")?.kill();
            gsap.set(cards, { clearProps: "transform,willChange" });
        };
    }, { scope: showcaseContainerRef });

    useGSAP(() => {
        const wrapper = scrollWrapperRef.current;
        const trigger = containerRef.current;
        if (!wrapper || !trigger) return;

        let tween: gsap.core.Tween | null = null;
        const triggerId = "landing-horizontal-features";
        const getScrollDistance = () => Math.max(0, (wrapper.scrollWidth || 0) - window.innerWidth);
        const getSnapStops = () => {
            const distance = getScrollDistance();
            if (distance <= 0) return [0];

            const panels = gsap.utils.toArray<HTMLElement>(".howit-panel", wrapper);
            const stops = panels
                .map((panel) => gsap.utils.clamp(0, 1, panel.offsetLeft / distance))
                .filter((value, index, arr) => index === 0 || Math.abs(value - arr[index - 1]) > 0.003);

            if (stops[0] !== 0) stops.unshift(0);
            if (stops[stops.length - 1] !== 1) stops.push(1);
            return stops;
        };

        const setupAnimation = () => {
            ScrollTrigger.getById(triggerId)?.kill();
            tween?.kill();
            tween = null;

            if (window.matchMedia("(max-width: 1023px)").matches) {
                gsap.set(wrapper, { clearProps: "transform,willChange" });
                return;
            }

            gsap.set(wrapper, { x: 0, force3D: true, willChange: "transform" });

            tween = gsap.to(wrapper, {
                x: () => -getScrollDistance(),
                ease: "none",
                force3D: true,
                overwrite: true,
                scrollTrigger: {
                    id: triggerId,
                    trigger,
                    start: "top top",
                    pin: true,
                    pinSpacing: true,
                    scrub: 1,
                    snap: {
                        snapTo: (rawProgress: number) => {
                            const stops = getSnapStops();
                            let closest = stops[0];
                            let minDiff = Math.abs(rawProgress - closest);
                            for (let i = 1; i < stops.length; i++) {
                                const diff = Math.abs(rawProgress - stops[i]);
                                if (diff < minDiff) {
                                    closest = stops[i];
                                    minDiff = diff;
                                }
                            }
                            return closest;
                        },
                        duration: { min: 0.2, max: 0.45 },
                        delay: 0.06,
                        ease: "power1.inOut",
                    },
                    anticipatePin: 1,
                    refreshPriority: 2,
                    invalidateOnRefresh: true,
                    end: () => `+=${Math.max(getScrollDistance(), 1)}`
                }
            });
        };

        const handleRefreshInit = () => {
            setupAnimation();
        };

        const resizeObserver = new ResizeObserver(() => {
            ScrollTrigger.refresh();
        });
        resizeObserver.observe(wrapper);

        const onWindowLoad = () => {
            ScrollTrigger.refresh();
        };

        setupAnimation();
        ScrollTrigger.addEventListener("refreshInit", handleRefreshInit);
        window.addEventListener("load", onWindowLoad);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("load", onWindowLoad);
            ScrollTrigger.removeEventListener("refreshInit", handleRefreshInit);
            tween?.kill();
            ScrollTrigger.getById(triggerId)?.kill();
            gsap.set(wrapper, { clearProps: "transform,willChange" });
        };
    }, { scope: containerRef });

    useGSAP(() => {
        const scheduleRefresh = () => {
            requestAnimationFrame(() => ScrollTrigger.refresh());
        };

        scheduleRefresh();
        window.addEventListener("load", scheduleRefresh);
        document.fonts?.ready.then(scheduleRefresh).catch(() => {
            /* no-op */
        });

        return () => {
            window.removeEventListener("load", scheduleRefresh);
        };
    });

    useGSAP(() => {
        const irisSection = irisSectionRef.current;
        const outcomesSection = outcomesSectionRef.current;
        const ctaSection = ctaSectionRef.current;
        if (!irisSection || !outcomesSection || !ctaSection) return;

        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            // == IRIS SECTION ANIMATION ==
            const irisGlow = irisSection.querySelector(".iris-glow");
            const irisHeader = irisSection.querySelectorAll(".iris-header-anim");
            const irisCards = gsap.utils.toArray<HTMLElement>(".iris-card", irisSection);
            const irisMascot = irisSection.querySelector<HTMLElement>(".iris-mascot");
            
            // Set initial state
            gsap.set(irisHeader, { autoAlpha: 0, y: 100, rotateX: 20 });
            gsap.set(irisCards, { autoAlpha: 0, y: 300, scale: 0.8, rotateZ: () => gsap.utils.random(-15, 15) });
            if (irisMascot) {
                gsap.set(irisMascot, { autoAlpha: 0, xPercent: 42, yPercent: 10, rotate: -6, scale: 0.9 });
            }
            
            const irisTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-iris-story-v2",
                    trigger: irisSection,
                    start: "top top",
                    end: "+=220%",
                    pin: true,
                    scrub: 1.2,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            if (irisMascot) {
                irisTl.to(irisMascot, {
                    xPercent: 0,
                    yPercent: 0,
                    rotate: -1,
                    scale: 1,
                    autoAlpha: 0.85,
                    duration: 0.9,
                    ease: "power2.out",
                }, 0.58);

                irisTl.to(irisMascot, {
                    yPercent: -6,
                    rotate: 1.2,
                    duration: 1.2,
                    ease: "none",
                }, 1.45);
            }

            // 1. Reveal header with 3D flip
            irisTl.to(irisHeader, {
                y: 0,
                autoAlpha: 1,
                rotateX: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out",
            });

            // 2. Cards fly in from chaos to organized grid
            irisTl.to(irisCards, {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                rotateZ: 0,
                duration: 1.5,
                stagger: 0.15,
                ease: "back.out(1.2)",
            }, "-=0.4");
            
            // 3. Subtle float/drift effect while scrolling
            irisTl.to(irisCards, {
                y: -30,
                ease: "none",
                duration: 1,
            });

            // Subtle parallax for the main glow
            if (irisGlow) {
                gsap.to(irisGlow, {
                    yPercent: 40,
                    scale: 1.5,
                    ease: "none",
                    scrollTrigger: {
                        trigger: irisSection,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1.5,
                    },
                });
            }

            // == OUTCOMES SECTION ANIMATION ==
            const outcomesHeading = outcomesSection.querySelectorAll(".outcomes-reveal");
            const outcomesLeft = outcomesSection.querySelector<HTMLElement>(".outcomes-left");
            const outcomesViewport = outcomesSection.querySelector<HTMLElement>(".outcomes-right-viewport");
            const outcomesTrack = outcomesSection.querySelector<HTMLElement>(".outcomes-right-track");
            const outcomeItems = gsap.utils.toArray<HTMLElement>(".outcome-item", outcomesSection);
            const outcomesGlow = outcomesSection.querySelector(".outcomes-glow");
            const outcomesMetrics = outcomesSection.querySelectorAll<HTMLElement>(".outcome-metric-value");
            const firstItemOffset = outcomeItems[0]?.offsetTop ?? 0;
            const outcomeOffsets = outcomeItems.map((item) => Math.max(0, item.offsetTop - firstItemOffset));
            const viewportHeight = outcomesViewport?.clientHeight ?? Math.round(window.innerHeight * 0.65);
            const trackHeight = outcomesTrack?.scrollHeight ?? 0;
            const maxTrackShift = Math.max(0, trackHeight - viewportHeight);
            const trackShiftTargets = outcomeOffsets.map((offset) => Math.min(offset, maxTrackShift));
            const lastTrackShift = trackShiftTargets[trackShiftTargets.length - 1] ?? 0;

            gsap.set(outcomesHeading, { autoAlpha: 0, x: -80 });
            gsap.set(outcomeItems, { autoAlpha: 0.15, y: 86, scale: 0.95 });
            gsap.set(outcomesMetrics, { autoAlpha: 0, scale: 0.72 });
            if (outcomesTrack) gsap.set(outcomesTrack, { y: 0 });

            const introPhase = 1.05;
            const stepPhase = 1.35;
            const outroPhase = 0.65;
            const totalPhase = introPhase + outcomeItems.length * stepPhase + outroPhase;

            const outcomesTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-outcomes-story-v3",
                    trigger: outcomesSection,
                    start: "top top",
                    end: () => {
                        const minPinnedDistance = window.innerHeight * 3.6;
                        const contentPinnedDistance = lastTrackShift + viewportHeight * 1.55;
                        return `+=${Math.max(minPinnedDistance, contentPinnedDistance)}`;
                    },
                    pin: true,
                    pinSpacing: true,
                    scrub: 1.6,
                    snap: undefined,
                    fastScrollEnd: false,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            outcomesTl.to(outcomesHeading, {
                x: 0,
                autoAlpha: 1,
                duration: 0.32,
                stagger: 0.08,
                ease: "none",
            }, 0);

            if (outcomesLeft) {
                outcomesTl.to(outcomesLeft, {
                    yPercent: -6,
                    duration: totalPhase,
                    ease: "none",
                }, 0);
            }

            outcomeItems.forEach((item, index) => {
                const metric = item.querySelector<HTMLElement>(".outcome-metric-value");
                const previous = index > 0 ? outcomeItems[index - 1] : null;
                const pos = introPhase + index * stepPhase;

                if (outcomesTrack) {
                    outcomesTl.to(outcomesTrack, {
                        y: -trackShiftTargets[index],
                        duration: 0.92,
                        ease: "none",
                    }, pos + (index === 0 ? 0 : 0.2));
                }

                outcomesTl.to(item, {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.58,
                    ease: "none",
                }, pos);

                if (metric) {
                    outcomesTl.to(metric, {
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.34,
                        ease: "none",
                    }, pos + 0.24);
                }

                if (previous) {
                    outcomesTl.to(previous, {
                        autoAlpha: 0.34,
                        y: -26,
                        scale: 0.97,
                        duration: 0.52,
                        ease: "none",
                    }, pos + 0.34);
                }
            });

            if (outcomesGlow) {
                outcomesTl.to(outcomesGlow, {
                    yPercent: -24,
                    scale: 1.24,
                    duration: totalPhase,
                    ease: "none",
                }, 0);
            }

            // == CTA SECTION ANIMATION ==
            const ctaReveal = gsap.utils.toArray<HTMLElement>(".cta-reveal", ctaSection);
            const ctaPanelWrapper = ctaSection.querySelector(".cta-panel-wrapper");
            const ctaAmbient = ctaSection.querySelector(".cta-ambient");

            gsap.set(ctaReveal, { autoAlpha: 0.2, y: 28, scale: 0.96 });
            if (ctaPanelWrapper) gsap.set(ctaPanelWrapper, { autoAlpha: 0.15, y: 84, rotateX: 10 });

            const ctaTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-cta-story-v2",
                    trigger: ctaSection,
                    start: "top 88%",
                    end: "bottom 80%",
                    scrub: 1,
                },
            });

            ctaTl.to(ctaReveal, {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                duration: 1,
                stagger: 0.15,
                ease: "power2.out",
            });

            if (ctaPanelWrapper) {
                ctaTl.to(ctaPanelWrapper, {
                    y: 0,
                    autoAlpha: 1,
                    rotateX: 0,
                    duration: 1.2,
                    ease: "power3.out",
                }, "-=0.5");
            }

            if (ctaAmbient) {
                gsap.to(ctaAmbient, {
                    scale: 1.4,
                    opacity: 0.8,
                    ease: "none",
                    scrollTrigger: {
                        trigger: ctaSection,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1.5,
                    },
                });
            }
        });

        // Mobile Fallbacks
        mm.add("(max-width: 1023px)", () => {
            const irisHeaders = gsap.utils.toArray<HTMLElement>(".iris-header-anim", irisSection);
            const irisCards = gsap.utils.toArray<HTMLElement>(".iris-card", irisSection);
            const irisMascot = irisSection.querySelector<HTMLElement>(".iris-mascot");
            const outcomeItems = gsap.utils.toArray<HTMLElement>(".outcome-item", outcomesSection);
            const ctaElems = gsap.utils.toArray<HTMLElement>(".cta-reveal, .cta-panel-wrapper", ctaSection);

            gsap.fromTo(irisHeaders, { autoAlpha: 0, y: 30 }, {
                autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1,
                scrollTrigger: { trigger: irisSection, start: "top 80%" },
            });

            if (irisMascot) {
                gsap.fromTo(irisMascot, { autoAlpha: 0, xPercent: 40, yPercent: 10, scale: 0.92 }, {
                    autoAlpha: 0.7, xPercent: 0, yPercent: 0, scale: 1, duration: 0.9, ease: "power2.out",
                    scrollTrigger: { trigger: irisSection, start: "top 74%", end: "top 42%", scrub: 1 },
                });
            }

            gsap.fromTo(irisCards, { autoAlpha: 0, y: 50 }, {
                autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1,
                scrollTrigger: { trigger: irisSection, start: "top 75%" },
            });

            gsap.fromTo(outcomeItems, { autoAlpha: 0, y: 50 }, {
                autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1,
                scrollTrigger: { trigger: outcomesSection, start: "top 75%" },
            });

            gsap.fromTo(ctaElems, { autoAlpha: 0, y: 40 }, {
                autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1,
                scrollTrigger: { trigger: ctaSection, start: "top 85%" },
            });
        });
        
        requestAnimationFrame(() => ScrollTrigger.refresh());

        return () => {
            mm.revert();
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.5))]" />
                <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.04] mix-blend-overlay z-10" />
                
                <style dangerouslySetInnerHTML={{__html: `
                    .ripple-background {
                        position: absolute;
                        inset: 0;
                        background: transparent;
                        overflow: hidden;
                        z-index: -1;
                    }
                    .ripple-circle {
                        position: absolute;
                        border-radius: 50%;
                        background: var(--primary);
                        animation: ripple 15s infinite;
                        box-shadow: 0px 0px 1px 0px var(--primary);
                    }
                    .ripple-small { width: 200px; height: 200px; left: -100px; bottom: -100px; }
                    .ripple-medium { width: 400px; height: 400px; left: -200px; bottom: -200px; }
                    .ripple-large { width: 600px; height: 600px; left: -300px; bottom: -300px; }
                    .ripple-xlarge { width: 800px; height: 800px; left: -400px; bottom: -400px; }
                    .ripple-xxlarge { width: 1000px; height: 1000px; left: -500px; bottom: -500px; }
                    
                    .ripple-shade1 { opacity: 0.03; }
                    .ripple-shade2 { opacity: 0.05; }
                    .ripple-shade3 { opacity: 0.08; }
                    .ripple-shade4 { opacity: 0.12; }
                    .ripple-shade5 { opacity: 0.15; }

                    .dark .ripple-circle {
                        background: var(--primary);
                        box-shadow: 0px 0px 1px 0px var(--primary);
                    }
                    .dark .ripple-shade1 { opacity: 0.02; }
                    .dark .ripple-shade2 { opacity: 0.04; }
                    .dark .ripple-shade3 { opacity: 0.06; }
                    .dark .ripple-shade4 { opacity: 0.08; }
                    .dark .ripple-shade5 { opacity: 0.1; }

                    @keyframes ripple {
                        0% { transform: scale(0.8); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(0.8); }
                    }
                `}} />
                <div className="ripple-background">
                    <div className="ripple-circle ripple-xxlarge ripple-shade1"></div>
                    <div className="ripple-circle ripple-xlarge ripple-shade2"></div>
                    <div className="ripple-circle ripple-large ripple-shade3"></div>
                    <div className="ripple-circle ripple-medium ripple-shade4"></div>
                    <div className="ripple-circle ripple-small ripple-shade5"></div>
                </div>

                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-2xl"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <Logo className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105" />
                        <div className="flex flex-col border-l border-border/50 pl-4">
                            <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary leading-tight">Landlord Access</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4"><ThemeToggle /><TransitionLink href="/login" className="relative flex items-center gap-2 overflow-hidden group px-6 py-2.5 rounded-full border border-zinc-200 bg-muted border-border text-sm font-bold text-foreground transition-all hover:bg-muted/80 hover:border-primary/30">
                        <span className="relative z-10 hidden md:block">Access Portal</span>
                        <span className="relative z-10 md:hidden">Login</span>
                        <ChevronRight className="h-4 w-4 relative z-10 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TransitionLink></div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pb-24 z-10 box-border">
                <motion.div 
                    className="max-w-[70rem] mx-auto text-center w-full relative"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-6 shadow-[0_0_30px_rgba(109,152,56,0.15)] backdrop-blur-md">
                            <ShieldCheck className="h-4 w-4" />
                            Exclusive Network
                        </span>
                        
                        <h1 className="text-[3.5rem] sm:text-6xl md:text-[6.5rem] lg:text-[8rem] font-black tracking-tighter leading-[0.85] mb-6 flex flex-col items-center">
                            <Logo variant="primary" className="h-[0.8em] w-[3em] block drop-shadow-sm dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] mb-2" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary to-primary-dark dark:from-primary-200 dark:via-primary dark:to-primary block text-center">Perfected.</span>
                        </h1>
                        
                        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-8 tracking-tight">
                            Run your rentals with less friction, stronger security, and predictable cash flow.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                            <TransitionLink href="/apply-landlord" className="group relative flex items-center justify-center h-14 md:h-16 px-8 md:px-10 rounded-full bg-primary text-primary-foreground font-black text-lg transition-all hover:scale-105 hover:bg-primary-dark shadow-[0_0_40px_rgba(109,152,56,0.3)] hover:shadow-[0_0_60px_rgba(109,152,56,0.5)] overflow-hidden w-full sm:w-auto">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative z-10 flex items-center gap-3">
                                    Request Access
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                                </span>
                            </TransitionLink>
                            <TransitionLink href="/demo" className="group relative flex items-center justify-center h-14 md:h-16 px-8 md:px-10 rounded-full bg-background border-2 border-primary text-primary font-black text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(109,152,56,0.1)] hover:shadow-[0_0_60px_rgba(109,152,56,0.2)] overflow-hidden w-full sm:w-auto">
                                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <span className="relative z-10 flex items-center gap-3">
                                    Book a Demo
                                </span>
                            </TransitionLink>
                        </div>
                    </motion.div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3"
                >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scroll to Explore</span>
                    <div className="w-[1px] h-6 md:h-10 bg-gradient-to-b from-primary/50 to-transparent" />
                </motion.div>
            </section>

            {/* Trust Line */}
            <section className="relative z-20 py-24 px-6 bg-muted/30 border-y border-border/50 text-center">
                <div className="max-w-4xl mx-auto">
                    <p className="text-2xl md:text-4xl font-black tracking-tight text-foreground/80 leading-relaxed">
                        Built for landlords and operators who value <span className="text-primary italic px-1">control</span>, compliance, and consistency.
                    </p>
                </div>
            </section>

            {/* How It Works (GSAP Horizontal) */}
            <section ref={containerRef} className="relative h-screen z-20 overflow-hidden bg-background">
                <div ref={scrollWrapperRef} style={{ willChange: "transform" }} className="flex h-screen items-center w-max px-[5vw] pt-8 md:pt-12 [transform:translate3d(0,0,0)]">
                    
                    <div className="howit-panel w-[90vw] md:w-[60vw] shrink-0 flex flex-col justify-center px-12 md:px-20">
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-foreground leading-tight">
                            How It<br className="hidden md:block"/>Works
                        </h2>
                        <p className="text-2xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                            Step into a simpler, calmer way to manage your portfolio with iReside.
                        </p>
                    </div>

                    {HOW_IT_WORKS.map((feature, i) => (
                        <div key={feature.id} className="howit-panel w-[90vw] md:w-[70vw] lg:w-[60vw] shrink-0 h-[min(68vh,580px)] min-h-[460px] flex items-center px-6 md:px-12">
                            <div className="relative w-full h-full rounded-[3rem] border border-border bg-card px-8 py-7 md:px-12 md:py-10 flex flex-col justify-between overflow-hidden group shadow-lg transition-all hover:border-primary/50">
                                
                                <div className={cn("absolute -top-40 -right-40 hidden md:block w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-opacity duration-700 group-hover:opacity-50 bg-gradient-to-br", feature.color)} />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6 md:mb-8">
                                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.25rem] bg-muted border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <feature.icon className={cn("h-7 w-7 md:h-8 md:w-8", feature.accent)} />
                                        </div>
                                        <span className="text-muted-foreground font-black text-5xl md:text-6xl opacity-20">0{i + 1}</span>
                                    </div>
                                    
                                    <h3 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tighter text-foreground mb-4 md:mb-5 leading-[0.95]">
                                        {feature.title}
                                    </h3>
                                    <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-3xl">
                                        {feature.desc}
                                    </p>
                                </div>

                                <div className="relative z-10 mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border/70 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-end">
                                    <div className="md:col-span-8">
                                        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">What You Get</p>
                                        <ul className="space-y-2">
                                            {feature.highlights.map((highlight) => (
                                                <li key={highlight} className="flex items-start gap-2.5 text-sm md:text-[15px] text-foreground/85 leading-snug">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="md:col-span-4 flex md:justify-end">
                                        <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 min-w-[10.5rem]">
                                            <p className="text-3xl md:text-[2.1rem] font-black tracking-tight text-primary leading-none">{feature.metric}</p>
                                            <p className="text-[11px] md:text-xs font-semibold text-muted-foreground mt-1.5">{feature.metricLabel}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="w-[20vw] shrink-0"></div>
                </div>
            </section>

            {/* Featured Modules (GSAP Stack) */}
            <section ref={showcaseContainerRef} className="relative h-screen bg-background z-20 overflow-hidden">
                <div className="absolute top-12 md:top-24 left-0 right-0 z-30 text-center px-6 pointer-events-none">
                    <h2 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-primary mb-2">Featured Modules</h2>
                    <p className="text-xl md:text-3xl font-bold tracking-tight max-w-2xl mx-auto text-foreground">Three core tools landlords use to run properties with confidence.</p>
                </div>

                {SHOWCASE_MODULES.map((mod, i) => (
                    <div 
                        key={mod.id} 
                        className="showcase-card absolute inset-0 flex items-center justify-center p-6 md:p-12 border-t border-border bg-background shadow-lg origin-top [transform:translate3d(0,0,0)] [will-change:transform]"
                        style={{ zIndex: i + 1 }}
                    >
                        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-24">
                            <div className="module-body flex flex-col">
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-2xl", mod.color, mod.shadow)}>
                                    <mod.icon className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">{mod.title}</h2>
                                <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                                    {mod.desc}
                                </p>
                                <TransitionLink
                                    href={mod.href}
                                    className="module-cta mt-8 inline-flex w-max items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-primary hover:bg-primary/20 transition-colors"
                                >
                                    Learn More
                                    <ChevronRight className="h-4 w-4" />
                                </TransitionLink>
                            </div>
                            <div className="relative h-[40vh] md:h-[60vh] w-full rounded-[2.5rem] border border-white/5 bg-white/[0.02] shadow-xl overflow-hidden flex flex-col items-center justify-center dark:bg-black/20 transition-transform duration-500 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                
                                <div className="absolute top-6 left-6 flex gap-2 z-20">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                </div>
                                
                                <mod.icon className="w-32 h-32 md:w-48 md:h-48 text-primary shadow-[0_0_80px_rgba(109,152,56,0.3)] bg-primary/10 rounded-3xl p-6 md:p-8 rotate-[8deg] transition-all duration-700 hover:rotate-0 z-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* iRis Section - Enhanced Scrollytelling */}
            <section
                ref={irisSectionRef}
                className="relative min-h-screen pt-20 md:pt-24 pb-28 md:pb-36 px-6 border-t border-border overflow-hidden z-20 bg-background perspective-1000"
                style={{ perspective: "1000px" }}
            >
                <div className="iris-glow absolute top-[30%] left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[100px] opacity-80 pointer-events-none" />
                <div className="iris-mascot absolute right-[-14rem] md:right-[-10rem] lg:right-[-7rem] top-[14%] md:top-[18%] z-0 pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element -- image-sequence animation requires direct frame swapping on a native img element */}
                    <img
                        ref={irisSequenceRef}
                        src="/assets/happy-wave/frame_0001.png"
                        alt="iRis happy wave animation"
                        className="w-[min(80vw,34rem)] h-[min(54vh,30rem)] object-contain opacity-45 [mask-image:radial-gradient(circle_at_center,black_68%,transparent_98%)]"
                        loading="eager"
                        decoding="async"
                    />
                </div>
                
                <div className="iris-inner-container relative max-w-7xl mx-auto flex flex-col items-center text-center gap-3 md:gap-4">
                    <div className="iris-header-anim inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 shadow-[0_0_20px_rgba(109,152,56,0.15)]">
                        <Sparkles className="h-4 w-4" />
                        iRis Intelligence Layer
                    </div>
                    
                    <h2 className="iris-header-anim text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] text-foreground leading-[0.95] max-w-4xl mx-auto drop-shadow-xl">
                        One assistant that
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-focus">orchestrates your day.</span>
                    </h2>
                    
                    <p className="iris-header-anim text-lg md:text-2xl text-muted-foreground font-medium mt-6 max-w-3xl leading-relaxed">
                        iRis turns your live portfolio data into clear actions, so your team moves faster without sacrificing compliance or quality.
                    </p>

                    <div className="mt-10 md:mt-14 xl:mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 w-full relative z-10" style={{ transformStyle: "preserve-3d" }}>
                        {IRIS_WORKFLOWS.map((item, idx) => (
                            <article key={item.title} className="iris-card rounded-[2rem] border border-primary/20 bg-background/60 backdrop-blur-xl px-6 py-8 shadow-2xl relative overflow-hidden group hover:border-primary/50 transition-colors h-full flex flex-col justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between gap-4 relative z-10 w-full">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
                                        <item.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <span className="text-sm font-black tracking-[0.2em] text-primary/40">0{idx + 1}</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-6 relative z-10 text-left">{item.title}</h3>
                                <p className="text-base text-muted-foreground mt-3 leading-relaxed relative z-10 text-left">{item.detail}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Outcomes Section - Enhanced Scrollytelling */}
            <section ref={outcomesSectionRef} className="relative py-32 md:py-48 px-6 z-20 overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--background),color-mix(in_oklab,var(--muted)_40%,var(--background)_60%))] border-t border-border/40">
                <div className="outcomes-glow absolute top-[20%] right-[10%] h-[35rem] w-[35rem] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start pt-10">
                    <div className="outcomes-left lg:w-1/2 lg:sticky lg:top-40">
                        <p className="outcomes-reveal text-sm font-black uppercase tracking-[0.2em] text-primary mb-5 shadow-sm">Operational Outcomes</p>
                        <h2 className="outcomes-reveal text-5xl md:text-7xl font-black tracking-[-0.03em] text-foreground leading-[0.95]">
                            Calm operations,<br/>measurable gains.
                        </h2>
                        <div className="outcomes-reveal w-20 h-1.5 bg-primary mt-8 rounded-full shadow-[0_0_15px_rgba(109,152,56,0.4)]" />
                    </div>

                    <div className="outcomes-right lg:w-1/2">
                        <div className="outcomes-right-viewport relative overflow-visible lg:overflow-hidden lg:h-[min(70vh,36rem)]">
                            <div className="outcomes-right-track grid grid-cols-1 gap-y-12 md:gap-y-16 lg:absolute lg:inset-x-0 lg:top-0">
                                {OUTCOMES.map((outcome) => (
                                    <article key={outcome.label} className="outcome-item relative pl-8 border-l-[3px] border-primary/30 py-4 bg-background/30 backdrop-blur-sm rounded-r-3xl pr-6">
                                        <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 h-0 w-[3px] bg-primary rounded-full shadow-[0_0_15px_rgba(109,152,56,0.9)]" />
                                        <div className="flex items-center gap-4 mb-3">
                                            <span className="outcome-metric-value text-6xl md:text-7xl font-black tracking-[-0.04em] text-foreground leading-none drop-shadow-md">
                                                {outcome.metric}
                                            </span>
                                            <CheckCircle2 className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mt-3 text-primary">{outcome.label}</h3>
                                        <p className="text-base md:text-lg text-muted-foreground mt-3 leading-relaxed max-w-md">{outcome.detail}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA - Enhanced Scrollytelling */}
            <section ref={ctaSectionRef} className="relative py-24 md:py-32 px-6 border-t border-border overflow-hidden z-20 bg-background perspective-[1200px]">
                <div className="cta-ambient absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(109,152,56,0.18),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
                    <p className="cta-reveal text-sm font-black uppercase tracking-[0.2em] text-primary mb-6 shadow-sm">Your Pipeline Awaits</p>
                    
                    <h2 className="cta-reveal text-6xl md:text-[7.5rem] font-black tracking-[-0.04em] text-foreground leading-[0.85] drop-shadow-2xl">
                        Build your next
                        <span className="block text-primary mt-3">growth cycle.</span>
                    </h2>
                    
                    <p className="cta-reveal text-xl md:text-3xl text-muted-foreground font-medium mt-10 max-w-3xl leading-relaxed">
                        Request access and our team will guide setup, portfolio onboarding, and your first automation workflow.
                    </p>

                    <div className="cta-reveal mt-20 w-full" style={{ perspective: "1500px" }}>
                        <div className="cta-panel-wrapper border border-primary/30 bg-card/80 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 shadow-[0_30px_80px_-15px_rgba(109,152,56,0.25)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                            <p className="text-lg text-muted-foreground mb-10 font-medium">Application review usually completes within two business days.</p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <TransitionLink href="/apply-landlord" className="group w-full sm:w-auto inline-flex items-center justify-center h-16 md:h-20 px-12 rounded-full bg-primary text-primary-foreground font-black text-xl transition-all hover:scale-105 hover:bg-primary-dark shadow-[0_0_40px_rgba(109,152,56,0.4)] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat group-hover:transition-[background-position_1.5s_ease-out] group-hover:bg-[position:200%_0,0_0]" />
                                    <span className="relative z-10 flex items-center">
                                        Request Access
                                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                    </span>
                                </TransitionLink>
                                <TransitionLink href="/demo" className="w-full sm:w-auto inline-flex items-center justify-center h-16 md:h-20 px-10 rounded-full border-2 border-border bg-card/50 text-foreground text-lg font-bold hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                    Book Walkthrough
                                </TransitionLink>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
