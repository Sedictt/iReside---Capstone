/**
 * NotificationService — centralized service for creating, reading, and managing user notifications.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type {
  CreateNotificationInput,
  NotificationFilterOptions,
  NotificationRow,
} from "./notification.types";
import { NotificationValidationError } from "./notification.errors";

export class NotificationService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch notifications for a user with optional filtering.
   *
   * @param userId - Target user ID.
   * @param options - Optional filters (unreadOnly, types, limit, offset).
   * @returns Array of NotificationRow records.
   */
  async getNotifications(
    userId: string,
    options?: NotificationFilterOptions,
  ): Promise<NotificationRow[]> {
    let query = this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId);

    if (options?.unreadOnly) {
      query = query.eq("read", false);
    }

    if (options?.types && options.types.length > 0) {
      query = query.in("type", options.types);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: notifications, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    return notifications ?? [];
  }

  /**
   * Create and send a single in-app notification.
   *
   * @param input - Notification payload.
   * @returns Created NotificationRow.
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationRow> {
    if (!input.title?.trim() || !input.message?.trim()) {
      throw new NotificationValidationError("Title and message are required for notifications.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: notification, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title.trim(),
        message: input.message.trim(),
        data: (input.data ?? null) as Json | null,
        read: false,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      })
      .select("*")
      .single();

    if (error || !notification) {
      throw new Error(`Failed to create notification: ${error?.message}`);
    }

    return notification;
  }

  /**
   * Create a batch of notifications (e.g. for building-wide announcements or billing reminders).
   *
   * @param inputs - Array of notification payloads.
   */
  async createBatchNotifications(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;

    const currentTimestamp = new Date().toISOString();
    const records = inputs.map((input) => ({
      user_id: input.userId,
      type: input.type,
      title: input.title.trim(),
      message: input.message.trim(),
      data: (input.data ?? null) as Json | null,
      read: false,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
    }));

    const { error } = await this.supabase.from("notifications").insert(records);

    if (error) {
      throw new Error(`Failed to create batch notifications: ${error.message}`);
    }
  }

  /**
   * Mark a single notification as read.
   *
   * @param notificationId - Notification record ID.
   * @param userId - Target user ID.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications for a user as read.
   *
   * @param userId - Target user ID.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({
        read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Get count of unread notifications for a user.
   *
   * @param userId - Target user ID.
   * @returns Number of unread notifications.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new Error(`Failed to get unread notification count: ${error.message}`);
    }

    return count ?? 0;
  }
}
