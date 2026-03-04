"use client";

import { useState, useRef, TouchEvent } from "react";
import {
    ArrowLeft,
    Heart,
    Share2,
    MapPin,
    BedDouble,
    Bath,
    Maximize2,
    Send,
    AlertCircle,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { properties, amenitiesList } from "@/lib/data";
import styles from "./PropertyDetailScreen.module.css";

export default function PropertyDetailScreen() {
    const { goBack, screenParams, navigate } = useNavigation();
    const [isLiked, setIsLiked] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartX = useRef(0);

    // Find the property from params
    const propertyId = screenParams.propertyId as string;
    const property = properties.find((p) => p.id === propertyId);

    if (!property) {
        return (
            <div className={styles.container}>
                <div className={styles.imageNav}>
                    <button className={styles.navButton} onClick={goBack}>
                        <ArrowLeft />
                    </button>
                </div>
            </div>
        );
    }

    const images = property.images;
    const totalImages = images.length;

    // ─── Touch Handlers for Image Carousel ─────────────────
    const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - touchStartX.current;
        setDragOffset(diff);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const threshold = 50;
        if (dragOffset < -threshold && currentImage < totalImages - 1) {
            setCurrentImage((prev) => prev + 1);
        } else if (dragOffset > threshold && currentImage > 0) {
            setCurrentImage((prev) => prev - 1);
        }
        setDragOffset(0);
    };

    const imageTranslateX =
        -(currentImage * 100) + (dragOffset / 393) * 100;

    // Match amenity names to icons
    const getAmenityIcon = (name: string) => {
        const found = amenitiesList.find((a) => a.name === name);
        return found ? found.icon : null;
    };

    return (
        <div className={styles.container}>
            {/* Scrollable Content */}
            <div className={styles.scrollArea}>
                {/* Image Carousel */}
                <div className={styles.imageArea}>
                    <div className={styles.imageOverlay} />

                    {/* Nav Buttons */}
                    <div className={styles.imageNav}>
                        <button className={styles.navButton} onClick={goBack}>
                            <ArrowLeft />
                        </button>
                        <div className={styles.navRight}>
                            <button
                                className={`${styles.navButton} ${isLiked ? styles.liked : ""}`}
                                onClick={() => setIsLiked(!isLiked)}
                            >
                                <Heart fill={isLiked ? "currentColor" : "none"} />
                            </button>
                            <button className={styles.navButton}>
                                <Share2 />
                            </button>
                        </div>
                    </div>

                    {/* Image Track */}
                    <div
                        className={`${styles.imageTrack} ${isDragging ? styles.dragging : ""}`}
                        style={{ transform: `translateX(${imageTranslateX}%)` }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {images.map((src, i) => (
                            <div key={i} className={styles.imageSlide}>
                                <img src={src} alt={`${property.name} - ${i + 1}`} />
                            </div>
                        ))}
                    </div>

                    {/* Dots */}
                    {totalImages > 1 && (
                        <div className={styles.imageDots}>
                            {images.map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.imageDot} ${currentImage === i ? styles.imageDotActive : ""
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Counter */}
                    {totalImages > 1 && (
                        <div className={styles.imageCounter}>
                            {currentImage + 1}/{totalImages}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Price */}
                    <div className={styles.priceRow}>
                        <div>
                            <span className={styles.price}>{property.price}</span>
                            <span className={styles.priceMonth}>/month</span>
                        </div>
                        {property.matchScore && (
                            <span className={styles.matchBadge}>
                                {property.matchScore}% Match
                            </span>
                        )}
                    </div>

                    {/* Name & Address */}
                    <h1 className={styles.propertyName}>{property.name}</h1>
                    <p className={styles.address}>
                        <MapPin />
                        {property.address}
                    </p>

                    {/* Stats */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{property.beds}</div>
                            <div className={styles.statLabel}>Beds</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{property.baths}</div>
                            <div className={styles.statLabel}>Baths</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{property.sqft}</div>
                            <div className={styles.statLabel}>Sqft</div>
                        </div>
                    </div>

                    {/* Type Badge */}
                    {property.type && (
                        <span className={styles.typeBadge}>{property.type}</span>
                    )}

                    {/* Description */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Description</h2>
                        <p
                            className={`${styles.description} ${!showFullDesc ? styles.descriptionClamped : ""
                                }`}
                        >
                            {property.description}
                        </p>
                        {property.description.length > 100 && (
                            <button
                                className={styles.readMore}
                                onClick={() => setShowFullDesc(!showFullDesc)}
                            >
                                {showFullDesc ? "Show Less" : "Read More"}
                            </button>
                        )}
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Amenities</h2>
                            <div className={styles.amenitiesGrid}>
                                {property.amenities.map((amenity) => {
                                    const Icon = getAmenityIcon(amenity);
                                    return (
                                        <div key={amenity} className={styles.amenityItem}>
                                            <div className={styles.amenityIcon}>
                                                {Icon ? <Icon /> : <AlertCircle />}
                                            </div>
                                            <span className={styles.amenityName}>{amenity}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* House Rules */}
                    {property.houseRules.length > 0 && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>House Rules</h2>
                            <div className={styles.rulesList}>
                                {property.houseRules.map((rule) => (
                                    <div key={rule} className={styles.ruleItem}>
                                        <div className={styles.ruleIcon}>
                                            <AlertCircle />
                                        </div>
                                        {rule}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Apply Button */}
            <div className={styles.stickyFooter}>
                <button
                    className={styles.applyButton}
                    onClick={() => navigate("applicationForm", { propertyId: property.id })}
                >
                    <Send />
                    Apply Now
                </button>
            </div>
        </div>
    );
}
