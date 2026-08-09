/**
 * Domain types for Messaging Service.
 */
import type { Database, MessageType, UserRole } from "@/types/database";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];

export interface ParticipantPreview {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarBgColor: string | null;
  role: UserRole;
}

export interface MessagePreview {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ParticipantPreview[];
  otherParticipants: ParticipantPreview[];
  relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
  hasPaymentHistory: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  lastMessage: MessagePreview | null;
  unreadCount: number;
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

export interface CreateConversationInput {
  creatorId: string;
  participantIds: string[];
}
