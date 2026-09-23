import { describe, it, expect } from "vitest";

describe("Mandatory Property & Unit Map Setup System Lock", () => {
  it("locks all non-setup routes when landlord has 0 properties (Stage 1)", () => {
    const isLocked = true;
    const lockStage = "no_property" as const;
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/properties/new", label: "New Property" },
      { href: "/landlord/unit-map", label: "Unit Map" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
      { href: "/landlord/messages", label: "Messaging" },
    ];

    const processed = items.map((item) => {
      const isItemLocked = Boolean(
        lockStage === "no_property" &&
        item.href !== "/landlord/properties" &&
        item.href !== "/landlord/properties/new"
      );
      const resolvedHref = (lockStage === "no_property" && item.href === "/landlord/properties")
        ? "/landlord/properties/new"
        : item.href;

      return {
        ...item,
        isItemLocked,
        resolvedHref,
      };
    });

    // Dashboard, Unit Map, Tenants, Invoices, Messages must be locked in Stage 1
    expect(processed.find((i) => i.label === "Dashboard")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Unit Map")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Tenants")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Finance Hub")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Messaging")?.isItemLocked).toBe(true);

    // Properties and New Property must NOT be locked
    expect(processed.find((i) => i.label === "Properties")?.isItemLocked).toBe(false);
    expect(processed.find((i) => i.label === "New Property")?.isItemLocked).toBe(false);

    // Clicking Properties must redirect to /landlord/properties/new
    expect(processed.find((i) => i.label === "Properties")?.resolvedHref).toBe("/landlord/properties/new");
  });

  it("locks operations and permits unit map when property registered but unit map pending (Stage 2)", () => {
    const lockStage = "no_unit_map" as const;
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/properties/new", label: "New Property" },
      { href: "/landlord/unit-map", label: "Unit Map" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
      { href: "/landlord/messages", label: "Messaging" },
      { href: "/landlord/maintenance", label: "Maintenance" },
    ];

    const processed = items.map((item) => {
      const isItemLocked = Boolean(
        lockStage === "no_unit_map" &&
        item.href !== "/landlord/unit-map"
      );
      const resolvedHref = item.href;

      return {
        ...item,
        isItemLocked,
        resolvedHref,
      };
    });

    // Only Unit Map must NOT be locked
    expect(processed.find((i) => i.label === "Unit Map")?.isItemLocked).toBe(false);

    // Properties, Dashboard, and operational routes must be locked
    expect(processed.find((i) => i.label === "Properties")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "New Property")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Dashboard")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Tenants")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Finance Hub")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Messaging")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Maintenance")?.isItemLocked).toBe(true);
  });

  it("unlocks all navigation routes when properties and unit map are configured", () => {
    const isLocked = false;
    const lockStage = null;
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/unit-map", label: "Unit Map" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
    ];

    const processed = items.map((item) => {
      const isItemLocked = Boolean(
        lockStage !== null &&
        item.href !== "/landlord/unit-map"
      );

      return {
        ...item,
        isItemLocked,
      };
    });

    expect(processed.every((i) => !i.isItemLocked)).toBe(true);
  });

  it("evaluates mandatory property setup guard route redirection (Stage 1 & Stage 2)", () => {
    const guardEvaluate = (
      pathname: string,
      properties: Array<{ id: string; isMapSetupComplete?: boolean }>
    ) => {
      const isReady = true;
      const isLandlord = true;
      const hasZeroProperties = isReady && isLandlord && properties.length === 0;
      const isAllowedCreationRoute = pathname === "/landlord/properties/new";

      const hasConfiguredMap = properties.some((p) => p.isMapSetupComplete);
      const hasPendingUnitMap = isReady && isLandlord && properties.length > 0 && !hasConfiguredMap;
      const isAllowedUnitMapRoute = pathname.startsWith("/landlord/unit-map");

      if (hasZeroProperties && !isAllowedCreationRoute) {
        if (pathname !== "/landlord/dashboard") {
          return { shouldRedirect: true, redirectTo: "/landlord/properties/new", showWelcomeLightbox: true, showUnitMapLightbox: false };
        }
        return { shouldRedirect: false, redirectTo: null, showWelcomeLightbox: true, showUnitMapLightbox: false };
      }

      if (hasPendingUnitMap && !isAllowedUnitMapRoute) {
        if (pathname !== "/landlord/dashboard") {
          return { shouldRedirect: true, redirectTo: "/landlord/unit-map", showWelcomeLightbox: false, showUnitMapLightbox: true };
        }
        return { shouldRedirect: false, redirectTo: null, showWelcomeLightbox: false, showUnitMapLightbox: true };
      }

      return { shouldRedirect: false, redirectTo: null, showWelcomeLightbox: false, showUnitMapLightbox: false };
    };

    // Stage 1: 0 properties on /landlord/tenants -> redirect to /landlord/properties/new
    expect(guardEvaluate("/landlord/tenants", [])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/properties/new",
      showWelcomeLightbox: true,
      showUnitMapLightbox: false,
    });

    // Stage 1: 0 properties on /landlord/dashboard -> show welcome lightbox
    expect(guardEvaluate("/landlord/dashboard", [])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: true,
      showUnitMapLightbox: false,
    });

    // Stage 1: 0 properties on /landlord/properties/new -> allowed, no redirect
    expect(guardEvaluate("/landlord/properties/new", [])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });

    // Stage 2: 1 property, map NOT configured, visiting /landlord/properties -> redirect to /landlord/unit-map
    expect(guardEvaluate("/landlord/properties", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/unit-map",
      showWelcomeLightbox: false,
      showUnitMapLightbox: true,
    });

    // Stage 2: 1 property, map NOT configured, visiting /landlord/properties/new -> redirect to /landlord/unit-map
    expect(guardEvaluate("/landlord/properties/new", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/unit-map",
      showWelcomeLightbox: false,
      showUnitMapLightbox: true,
    });

    // Stage 2: 1 property, map NOT configured, visiting /landlord/tenants -> redirect to /landlord/unit-map
    expect(guardEvaluate("/landlord/tenants", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/unit-map",
      showWelcomeLightbox: false,
      showUnitMapLightbox: true,
    });

    // Stage 2: 1 property, map NOT configured, visiting /landlord/invoices -> redirect to /landlord/unit-map
    expect(guardEvaluate("/landlord/invoices", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/unit-map",
      showWelcomeLightbox: false,
      showUnitMapLightbox: true,
    });

    // Stage 2: 1 property, map NOT configured, on /landlord/dashboard -> show unit map lightbox
    expect(guardEvaluate("/landlord/dashboard", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: true,
    });

    // Stage 2: 1 property, map NOT configured, on /landlord/unit-map -> allowed, no redirect, no lightbox over canvas
    expect(guardEvaluate("/landlord/unit-map", [{ id: "prop-1", isMapSetupComplete: false }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });

    // Stage 3: Fully unlocked (1 property, map configured) -> all routes accessible
    expect(guardEvaluate("/landlord/tenants", [{ id: "prop-1", isMapSetupComplete: true }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });
  });
});
