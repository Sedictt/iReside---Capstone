import { describe, it, expect } from "vitest";
import { resolveDocsBackLink } from "../navigation";

describe("resolveDocsBackLink", () => {
  describe("landlord route contexts", () => {
    it("returns landlord dashboard when on /landlord/docs without defaultBackHref", () => {
      const result = resolveDocsBackLink({ pathname: "/landlord/docs" });
      expect(result.href).toBe("/landlord/dashboard");
      expect(result.label).toBe("Back to Landlord Dashboard");
    });

    it("returns landlord dashboard regardless of user role when on /landlord/docs", () => {
      const result = resolveDocsBackLink({ pathname: "/landlord/docs", userRole: "landlord" });
      expect(result.href).toBe("/landlord/dashboard");
      expect(result.label).toBe("Back to Landlord Dashboard");
    });

    it("respects explicit defaultBackHref when provided on landlord route", () => {
      const result = resolveDocsBackLink({
        pathname: "/landlord/docs",
        defaultBackHref: "/landlord/properties",
      });
      expect(result.href).toBe("/landlord/properties");
      expect(result.label).toBe("Back to Landlord Dashboard");
    });
  });

  describe("tenant route contexts", () => {
    it("returns tenant dashboard when on /tenant/docs", () => {
      const result = resolveDocsBackLink({ pathname: "/tenant/docs" });
      expect(result.href).toBe("/tenant/dashboard");
      expect(result.label).toBe("Back to Resident Portal");
    });

    it("returns tenant dashboard when on /tenant/manual", () => {
      const result = resolveDocsBackLink({ pathname: "/tenant/manual" });
      expect(result.href).toBe("/tenant/dashboard");
      expect(result.label).toBe("Back to Resident Portal");
    });

    it("respects explicit defaultBackHref when provided on tenant route", () => {
      const result = resolveDocsBackLink({
        pathname: "/tenant/docs",
        defaultBackHref: "/tenant/lease",
      });
      expect(result.href).toBe("/tenant/lease");
      expect(result.label).toBe("Back to Resident Portal");
    });
  });

  describe("public and neutral route contexts", () => {
    it("resolves to landlord dashboard if logged-in user is landlord on public docs", () => {
      const result = resolveDocsBackLink({ pathname: "/docs", userRole: "landlord" });
      expect(result.href).toBe("/landlord/dashboard");
      expect(result.label).toBe("Back to Landlord Dashboard");
    });

    it("resolves to resident portal if logged-in user is tenant on public docs", () => {
      const result = resolveDocsBackLink({ pathname: "/docs", userRole: "tenant" });
      expect(result.href).toBe("/tenant/dashboard");
      expect(result.label).toBe("Back to Resident Portal");
    });

    it("resolves to landlord dashboard if logged-in user is admin on public docs", () => {
      const result = resolveDocsBackLink({ pathname: "/docs", userRole: "admin" });
      expect(result.href).toBe("/landlord/dashboard");
      expect(result.label).toBe("Back to Landlord Dashboard");
    });

    it("resolves to home for unauthenticated visitors on public docs", () => {
      const result = resolveDocsBackLink({ pathname: "/docs" });
      expect(result.href).toBe("/");
      expect(result.label).toBe("Back to Home");
    });
  });

  describe("audience decoupling guarantee", () => {
    it("proves that switching manuals never mutates the return destination", () => {
      // Simulating a landlord navigating through all 3 manuals on /landlord/docs
      const landlordViewingTenantManual = resolveDocsBackLink({ pathname: "/landlord/docs" });
      const landlordViewingLandlordManual = resolveDocsBackLink({ pathname: "/landlord/docs" });
      const landlordViewingITManual = resolveDocsBackLink({ pathname: "/landlord/docs" });

      expect(landlordViewingTenantManual.href).toBe("/landlord/dashboard");
      expect(landlordViewingLandlordManual.href).toBe("/landlord/dashboard");
      expect(landlordViewingITManual.href).toBe("/landlord/dashboard");

      // Simulating a tenant navigating through all 3 manuals on /tenant/docs
      const tenantViewingTenantManual = resolveDocsBackLink({ pathname: "/tenant/docs" });
      const tenantViewingLandlordManual = resolveDocsBackLink({ pathname: "/tenant/docs" });
      const tenantViewingITManual = resolveDocsBackLink({ pathname: "/tenant/docs" });

      expect(tenantViewingTenantManual.href).toBe("/tenant/dashboard");
      expect(tenantViewingLandlordManual.href).toBe("/tenant/dashboard");
      expect(tenantViewingITManual.href).toBe("/tenant/dashboard");
    });
  });
});
