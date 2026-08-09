/**
 * Domain types for User & Profile Service.
 */
import type { Database, UserRole } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface UpdateProfileInput {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  avatarBgColor?: string | null;
  coverUrl?: string | null;
}

export interface TenantProductTourSummary {
  status: "not_started" | "in_progress" | "skipped" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  lastEventAt: string | null;
}

export interface AdminUserListItem {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  productTourSummary: TenantProductTourSummary | null;
}

export interface AdminUserDetail {
  profile: ProfileRow;
  application: Database["public"]["Tables"]["landlord_applications"]["Row"] | null;
}
