/**
 * UserService — data access and operations for user profiles and admin user management.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AdminUserDetail,
  AdminUserListItem,
  ProfileRow,
  TenantProductTourSummary,
  UpdateProfileInput,
} from "./user.types";

import { UserNotFoundError, UserValidationError } from "./user.errors";

export class UserService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Retrieve a user profile by ID.
   *
   * @param userId - User ID to look up.
   * @returns ProfileRow or null if not found.
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return profile;
  }

  /**
   * Update fields on a user profile.
   *
   * @param userId - User ID to update.
   * @param input - Partial profile fields to update.
   * @returns Updated ProfileRow.
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileRow> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.fullName !== undefined) updatePayload.full_name = input.fullName;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.address !== undefined) updatePayload.address = input.address;
    if (input.bio !== undefined) updatePayload.bio = input.bio;
    if (input.avatarUrl !== undefined) updatePayload.avatar_url = input.avatarUrl;
    if (input.avatarBgColor !== undefined) updatePayload.avatar_bg_color = input.avatarBgColor;
    if (input.coverUrl !== undefined) updatePayload.cover_url = input.coverUrl;

    const { data: updatedProfile, error } = await this.supabase
      .from("profiles")
      .update(updatePayload as any)
      .eq("id", userId)
      .select()
      .single();

    if (error || !updatedProfile) {
      throw new Error(`Failed to update profile: ${error?.message}`);
    }

    return updatedProfile;
  }

  /**
   * Fetch all registered users for the admin portal, joining product tour states for tenants.
   *
   * @returns Array of AdminUserListItem.
   */
  async listUsersForAdmin(): Promise<AdminUserListItem[]> {
    const { data: profiles, error: dbError } = await this.supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      throw new Error(`Failed to load users: ${dbError.message}`);
    }

    const profileRows = profiles ?? [];
    const tenantIds = profileRows.filter((p) => p.role === "tenant").map((p) => p.id);

    const { data: tourRows } = tenantIds.length
      ? await (this.supabase as any)
          .from("tenant_product_tour_states")
          .select("tenant_id, status, started_at, completed_at, last_event_at")
          .in("tenant_id", tenantIds)
      : { data: [] };

    const tourMap = new Map<string, TenantProductTourSummary>(
      (tourRows ?? []).map((row: any) => [
        row.tenant_id,
        {
          status: row.status ?? "not_started",
          startedAt: row.started_at ?? null,
          completedAt: row.completed_at ?? null,
          lastEventAt: row.last_event_at ?? null,
        },
      ]),
    );


    return profileRows.map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      productTourSummary:
        profile.role === "tenant"
          ? tourMap.get(profile.id) ?? {
              status: "not_started",
              startedAt: null,
              completedAt: null,
              lastEventAt: null,
            }
          : null,
    }));
  }

  /**
   * Retrieve full details for a user in the admin panel, including landlord applications if applicable.
   *
   * @param userId - User ID.
   * @returns Object containing profile and application (if landlord).
   */
  async getUserDetailForAdmin(userId: string): Promise<AdminUserDetail> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new UserNotFoundError(userId);
    }

    let application = null;
    if (profile.role === "landlord") {
      const { data: appData } = await this.supabase
        .from("landlord_applications")
        .select(`
          *,
          landlord:profiles!landlord_applications_profile_id_fkey(full_name, email, phone)
        `)
        .eq("profile_id", userId)
        .maybeSingle();

      application = appData ?? null;
    }

    return {
      profile,
      application,
    };
  }
}
