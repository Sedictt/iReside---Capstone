"use client";

import { useState } from "react";
import {
    Heart,
    X,
    BedDouble,
    Bath,
    Search,
    ArrowUpDown,
    ArrowLeft,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { properties } from "@/lib/data";
import styles from "./SavedPropertiesScreen.module.css";

export type SortOption = "date_desc" | "match_desc" | "price_asc" | "price_desc";

export default function SavedPropertiesScreen() {
    const { navigate } = useNavigation();

    // Mock: start with first 3 properties as "saved"
    const [savedIds, setSavedIds] = useState<string[]>(["1", "2", "4"]);

    // Sort State
    const [showSortModal, setShowSortModal] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    const savedProperties = properties.filter((p) => savedIds.includes(p.id));

    // Apply Sorting
    const sortedProperties = [...savedProperties].sort((a, b) => {
        const getPrice = (str: string) => parseInt(str.replace(/[^\d]/g, "")) || 0;
        switch (sortBy) {
            case "match_desc":
                return (b.matchScore || 0) - (a.matchScore || 0);
            case "price_asc":
                return getPrice(a.price) - getPrice(b.price);
            case "price_desc":
                return getPrice(b.price) - getPrice(a.price);
            case "date_desc":
            default:
                // Mock date sort: use ID descending
                return parseInt(b.id) - parseInt(a.id);
        }
    });

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSavedIds((prev) => prev.filter((i) => i !== id));
    };

    const handlePropertyClick = (id: string) => {
        navigate("propertyDetail", { propertyId: id });
    };

    if (savedProperties.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.topBar}>
                    <button className={styles.backButton} onClick={() => navigate("tenantHome")}>
                        <ArrowLeft />
                    </button>
                    <div className={styles.actionButton}></div>
                </div>
                <div className={styles.header} style={{ paddingTop: 0 }}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.headerTitle}>Saved Properties</h1>
                    </div>
                </div>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Heart />
                    </div>
                    <h2 className={styles.emptyTitle}>No Saved Properties</h2>
                    <p className={styles.emptySub}>
                        Properties you like will appear here. Start browsing to save your
                        favorites.
                    </p>
                    <button
                        className={styles.emptyButton}
                        onClick={() => navigate("propertySearch")}
                    >
                        <Search />
                        Browse Properties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={() => navigate("tenantHome")}>
                    <ArrowLeft />
                </button>
                <div className={styles.actionButton}></div>
            </div>

            {/* Header */}
            <div className={styles.header} style={{ paddingTop: 0 }}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.headerTitle}>Saved Properties</h1>
                    <p className={styles.headerCount}>
                        <span>{savedProperties.length}</span> saved properties
                    </p>
                </div>
                <button className={styles.sortButton} onClick={() => setShowSortModal(true)}>
                    <ArrowUpDown />
                    Sort
                </button>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {sortedProperties.map((property) => (
                    <div
                        key={property.id}
                        className={styles.card}
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
                            <button
                                className={styles.removeButton}
                                onClick={(e) => handleRemove(property.id, e)}
                            >
                                <X />
                            </button>
                            {property.matchScore && (
                                <div className={styles.matchBadge}>
                                    {property.matchScore}%
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
                            <p className={styles.cardAddress}>{property.address}</p>
                            <div className={styles.cardStats}>
                                <span className={styles.cardStat}>
                                    <BedDouble />
                                    {property.beds}
                                </span>
                                <span className={styles.cardStat}>
                                    <Bath />
                                    {property.baths}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sort Modal */}
            {showSortModal && (
                <div className={styles.modalOverlay} onClick={() => setShowSortModal(false)}>
                    <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Sort By</h2>
                            <button className={styles.closeButton} onClick={() => setShowSortModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.optionsList}>
                            <button 
                                className={`${styles.optionBtn} ${sortBy === "date_desc" ? styles.optionActive : ""}`}
                                onClick={() => { setSortBy("date_desc"); setShowSortModal(false); }}
                            >
                                Date Saved (Newest First)
                            </button>
                            <button 
                                className={`${styles.optionBtn} ${sortBy === "match_desc" ? styles.optionActive : ""}`}
                                onClick={() => { setSortBy("match_desc"); setShowSortModal(false); }}
                            >
                                Match Score (Highest First)
                            </button>
                            <button 
                                className={`${styles.optionBtn} ${sortBy === "price_asc" ? styles.optionActive : ""}`}
                                onClick={() => { setSortBy("price_asc"); setShowSortModal(false); }}
                            >
                                Rent Price (Lowest to Highest)
                            </button>
                            <button 
                                className={`${styles.optionBtn} ${sortBy === "price_desc" ? styles.optionActive : ""}`}
                                onClick={() => { setSortBy("price_desc"); setShowSortModal(false); }}
                            >
                                Rent Price (Highest to Lowest)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
