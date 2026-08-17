/**
 * Standardized API Auth Guards
 *
 * Every API route should use these guards instead of copy-pasting
 * the same 4-line Supabase auth check. Each guard validates the
 * caller's identity and returns typed context, or throws a
 * response that the caller can return directly.
 *
 * @module lib/api/auth-guard
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database";
import { apiUnauthorized, apiForbidden, apiNotFound } from "./response";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Context returned after successful authentication. */
export interface AuthenticatedContext {
  readonly userId: string;
  readonly userEmail: string;
  readonly userRole: UserRole;
  readonly supabase: SupabaseClient<Database>;
}

/** Full user profile from the database. */
type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Requires a valid authenticated session.
 *
 * Verifies the JWT with Supabase and resolves the user's role.
 * Use this as the first guard in every protected API route.
 *
 * @param _authRequest - Optional. Reserved for future per-request validation
 *                       (e.g., API key, origin header). Currently reads from cookies.
 * @returns AuthenticatedContext with userId, userRole, and supabase client.
 *          Returns a 401 NextResponse if the caller is not authenticated.
 */
export async function requireAuthenticatedUser(
  _authRequest?: Request,
): Promise<AuthenticatedContext | Response> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authenticationError,
  } = await supabase.auth.getUser();

  if (authenticationError || !user) {
    return apiUnauthorized("Authentication required");
  }

  const userRole = resolveUserRole(supabase, user);
  const resolvedRole = await userRole;

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    userRole: resolvedRole,
    supabase,
  };
}

/**
 * Requires the caller to have one of the specified roles.
 *
 * Call this AFTER `requireAuthenticatedUser()`, or pass the context
 * from a prior call.
 *
 * @param authenticatedContext - Result from requireAuthenticatedUser().
 * @param allowedRoles          - One or more roles that are permitted.
 * @returns The same context if the role check passes.
 *          Throws a 403 if the user lacks the required role.
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
 *
 * @param authenticatedContext - Result from requireAuthenticatedUser().
 * @param propertyIdentifier   - The property ID to verify ownership of.
 * @throws 403 if the user is not a landlord or does not own the property.
 * @throws 404 if the property does not exist.
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
 *
 * Landlords can access leases on their properties.
 * Tenants can only access their own leases.
 *
 * @param authenticatedContext - Result from requireAuthenticatedUser().
 * @param leaseIdentifier      - The lease ID to verify access for.
 * @throws 403 if the user cannot access this lease.
 * @throws 404 if the lease does not exist.
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
    // Tenants can only access their own leases
    leaseQuery = baseQuery.eq("tenant_id", authenticatedContext.userId);
  } else {
    // Landlords: verify the lease is on one of their properties below
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the user's role from metadata or the profiles table.
 *
 * Prefers user_metadata.role (set during sign-up / JWT claims).
 * Falls back to querying the profiles table.
 * Defaults to "tenant" if neither source has a role.
 */
async function resolveUserRole(
  supabase: SupabaseClient<Database>,
  user: { id: string; user_metadata?: Record<string, unknown> },
): Promise<UserRole> {
  const metadataRole = user.user_metadata?.role;
  if (
    typeof metadataRole === "string" &&
    ["admin", "landlord", "tenant"].includes(metadataRole)
  ) {
    return metadataRole as UserRole;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) ?? "tenant";
}