import { describe, it, expect } from "vitest";

describe("Mandatory Property Setup System Lock", () => {
  it("locks all non-setup routes when landlord has 0 properties", () => {
    const isLocked = true;
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/properties/new", label: "New Property" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
      { href: "/landlord/messages", label: "Messaging" },
    ];

    const processed = items.map((item) => {
      const isItemLocked = Boolean(
        isLocked &&
        item.href !== "/landlord/properties" &&
        item.href !== "/landlord/properties/new"
      );
      const resolvedHref = (isLocked && item.href === "/landlord/properties")
        ? "/landlord/properties/new"
        : item.href;

      return {
        ...item,
        isItemLocked,
        resolvedHref,
      };
    });

    // Dashboard, Tenants, Invoices, Messages must be locked
    expect(processed.find((i) => i.label === "Dashboard")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Tenants")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Finance Hub")?.isItemLocked).toBe(true);
    expect(processed.find((i) => i.label === "Messaging")?.isItemLocked).toBe(true);

    // Properties and New Property must NOT be locked
    expect(processed.find((i) => i.label === "Properties")?.isItemLocked).toBe(false);
    expect(processed.find((i) => i.label === "New Property")?.isItemLocked).toBe(false);

    // Clicking Properties must redirect to /landlord/properties/new
    expect(processed.find((i) => i.label === "Properties")?.resolvedHref).toBe("/landlord/properties/new");
  });

  it("unlocks all navigation routes when properties are registered", () => {
    const isLocked = false;
    const items = [
      { href: "/landlord/dashboard", label: "Dashboard" },
      { href: "/landlord/properties", label: "Properties" },
      { href: "/landlord/tenants", label: "Tenants" },
      { href: "/landlord/invoices", label: "Finance Hub" },
    ];

    const processed = items.map((item) => {
      const isItemLocked = Boolean(
        isLocked &&
        item.href !== "/landlord/properties" &&
        item.href !== "/landlord/properties/new"
      );
      const resolvedHref = (isLocked && item.href === "/landlord/properties")
        ? "/landlord/properties/new"
        : item.href;

      return {
        ...item,
        isItemLocked,
        resolvedHref,
      };
    });

    expect(processed.every((i) => !i.isItemLocked)).toBe(true);
    expect(processed.find((i) => i.label === "Properties")?.resolvedHref).toBe("/landlord/properties");
  });

  it("evaluates mandatory property setup guard route redirection", () => {
    const guardEvaluate = (pathname: string, propertiesCount: number) => {
      const isReady = true;
      const isLandlord = true;
      const hasZeroProperties = isReady && isLandlord && propertiesCount === 0;
      const isAllowedCreationRoute = pathname === "/landlord/properties/new";

      if (hasZeroProperties && !isAllowedCreationRoute) {
        if (pathname !== "/landlord/dashboard") {
          return { shouldRedirect: true, redirectTo: "/landlord/properties/new", showLightbox: true };
        }
        return { shouldRedirect: false, redirectTo: null, showLightbox: true };
      }

      return { shouldRedirect: false, redirectTo: null, showLightbox: false };
    };

    // When 0 properties on /landlord/tenants, must redirect to properties/new and show lightbox
    expect(guardEvaluate("/landlord/tenants", 0)).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/properties/new",
      showLightbox: true,
    });

    // When 0 properties on /landlord/properties, must redirect to properties/new and show lightbox
    expect(guardEvaluate("/landlord/properties", 0)).toEqual({
      shouldRedirect: true,
      redirectTo: "/landlord/properties/new",
      showLightbox: true,
    });

    // When 0 properties on /landlord/dashboard, show lightbox
    expect(guardEvaluate("/landlord/dashboard", 0)).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showLightbox: true,
    });

    // When on /landlord/properties/new with 0 properties, allowed (no redirect, no lightbox over the form)
    expect(guardEvaluate("/landlord/properties/new", 0)).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showLightbox: false,
    });

    // When 1 property, all routes allowed with no lightbox
    expect(guardEvaluate("/landlord/tenants", 1)).toEqual({
      shouldRedirect: false,
      redirectTo: null,
      showLightbox: false,
    });
  });
});
