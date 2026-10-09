import { describe, expect, it } from "vitest";
import { resolveRoleAccessRedirect } from "../middleware";

describe("role-based portal access redirects across Desktop and Mobile", () => {
  describe("Tenant role enforcement", () => {
    it("redirects tenants away from landlord mobile views to tenant mobile home", () => {
      expect(resolveRoleAccessRedirect("/mobile/landlord", "tenant")).toBe("/mobile/tenant/home");
      expect(resolveRoleAccessRedirect("/mobile/landlord/overview", "tenant")).toBe("/mobile/tenant/home");
      expect(resolveRoleAccessRedirect("/mobile/landlord/payments", "tenant")).toBe("/mobile/tenant/home");
      expect(resolveRoleAccessRedirect("/mobile/landlord/tenants", "tenant")).toBe("/mobile/tenant/home");
    });

    it("redirects tenants away from desktop landlord, setup, and admin routes to tenant dashboard", () => {
      expect(resolveRoleAccessRedirect("/landlord", "tenant")).toBe("/tenant/dashboard");
      expect(resolveRoleAccessRedirect("/landlord/dashboard", "tenant")).toBe("/tenant/dashboard");
      expect(resolveRoleAccessRedirect("/landlord/payments", "tenant")).toBe("/tenant/dashboard");
      expect(resolveRoleAccessRedirect("/setup", "tenant")).toBe("/tenant/dashboard");
      expect(resolveRoleAccessRedirect("/admin", "tenant")).toBe("/tenant/dashboard");
      expect(resolveRoleAccessRedirect("/admin/users", "tenant")).toBe("/tenant/dashboard");
    });

    it("permits tenants to access mobile and desktop tenant routes without redirect", () => {
      expect(resolveRoleAccessRedirect("/mobile/tenant/home", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/tenant/pay", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/tenant/maintenance", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/community", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/calendar", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/tenant/dashboard", "tenant")).toBeNull();
      expect(resolveRoleAccessRedirect("/tenant/payments", "tenant")).toBeNull();
    });
  });

  describe("Landlord role enforcement", () => {
    it("redirects landlords away from tenant mobile views to landlord mobile overview", () => {
      expect(resolveRoleAccessRedirect("/mobile/tenant", "landlord")).toBe("/mobile/landlord/overview");
      expect(resolveRoleAccessRedirect("/mobile/tenant/home", "landlord")).toBe("/mobile/landlord/overview");
      expect(resolveRoleAccessRedirect("/mobile/tenant/pay", "landlord")).toBe("/mobile/landlord/overview");
    });

    it("redirects landlords away from desktop tenant routes and admin console to landlord dashboard", () => {
      expect(resolveRoleAccessRedirect("/tenant", "landlord")).toBe("/landlord/dashboard");
      expect(resolveRoleAccessRedirect("/tenant/dashboard", "landlord")).toBe("/landlord/dashboard");
      expect(resolveRoleAccessRedirect("/tenant/payments", "landlord")).toBe("/landlord/dashboard");
      expect(resolveRoleAccessRedirect("/admin", "landlord")).toBe("/landlord/dashboard");
      expect(resolveRoleAccessRedirect("/admin/users", "landlord")).toBe("/landlord/dashboard");
    });

    it("permits landlords to access mobile and desktop landlord routes without redirect", () => {
      expect(resolveRoleAccessRedirect("/mobile/landlord/overview", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/landlord/payments", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/community", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/calendar", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/landlord/dashboard", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/landlord/payments", "landlord")).toBeNull();
      expect(resolveRoleAccessRedirect("/setup", "landlord")).toBeNull();
    });
  });

  describe("Admin role enforcement", () => {
    it("redirects admins away from tenant mobile views to landlord mobile overview", () => {
      expect(resolveRoleAccessRedirect("/mobile/tenant/home", "admin")).toBe("/mobile/landlord/overview");
    });

    it("redirects admins away from desktop tenant views to admin dashboard", () => {
      expect(resolveRoleAccessRedirect("/tenant/dashboard", "admin")).toBe("/admin/dashboard");
    });

    it("permits admins to access admin, landlord, and shared routes", () => {
      expect(resolveRoleAccessRedirect("/admin/dashboard", "admin")).toBeNull();
      expect(resolveRoleAccessRedirect("/landlord/dashboard", "admin")).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/landlord/overview", "admin")).toBeNull();
    });
  });

  describe("Anonymous / Unauthenticated visitors", () => {
    it("returns null when role is null or undefined so auth check handles login redirect", () => {
      expect(resolveRoleAccessRedirect("/mobile/landlord/overview", null)).toBeNull();
      expect(resolveRoleAccessRedirect("/mobile/tenant/home", undefined)).toBeNull();
    });
  });
});
