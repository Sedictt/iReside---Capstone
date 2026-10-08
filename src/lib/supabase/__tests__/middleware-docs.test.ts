import { describe, expect, it } from "vitest";
import { resolveDocsAccessRedirect, TENANT_MANUAL_ROUTE } from "../middleware";

describe("documentation access by role", () => {
  it("sends tenants from the public documentation site to the tenant manual", () => {
    expect(resolveDocsAccessRedirect("/docs", "tenant")).toBe(TENANT_MANUAL_ROUTE);
    expect(resolveDocsAccessRedirect("/docs/introduction", "tenant")).toBe(TENANT_MANUAL_ROUTE);
    expect(resolveDocsAccessRedirect("/docs/technical", "tenant")).toBe(TENANT_MANUAL_ROUTE);
    expect(resolveDocsAccessRedirect("/docs/landlord/finance", "tenant")).toBe(TENANT_MANUAL_ROUTE);
  });

  it("sends tenants from the landlord manual to the tenant manual", () => {
    expect(resolveDocsAccessRedirect("/landlord/docs", "tenant")).toBe(TENANT_MANUAL_ROUTE);
    expect(resolveDocsAccessRedirect("/landlord/docs/anything", "tenant")).toBe(TENANT_MANUAL_ROUTE);
  });

  it("lets tenants open their own manual and other tenant routes", () => {
    expect(resolveDocsAccessRedirect("/tenant/docs", "tenant")).toBeNull();
    expect(resolveDocsAccessRedirect("/tenant/manual", "tenant")).toBeNull();
    expect(resolveDocsAccessRedirect("/tenant/dashboard", "tenant")).toBeNull();
  });

  it("does not confuse look-alike paths with documentation", () => {
    expect(resolveDocsAccessRedirect("/documents", "tenant")).toBeNull();
    expect(resolveDocsAccessRedirect("/landlord/documents", "tenant")).toBeNull();
    expect(resolveDocsAccessRedirect("/docsearch", "tenant")).toBeNull();
  });

  it("never restricts landlords, admins, or anonymous visitors", () => {
    ["landlord", "admin", null, undefined].forEach((role) => {
      expect(resolveDocsAccessRedirect("/docs", role)).toBeNull();
      expect(resolveDocsAccessRedirect("/docs/technical", role)).toBeNull();
      expect(resolveDocsAccessRedirect("/landlord/docs", role)).toBeNull();
      expect(resolveDocsAccessRedirect("/tenant/docs", role)).toBeNull();
    });
  });
});
