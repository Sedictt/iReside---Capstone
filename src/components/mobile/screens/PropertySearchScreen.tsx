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
import { properties, Property } from "@/lib/data";
import SearchFilters, { FilterState } from "./SearchFilters";
import styles from "./PropertySearchScreen.module.css";

type ViewMode = "list" | "map";

export default function PropertySearchScreen() {
    const { navigate } = useNavigation();
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        priceMin: "",
        priceMax: "",
        propertyTypes: [],
        bedrooms: "Any",
        amenities: [],
    });

    // Count active filters
    const activeFilterCount =
        (filters.priceMin ? 1 : 0) +
        (filters.priceMax ? 1 : 0) +
        filters.propertyTypes.length +
        (filters.bedrooms !== "Any" ? 1 : 0) +
        filters.amenities.length;

    // Filter properties based on search query and filters
    const filteredProperties = useMemo(() => {
        let result: Property[] = properties;

        // Text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.address.toLowerCase().includes(q) ||
                    p.type?.toLowerCase().includes(q)
            );
        }

        // Price range
        if (filters.priceMin) {
            result = result.filter((p) => p.numericPrice >= Number(filters.priceMin));
        }
        if (filters.priceMax) {
            result = result.filter((p) => p.numericPrice <= Number(filters.priceMax));
        }

        // Property type
        if (filters.propertyTypes.length > 0) {
            result = result.filter((p) => p.type && filters.propertyTypes.includes(p.type));
        }

        // Bedrooms
        if (filters.bedrooms !== "Any") {
            const beds = filters.bedrooms === "4+" ? 4 : Number(filters.bedrooms);
            result = result.filter((p) =>
                filters.bedrooms === "4+" ? p.beds >= beds : p.beds === beds
            );
        }

        // Amenities
        if (filters.amenities.length > 0) {
            result = result.filter((p) =>
                filters.amenities.every((a) => p.amenities.includes(a))
            );
        }

        return result;
    }, [searchQuery, filters]);

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
                    <button
                        className={styles.filterButton}
                        onClick={() => setShowFilters(true)}
                    >
                        <SlidersHorizontal />
                        {activeFilterCount > 0 && (
                            <div className={styles.filterBadge} />
                        )}
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

            {/* Filters Bottom Sheet */}
            {showFilters && (
                <SearchFilters
                    onClose={() => setShowFilters(false)}
                    onApply={setFilters}
                    initialFilters={filters}
                />
            )}
        </div>
    );
}
