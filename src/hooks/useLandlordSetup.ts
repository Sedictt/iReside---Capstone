"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import {
    EMPTY_LOCAL_HINTS,
    LANDLORD_SETUP_CHANGED_EVENT,
    LEGACY_SETUP_EVENTS,
    readLandlordSetupLocalHints,
    resolveLandlordSetup,
    type LandlordSetupLocalHints,
    type LandlordSetupState,
} from "@/lib/landlord-setup";

/**
 * Resolved landlord setup state for the signed-in account.
 *
 * Combines the authoritative property list + persisted setup signals from
 * PropertyContext with same-session optimistic hints, and re-evaluates when
 * any setup flow reports a change. Use this instead of reading onboarding
 * localStorage keys directly.
 */
export function useLandlordSetup(): LandlordSetupState {
    const { profile, loading: authLoading } = useAuth();
    const { properties, status, setupSignals } = useProperty();
    const [hints, setHints] = useState<LandlordSetupLocalHints>(EMPTY_LOCAL_HINTS);

    const propertyIdsKey = properties.map((p) => p.id).join(",");

    useEffect(() => {
        const ids = propertyIdsKey ? propertyIdsKey.split(",") : [];
        const sync = () => setHints(readLandlordSetupLocalHints(ids));
        sync();
        const events = [LANDLORD_SETUP_CHANGED_EVENT, ...LEGACY_SETUP_EVENTS, "storage"];
        events.forEach((name) => window.addEventListener(name, sync));
        return () => events.forEach((name) => window.removeEventListener(name, sync));
    }, [propertyIdsKey]);

    return useMemo(
        () =>
            resolveLandlordSetup({
                status: authLoading ? "loading" : status,
                isLandlord: profile?.role === "landlord",
                properties,
                signals: setupSignals,
                hints,
            }),
        [authLoading, status, profile?.role, properties, setupSignals, hints]
    );
}
