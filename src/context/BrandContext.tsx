"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { applyBrandCssVariables, getMonogramInitials } from "@/lib/branding/colors";
import { OfflineStorage } from "@/lib/offline/offlineStorage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export interface BrandConfig {
  propertyName: string;
  propertyTagline: string;
  rentalArchetype: "apartment" | "dormitory" | "boarding_house";
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}

export interface BrandContextValue extends BrandConfig {
  monogramInitials: string;
  isCustomBranded: boolean;
  isLoading: boolean;
  updateBranding: (newBranding: Partial<BrandConfig>, persistToDatabase?: boolean) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
  refreshBranding: () => Promise<void>;
}

export const DEFAULT_BRANDING: BrandConfig = {
  propertyName: "iReside Residences",
  propertyTagline: "Modern Property Management & Residential Operations",
  rentalArchetype: "apartment",
  primaryColor: "#c4b0ff",
  secondaryColor: "#8b5cf6",
  logoUrl: null,
  bannerUrl: null,
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandConfig>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load from local storage or cached snapshot
  const loadLocalSnapshot = useCallback((): BrandConfig => {
    if (typeof window === "undefined") return DEFAULT_BRANDING;

    try {
      const cached = OfflineStorage.get<BrandConfig>("brand_configuration");
      if (cached?.data) {
        return cached.data;
      }

      // Legacy fallback keys
      const savedName = localStorage.getItem("ireside_property_name");
      const savedTagline = localStorage.getItem("ireside_property_tagline");
      const savedArchetype = localStorage.getItem("ireside_rental_archetype") as BrandConfig["rentalArchetype"];
      const savedPrimary = localStorage.getItem("ireside_brand_primary");
      const savedSecondary = localStorage.getItem("ireside_brand_secondary");
      const savedLogo = localStorage.getItem("ireside_property_logo");
      const savedBanner = localStorage.getItem("ireside_landlord_custom_banner_url");

      if (savedName || savedPrimary) {
        return {
          propertyName: savedName || DEFAULT_BRANDING.propertyName,
          propertyTagline: savedTagline || DEFAULT_BRANDING.propertyTagline,
          rentalArchetype: savedArchetype || DEFAULT_BRANDING.rentalArchetype,
          primaryColor: savedPrimary || DEFAULT_BRANDING.primaryColor,
          secondaryColor: savedSecondary || DEFAULT_BRANDING.secondaryColor,
          logoUrl: savedLogo || null,
          bannerUrl: savedBanner || null,
        };
      }
    } catch (err) {
      console.warn("[BrandProvider] Error loading local cache:", err);
    }
    return DEFAULT_BRANDING;
  }, []);

  // Fetch live branding from backend
  const refreshBranding = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        const res = await fetch("/api/branding", { cache: "no-store" });
        if (res.ok) {
          const data: BrandConfig = await res.json();
          setBranding(data);
          applyBrandCssVariables(data.primaryColor, data.secondaryColor);
          OfflineStorage.set("brand_configuration", data, null, "branding");

          // Sync to legacy localStorage keys for backward compatibility
          localStorage.setItem("ireside_property_name", data.propertyName);
          localStorage.setItem("ireside_property_tagline", data.propertyTagline);
          localStorage.setItem("ireside_rental_archetype", data.rentalArchetype);
          localStorage.setItem("ireside_brand_primary", data.primaryColor);
          localStorage.setItem("ireside_brand_secondary", data.secondaryColor);
          if (data.logoUrl) localStorage.setItem("ireside_property_logo", data.logoUrl);
          if (data.bannerUrl) localStorage.setItem("ireside_landlord_custom_banner_url", data.bannerUrl);

          window.dispatchEvent(new CustomEvent("property-branding-updated", { detail: data }));
          return;
        }
      }
    } catch (err) {
      console.warn("[BrandProvider] Remote fetch error, falling back to local:", err);
    }

    // Fallback to local snapshot
    const local = loadLocalSnapshot();
    setBranding(local);
    applyBrandCssVariables(local.primaryColor, local.secondaryColor);
  }, [loadLocalSnapshot]);

  // Initial load & real-time synchronization
  useEffect(() => {
    const initial = loadLocalSnapshot();
    setBranding(initial);
    applyBrandCssVariables(initial.primaryColor, initial.secondaryColor);
    setIsLoading(false);

    // Fetch latest in background
    refreshBranding();

    // Listen to custom cross-component update events
    const handleBrandingEvent = () => {
      const updated = loadLocalSnapshot();
      setBranding(updated);
      applyBrandCssVariables(updated.primaryColor, updated.secondaryColor);
    };

    window.addEventListener("property-branding-updated", handleBrandingEvent);

    // Revalidate when user returns to or focuses the window/tab
    const handleFocus = () => {
      refreshBranding();
    };
    window.addEventListener("focus", handleFocus);

    // Realtime channel subscription for instant multi-device sync
    let channel: any = null;
    try {
      const supabase = createBrowserSupabaseClient();
      channel = supabase
        .channel("ireside-branding-realtime")
        .on("broadcast", { event: "brand-updated" }, (payload: any) => {
          if (payload?.payload) {
            const data: BrandConfig = payload.payload;
            setBranding(data);
            applyBrandCssVariables(data.primaryColor, data.secondaryColor);
            OfflineStorage.set("brand_configuration", data, null, "branding");
            localStorage.setItem("ireside_property_name", data.propertyName);
            localStorage.setItem("ireside_property_tagline", data.propertyTagline);
            localStorage.setItem("ireside_rental_archetype", data.rentalArchetype);
            localStorage.setItem("ireside_brand_primary", data.primaryColor);
            localStorage.setItem("ireside_brand_secondary", data.secondaryColor);
            if (data.logoUrl) localStorage.setItem("ireside_property_logo", data.logoUrl);
            if (data.bannerUrl) localStorage.setItem("ireside_landlord_custom_banner_url", data.bannerUrl);
            window.dispatchEvent(new CustomEvent("property-branding-updated", { detail: data }));
          } else {
            refreshBranding();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn("[BrandProvider] Realtime channel init note:", err);
    }

    return () => {
      window.removeEventListener("property-branding-updated", handleBrandingEvent);
      window.removeEventListener("focus", handleFocus);
      if (channel) {
        try {
          const supabase = createBrowserSupabaseClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [loadLocalSnapshot, refreshBranding]);

  // Synchronize dynamic property branding with Desktop native window and browser title
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Update document title for browser & web views
    if (branding.propertyName && branding.propertyName !== "iReside Residences") {
      document.title = `${branding.propertyName} — iReside Operations`;
    }

    // Notify native desktop shell if running inside Windows desktop app
    if ((window as any).iResideDesktop?.updateBrand) {
      (window as any).iResideDesktop.updateBrand({
        propertyName: branding.propertyName,
        propertyTagline: branding.propertyTagline,
        logoUrl: branding.logoUrl,
      });
    }
  }, [branding.propertyName, branding.propertyTagline, branding.logoUrl]);

  // Update Branding function
  const updateBranding = useCallback(
    async (newValues: Partial<BrandConfig>, persistToDatabase: boolean = true): Promise<boolean> => {
      const merged: BrandConfig = {
        ...branding,
        ...newValues,
      };

      // 1. Immediately apply to state & CSS variables for instant live preview
      setBranding(merged);
      applyBrandCssVariables(merged.primaryColor, merged.secondaryColor);

      // 2. Save locally
      if (typeof window !== "undefined") {
        OfflineStorage.set("brand_configuration", merged, null, "branding");
        localStorage.setItem("ireside_property_name", merged.propertyName);
        localStorage.setItem("ireside_property_tagline", merged.propertyTagline);
        localStorage.setItem("ireside_rental_archetype", merged.rentalArchetype);
        localStorage.setItem("ireside_brand_primary", merged.primaryColor);
        localStorage.setItem("ireside_brand_secondary", merged.secondaryColor);
        if (merged.logoUrl) {
          localStorage.setItem("ireside_property_logo", merged.logoUrl);
        } else {
          localStorage.removeItem("ireside_property_logo");
        }
        if (merged.bannerUrl) {
          localStorage.setItem("ireside_landlord_custom_banner_url", merged.bannerUrl);
        } else {
          localStorage.removeItem("ireside_landlord_custom_banner_url");
        }
        window.dispatchEvent(new CustomEvent("property-branding-updated", { detail: merged }));
      }

      // 3. Broadcast to other connected devices via Realtime channel
      try {
        const supabase = createBrowserSupabaseClient();
        const ch = supabase.channel("ireside-branding-realtime");
        ch.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            ch.send({
              type: "broadcast",
              event: "brand-updated",
              payload: merged,
            });
          }
        });
      } catch (broadcastErr) {
        console.warn("[BrandProvider] Realtime broadcast note:", broadcastErr);
      }

      // 4. Persist to backend database if requested
      if (persistToDatabase && typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch("/api/branding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged),
          });
          return res.ok;
        } catch (err) {
          console.warn("[BrandProvider] Failed to persist to backend:", err);
          return false;
        }
      }

      return true;
    },
    [branding]
  );

  const resetToDefault = useCallback(async () => {
    await updateBranding(DEFAULT_BRANDING, true);
  }, [updateBranding]);

  const monogramInitials = useMemo(() => {
    return getMonogramInitials(branding.propertyName);
  }, [branding.propertyName]);

  const isCustomBranded = useMemo(() => {
    return (
      branding.propertyName !== DEFAULT_BRANDING.propertyName ||
      branding.primaryColor.toLowerCase() !== DEFAULT_BRANDING.primaryColor.toLowerCase() ||
      branding.logoUrl !== null
    );
  }, [branding]);

  const value: BrandContextValue = {
    ...branding,
    monogramInitials,
    isCustomBranded,
    isLoading,
    updateBranding,
    resetToDefault,
    refreshBranding,
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a <BrandProvider>");
  }
  return context;
}
