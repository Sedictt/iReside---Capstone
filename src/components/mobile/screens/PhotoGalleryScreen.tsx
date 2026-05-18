"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import styles from "./PhotoGalleryScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

type AlbumCategory = "all" | "amenities" | "common" | "events" | "units";

const CATEGORIES: Array<{ key: AlbumCategory; label: string }> = [
    { key: "all",       label: "All" },
    { key: "amenities", label: "Amenities" },
    { key: "common",    label: "Common Areas" },
    { key: "events",    label: "Events" },
    { key: "units",     label: "Units" },
];

export default function PhotoGalleryScreen() {
    const [activeCategory, setActiveCategory] = useState<AlbumCategory>("all");

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Photo Gallery</h1>
                <p className={styles.headerSub}>Browse photos of the property and community.</p>
            </div>

            {/* Category Filters */}
            <div className={styles.filterRow}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        className={`${styles.filterChip} ${activeCategory === cat.key ? styles.activeChip : ""}`}
                        onClick={() => setActiveCategory(cat.key)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className={styles.scrollArea}>
                <EmptyState
                    icon={ImageIcon}
                    title="No photos yet"
                    description="When property and community photos are uploaded, they will appear here."
                />
            </div>
        </div>
    );
}
