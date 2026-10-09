/**
 * Standardized API Auth Guards
 *
 * Every API route should use these guards instead of copy-pasting
 * the same 4-line Supabase auth check. Each guard validates the
 * caller's identity and returns typed context, or throws a
 * response that the caller can return directly.
 *
 * Security model:
 * - The session JWT is cryptographically verified via `auth.getClaims()`.
 *   The payload is never trusted on its own: a cookie is attacker-controlled
 *   input, and an unverified decode would let anyone impersonate any user id.
 * - The caller's role comes from `profiles.role` (protected by a DB trigger),
 *   never from `user_metadata`, which any signed-in user can edit themselves.
 * - Accounts with two-factor enabled must present the signed verified-device
 *   cookie, so 2FA cannot be skipped by calling the API directly.
 *
 * @module lib/api/auth-guard
 */

import { createHash } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database";
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from "./response";
import { cookies } from "next/headers";
import {
  TWO_FACTOR_VERIFIED_COOKIE,
  verifyTwoFactorVerifiedCookieValue,
} from "@/lib/security/two-factor-cookie";

// ---------------------------------------------------------------------------
// Types & In-Memory Deduplication Cache
// ---------------------------------------------------------------------------

/** Context returned after successful authentication. */
export interface AuthenticatedContext {
  readonly userId: string;
  readonly userEmail: string;
  readonly userRole: UserRole;
  readonly supabase: SupabaseClient<Database>;
}

export interface RequireAuthOptions {
  /**
   * Allow a caller whose account has 2FA enabled but who has not yet completed
   * the OTP challenge on this device. Only the 2FA challenge/verify endpoints
   * themselves should set this.
   */
  allowPendingTwoFactor?: boolean;
}

interface VerifiedIdentity {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  twoFactorEnabled: boolean;
}

interface CachedIdentity extends VerifiedIdentity {
  expiresAt: number;
}

const VALID_ROLES: readonly UserRole[] = ["admin", "landlord", "tenant"];
const IDENTITY_CACHE_TTL_MS = 60_000;
const IDENTITY_CACHE_MAX_ENTRIES = 2_000;
const CLAIMS_TIMEOUT_MS = 12_000;
const PROFILE_TIMEOUT_MS = 3_000;

// Verified identities, keyed by a hash of the auth cookies. Only identities
// that passed signature verification are ever stored here.
const identityCache = new Map<string, CachedIdentity>();
// In-flight deduplication: parallel requests with the same cookies share one verification.
const inFlightVerifications = new Map<string, Promise<VerifiedIdentity | null>>();

type CookieStore = { getAll(): Array<{ name: string; value: string }>; get(name: string): { value: string } | undefined };

const isAuthCookie = (name: string) =>
  name.includes("-auth-token") || name.startsWith("sb-") || name === "supabase-auth-token";

function buildCacheKey(cookieStore: CookieStore): string | null {
  try {
    const tokenCookies = cookieStore
      .getAll()
      .filter((cookie) => isAuthCookie(cookie.name))
      .sort((left, right) => left.name.localeCompare(right.name));
    if (!tokenCookies.length) return null;
    const material = tokenCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(";");
    // Hash so raw session tokens are never held in the cache map.
    return createHash("sha256").update(material).digest("hex");
  } catch {
    return null;
  }
}

function readCache(cacheKey: string): VerifiedIdentity | null {
  const cached = identityCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    identityCache.delete(cacheKey);
    return null;
  }
  return cached;
}

function writeCache(cacheKey: string, identity: VerifiedIdentity): void {
  if (identityCache.size >= IDENTITY_CACHE_MAX_ENTRIES) {
    const oldestKey = identityCache.keys().next().value;
    if (oldestKey !== undefined) identityCache.delete(oldestKey);
  }
  identityCache.set(cacheKey, { ...identity, expiresAt: Date.now() + IDENTITY_CACHE_TTL_MS });
}

/** Test/maintenance hook: drop every cached identity (e.g. after a role change). */
export function clearAuthIdentityCache(): void {
  identityCache.clear();
  inFlightVerifications.clear();
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, fallback: T): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

const toRole = (value: unknown): UserRole | null =>
  typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value) ? (value as UserRole) : null;

/**
 * Loads the authoritative role and 2FA state from `profiles`. The profile row
 * is the source of truth: `user_metadata.role` is user-editable and must not
 * decide authorization. On lookup failure we fall back to least privilege.
 */
async function loadProfileSecurity(
  supabase: SupabaseClient<Database>,
  userId: string,
  claims: Record<string, unknown>,
): Promise<{ userRole: UserRole; twoFactorEnabled: boolean }> {
  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const fallback = {
    userRole: "tenant" as UserRole,
    twoFactorEnabled: metadata.two_factor_enabled === true,
  };

  try {
    const query = supabase
      .from("profiles")
      .select("role, two_factor_enabled")
      .eq("id", userId)
      .maybeSingle();
    const result = await withTimeout(
      query as unknown as Promise<{ data: { role?: string | null; two_factor_enabled?: boolean | null } | null; error: unknown }>,
      PROFILE_TIMEOUT_MS,
      { data: null, error: new Error("Profile lookup timed out") },
    );

    if (result.error || !result.data) return fallback;

    return {
      userRole: toRole(result.data.role) ?? "tenant",
      twoFactorEnabled: result.data.two_factor_enabled === true || fallback.twoFactorEnabled,
    };
  } catch {
    return fallback;
  }
}

/** Verifies the session JWT signature and resolves the caller's identity. */
async function verifyIdentity(supabase: SupabaseClient<Database>): Promise<VerifiedIdentity | null> {
  try {
    const claimsResult = await withTimeout(
      supabase.auth.getClaims(),
      CLAIMS_TIMEOUT_MS,
      { data: null, error: new Error("Auth verification timed out") } as Awaited<ReturnType<typeof supabase.auth.getClaims>>,
    );

    if (claimsResult.error || !claimsResult.data?.claims) return null;

    const claims = claimsResult.data.claims as Record<string, unknown>;
    const userId = typeof claims.sub === "string" ? claims.sub : "";
    if (!userId) return null;

    const { userRole, twoFactorEnabled } = await loadProfileSecurity(supabase, userId, claims);

    return {
      userId,
      userEmail: typeof claims.email === "string" ? claims.email : "",
      userRole,
      twoFactorEnabled,
    };
  } catch (error) {
    console.warn("[requireAuthenticatedUser] Auth verification error:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Requires a valid authenticated session.
 *
 * Verifies the JWT signature (locally when the project uses asymmetric signing
 * keys), resolves the role from the database, and enforces two-factor
 * verification for accounts that enabled it. Verified identities are cached
 * in memory for 60 seconds per cookie set.
 *
 * @param _authRequest - Optional. Reserved for future per-request validation.
 * @param options      - See {@link RequireAuthOptions}.
 * @returns AuthenticatedContext with userId, userRole, and supabase client.
 *          Returns a 401 NextResponse if the caller is not authenticated.
 */
export async function requireAuthenticatedUser(
  _authRequest?: Request,
  options: RequireAuthOptions = {},
): Promise<AuthenticatedContext | Response> {
  const cookieStore = (await cookies()) as unknown as CookieStore;
  const supabase = await createServerSupabaseClient();
  const cacheKey = buildCacheKey(cookieStore);

  let identity: VerifiedIdentity | null = cacheKey ? readCache(cacheKey) : null;

  if (!identity) {
    let verification: Promise<VerifiedIdentity | null>;
    if (cacheKey && inFlightVerifications.has(cacheKey)) {
      verification = inFlightVerifications.get(cacheKey)!;
    } else {
      verification = verifyIdentity(supabase).finally(() => {
        if (cacheKey) inFlightVerifications.delete(cacheKey);
      });
      if (cacheKey) inFlightVerifications.set(cacheKey, verification);
    }

    identity = await verification;
    if (!identity) {
      return apiUnauthorized("Authentication required");
    }
    if (cacheKey) writeCache(cacheKey, identity);
  }

  if (identity.twoFactorEnabled && !options.allowPendingTwoFactor) {
    const verifiedCookie = cookieStore.get(TWO_FACTOR_VERIFIED_COOKIE)?.value;
    const isDeviceVerified = await verifyTwoFactorVerifiedCookieValue(verifiedCookie, identity.userId);
    if (!isDeviceVerified) {
      return apiError(
        "UNAUTHORIZED",
        "Two-factor verification is required before this action can be performed.",
        401,
        { code: "TWO_FACTOR_REQUIRED" },
      );
    }
  }

  return {
    userId: identity.userId,
    userEmail: identity.userEmail,
    userRole: identity.userRole,
    supabase,
  };
}

/**
 * Requires the caller to have one of the specified roles.
 */
export function requireRole(
  authenticatedContext: AuthenticatedContext,
  ...allowedRoles: UserRole[]
): AuthenticatedContext {
  if (!allowedRoles.includes(authenticatedContext.userRole)) {
    throw apiForbidden(
      `This action requires one of these roles: ${allowedRoles.join(", ")}`,
    );
  }
  return authenticatedContext;
}

/**
 * Requires the caller to be the landlord who owns a given property.
 */
export async function requireLandlordOwnsProperty(
  authenticatedContext: AuthenticatedContext,
  propertyIdentifier: string,
): Promise<void> {
  if (authenticatedContext.userRole !== "landlord") {
    throw apiForbidden("Only landlords can access this resource");
  }

  const { data: property, error: queryError } =
    await authenticatedContext.supabase
      .from("properties")
      .select("id")
      .eq("id", propertyIdentifier)
      .eq("landlord_id", authenticatedContext.userId)
      .maybeSingle();

  if (queryError || !property) {
    throw apiNotFound("Property");
  }
}

/**
 * Requires the caller to have access to a given lease.
 */
export async function requireAccessToLease(
  authenticatedContext: AuthenticatedContext,
  leaseIdentifier: string,
): Promise<void> {
  const baseQuery = authenticatedContext.supabase
    .from("leases")
    .select("id, tenant_id, unit_id")
    .eq("id", leaseIdentifier);

  let leaseQuery;
  if (authenticatedContext.userRole === "tenant") {
    leaseQuery = baseQuery.eq("tenant_id", authenticatedContext.userId);
  } else {
    leaseQuery = baseQuery;
  }

  const { data: lease, error: queryError } = await leaseQuery.maybeSingle();

  if (queryError || !lease) {
    throw apiNotFound("Lease");
  }

  if (authenticatedContext.userRole === "landlord") {
    const { data: unitOwnership } = await authenticatedContext.supabase
      .from("units")
      .select("property_id")
      .eq("id", lease.unit_id)
      .maybeSingle();

    if (!unitOwnership) {
      throw apiNotFound("Lease");
    }

    const { data: propertyOwnership } = await authenticatedContext.supabase
      .from("properties")
      .select("id")
      .eq("id", unitOwnership.property_id)
      .eq("landlord_id", authenticatedContext.userId)
      .maybeSingle();

    if (!propertyOwnership) {
      throw apiForbidden("You do not own the property this lease belongs to");
    }
  }
}
