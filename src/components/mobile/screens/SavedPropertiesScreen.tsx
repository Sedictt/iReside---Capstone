"use client";

import { useState } from "react";
import {
    Heart,
    X,
    BedDouble,
    Bath,
    Search,
    ArrowUpDown,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { properties } from "@/lib/data";
import styles from "./SavedPropertiesScreen.module.css";

export default function SavedPropertiesScreen() {
    const { navigate } = useNavigation();

    // Mock: start with first 3 properties as "saved"
    const [savedIds, setSavedIds] = useState<string[]>(["1", "2", "4"]);

    const savedProperties = properties.filter((p) => savedIds.includes(p.id));

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
                <div className={styles.header}>
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
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.headerTitle}>Saved Properties</h1>
                    <p className={styles.headerCount}>
                        <span>{savedProperties.length}</span> saved properties
                    </p>
                </div>
                <button className={styles.sortButton}>
                    <ArrowUpDown />
                    Sort
                </button>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {savedProperties.map((property) => (
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
        </div>
    );
}
