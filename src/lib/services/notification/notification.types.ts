/**
 * Domain types for Notification Service.
 */
import type { Database, Json, NotificationType } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
}

export interface NotificationFilterOptions {
  unreadOnly?: boolean;
  types?: NotificationType[];
  limit?: number;
  offset?: number;
}
