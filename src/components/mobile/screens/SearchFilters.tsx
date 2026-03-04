"use client";

import { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import styles from "./SearchFilters.module.css";

// ─── Types ─────────────────────────────────────────────────
export interface FilterState {
    priceMin: string;
    priceMax: string;
    propertyTypes: string[];
    bedrooms: string;
    amenities: string[];
}

const INITIAL_FILTERS: FilterState = {
    priceMin: "",
    priceMax: "",
    propertyTypes: [],
    bedrooms: "Any",
    amenities: [],
};

const PROPERTY_TYPES = ["Apartment", "Condo", "House", "Townhouse", "Studio"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const AMENITY_OPTIONS = [
    "WiFi",
    "Parking",
    "Air Con",
    "Pool",
    "Gym",
    "Security",
    "Laundry",
    "Kitchen",
    "Elevator",
    "Pet Friendly",
    "Balcony",
    "Cable TV",
];

interface SearchFiltersProps {
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters?: FilterState;
}

export default function SearchFilters({
    onClose,
    onApply,
    initialFilters,
}: SearchFiltersProps) {
    const [filters, setFilters] = useState<FilterState>(
        initialFilters || INITIAL_FILTERS
    );

    // ─── Helpers ───────────────────────────────────────────
    const togglePropertyType = (type: string) => {
        setFilters((prev) => ({
            ...prev,
            propertyTypes: prev.propertyTypes.includes(type)
                ? prev.propertyTypes.filter((t) => t !== type)
                : [...prev.propertyTypes, type],
        }));
    };

    const toggleAmenity = (amenity: string) => {
        setFilters((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((a) => a !== amenity)
                : [...prev.amenities, amenity],
        }));
    };

    const activeFilterCount =
        (filters.priceMin ? 1 : 0) +
        (filters.priceMax ? 1 : 0) +
        filters.propertyTypes.length +
        (filters.bedrooms !== "Any" ? 1 : 0) +
        filters.amenities.length;

    const handleReset = () => setFilters(INITIAL_FILTERS);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            <div className={styles.overlay} onClick={onClose} />

            {/* Sheet */}
            <div className={styles.sheet}>
                {/* Drag Handle */}
                <div className={styles.handleArea}>
                    <div className={styles.handle} />
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.headerTitle}>Filters</h2>
                    {activeFilterCount > 0 && (
                        <button className={styles.resetButton} onClick={handleReset}>
                            Reset All
                        </button>
                    )}
                </div>

                {/* Scrollable Body */}
                <div className={styles.body}>
                    {/* Price Range */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Price Range (₱/month)</p>
                        <div className={styles.priceRow}>
                            <div className={styles.priceInput}>
                                <span className={styles.pricePrefix}>₱</span>
                                <input
                                    className={styles.priceField}
                                    type="number"
                                    placeholder="Min"
                                    value={filters.priceMin}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            priceMin: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <span className={styles.priceDash}>—</span>
                            <div className={styles.priceInput}>
                                <span className={styles.pricePrefix}>₱</span>
                                <input
                                    className={styles.priceField}
                                    type="number"
                                    placeholder="Max"
                                    value={filters.priceMax}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            priceMax: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Type */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Property Type</p>
                        <div className={styles.chipGrid}>
                            {PROPERTY_TYPES.map((type) => (
                                <button
                                    key={type}
                                    className={`${styles.chip} ${filters.propertyTypes.includes(type)
                                            ? styles.chipActive
                                            : ""
                                        }`}
                                    onClick={() => togglePropertyType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bedrooms */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Bedrooms</p>
                        <div className={styles.numberRow}>
                            {BEDROOM_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    className={`${styles.numberButton} ${filters.bedrooms === opt ? styles.numberActive : ""
                                        }`}
                                    onClick={() =>
                                        setFilters((prev) => ({ ...prev, bedrooms: opt }))
                                    }
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Amenities</p>
                        <div className={styles.amenityGrid}>
                            {AMENITY_OPTIONS.map((amenity) => {
                                const isActive = filters.amenities.includes(amenity);
                                return (
                                    <div
                                        key={amenity}
                                        className={`${styles.amenityItem} ${isActive ? styles.amenityActive : ""
                                            }`}
                                        onClick={() => toggleAmenity(amenity)}
                                    >
                                        <div
                                            className={`${styles.amenityCheck} ${isActive ? styles.amenityCheckActive : ""
                                                }`}
                                        >
                                            {isActive && <Check />}
                                        </div>
                                        <span className={styles.amenityLabel}>{amenity}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Apply Button */}
                <div className={styles.footer}>
                    <button className={styles.applyButton} onClick={handleApply}>
                        <SlidersHorizontal />
                        Apply Filters
                        {activeFilterCount > 0 && (
                            <span className={styles.activeCount}>{activeFilterCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
