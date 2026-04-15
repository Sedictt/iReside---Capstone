import sys
import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Replace the GSAP hook
old_gsap_start = text.find('    useGSAP(() => {\n        const irisSection = irisSectionRef.current;')
old_gsap_end = text.find('        return () => {\n            mm.revert();\n        };\n    }, []);\n\n    return (')

new_gsap = """    useGSAP(() => {
        const irisSection = irisSectionRef.current;
        const outcomesSection = outcomesSectionRef.current;
        const ctaSection = ctaSectionRef.current;
        if (!irisSection || !outcomesSection || !ctaSection) return;

        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
            // == IRIS SECTION ANIMATION ==
            const irisGlow = irisSection.querySelector(".iris-glow");
            const irisHeader = irisSection.querySelectorAll(".iris-header-anim");
            const irisCards = gsap.utils.toArray<HTMLElement>(".iris-card", irisSection);
            
            // Set initial state
            gsap.set(irisHeader, { autoAlpha: 0, y: 100, rotateX: 20 });
            gsap.set(irisCards, { autoAlpha: 0, y: 300, scale: 0.8, rotateZ: () => gsap.utils.random(-15, 15) });
            
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
            const outcomeItems = gsap.utils.toArray<HTMLElement>(".outcome-item", outcomesSection);
            const outcomesGlow = outcomesSection.querySelector(".outcomes-glow");
            const outcomesMetrics = outcomesSection.querySelectorAll(".outcome-metric-value");

            gsap.set(outcomesHeading, { autoAlpha: 0, x: -80 });
            gsap.set(outcomeItems, { autoAlpha: 0, x: 100, scale: 0.95 });
            gsap.set(outcomesMetrics, { autoAlpha: 0, scale: 0.5 });

            const outcomesTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-outcomes-story-v2",
                    trigger: outcomesSection,
                    start: "top top",
                    end: "+=160%",
                    pin: true,
                    scrub: 1.1,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            // Horizontal slide-in for header
            outcomesTl.to(outcomesHeading, {
                x: 0,
                autoAlpha: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
            });

            // Items slide in from the right
            outcomesTl.to(outcomeItems, {
                x: 0,
                autoAlpha: 1,
                scale: 1,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out",
            }, "-=0.3");

            // Metrics pop effect
            outcomesTl.to(outcomesMetrics, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "elastic.out(1.5, 0.5)",
            }, "-=0.8");

            // Final cohesive drift upwards
            outcomesTl.to(outcomeItems, {
                y: -15,
                duration: 1,
                ease: "none",
            });

            if (outcomesGlow) {
                gsap.to(outcomesGlow, {
                    yPercent: -30,
                    scale: 1.2,
                    ease: "none",
                    scrollTrigger: {
                        trigger: outcomesSection,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1.3,
                    },
                });
            }

            // == CTA SECTION ANIMATION ==
            const ctaReveal = gsap.utils.toArray<HTMLElement>(".cta-reveal", ctaSection);
            const ctaPanelWrapper = ctaSection.querySelector(".cta-panel-wrapper");
            const ctaAmbient = ctaSection.querySelector(".cta-ambient");

            gsap.set(ctaReveal, { autoAlpha: 0, y: 60, scale: 0.9 });
            if (ctaPanelWrapper) gsap.set(ctaPanelWrapper, { autoAlpha: 0, y: 150, rotateX: 15 });

            const ctaTl = gsap.timeline({
                scrollTrigger: {
                    id: "landing-cta-story-v2",
                    trigger: ctaSection,
                    start: "top 60%", // start animation when top hits 60% of viewport
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
        mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
            const irisHeaders = gsap.utils.toArray<HTMLElement>(".iris-header-anim", irisSection);
            const irisCards = gsap.utils.toArray<HTMLElement>(".iris-card", irisSection);
            const outcomeItems = gsap.utils.toArray<HTMLElement>(".outcome-item", outcomesSection);
            const ctaElems = gsap.utils.toArray<HTMLElement>(".cta-reveal, .cta-panel-wrapper", ctaSection);

            gsap.fromTo(irisHeaders, { autoAlpha: 0, y: 30 }, {
                autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1,
                scrollTrigger: { trigger: irisSection, start: "top 80%" },
            });

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
        
        return () => {
            mm.revert();
        };
    }, []);

    return ("""

if old_gsap_start != -1 and old_gsap_end != -1:
    text = text[:old_gsap_start] + new_gsap + text[old_gsap_end + len('        return () => {\n            mm.revert();\n        };\n    }, []);\n\n    return ('):]
else:
    print("Could not find GSAP block")
    sys.exit(1)


# 2. Replace the JSX sections
old_jsx_start = text.find('            {/* iRis Section */}')
old_jsx_end = text.find('        </div>\n    );\n}')

new_jsx = """            {/* iRis Section - Enhanced Scrollytelling */}
            <section
                ref={irisSectionRef}
                className="relative min-h-[120vh] py-24 md:py-32 px-6 border-t border-border overflow-hidden z-20 bg-background perspective-1000"
                style={{ perspective: "1000px" }}
            >
                <div className="iris-glow absolute top-[30%] left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[100px] opacity-80 pointer-events-none" />
                
                <div className="iris-inner-container relative max-w-7xl mx-auto flex flex-col items-center text-center">
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

                    <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 w-full relative z-10" style={{ transformStyle: "preserve-3d" }}>
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
                    <div className="lg:w-1/2 lg:sticky lg:top-40">
                        <p className="outcomes-reveal text-sm font-black uppercase tracking-[0.2em] text-primary mb-5 shadow-sm">Operational Outcomes</p>
                        <h2 className="outcomes-reveal text-5xl md:text-7xl font-black tracking-[-0.03em] text-foreground leading-[0.95]">
                            Calm operations,<br/>measurable gains.
                        </h2>
                        <div className="outcomes-reveal w-20 h-1.5 bg-primary mt-8 rounded-full shadow-[0_0_15px_rgba(109,152,56,0.4)]" />
                    </div>

                    <div className="lg:w-1/2 grid grid-cols-1 gap-y-12 md:gap-y-16">
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
            </section>

            {/* Final CTA - Enhanced Scrollytelling */}
            <section ref={ctaSectionRef} className="relative py-40 md:py-56 px-6 border-t border-border overflow-hidden z-20 bg-background perspective-[1200px]">
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
}"""

if old_jsx_start != -1 and old_jsx_end != -1:
    text = text[:old_jsx_start] + new_jsx + text[old_jsx_end + len('        </div>\n    );\n}'):]
else:
    print("Could not find JSX block")
    sys.exit(1)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Page.tsx successfully updated with advanced GSAP animations.")