"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type ListingRow = {
  id: string;
  property_id: string;
  unit_id: string | null;
  scope: "property" | "unit";
  title: string;
  rent_amount: number;
  created_at: string;
};

type PropertyRow = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  type: string;
  lat: number | null;
  lng: number | null;
  amenities: string[] | null;
  house_rules: string[] | null;
  images: string[] | null;
  is_featured: boolean;
  created_at: string;
};

type UnitRow = {
  id: string;
  property_id: string;
  status: string;
  rent_amount: number;
  sqft: number | null;
  beds: number;
  baths: number;
};

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

function pickRepresentativeUnit(scope: "property" | "unit", listing: ListingRow, units: UnitRow[]): UnitRow | undefined {
  if (scope === "unit") {
    return units.find((unit) => unit.id === listing.unit_id);
  }

  const vacantUnits = units.filter((unit) => unit.status === "vacant");
  return vacantUnits.sort((a, b) => a.rent_amount - b.rent_amount)[0] ?? units[0];
}

function toFeedProperty(listing: ListingRow, property: PropertyRow, units: UnitRow[]): FeedProperty {
  const representative = pickRepresentativeUnit(listing.scope, listing, units);
  const rent = Number(listing.rent_amount ?? representative?.rent_amount ?? 0);
  const isNew =
    new Date(listing.created_at).getTime() >
    Date.now() - 14 * 24 * 60 * 60 * 1000; // created in the last 14 days

  return {
    id: listing.id,
    name: listing.title || property.name,
    address: property.address,
    price: `₱${rent.toLocaleString()}`,
    numericPrice: rent,
    beds: representative?.beds ?? 1,
    baths: representative?.baths ?? 1,
    sqft: representative?.sqft ?? 0,
    lat: property.lat ?? 14.7,
    lng: property.lng ?? 121.0,
    amenities: property.amenities ?? [],
    description: property.description ?? "",
    houseRules: property.house_rules ?? [],
    images:
      property.images && property.images.length > 0
        ? property.images
        : ["/hero-images/apartment-01.png"],
    matchScore: Math.floor(Math.random() * 15) + 85, // 85-100
    isNew,
    featured: property.is_featured,
    type: mapType(property.type),
  };
}

/**
 * Hook: fetches published listings for the public marketplace
 * and returns them as FeedProperty[] for both apartment and unit listings.
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
      const { data: listings, error: listingError } = await supabase
        .from("listings")
        .select("id, property_id, unit_id, scope, title, rent_amount, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (listingError) {
        console.error("useProperties listing error:", listingError);
        setError(listingError.message);
        setLoading(false);
        return;
      }

      const listingRows = (listings ?? []) as ListingRow[];
      if (listingRows.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const propertyIds = Array.from(new Set(listingRows.map((listing) => listing.property_id)));

      const [{ data: properties, error: propertyError }, { data: units, error: unitError }] = await Promise.all([
        supabase
          .from("properties")
          .select("id, name, address, description, type, lat, lng, amenities, house_rules, images, is_featured, created_at")
          .in("id", propertyIds),
        supabase
          .from("units")
          .select("id, property_id, status, rent_amount, sqft, beds, baths")
          .in("property_id", propertyIds),
      ]);

      if (cancelled) return;

      if (propertyError) {
        console.error("useProperties property error:", propertyError);
        setError(propertyError.message);
        setLoading(false);
        return;
      }

      if (unitError) {
        console.error("useProperties unit error:", unitError);
        setError(unitError.message);
        setLoading(false);
        return;
      }

      const propertyById = new Map(((properties ?? []) as PropertyRow[]).map((property) => [property.id, property]));
      const unitsByProperty = new Map<string, UnitRow[]>();
      for (const unit of (units ?? []) as UnitRow[]) {
        const existing = unitsByProperty.get(unit.property_id) ?? [];
        existing.push(unit);
        unitsByProperty.set(unit.property_id, existing);
      }

      const feed = listingRows
        .map((listing) => {
          const property = propertyById.get(listing.property_id);
          if (!property) return null;

          const propertyUnits = unitsByProperty.get(property.id) ?? [];
          return toFeedProperty(listing, property, propertyUnits);
        })
        .filter((item): item is FeedProperty => Boolean(item));

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
