"use client";

import { useState, useMemo } from "react";
import {
    Search,
    SlidersHorizontal,
    Map,
    List,
    Heart,
    MapPin,
    BedDouble,
    Bath,
    Maximize2,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { properties } from "@/lib/data";
import styles from "./PropertySearchScreen.module.css";

type ViewMode = "list" | "map";

export default function PropertySearchScreen() {
    const { navigate } = useNavigation();
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

    // Filter properties based on search query
    const filteredProperties = useMemo(() => {
        if (!searchQuery.trim()) return properties;
        const q = searchQuery.toLowerCase();
        return properties.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.address.toLowerCase().includes(q) ||
                p.type?.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const toggleLike = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLikedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handlePropertyClick = (id: string) => {
        navigate("propertyDetail", { propertyId: id });
    };

    return (
        <div className={styles.container}>
            {/* Search Header */}
            <div className={styles.searchHeader}>
                <div className={styles.searchRow}>
                    <div className={styles.searchBar}>
                        <Search />
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Search location, property..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className={styles.filterButton}>
                        <SlidersHorizontal />
                    </button>
                </div>
            </div>

            {/* View Toggle */}
            <div className={styles.toggleRow}>
                <button
                    className={`${styles.toggleButton} ${viewMode === "list" ? styles.toggleActive : ""
                        }`}
                    onClick={() => setViewMode("list")}
                >
                    <List />
                    List
                </button>
                <button
                    className={`${styles.toggleButton} ${viewMode === "map" ? styles.toggleActive : ""
                        }`}
                    onClick={() => setViewMode("map")}
                >
                    <Map />
                    Map
                </button>
            </div>

            {/* Result Count */}
            <div className={styles.resultCount}>
                <span>{filteredProperties.length}</span> properties found
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {viewMode === "list" ? (
                    <div className={styles.listView}>
                        {filteredProperties.map((property) => (
                            <div
                                key={property.id}
                                className={styles.propertyCard}
                                onClick={() => handlePropertyClick(property.id)}
                            >
                                {/* Image */}
                                <div className={styles.cardImageArea}>
                                    <img
                                        className={styles.cardImage}
                                        src={property.images[0]}
                                        alt={property.name}
                                        loading="lazy"
                                    />

                                    {/* Badges */}
                                    <div className={styles.cardBadges}>
                                        {property.isNew && (
                                            <span className={`${styles.cardBadge} ${styles.badgeNew}`}>
                                                New
                                            </span>
                                        )}
                                        {property.featured && (
                                            <span
                                                className={`${styles.cardBadge} ${styles.badgeFeatured}`}
                                            >
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    {/* Like Button */}
                                    <button
                                        className={`${styles.likeButton} ${likedIds.has(property.id) ? styles.liked : ""
                                            }`}
                                        onClick={(e) => toggleLike(property.id, e)}
                                    >
                                        <Heart
                                            fill={likedIds.has(property.id) ? "currentColor" : "none"}
                                        />
                                    </button>

                                    {/* Match Score */}
                                    {property.matchScore && (
                                        <div className={styles.matchScore}>
                                            {property.matchScore}% Match
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className={styles.cardBody}>
                                    <div className={styles.cardPrice}>
                                        {property.price}
                                        <span className={styles.cardPriceMonth}>/mo</span>
                                    </div>
                                    <h3 className={styles.cardName}>{property.name}</h3>
                                    <p className={styles.cardAddress}>
                                        <MapPin />
                                        {property.address}
                                    </p>
                                    <div className={styles.cardStats}>
                                        <span className={styles.cardStat}>
                                            <BedDouble />
                                            {property.beds} Beds
                                        </span>
                                        <span className={styles.cardStat}>
                                            <Bath />
                                            {property.baths} Baths
                                        </span>
                                        <span className={styles.cardStat}>
                                            <Maximize2 />
                                            {property.sqft} sqft
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.mapView}>
                        <div className={styles.mapPlaceholder}>
                            <Map />
                            <span className={styles.mapPlaceholderText}>
                                Map view — coming in a future update
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
