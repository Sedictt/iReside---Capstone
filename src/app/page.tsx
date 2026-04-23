"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from '@/components/theme-toggle';
import { Building, ChevronRight, ArrowRight, Home, Users, BarChart3, Clock, Lock, Zap, FileText, CheckCircle2, Sparkles, Activity, LayoutDashboard, MapPin, Receipt, PieChart, MessageSquare, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { TransitionLink } from "@/components/transitions/PageTransitionProvider";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);
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
    const outcomesSectionRef = useRef<HTMLElement>(null);
    const ctaSectionRef = useRef<HTMLElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const backToTopRef = useRef<HTMLButtonElement>(null);

    // 0. Smart Header Behavior
    useGSAP(() => {
        const nav = navRef.current;
        if (!nav) return;

        let lastScroll = 0;
        const showAnim = gsap.from(nav, { 
            yPercent: -100,
            paused: true,
            duration: 0.3,
            ease: "power2.out"
        }).progress(1);

        ScrollTrigger.create({
            start: "top top",
            end: 99999,
            onUpdate: (self) => {
                const scrollY = self.scroll();
                const isScrollingDown = self.direction === 1;
                
                // Hide if scrolling down and past a small threshold
                if (isScrollingDown && scrollY > 100) {
                    showAnim.reverse();
                } else {
                    // Show if scrolling up or at the very top
                    showAnim.play();
                }
                
                lastScroll = scrollY;
            }
        });

        // Entrance Reveal
        gsap.from(nav, {
            y: -100,
            opacity: 0,
            duration: 1.2,
            ease: "expo.out",
            delay: 0.5
        });
    }, { scope: containerRef });

    // 0.5. Back to Top Progress & Visibility
    useGSAP(() => {
        const btn = backToTopRef.current;
        const progressPath = btn?.querySelector(".progress-ring-path");
        if (!btn || !progressPath) return;

        gsap.set(btn, { autoAlpha: 0, scale: 0.5, y: 40 });

        ScrollTrigger.create({
            trigger: "body",
            start: "top -100%",
            onEnter: () => gsap.to(btn, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }),
            onLeaveBack: () => gsap.to(btn, { autoAlpha: 0, scale: 0.5, y: 40, duration: 0.4, ease: "power2.in" }),
        });

        const totalLength = (progressPath as SVGPathElement).getTotalLength();
        gsap.set(progressPath, { strokeDasharray: totalLength, strokeDashoffset: totalLength });

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                const offset = totalLength - (self.progress * totalLength);
                gsap.set(progressPath, { strokeDashoffset: offset });
            }
        });
    }, { scope: containerRef });

    // 1. Showcase Stack Animation
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
                    gsap.set(moduleBodies[0], {
                        autoAlpha: firstReveal,
                        y: (1 - firstReveal) * 24,
                    });
                }
                if (moduleCtas[0]) {
                    gsap.set(moduleCtas[0], {
                        autoAlpha: firstReveal,
                        x: (1 - firstReveal) * -12,
                    });
                }

                for (let i = 1; i < cards.length; i++) {
                    const local = gsap.utils.clamp(0, 1, p - (i - 1));
                    gsap.set(cards[i], { yPercent: (1 - local) * 100 });
                    if (moduleBodies[i]) {
                        gsap.set(moduleBodies[i], {
                            autoAlpha: local,
                            y: (1 - local) * 24,
                        });
                    }
                    if (moduleCtas[i]) {
                        gsap.set(moduleCtas[i], {
                            autoAlpha: local,
                            x: (1 - local) * -12,
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

    // 2. Horizontal Scroll Features
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

        setupAnimation();
        ScrollTrigger.addEventListener("refreshInit", setupAnimation);
        return () => {
            ScrollTrigger.removeEventListener("refreshInit", setupAnimation);
            tween?.kill();
            ScrollTrigger.getById(triggerId)?.kill();
            gsap.set(wrapper, { clearProps: "transform,willChange" });
        };
    }, { scope: containerRef });

    // 3. Section Transitions (Iris, Outcomes, CTA)
    useGSAP(() => {
        const irisSection = irisSectionRef.current;
        const outcomesSection = outcomesSectionRef.current;
        const ctaSection = ctaSectionRef.current;
        if (!irisSection || !outcomesSection || !ctaSection) return;

        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            // == IRIS SECTION ANIMATION ==
            const irisGlow = irisSection.querySelector(".iris-glow");
            const irisHeaderItems = irisSection.querySelectorAll(".iris-header-anim");
            const irisCards = gsap.utils.toArray<HTMLElement>(".iris-card", irisSection);
            const irisMascot = irisSection.querySelector<HTMLElement>(".iris-mascot");
            
            gsap.set(irisHeaderItems, { autoAlpha: 0, y: 80, filter: "blur(12px)", scale: 0.94 });
            gsap.set(irisCards, { autoAlpha: 0, y: 60, x: -40, scale: 0.92, filter: "blur(8px)" });
            if (irisMascot) {
                gsap.set(irisMascot, { autoAlpha: 0, scale: 0.7, rotate: 8, x: 120, filter: "blur(20px)" });
            }

            const irisTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-iris-main",
                    trigger: irisSection,
                    start: "top top",
                    end: "+=130%",
                    pin: true,
                    scrub: 0.6,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            // Entry Phase
            irisTl.to(irisHeaderItems, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.2, ease: "expo.out" }, 0);
            if (irisMascot) {
                irisTl.to(irisMascot, { autoAlpha: 1, scale: 1, rotate: 0, x: 0, filter: "blur(0px)", duration: 1.8, ease: "elastic.out(1, 0.82)" }, 0.2);
            }
            irisTl.to(irisCards, { autoAlpha: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", duration: 1.4, stagger: 0.15, ease: "power4.out" }, 0.4);

            // Middle drift
            if (irisMascot) irisTl.to(irisMascot, { y: -25, duration: 2, ease: "sine.inOut" }, 1.2);
            irisTl.to(irisCards, { y: -30, duration: 2, ease: "power1.inOut", stagger: 0.1 }, 1.5);
            irisTl.to(irisHeaderItems, { y: -15, duration: 2, ease: "power1.inOut", stagger: 0.05 }, 1.5);

            // Outro phase
            const outroTime = 4;
            irisTl.to(irisHeaderItems, { autoAlpha: 0, y: -60, filter: "blur(10px)", scale: 0.95, duration: 0.8, stagger: 0.05, ease: "power2.in" }, outroTime);
            irisTl.to(irisCards, { autoAlpha: 0, y: -80, x: 20, filter: "blur(8px)", scale: 0.9, duration: 0.8, stagger: 0.05, ease: "power2.in" }, outroTime + 0.1);
            if (irisMascot) {
                irisTl.to(irisMascot, { autoAlpha: 0, scale: 0.8, y: -120, rotate: -5, filter: "blur(15px)", duration: 1, ease: "back.in(1.7)" }, outroTime + 0.2);
            }

            if (irisGlow) {
                gsap.to(irisGlow, { yPercent: -40, scale: 1.6, opacity: 0.25, ease: "none", scrollTrigger: { trigger: irisSection, start: "top bottom", end: "bottom top", scrub: true } });
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
            const totalPhase = introPhase + outcomeItems.length * stepPhase + 0.65;

            const outcomesTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-outcomes-story-v3",
                    trigger: outcomesSection,
                    start: "top top",
                    end: () => `+=${Math.max(window.innerHeight * 3.6, lastTrackShift + viewportHeight * 1.55)}`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 1.6,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            outcomesTl.to(outcomesHeading, { x: 0, autoAlpha: 1, duration: 0.32, stagger: 0.08, ease: "none" }, 0);
            if (outcomesLeft) outcomesTl.to(outcomesLeft, { yPercent: -6, duration: totalPhase, ease: "none" }, 0);

            outcomeItems.forEach((item, index) => {
                const metric = item.querySelector<HTMLElement>(".outcome-metric-value");
                const previous = index > 0 ? outcomeItems[index - 1] : null;
                const pos = introPhase + index * stepPhase;
                if (outcomesTrack) outcomesTl.to(outcomesTrack, { y: -trackShiftTargets[index], duration: 0.92, ease: "none" }, pos + (index === 0 ? 0 : 0.2));
                outcomesTl.to(item, { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: "none" }, pos);
                if (metric) outcomesTl.to(metric, { autoAlpha: 1, scale: 1, duration: 0.34, ease: "none" }, pos + 0.24);
                if (previous) outcomesTl.to(previous, { autoAlpha: 0.34, y: -26, scale: 0.97, duration: 0.52, ease: "none" }, pos + 0.34);
            });

            if (outcomesGlow) outcomesTl.to(outcomesGlow, { yPercent: -24, scale: 1.24, duration: totalPhase, ease: "none" }, 0);

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

            ctaTl.to(ctaReveal, { y: 0, autoAlpha: 1, scale: 1, duration: 1, stagger: 0.15, ease: "power2.out" });
            if (ctaPanelWrapper) ctaTl.to(ctaPanelWrapper, { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.2, ease: "power3.out" }, "-=0.5");
            if (ctaAmbient) {
                gsap.to(ctaAmbient, {
                    scale: 1.4, opacity: 0.8, ease: "none",
                    scrollTrigger: { trigger: ctaSection, start: "top bottom", end: "bottom top", scrub: 1.5 },
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

            gsap.fromTo(irisHeaders, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: irisSection, start: "top 80%" } });
            if (irisMascot) {
                gsap.fromTo(irisMascot, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 0.8, scale: 1, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: irisSection, start: "top 70%" } });
            }
            gsap.fromTo(irisCards, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, scrollTrigger: { trigger: irisSection, start: "top 75%" } });
            gsap.fromTo(outcomeItems, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, scrollTrigger: { trigger: outcomesSection, start: "top 75%" } });
            gsap.fromTo(ctaElems, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: ctaSection, start: "top 85%" } });
        });

        requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => mm.revert();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <style dangerouslySetInnerHTML={{__html: `
                    .ripple-background { position: absolute; inset: 0; background: transparent; overflow: hidden; z-index: -1; }
                    .ripple-circle { position: absolute; border-radius: 50%; background: var(--primary); animation: ripple 15s infinite; box-shadow: 0px 0px 1px 0px var(--primary); }
                    .ripple-small { width: 200px; height: 200px; left: -100px; bottom: -100px; }
                    .ripple-medium { width: 400px; height: 400px; left: -200px; bottom: -200px; }
                    .ripple-large { width: 600px; height: 600px; left: -300px; bottom: -300px; }
                    .ripple-xlarge { width: 800px; height: 800px; left: -400px; bottom: -400px; }
                    .ripple-xxlarge { width: 1000px; height: 1000px; left: -500px; bottom: -500px; }
                    .ripple-shade1 { opacity: 0.03; } .ripple-shade2 { opacity: 0.05; } .ripple-shade3 { opacity: 0.08; } .ripple-shade4 { opacity: 0.12; } .ripple-shade5 { opacity: 0.15; }
                    @keyframes ripple { 0% { transform: scale(0.8); } 50% { transform: scale(1.2); } 100% { transform: scale(0.8); } }
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

            <nav 
                ref={navRef}
                aria-label="Primary Navigation"
                className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-2xl"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
                    <div 
                        className="flex items-center gap-4 group cursor-pointer" 
                        onClick={() => gsap.to(window, { scrollTo: 0, duration: 1, ease: "power2.inOut" })}
                        role="button"
                        aria-label="iReside Home - Scroll to top"
                        tabIndex={0}
                        onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { gsap.to(window, { scrollTo: 0, duration: 1, ease: "power2.inOut" }); } }}
                    >
                        <Logo className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105" aria-hidden="true" />
                        <div className="flex flex-col border-l border-border/50 pl-4">
                            <span className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary leading-tight">Landlord Access</span>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        {[
                            { label: "Our Process", id: "#how-it-works" },
                            { label: "Smart Tools", id: "#features" },
                            { label: "Meet iRis", id: "#iris" },
                            { label: "Why iReside", id: "#outcomes" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => gsap.to(window, { 
                                    scrollTo: { y: item.id, autoKill: false }, 
                                    duration: 1.2, 
                                    ease: "power2.inOut" 
                                })}
                                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-tight"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4"><ThemeToggle /><TransitionLink href="/login" className="relative flex items-center gap-2 overflow-hidden group px-6 py-2.5 rounded-full border border-zinc-200 bg-muted border-border text-sm font-bold text-foreground transition-all hover:bg-muted/80 hover:border-primary/30">
                        <span className="relative z-10 hidden md:block">Access Portal</span><span className="relative z-10 md:hidden">Login</span>
                        <ChevronRight className="h-4 w-4 relative z-10 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </TransitionLink></div>
                </div>
            </nav>

            <main id="main-content">
                {/* Hero Section */}
                <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-24 pb-20 z-10" aria-labelledby="hero-title">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }} className="max-w-[70rem] mx-auto text-center w-full">
                        <h1 id="hero-title" className="text-[3.5rem] sm:text-6xl md:text-[6.5rem] lg:text-[8rem] font-black tracking-tighter leading-[0.85] mb-6 flex flex-col items-center">
                            <Logo variant="primary" className="h-[0.8em] w-[3em] mb-2" aria-label="iReside" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-primary to-primary-dark">For Rental Ops.</span>
                        </h1>
                    <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium mb-8">Run your rentals with less friction, stronger security, and predictable cash flow.</p>
                    <TransitionLink href="/signup" className="group relative inline-flex items-center justify-center h-16 px-10 rounded-full bg-primary text-primary-foreground font-black text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(109,152,56,0.3)]">
                        Request Access <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                    </TransitionLink>
                </motion.div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scroll to Explore</span>
                    <div className="w-[1px] h-10 bg-gradient-to-b from-primary/50 to-transparent" />
                </div>
            </section>

            {/* Trust Line */}
            <section className="relative py-24 px-6 bg-muted/30 border-y border-border/50 text-center z-20">
                <p className="text-2xl md:text-4xl font-black text-foreground/80">Built for landlords who value <span className="text-primary italic">control</span> and consistency.</p>
            </section>

            {/* How It Works */}
            <section id="how-it-works" ref={containerRef} className="relative h-screen z-20 overflow-hidden bg-background">
                <div ref={scrollWrapperRef} className="flex h-screen items-center w-max px-[5vw]">
                    <div className="howit-panel w-[90vw] md:w-[60vw] shrink-0 flex flex-col justify-center px-12 md:px-20">
                        <h2 className="text-5xl md:text-8xl font-black mb-8">How It<br/>Works</h2>
                        <p className="text-2xl text-muted-foreground">A simpler, calmer way to manage your portfolio.</p>
                    </div>
                    {HOW_IT_WORKS.map((feature, i) => (
                        <div key={feature.id} className="howit-panel w-[90vw] md:w-[70vw] lg:w-[60vw] shrink-0 h-[68vh] flex items-center px-6">
                            <div className="relative w-full h-full rounded-[3rem] border border-border bg-card p-10 flex flex-col justify-between overflow-hidden group shadow-lg">
                                <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 bg-gradient-to-br from-primary/20 to-transparent" />
                                <div>
                                    <div className="flex justify-between mb-8">
                                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center"><feature.icon className={cn("h-7 w-7", feature.accent)} /></div>
                                        <span className="text-muted-foreground font-black text-6xl opacity-10">0{i + 1}</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black mb-4">{feature.title}</h3>
                                    <p className="text-xl text-muted-foreground font-medium">{feature.desc}</p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <ul className="space-y-3">{feature.highlights.map(h => <li key={h} className="flex items-center gap-2 text-[15px]"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{h}</li>)}</ul>
                                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
                                        <p className="text-3xl font-black text-primary">{feature.metric}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{feature.metricLabel}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="w-[10vw] shrink-0"></div>
                </div>
            </section>

            {/* Showcase Stack */}
            <section id="features" ref={showcaseContainerRef} className="relative h-screen bg-background z-20 overflow-hidden">
                <div className="absolute top-24 left-0 right-0 z-30 text-center pointer-events-none">
                    <p className="text-sm font-black uppercase tracking-widest text-primary mb-2">Featured Modules</p>
                    <h2 className="text-3xl font-bold">Three core tools for confident management.</h2>
                </div>
                {SHOWCASE_MODULES.map((mod, i) => (
                    <div key={mod.id} className="showcase-card absolute inset-0 flex items-center justify-center p-6 bg-background border-t border-border shadow-2xl" style={{ zIndex: i + 1 }}>
                        <div className="max-w-7xl w-full flex flex-col items-center text-center mt-12">
                            <div className="module-body flex flex-col items-center">
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl", mod.color)}>
                                    <mod.icon className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{mod.title}</h2>
                                <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-8 leading-relaxed max-w-2xl">
                                    {mod.desc}
                                </p>
                                <TransitionLink href={mod.href} className="module-cta inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-8 py-4 font-black text-primary uppercase text-sm hover:bg-primary/20 transition-all">
                                    Explore Module <ChevronRight className="h-4 w-4" />
                                </TransitionLink>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* iRis Section */}
            <section id="iris" ref={irisSectionRef} className="relative h-[100svh] flex flex-col justify-center px-6 border-t border-border overflow-hidden z-20 bg-background">
                <div className="iris-glow absolute top-[30%] right-[10%] h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[100px] opacity-60 pointer-events-none" />
                <div className="relative max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="relative z-10">
                            <h2 className="iris-header-anim text-5xl md:text-7xl lg:text-[6rem] font-black tracking-[-0.04em] mb-6">Meet <span className="text-primary">iRis.</span></h2>
                            <p className="iris-header-anim text-lg md:text-xl text-muted-foreground font-medium max-w-xl mb-10">Your dedicated AI operations assistant. iRis bridges the gap between raw property signals and meaningful execution.</p>
                            <div className="grid grid-cols-1 gap-4 max-w-lg">
                                {IRIS_WORKFLOWS.map((item) => (
                                    <article key={item.title} className="iris-card rounded-2xl border border-primary/20 bg-background/50 p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><item.icon className="h-5 w-5 text-primary" /></div>
                                        <div><h3 className="text-lg font-bold">{item.title}</h3><p className="text-sm text-muted-foreground mt-1">{item.detail}</p></div>
                                    </article>
                                ))}
                            </div>
                        </div>
                        <div className="relative flex justify-center">
                            <div className="iris-mascot relative z-20">
                                <video 
                                    autoPlay loop muted playsInline 
                                    className="w-[min(88vw,32rem)] h-auto drop-shadow-2xl"
                                    title="iRis AI mascot waving happily"
                                    aria-label="3D animated mascot iRis waving friendly to the user"
                                >
                                    <source src="https://assets.masko.ai/d223fc/homey-8511/happy-wave-a656528d.webm" type="video/webm" />
                                    <source src="https://assets.masko.ai/d223fc/homey-8511/happy-wave-6358cae0.mov" type='video/mp4; codecs="hvc1"' />
                                </video>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Outcomes Section */}
            <section id="outcomes" ref={outcomesSectionRef} className="relative py-32 px-6 z-20 overflow-hidden bg-background border-t border-border/40">
                <div className="outcomes-glow absolute top-[20%] right-[10%] h-[28rem] w-[28rem] bg-primary/10 blur-[90px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
                    <div className="outcomes-left lg:w-1/2 lg:sticky lg:top-40">
                        <p className="outcomes-reveal text-sm font-black uppercase text-primary mb-5">Operational Outcomes</p>
                        <h2 className="outcomes-reveal text-5xl md:text-7xl font-black leading-tight">Calm operations,<br/>measurable gains.</h2>
                    </div>
                    <div className="outcomes-right lg:w-1/2 overflow-hidden h-[min(70vh,36rem)] relative outcomes-right-viewport">
                        <div className="grid gap-12 outcomes-right-track lg:absolute lg:inset-x-0 lg:top-0">
                            {OUTCOMES.map(o => (
                                <article key={o.label} className="outcome-item p-8 border-l-4 border-primary/30 bg-muted/20 rounded-r-3xl">
                                    <div className="flex items-center gap-4 mb-4"><span className="outcome-metric-value text-6xl font-black">{o.metric}</span><CheckCircle2 className="h-8 w-8 text-primary" /></div>
                                    <h3 className="text-2xl font-bold text-primary">{o.label}</h3><p className="text-lg text-muted-foreground mt-2">{o.detail}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section ref={ctaSectionRef} className="relative py-32 px-6 border-t border-border z-20 bg-background text-center">
                <div className="cta-ambient absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(109,152,56,0.1),transparent_70%)] pointer-events-none" />
                <div className="max-w-4xl mx-auto">
                    <p className="cta-reveal text-sm font-black uppercase text-primary mb-6 tracking-widest">Your Pipeline Awaits</p>
                    <h2 className="cta-reveal text-5xl md:text-8xl font-black leading-[0.9]">Build your next<span className="block text-primary mt-4">growth cycle.</span></h2>
                    <div className="cta-reveal mt-20 cta-panel-wrapper border border-border bg-card p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <p className="text-xl text-muted-foreground mb-10">Application review usually completes within two business days.</p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <TransitionLink href="/signup" className="h-20 px-12 rounded-full bg-primary text-white font-black text-xl flex items-center justify-center hover:scale-105 transition-transform">Request Access <ArrowRight className="ml-3 h-6 w-6" /></TransitionLink>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unique Back to Top Button */}
            <button
                ref={backToTopRef}
                onClick={() => {
                    const arrow = backToTopRef.current?.querySelector(".arrow-icon");
                    if (arrow) {
                        gsap.to(arrow, { 
                            y: -40, opacity: 0, duration: 0.3, ease: "power2.in",
                            onComplete: () => {
                                gsap.set(arrow, { y: 20 });
                                gsap.to(arrow, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)", delay: 0.8 });
                            }
                        });
                    }
                    gsap.to(window, { scrollTo: 0, duration: 1.5, ease: "power4.inOut" });
                }}
                className="fixed bottom-10 right-10 z-[100] group flex items-center justify-center h-16 w-16 rounded-full bg-background/40 backdrop-blur-md border border-primary/20 shadow-2xl transition-transform hover:scale-110 active:scale-95 overflow-visible"
                aria-label="Scroll to top"
            >
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-full bg-primary/10 scale-100 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                
                {/* SVG Progress Ring */}
                <svg className="absolute inset-[-4px] -rotate-90 pointer-events-none" width="72" height="72" viewBox="0 0 100 100">
                    <circle 
                        className="text-muted/10" 
                        stroke="currentColor" strokeWidth="4" fill="transparent" r="46" cx="50" cy="50" 
                    />
                    <path 
                        className="progress-ring-path text-primary drop-shadow-[0_0_8px_rgba(109,152,56,0.6)]"
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="transparent"
                        d="M 50,50 m -46,0 a 46,46 0 1,0 92,0 a 46,46 0 1,0 -92,0"
                    />
                </svg>

                {/* Fun Icon Container */}
                <div className="relative z-10 flex flex-col items-center">
                    <ArrowRight className="arrow-icon h-6 w-6 -rotate-90 text-primary transition-colors group-hover:text-primary-dark" />
                    <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Top</span>
                    </div>
                </div>

                {/* Particle Glow */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
            </button>
            {/* Premium Footer */}
            <footer className="relative pt-32 pb-16 px-6 border-t border-border bg-card z-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,152,56,0.08),transparent_60%)] pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-32">
                        <div className="flex flex-col gap-10 col-span-1 lg:col-span-1">
                            <div className="flex flex-col gap-5">
                                <Logo className="h-10 w-auto" />
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">Systems Operational</span>
                                </div>
                            </div>
                            <p className="text-muted-foreground text-[17px] font-medium leading-relaxed">
                                Reimagining rental operations with intelligent workflows and a calm, centered experience for modern portfolios.
                            </p>
                            <div className="flex items-center gap-3">
                                {[Github, Mail].map((Icon, i) => (
                                    <a key={i} href="#" className="h-12 w-12 rounded-2xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm">
                                        <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 lg:col-span-3">
                            <div className="flex flex-col gap-8">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40">Platform Modules</h4>
                                <ul className="flex flex-col gap-6">
                                    {[
                                        { name: "Portfolio Map", href: "/modules/unit-map" },
                                        { name: "Maintenance Ops", href: "/landlord/maintenance" },
                                        { name: "Financials", href: "/modules/financials" },
                                        { name: "Tenant Screening", href: "/apply" }
                                    ].map(link => (
                                        <li key={link.name}>
                                            <TransitionLink href={link.href} className="text-[15px] font-bold text-muted-foreground hover:text-primary transition-all flex items-center gap-3 group">
                                                <div className="w-1.5 h-px bg-primary/30 group-hover:w-4 transition-all" />
                                                {link.name}
                                            </TransitionLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex flex-col gap-8">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40">Company</h4>
                                <ul className="flex flex-col gap-6">
                                    {[
                                        { name: "About iReside", href: "#" },
                                        { name: "Documentation", href: "#" },
                                        { name: "FAQs", href: "#" },
                                        { name: "Contact Support", href: "mailto:support@ireside.ai" }
                                    ].map(link => (
                                        <li key={link.name}>
                                            <a href={link.href} className="text-[15px] font-bold text-muted-foreground hover:text-primary transition-all hover:translate-x-1 inline-block">
                                                {link.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                            <p className="text-[13px] font-bold text-muted-foreground/60">© 2026 iReside Technologies Inc.</p>
                            <div className="flex items-center gap-8 text-[13px] font-bold text-muted-foreground/80">
                                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm group cursor-default shadow-sm hover:border-primary/40 transition-colors">
                            <div className="relative">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                <div className="absolute inset-0 bg-primary blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Powered by iRis AI</span>
                                <span className="text-[9px] font-extrabold text-primary/50 uppercase tracking-[0.1em]">Intelligence Engine v2.4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            </main>
        </div>
    );
}
