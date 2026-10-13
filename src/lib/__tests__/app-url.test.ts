import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_BASE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "VERCEL_ENV",
] as const;

const originalEnv: Record<string, string | undefined> = {};

describe("app-url", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }
    originalEnv.NODE_ENV = process.env.NODE_ENV;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    for (const key of [...ENV_KEYS, "NODE_ENV"]) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
    vi.restoreAllMocks();
  });

  it("uses NEXT_PUBLIC_APP_URL when set and strips trailing slashes", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/";
    const { getAppBaseUrl, buildAppUrl } = await import("../app-url");
    expect(getAppBaseUrl()).toBe("https://app.example.com");
    expect(buildAppUrl("tenant/tour")).toBe("https://app.example.com/tenant/tour");
  });

  it("falls back to localhost outside production", async () => {
    process.env.NODE_ENV = "test";
    const { getAppBaseUrl } = await import("../app-url");
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("never returns localhost in production", async () => {
    process.env.NODE_ENV = "production";
    const { getAppBaseUrl, CANONICAL_APP_URL } = await import("../app-url");
    expect(getAppBaseUrl()).toBe(CANONICAL_APP_URL);

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(getAppBaseUrl()).toBe(CANONICAL_APP_URL);

    expect(getAppBaseUrl("http://127.0.0.1:3000")).toBe(CANONICAL_APP_URL);
  });

  it("prefers the Vercel production host over the request origin", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "ireside.vercel.app";
    const { getAppBaseUrl } = await import("../app-url");
    expect(getAppBaseUrl("https://other.example.com")).toBe("https://ireside.vercel.app");
  });

  it("uses a non-local request origin when nothing is configured", async () => {
    process.env.NODE_ENV = "production";
    const { getAppBaseUrl } = await import("../app-url");
    expect(getAppBaseUrl("https://staging.example.com/")).toBe("https://staging.example.com");
  });

  it("builds an auth callback URL that lands on our app", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ireside.app";
    const { buildAuthCallbackUrl } = await import("../app-url");
    expect(buildAuthCallbackUrl("/auth/reset-password")).toBe(
      "https://ireside.app/auth/callback?type=recovery&next=%2Fauth%2Freset-password",
    );
  });

  it("detects local URLs", async () => {
    const { isLocalUrl } = await import("../app-url");
    expect(isLocalUrl("http://localhost:3000/x")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1")).toBe(true);
    expect(isLocalUrl("https://ireside.app")).toBe(false);
    expect(isLocalUrl("https://localhost.ireside.app")).toBe(false);
  });
});
