"use client";

import { useState } from "react";
import { X, Grid3x3, Image as ImageIcon, Maximize2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import styles from "./PhotoGalleryScreen.module.css";

// ─── Types ─────────────────────────────────────────────────
type AlbumCategory = "all" | "amenities" | "common" | "events" | "units";

interface GalleryPhoto {
    id: string;
    category: AlbumCategory;
    caption: string;
    uploader: string;
    date: string;
    /** Controls grid span to create mosaic effect */
    span: "normal" | "wide" | "tall" | "large";
    /** Accent color for placeholder */
    color: string;
    emoji: string;
}

// ─── Mock Gallery Data ──────────────────────────────────────
const PHOTOS: GalleryPhoto[] = [
    { id: "ph1",  category: "amenities", caption: "Rooftop Pool",        uploader: "PrimeCo",  date: "Apr 10", span: "large",  color: "#1e3a5f", emoji: "🏊" },
    { id: "ph2",  category: "common",    caption: "Lobby Entrance",       uploader: "Roberto",  date: "Apr 9",  span: "normal", color: "#1f3323", emoji: "🚪" },
    { id: "ph3",  category: "events",    caption: "Summer BBQ Night",     uploader: "Ana",      date: "Apr 8",  span: "wide",   color: "#3d1f1f", emoji: "🍖" },
    { id: "ph4",  category: "units",     caption: "Unit 4B - Living Room", uploader: "Skyline", date: "Apr 7",  span: "normal", color: "#2a1f3d", emoji: "🛋️" },
    { id: "ph5",  category: "amenities", caption: "Gym & Fitness Center", uploader: "PrimeCo",  date: "Apr 6",  span: "tall",   color: "#1f2d3d", emoji: "🏋️" },
    { id: "ph6",  category: "common",    caption: "Co-Working Lounge",    uploader: "Roberto",  date: "Apr 5",  span: "normal", color: "#1f3a2a", emoji: "💻" },
    { id: "ph7",  category: "events",    caption: "Move-In Day",          uploader: "Jose",     date: "Apr 4",  span: "normal", color: "#3a2a1f", emoji: "📦" },
    { id: "ph8",  category: "units",     caption: "Unit 2A - Bedroom",    uploader: "Skyline",  date: "Apr 3",  span: "wide",   color: "#2a1a2a", emoji: "🛏️" },
    { id: "ph9",  category: "amenities", caption: "Garden Terrace",       uploader: "PrimeCo",  date: "Apr 2",  span: "normal", color: "#1f3d1f", emoji: "🌿" },
    { id: "ph10", category: "common",    caption: "Mail Room",            uploader: "Roberto",  date: "Apr 1",  span: "normal", color: "#2a2a1f", emoji: "📬" },
    { id: "ph11", category: "events",    caption: "Fire Drill 2026",      uploader: "Admin",    date: "Mar 30", span: "normal", color: "#3a1f1f", emoji: "🚒" },
    { id: "ph12", category: "units",     caption: "Studio Unit Sample",   uploader: "Skyline",  date: "Mar 29", span: "tall",   color: "#1f2a3a", emoji: "🏠" },
];

const CATEGORIES: Array<{ key: AlbumCategory; label: string }> = [
    { key: "all",       label: "All" },
    { key: "amenities", label: "Amenities" },
    { key: "common",    label: "Common Areas" },
    { key: "events",    label: "Events" },
    { key: "units",     label: "Units" },
];

// ─── Lightbox Component ─────────────────────────────────────
function Lightbox({
    photo,
    photos,
    onClose,
}: {
    photo: GalleryPhoto;
    photos: GalleryPhoto[];
    onClose: () => void;
}) {
    const [current, setCurrent] = useState(photos.findIndex((p) => p.id === photo.id));
    const p = photos[current];

    const prev = () => setCurrent((c) => (c > 0 ? c - 1 : photos.length - 1));
    const next = () => setCurrent((c) => (c < photos.length - 1 ? c + 1 : 0));

    return (
        <div className={styles.lightbox} onClick={onClose}>
            <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
                {/* Close */}
                <button className={styles.lightboxClose} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Image */}
                <div
                    className={styles.lightboxImage}
                    style={{ background: p.color }}
                >
                    <span className={styles.lightboxEmoji}>{p.emoji}</span>
                </div>

                {/* Caption */}
                <div className={styles.lightboxCaption}>
                    <div className={styles.lightboxTitle}>{p.caption}</div>
                    <div className={styles.lightboxMeta}>Uploaded by {p.uploader} · {p.date}</div>
                </div>

                {/* Nav */}
                <div className={styles.lightboxNav}>
                    <button className={styles.lightboxNavBtn} onClick={prev}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className={styles.lightboxCounter}>{current + 1} / {photos.length}</span>
                    <button className={styles.lightboxNavBtn} onClick={next}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Screen ────────────────────────────────────────────
export default function PhotoGalleryScreen() {
    const [category, setCategory] = useState<AlbumCategory>("all");
    const [selected, setSelected] = useState<GalleryPhoto | null>(null);

    const visible = PHOTOS.filter((p) => category === "all" || p.category === category);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>Photo Gallery</h1>
                    <p className={styles.headerSub}>{PHOTOS.length} photos across {CATEGORIES.length - 1} albums</p>
                </div>
                <div className={styles.headerIcon}>
                    <Grid3x3 size={20} />
                </div>
            </div>


            {/* Category Pills */}
            <div className={styles.filterRow}>
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        className={`${styles.filterPill} ${category === c.key ? styles.filterPillActive : ""}`}
                        onClick={() => setCategory(c.key)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <ImageIcon size={13} className={styles.statsIcon} />
                <span>{visible.length} photos</span>
            </div>

            {/* Mosaic Grid */}
            <div className={styles.mosaic}>
                {visible.map((photo) => (
                    <div
                        key={photo.id}
                        className={`${styles.tile} ${styles[`tile_${photo.span}`]}`}
                        style={{ background: photo.color }}
                        onClick={() => setSelected(photo)}
                    >
                        {/* Emoji placeholder for image */}
                        <span className={styles.tileEmoji}>{photo.emoji}</span>

                        {/* Hover overlay */}
                        <div className={styles.tileOverlay}>
                            <Maximize2 size={16} className={styles.tileExpandIcon} />
                            <div className={styles.tileCaption}>{photo.caption}</div>
                            <div className={styles.tileUploader}>{photo.uploader} · {photo.date}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selected && (
                <Lightbox
                    photo={selected}
                    photos={visible}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}
