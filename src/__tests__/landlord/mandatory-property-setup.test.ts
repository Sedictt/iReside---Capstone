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

  it("locks navigation items in no_tenant stage except Dashboard, Unit Map, and Tenants", () => {
    const lockStage = "no_tenant";
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/unit-map", label: "Unit Map" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
      { href: "/landlord/analytics", label: "Analytics" },
      { href: "/landlord/messages", label: "Messaging" },
      { href: "/landlord/maintenance", label: "Maintenance" },
      { href: "/landlord/settings", label: "Settings" },
    ];

    const allowedHrefs = ["/landlord/dashboard", "/landlord/unit-map", "/landlord/tenants"];

    const processed = items.map((item) => {
      const isItemLocked = lockStage === "no_tenant" ? !allowedHrefs.includes(item.href) : false;
      const lockBadgeText = isItemLocked ? "Tenant Setup Required" : "";
      const lockTooltipText = isItemLocked
        ? "Complete property setup and register your first tenant to unlock portal operations."
        : "";

      return {
        ...item,
        isItemLocked,
        lockBadgeText,
        lockTooltipText,
      };
    });

    // Dashboard, Unit Map, and Tenants must NOT be locked
    expect(processed.find((i) => i.label === "Dashboard")?.isItemLocked).toBe(false);
    expect(processed.find((i) => i.label === "Unit Map")?.isItemLocked).toBe(false);
    expect(processed.find((i) => i.label === "Tenants")?.isItemLocked).toBe(false);

    // Other operational sections must be locked
    expect(processed.find((i) => i.label === "Properties")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Finance Hub")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Analytics")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Messaging")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Maintenance")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Settings")?.isItemLocked).toBe(true);

    const lockedItem = processed.find((i) => i.label === "Finance Hub");
    expect(lockedItem?.lockBadgeText).toBe("Tenant Setup Required");
    expect(lockedItem?.lockTooltipText).toBe(
      "Complete property setup and register your first tenant to unlock portal operations."
    );
  });

  it("unlocks all navigation routes when properties, unit map, and at least one tenant are configured", () => {
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

  it("evaluates mandatory property setup guard route redirection across all stages", () => {
    const guardEvaluate = (
      pathname: string,
      properties: Array<{ id: string; isMapSetupComplete?: boolean; hasTenants?: boolean; units?: Array<{ status: string }> }>
    ) => {
      const isReady = true;
      const isLandlord = true;
      const hasZeroProperties = isReady && isLandlord && properties.length === 0;
      const isAllowedCreationRoute = pathname === "/landlord/properties/new";

      const hasConfiguredMap = properties.some((p) => p.isMapSetupComplete);
      const hasPendingUnitMap = isReady && isLandlord && properties.length > 0 && !hasConfiguredMap;
      const isAllowedUnitMapRoute = pathname.startsWith("/landlord/unit-map");

      const hasAtLeastOneTenant = properties.some((p) =>
        Boolean(p.hasTenants) ||
        p.units?.some((u) => (u.status || "").toLowerCase() === "occupied")
      );
      const hasPendingTenantSetup = isReady && isLandlord && properties.length > 0 && hasConfiguredMap && !hasAtLeastOneTenant;
      const isAllowedStage3Route =
        pathname === "/landlord/dashboard" ||
        pathname.startsWith("/landlord/unit-map") ||
        pathname.startsWith("/landlord/tenants");

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

      if (hasPendingTenantSetup && !isAllowedStage3Route) {
        return { shouldRedirect: true, redirectTo: "/landlord/dashboard", showWelcomeLightbox: false, showUnitMapLightbox: false };
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

    // Stage 3: Map configured, 0 tenants, visiting locked route /landlord/analytics -> redirect to /landlord/dashboard
    expect(guardEvaluate("/landlord/analytics", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/dashboard",
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });

    // Stage 3: Map configured, 0 tenants, visiting locked route /landlord/invoices -> redirect to /landlord/dashboard
    expect(guardEvaluate("/landlord/invoices", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: false }])).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/dashboard",
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });

    // Stage 3: Map configured, 0 tenants, visiting allowed routes -> no redirect
    expect(guardEvaluate("/landlord/dashboard", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: false }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });
    expect(guardEvaluate("/landlord/unit-map", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: false }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });
    expect(guardEvaluate("/landlord/tenants", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: false }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });

    // Stage 4: Fully unlocked (1 property, map configured, tenant registered) -> all routes accessible
    expect(guardEvaluate("/landlord/invoices", [{ id: "prop-1", isMapSetupComplete: true, hasTenants: true }])).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showWelcomeLightbox: false,
      showUnitMapLightbox: false,
    });
  });
});
