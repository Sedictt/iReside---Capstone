/**
 * User and Profile test factory.
 *
 * @module __tests__/factories/user.factory
 */
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function buildUserProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "user-123",
    email: "user@example.com",
    role: "tenant",
    full_name: "Test User",
    phone: "+639171234567",
    avatar_url: null,
    avatar_bg_color: null,
    cover_url: null,
    business_name: null,
    business_permit_url: null,
    business_verification_status: "pending",
    is_profile_completed: true,
    has_seen_product_tour: false,
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}

export function buildAuthenticatedContext(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-123",
    userEmail: "user@example.com",
    userRole: "tenant",
    supabase: {} as any,
    ...overrides,
  };
}
