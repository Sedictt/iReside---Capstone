/**
 * Canonical application base URL.
 *
 * Every link that leaves the system (emails, Supabase auth redirects, signing
 * links) must be built from this helper so a missing environment variable can
 * never produce a `localhost` link for a real user.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL (preferred, explicit)
 *   2. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_URL (legacy names)
 *   3. Vercel-provided production / deployment host
 *   4. The request origin, when the caller passes one and it is not local
 *   5. The canonical production domain (production) or localhost (dev/test)
 *
 * @module lib/app-url
 */

export const CANONICAL_APP_URL = "https://ireside.app";
const LOCAL_DEV_URL = "http://localhost:3000";

const LOCAL_HOST_PATTERN = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?(\/|$)/i;

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** True when the URL (or host) points at a local development machine. */
export function isLocalUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return LOCAL_HOST_PATTERN.test(value.trim());
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/**
 * Returns the absolute origin (no trailing slash) that outbound links should
 * be built from.
 *
 * @param requestOrigin - Optional origin of the incoming request. Used only as
 *   a fallback after the configured URLs, and ignored when it is a local host
 *   in production.
 */
export function getAppBaseUrl(requestOrigin?: string | null): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL;

  const production = isProduction();

  if (configured?.trim()) {
    const candidate = trimTrailingSlashes(withProtocol(configured.trim()));
    if (!(production && isLocalUrl(candidate))) {
      return candidate;
    }
    console.error(
      `[app-url] Configured app URL "${candidate}" points at localhost in production; falling back to ${CANONICAL_APP_URL}.`,
    );
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    (process.env.VERCEL_ENV === "production" ? process.env.VERCEL_URL : undefined);
  if (vercelHost?.trim()) {
    return trimTrailingSlashes(withProtocol(vercelHost.trim()));
  }

  if (requestOrigin?.trim()) {
    const candidate = trimTrailingSlashes(requestOrigin.trim());
    if (!(production && isLocalUrl(candidate))) {
      return candidate;
    }
  }

  return production ? CANONICAL_APP_URL : LOCAL_DEV_URL;
}

/** Builds an absolute URL from a site-relative path. */
export function buildAppUrl(path: string, requestOrigin?: string | null): string {
  const base = getAppBaseUrl(requestOrigin);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Post-auth redirect target used with Supabase `generateLink` so recovery and
 * invite links land on our app instead of the Supabase project's Site URL.
 */
export function buildAuthCallbackUrl(
  next: string,
  type: "recovery" | "signup" | "invite" | "magiclink" = "recovery",
  requestOrigin?: string | null,
): string {
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return buildAppUrl(`/auth/callback?type=${type}&next=${encodeURIComponent(safeNext)}`, requestOrigin);
}
