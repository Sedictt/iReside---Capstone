"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property as DBProperty } from "@/types/database";

/** Shape returned by the Supabase query (property + nested units). */
export interface PropertyWithUnits extends DBProperty {
  units: {
    id: string;
    name: string;
    floor: number;
    status: string;
    rent_amount: number;
    sqft: number | null;
    beds: number;
    baths: number;
  }[];
}

/**
 * Flattened shape that the UI components (PropertyCard, PropertyDetailModal,
 * SearchMapView) already understand.  We derive one "FeedProperty" per
 * *property* (not per unit) by picking the cheapest vacant unit's numbers,
 * or falling back to the first unit.
 */
export interface FeedProperty {
  id: string;
  name: string;
  address: string;
  price: string;
  numericPrice: number;
  beds: number;
  baths: number;
  sqft: number;
  lat: number;
  lng: number;
  amenities: string[];
  description: string;
  houseRules: string[];
  images: string[];
  matchScore: number;
  isNew?: boolean;
  featured?: boolean;
  type?: "Apartment" | "Condo" | "House" | "Townhouse" | "Studio";
}

/** Map DB property_type enum → UI display type */
function mapType(dbType: string): FeedProperty["type"] {
  const map: Record<string, FeedProperty["type"]> = {
    apartment: "Apartment",
    condo: "Condo",
    house: "House",
    townhouse: "Townhouse",
    studio: "Studio",
  };
  return map[dbType] ?? "Apartment";
}

/** Convert a DB property + units row into the flat shape the cards expect. */
function toFeedProperty(p: PropertyWithUnits): FeedProperty {
  // Prefer the cheapest vacant unit; fall back to any unit
  const vacantUnits = (p.units ?? []).filter((u) => u.status === "vacant");
  const representative =
    vacantUnits.sort((a, b) => a.rent_amount - b.rent_amount)[0] ??
    p.units?.[0];

  const rent = representative?.rent_amount ?? 0;
  const isNew =
    new Date(p.created_at).getTime() >
    Date.now() - 14 * 24 * 60 * 60 * 1000; // created in the last 14 days

  return {
    id: p.id,
    name: p.name,
    address: p.address,
    price: `₱${rent.toLocaleString()}`,
    numericPrice: rent,
    beds: representative?.beds ?? 1,
    baths: representative?.baths ?? 1,
    sqft: representative?.sqft ?? 0,
    lat: p.lat ?? 14.7,
    lng: p.lng ?? 121.0,
    amenities: p.amenities ?? [],
    description: p.description ?? "",
    houseRules: p.house_rules ?? [],
    images:
      p.images && p.images.length > 0
        ? p.images
        : ["/hero-images/apartment-01.png"],
    matchScore: Math.floor(Math.random() * 15) + 85, // 85-100
    isNew,
    featured: p.is_featured,
    type: mapType(p.type),
  };
}

/**
 * Hook: fetches all properties (with units) from Supabase
 * and returns them as FeedProperty[].
 */
export function useProperties() {
  const [properties, setProperties] = useState<FeedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetch() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("properties")
        .select(
          `
          *,
          units (
            id, name, floor, status,
            rent_amount, sqft, beds, baths
          )
        `
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (err) {
        console.error("useProperties error:", err);
        setError(err.message);
        setLoading(false);
        return;
      }

      const feed = (data as PropertyWithUnits[]).map(toFeedProperty);
      setProperties(feed);
      setLoading(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  return { properties, loading, error };
}
