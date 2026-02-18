
"use client";

import { useState, useEffect } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { properties } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import { Property } from "@/lib/data";

export default function SavedPropertiesPage() {
    const [likedProperties, setLikedProperties] = useState<Set<string>>(new Set());
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedLikes = localStorage.getItem("likedProperties");
        if (savedLikes) {
            setLikedProperties(new Set(JSON.parse(savedLikes)));
        }
        setIsLoaded(true);
    }, []);

    const toggleLike = (id: string) => {
        setLikedProperties(prev => {
            const newLiked = new Set(prev);
            if (newLiked.has(id)) {
                newLiked.delete(id);
            } else {
                newLiked.add(id);
            }
            localStorage.setItem("likedProperties", JSON.stringify(Array.from(newLiked)));
            return newLiked;
        });
    };

    const handleOpenDetails = (property: Property) => {
        setSelectedProperty(property);
        setDetailsOpen(true);
    };

    const savedPropertiesList = properties.filter(p => likedProperties.has(p.id));

    if (!isLoaded) {
        return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background text-neutral-200 font-sans p-8">
            <header className="max-w-7xl mx-auto mb-12 flex items-center gap-4">
                <Link href="/search" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-neutral-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Heart className="h-8 w-8 text-red-500 fill-current" />
                        Saved Homes
                    </h1>
                    <p className="text-neutral-400 mt-1">
                        {savedPropertiesList.length} properties saved
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {savedPropertiesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Heart className="h-16 w-16 mb-4 text-neutral-800" />
                        <h2 className="text-xl font-bold text-neutral-300">No saved homes yet</h2>
                        <p className="mt-2 text-sm text-neutral-500">Start exploring and save your favorite properties to see them here.</p>
                        <Link href="/search" className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors">
                            Explore Properties
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {savedPropertiesList.map((p) => (
                            <PropertyCard
                                key={p.id}
                                property={p}
                                isLiked={likedProperties.has(p.id)}
                                onLike={toggleLike}
                                onClick={handleOpenDetails}
                            />
                        ))}
                    </div>
                )}
            </main>

            <PropertyDetailModal
                property={selectedProperty}
                isLiked={selectedProperty ? likedProperties.has(selectedProperty.id) : false}
                onLike={toggleLike}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
