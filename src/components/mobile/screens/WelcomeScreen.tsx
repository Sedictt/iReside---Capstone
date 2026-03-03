"use client";

import { useState, useRef, TouchEvent } from "react";
import { MapPin, FileSignature, CreditCard, ArrowRight, ChevronRight } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./WelcomeScreen.module.css";

// ─── Slide Data ────────────────────────────────────────────
const SLIDES = [
    {
        icon: MapPin,
        color: "green" as const,
        title: "Find Your Perfect Home",
        description:
            "Browse nearby rental properties on an interactive map. Filter by price, amenities, and location to find exactly what you need.",
    },
    {
        icon: FileSignature,
        color: "blue" as const,
        title: "Apply & Sign Digitally",
        description:
            "Submit rental applications and sign lease agreements right from your phone — no paperwork, no hassle.",
    },
    {
        icon: CreditCard,
        color: "amber" as const,
        title: "Pay Rent Easily",
        description:
            "Pay via GCash or in-person with real-time tracking. Get instant receipts and never miss a due date.",
    },
];

export default function WelcomeScreen() {
    const { navigate } = useNavigation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);

    const isLastSlide = currentSlide === SLIDES.length - 1;

    // ─── Touch Handlers ────────────────────────────────────
    const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        touchCurrentX.current = e.touches[0].clientX;
        const diff = touchCurrentX.current - touchStartX.current;
        setDragOffset(diff);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const threshold = 60;

        if (dragOffset < -threshold && currentSlide < SLIDES.length - 1) {
            setCurrentSlide((prev) => prev + 1);
        } else if (dragOffset > threshold && currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
        }

        setDragOffset(0);
    };

    // ─── Actions ───────────────────────────────────────────
    const handleNext = () => {
        if (isLastSlide) {
            navigate("login");
        } else {
            setCurrentSlide((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        navigate("login");
    };

    // ─── Track Position ────────────────────────────────────
    const translateX = -(currentSlide * 100) + (dragOffset / 393) * 100;

    return (
        <div className={styles.container}>
            {/* Skip Button */}
            <button className={styles.skipButton} onClick={handleSkip}>
                Skip
            </button>

            {/* Slides */}
            <div
                className={styles.slidesArea}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={`${styles.slidesTrack} ${isDragging ? styles.dragging : ""}`}
                    style={{ transform: `translateX(${translateX}%)` }}
                >
                    {SLIDES.map((slide, index) => {
                        const Icon = slide.icon;
                        return (
                            <div className={styles.slide} key={index}>
                                {/* Illustration */}
                                <div className={styles.illustrationArea}>
                                    <div className={`${styles.illustrationBg} ${styles[slide.color]}`} />
                                    <div className={styles.illustrationRing} />

                                    {/* Floating accent dots */}
                                    <div className={`${styles.floatingDot} ${styles.dot1} ${styles[slide.color]}`} />
                                    <div className={`${styles.floatingDot} ${styles.dot2} ${styles[slide.color]}`} />
                                    <div className={`${styles.floatingDot} ${styles.dot3} ${styles[slide.color]}`} />

                                    <div className={`${styles.illustrationIcon} ${styles[slide.color]}`}>
                                        <Icon />
                                    </div>
                                </div>

                                {/* Text */}
                                <div className={styles.slideTextArea}>
                                    <h2 className={styles.slideTitle}>{slide.title}</h2>
                                    <p className={styles.slideDescription}>{slide.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom: Dots + Button */}
            <div className={styles.bottomArea}>
                {/* Dot Indicators */}
                <div className={styles.dotsRow}>
                    {SLIDES.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.dot} ${currentSlide === index ? styles.dotActive : ""}`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    className={`${styles.ctaButton} ${styles.ctaPrimary}`}
                    onClick={handleNext}
                >
                    {isLastSlide ? (
                        <>
                            Get Started
                            <ArrowRight />
                        </>
                    ) : (
                        <>
                            Next
                            <ChevronRight />
                        </>
                    )}
                </button>

                {/* Login Link */}
                <p className={styles.loginLink}>
                    Already have an account?{" "}
                    <span onClick={() => navigate("login")}>Log In</span>
                </p>
            </div>
        </div>
    );
}
