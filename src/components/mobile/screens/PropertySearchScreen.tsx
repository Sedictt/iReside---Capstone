"use client";

import { useState } from "react";
import { 
    Search, 
    SlidersHorizontal, 
    MapPin, 
    ArrowLeft,
    BedDouble,
    Bath,
    Square,
    Heart,
    Star,
    List,
    Map as MapIcon
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./PropertySearchScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_PROPERTIES = [
    {
        id: "prop1",
        title: "Modern Studio in Skyline Lofts",
        address: "Maysan, Valenzuela",
        price: "₱15,000",
        rating: 4.8,
        beds: 1,
        baths: 1,
        sqft: 28,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
        isSaved: false
    },
    {
        id: "prop2",
        title: "Cozy 2BR at Dalandanan Residences",
        address: "Dalandanan, Valenzuela",
        price: "₱22,000",
        rating: 4.5,
        beds: 2,
        baths: 1,
        sqft: 45,
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
        isSaved: true
    },
    {
        id: "prop3",
        title: "Metro Studio Unit B",
        address: "Marulas, Valenzuela",
        price: "₱18,500",
        rating: 4.9,
        beds: 1,
        baths: 1,
        sqft: 32,
        image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80",
        isSaved: false
    }
];

export default function PropertySearchScreen() {
    const { navigate, goBack } = useNavigation();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [savedProps, setSavedProps] = useState<Set<string>>(
        new Set(MOCK_PROPERTIES.filter(p => p.isSaved).map(p => p.id))
    );

    const toggleSave = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = new Set(savedProps);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSavedProps(next);
    };

    const filtered = MOCK_PROPERTIES.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Header & Search */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <button className={styles.backButton} onClick={goBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            className={styles.searchInput}
                            placeholder="Search area or property..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className={styles.filterButton} onClick={() => alert("Filters coming soon!")}>
                        <SlidersHorizontal size={18} />
                        <div className={styles.activeFilterDot} />
                    </button>
                </div>

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                    <button 
                        className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={16} /> List
                    </button>
                    <button 
                        className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.active : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        <MapIcon size={16} /> Map
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === "list" ? (
                <div className={styles.scrollArea}>
                    {filtered.length > 0 ? (
                        filtered.map(prop => (
                            <div 
                                key={prop.id} 
                                className={styles.propertyCard}
                                onClick={() => navigate("propertyDetail", { propertyId: prop.id })}
                            >
                                <div className={styles.imageWrapper}>
                                    <img src={prop.image} alt={prop.title} />
                                    <button 
                                        className={`${styles.likeButton} ${savedProps.has(prop.id) ? styles.saved : ''}`}
                                        onClick={(e) => toggleSave(e, prop.id)}
                                    >
                                        <Heart size={18} fill={savedProps.has(prop.id) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.priceRow}>
                                        <div>
                                            <span className={styles.price}>{prop.price}</span>
                                            <span className={styles.period}>/mo</span>
                                        </div>
                                        <div className={styles.rating}>
                                            <Star size={14} fill="currentColor" className={styles.ratingIcon} />
                                            {prop.rating}
                                        </div>
                                    </div>
                                    <h3 className={styles.title}>{prop.title}</h3>
                                    <div className={styles.address}>
                                        <MapPin size={14} /> {prop.address}
                                    </div>
                                    <div className={styles.features}>
                                        <div className={styles.featureItem}>
                                            <BedDouble size={14} /> {prop.beds} Bed
                                        </div>
                                        <div className={styles.featureItem}>
                                            <Bath size={14} /> {prop.baths} Bath
                                        </div>
                                        <div className={styles.featureItem}>
                                            <Square size={14} /> {prop.sqft} sqm
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <Search size={48} opacity={0.2} />
                            <h3 className={styles.emptyTitle}>No properties found</h3>
                            <p className={styles.emptyDesc}>Try adjusting your search filters.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.mapContainer}>
                    {/* Fake Map Markers */}
                    <div className={styles.mapMarker} style={{ top: '40%', left: '30%' }}>₱15k</div>
                    <div className={styles.mapMarker} style={{ top: '60%', left: '50%' }}>₱22k</div>
                    <div className={styles.mapMarker} style={{ top: '30%', left: '70%' }}>₱18.5k</div>
                </div>
            )}
        </div>
    );
}
