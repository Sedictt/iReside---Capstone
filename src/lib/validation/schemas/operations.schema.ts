/**
 * Operations & communication validation schemas.
 *
 * Shared by the API routes / server actions (maintenance, amenity bookings,
 * calendar notes, community, messaging, IRIS, analytics, search) and the
 * matching client forms, so both reject exactly the same input with the same
 * message. Client-safe: no server-only imports.
 *
 * @module lib/validation/schemas/operations
 */

import { z } from "zod";
import {
  TEXT_LIMITS,
  dateRangeRule,
  isValidIsoDate,
  textRule,
  timeRangeRule,
  todayIsoDate,
  type FieldRuleResult,
} from "../rules";
import { zIsoDate, zOptionalText, zRequiredText, zUuid } from "../zod-fields";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Image MIME types accepted by public image buckets (SVG excluded: it can carry script). */
export const SAFE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const isSafeImageMimeType = (type: string | null | undefined) =>
  typeof type === "string" && (SAFE_IMAGE_MIME_TYPES as readonly string[]).includes(type.toLowerCase());

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Optional UUID query/body value where blank / "all" mean "no filter". */
const zOptionalUuidFilter = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value && value !== "all" ? value : null))
    .refine((value) => value === null || z.uuid().safeParse(value).success, `${label} is invalid.`);

/** Bounded integer query param (strings from URLSearchParams) with a default. */
export const zQueryInt = (label: string, { min, max, fallback }: { min: number; max: number; fallback: number }) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === "") return fallback;
      if (!/^-?\d+$/.test(value)) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number.` });
        return z.NEVER;
      }
      const parsed = Number(value);
      if (parsed < min || parsed > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be between ${min} and ${max}.` });
        return z.NEVER;
      }
      return parsed;
    });

/** Free-text search query: trimmed, capped at TEXT_LIMITS.search. */
export const zSearchQuery = (label = "Search") =>
  z
    .string()
    .trim()
    .max(TEXT_LIMITS.search, `${label} cannot exceed ${TEXT_LIMITS.search} characters.`)
    .optional()
    .nullable()
    .transform((value) => value ?? "");

/** Characters that change the meaning of a PostgREST `.or()` / `ilike` filter. */
export const sanitizeSearchTerm = (value: string) => value.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export const MAINTENANCE_LIMITS = {
  title: TEXT_LIMITS.title,
  description: TEXT_LIMITS.description,
  category: 50,
  maxImages: 5,
  imageBytes: 8 * 1024 * 1024,
  thirdPartyName: TEXT_LIMITS.personName,
} as const;

/** Postgres `maintenance_status` enum. */
export const MAINTENANCE_STATUSES = ["open", "assigned", "in_progress", "resolved", "closed"] as const;
/** Postgres `maintenance_priority` enum. */
export const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
/** Landlord-facing priority labels used by the landlord create form. */
export const MAINTENANCE_PRIORITY_LABELS = ["Critical", "High", "Medium", "Low"] as const;
export const SELF_REPAIR_DECISIONS = ["pending", "approved", "rejected"] as const;
export const REPAIR_METHODS = ["landlord", "third_party", "self_repair"] as const;
export const TENANT_REPAIR_STATUSES = ["not_started", "personnel_arrived", "repairing", "done"] as const;

export const maintenanceTitleRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Title", required: true, max: MAINTENANCE_LIMITS.title });
export const maintenanceDescriptionRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Description", required: true, max: MAINTENANCE_LIMITS.description });

/** Image reference: an http(s) URL (uploaded via the media route) or a base64 image data URL (mobile). */
const DATA_IMAGE_URL = /^data:image\/(png|jpe?g|webp|gif|heic|heif);base64,[a-z0-9+/=\s]+$/i;
const MAX_DATA_URL_LENGTH = Math.ceil((MAINTENANCE_LIMITS.imageBytes * 4) / 3) + 64;
const zImageRef = z
  .string({ error: "Image must be a URL." })
  .trim()
  .refine(
    (value) =>
      (HTTP_URL.test(value) && value.length <= 2048) || (value.length <= MAX_DATA_URL_LENGTH && DATA_IMAGE_URL.test(value)),
    "Each image must be an uploaded image link.",
  );

const zImageList = (label: string) =>
  z
    .array(zImageRef, { error: `${label} must be a list.` })
    .max(MAINTENANCE_LIMITS.maxImages, `You can attach up to ${MAINTENANCE_LIMITS.maxImages} images.`);

export const tenantMaintenanceCreateSchema = z.object({
  title: zRequiredText("Title", MAINTENANCE_LIMITS.title),
  description: zRequiredText("Description", MAINTENANCE_LIMITS.description),
  priority: z.enum(MAINTENANCE_PRIORITIES, { error: "Select a valid priority." }).optional(),
  // Category ids differ between the web (plumbing, hvac, ...) and mobile ("Plumbing", ...) forms,
  // so this stays free text but bounded.
  category: zOptionalText("Category", MAINTENANCE_LIMITS.category).transform((value) => value ?? undefined),
  images: zImageList("Images").optional(),
  fixItMyself: z.boolean({ error: "Self-repair must be true or false." }).optional(),
});
export type TenantMaintenanceCreateInput = z.output<typeof tenantMaintenanceCreateSchema>;

export const tenantMaintenanceUpdateSchema = z.object({
  requestId: zUuid("Request ID"),
  tenantRepairStatus: z.enum(TENANT_REPAIR_STATUSES, { error: "Select a valid repair status." }).optional(),
  tenantProvidedPhotos: z
    .array(z.string().trim().regex(HTTP_URL, "Each photo must be an uploaded image link.").max(2048))
    .max(MAINTENANCE_LIMITS.maxImages, `You can attach up to ${MAINTENANCE_LIMITS.maxImages} photos.`)
    .optional(),
});

export const landlordMaintenanceCreateSchema = z.object({
  propertyId: zOptionalUuidFilter("Property"),
  unitId: zUuid("Unit"),
  title: zRequiredText("Title", MAINTENANCE_LIMITS.title),
  description: zRequiredText("Description", MAINTENANCE_LIMITS.description),
  priority: z.enum(MAINTENANCE_PRIORITY_LABELS, { error: "Select a valid priority." }),
});

export const landlordMaintenanceUpdateSchema = z.object({
  requestId: zUuid("Request ID"),
  status: z.enum(MAINTENANCE_STATUSES, { error: "Select a valid status." }).optional(),
  selfRepairDecision: z.enum(SELF_REPAIR_DECISIONS, { error: "Select a valid self-repair decision." }).nullable().optional(),
  repairMethod: z.enum(REPAIR_METHODS, { error: "Select a valid repair method." }).nullable().optional(),
  thirdPartyName: z
    .string({ error: "Contractor name must be text." })
    .trim()
    .max(MAINTENANCE_LIMITS.thirdPartyName, `Contractor name cannot exceed ${MAINTENANCE_LIMITS.thirdPartyName} characters.`)
    .nullable()
    .optional(),
  photoRequested: z.boolean({ error: "Photo request must be true or false." }).optional(),
});

export const maintenanceListQuerySchema = z.object({
  propertyId: zOptionalUuidFilter("Property"),
});

// ---------------------------------------------------------------------------
// Amenity bookings
// ---------------------------------------------------------------------------

export const BOOKING_NOTES_MAX = TEXT_LIMITS.reason;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const bookingDateRule = (value: unknown, today = todayIsoDate()): FieldRuleResult => {
  if (typeof value !== "string" || !value.trim()) return "Booking date is required.";
  if (!isValidIsoDate(value)) return "Booking date must be a valid date.";
  if (value < today) return "Booking date cannot be in the past.";
  return undefined;
};

export const amenityBookingSchema = z
  .object({
    amenity_id: zUuid("Amenity"),
    booking_date: zIsoDate("Booking date"),
    start_time: z.string({ error: "Start time is required." }).trim().regex(TIME_OF_DAY, "Start time must be a valid time."),
    end_time: z.string({ error: "End time is required." }).trim().regex(TIME_OF_DAY, "End time must be a valid time."),
    notes: zOptionalText("Notes", BOOKING_NOTES_MAX),
  })
  .superRefine((value, ctx) => {
    const dateError = bookingDateRule(value.booking_date);
    if (dateError) ctx.addIssue({ code: "custom", path: ["booking_date"], message: dateError });
    const timeError = timeRangeRule(value.start_time, value.end_time);
    if (timeError) ctx.addIssue({ code: "custom", path: ["end_time"], message: timeError });
  });
export type AmenityBookingInput = z.output<typeof amenityBookingSchema>;

/** Inclusive-exclusive overlap of two HH:MM(:SS) ranges on the same day. */
export const timeRangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart.slice(0, 5) < bEnd.slice(0, 5) && bStart.slice(0, 5) < aEnd.slice(0, 5);

export const INACTIVE_BOOKING_STATUSES = ["cancelled", "canceled", "rejected", "declined"] as const;

// ---------------------------------------------------------------------------
// Calendar notes
// ---------------------------------------------------------------------------

export const CALENDAR_NOTE_LIMITS = {
  title: TEXT_LIMITS.title,
  description: TEXT_LIMITS.note,
  maxNotes: 500,
} as const;

/** Note ids are generated as `note-<timestamp>-<random>` (client or server). */
const NOTE_ID = /^note-[a-z0-9-]{1,60}$/i;

export const calendarNoteTitleRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Note title", required: true, max: CALENDAR_NOTE_LIMITS.title });
export const calendarNoteDescriptionRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Note details", required: false, max: CALENDAR_NOTE_LIMITS.description });

export const calendarNoteSchema = z.object({
  id: z.string().trim().regex(NOTE_ID, "Note ID is invalid.").optional().nullable(),
  date: zIsoDate("Date"),
  title: zRequiredText("Note title", CALENDAR_NOTE_LIMITS.title),
  description: z
    .string({ error: "Note details must be text." })
    .trim()
    .max(CALENDAR_NOTE_LIMITS.description, `Note details cannot exceed ${CALENDAR_NOTE_LIMITS.description} characters.`)
    .optional()
    .nullable()
    .transform((value) => value ?? ""),
});

export const calendarNoteDeleteQuerySchema = z.object({
  id: z.string({ error: "Note ID is required." }).trim().min(1, "Note ID is required.").regex(NOTE_ID, "Note ID is invalid."),
});

export const calendarEventsQuerySchema = z.object({
  propertyId: zOptionalUuidFilter("Property"),
});

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export const COMMUNITY_LIMITS = {
  title: 500,
  content: TEXT_LIMITS.description,
  comment: TEXT_LIMITS.note,
  pollOption: TEXT_LIMITS.shortText,
  minPollOptions: 2,
  maxPollOptions: 5,
  maxPhotos: 4,
  photoBytes: 10 * 1024 * 1024,
  reportReason: TEXT_LIMITS.reason,
} as const;

export const COMMUNITY_REACTION_TYPES = ["like", "heart", "thumbs_up", "clap", "celebration"] as const;

const zCommunityText = (label: string, max: number) =>
  z
    .string({ error: `${label} must be text.` })
    .trim()
    .max(max, `${label} cannot exceed ${max} characters.`)
    .optional()
    .nullable()
    .transform((value) => value ?? "");

const requireTitleOrContent = (message: string) => (value: { title: string; content: string }, ctx: z.RefinementCtx) => {
  if (!value.title && !value.content) ctx.addIssue({ code: "custom", path: ["content"], message });
};

export const communityPostBaseSchema = z.object({
  title: zCommunityText("Title", COMMUNITY_LIMITS.title),
  content: zCommunityText("Post", COMMUNITY_LIMITS.content),
  propertyId: zUuid("Property").optional().nullable(),
});

export const communityDiscussionSchema = communityPostBaseSchema.superRefine(
  requireTitleOrContent("Discussion post must have either a title or content."),
);
export const communityAnnouncementSchema = communityPostBaseSchema.superRefine(
  requireTitleOrContent("Announcement must have some content."),
);

/** Inline rule for poll options: at least 2 non-empty, unique (case-insensitive), within limits. */
export const pollOptionsRule = (options: unknown): FieldRuleResult => {
  if (!Array.isArray(options)) return "Poll options are required.";
  const cleaned = options.map((option) => (typeof option === "string" ? option.trim() : "")).filter(Boolean);
  if (cleaned.length < COMMUNITY_LIMITS.minPollOptions) return "A poll requires at least 2 options.";
  if (cleaned.length > COMMUNITY_LIMITS.maxPollOptions) return `A poll can have at most ${COMMUNITY_LIMITS.maxPollOptions} options.`;
  if (cleaned.some((option) => option.length > COMMUNITY_LIMITS.pollOption)) {
    return `Each poll option cannot exceed ${COMMUNITY_LIMITS.pollOption} characters.`;
  }
  if (new Set(cleaned.map((option) => option.toLowerCase())).size !== cleaned.length) return "Poll options must be unique.";
  return undefined;
};

export const communityPollSchema = communityPostBaseSchema
  .extend({
    options: z.array(z.string({ error: "Poll options must be text." }), { error: "Poll options are required." }).max(20),
  })
  .superRefine(requireTitleOrContent("A title or question is required for the poll."))
  .superRefine((value, ctx) => {
    const error = pollOptionsRule(value.options);
    if (error) ctx.addIssue({ code: "custom", path: ["options"], message: error });
  })
  .transform((value) => ({ ...value, options: value.options.map((option) => option.trim()).filter(Boolean) }));

export const communityPhotoAlbumSchema = communityPostBaseSchema.extend({
  imageUrls: z
    .array(z.string().trim().regex(HTTP_URL, "Each photo must be an uploaded image link.").max(2048), {
      error: "Photos are required.",
    })
    .min(1, "At least one photo is required for a photo album.")
    .max(COMMUNITY_LIMITS.maxPhotos, `You can add up to ${COMMUNITY_LIMITS.maxPhotos} photos.`),
});

export const communityPostUpdateSchema = z.object({
  postId: zUuid("Post"),
  title: z
    .string({ error: "Post title must be text." })
    .trim()
    .min(1, "Post title is required.")
    .max(COMMUNITY_LIMITS.title, `Post title cannot exceed ${COMMUNITY_LIMITS.title} characters.`)
    .optional(),
  content: z
    .string({ error: "Post must be text." })
    .trim()
    .max(COMMUNITY_LIMITS.content, `Post cannot exceed ${COMMUNITY_LIMITS.content} characters.`)
    .optional(),
});

export const communityCommentRule = (value: unknown): FieldRuleResult =>
  textRule(value, { label: "Comment", required: true, max: COMMUNITY_LIMITS.comment });

export const communityCommentSchema = z.object({
  postId: zUuid("Post"),
  content: z
    .string({ error: "Comment cannot be empty." })
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(COMMUNITY_LIMITS.comment, `Comment cannot exceed ${COMMUNITY_LIMITS.comment} characters.`),
  parentCommentId: zUuid("Parent comment").optional().nullable(),
});

export const communityCommentUpdateSchema = z.object({
  commentId: zUuid("Comment"),
  content: communityCommentSchema.shape.content,
});

export const communityReportSchema = z.object({
  postId: zUuid("Post"),
  reason: z
    .string({ error: "A report reason is required." })
    .trim()
    .min(1, "A report reason is required.")
    .max(COMMUNITY_LIMITS.reportReason, `Report reason cannot exceed ${COMMUNITY_LIMITS.reportReason} characters.`),
});

export const communityReactionSchema = z.object({
  postId: zUuid("Post"),
  reactionType: z.enum(COMMUNITY_REACTION_TYPES, { error: "Select a valid reaction." }),
});

export const communityVoteSchema = z.object({
  pollId: zUuid("Poll"),
  optionIndex: z
    .number({ error: "Invalid poll option selected." })
    .int("Invalid poll option selected.")
    .min(0, "Invalid poll option selected.")
    .max(COMMUNITY_LIMITS.maxPollOptions - 1, "Invalid poll option selected."),
});

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export const MESSAGE_LIMITS = {
  content: TEXT_LIMITS.message,
  metadataBytes: 20_000,
  attachments: 20,
  participants: 10,
  reportDetails: 3000,
  reportExactMessage: 2000,
  reportScreenshots: 4,
  reportScreenshotBytes: 5 * 1024 * 1024,
} as const;

export const MESSAGE_TYPES = ["text", "system", "image", "file"] as const;
export const MESSAGE_FILES_BUCKET = "message-files";
export const MESSAGE_REPORT_CATEGORIES = ["spam", "phishing", "harassment", "profanity", "other"] as const;
export const MESSAGE_USER_ACTIONS = ["archive", "unarchive", "block", "unblock"] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Validates client-supplied message metadata. File references must point into
 * this conversation's own folder of the message-files bucket, uploaded by the
 * sender — otherwise the read path would sign URLs for arbitrary storage objects.
 */
export function messageMetadataError(metadata: unknown, conversationId: string, senderId: string): string | undefined {
  if (metadata === null || metadata === undefined) return undefined;
  if (!isPlainObject(metadata)) return "Message metadata must be an object.";
  let serialized = "";
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    return "Message metadata is invalid.";
  }
  if (serialized.length > MESSAGE_LIMITS.metadataBytes) return "Message metadata is too large.";

  const ownPrefix = `${conversationId}/${senderId}/`;
  const checkRef = (ref: Record<string, unknown>): string | undefined => {
    if (ref.bucket !== undefined && ref.bucket !== MESSAGE_FILES_BUCKET) return "Attachment storage location is invalid.";
    if (ref.filePath !== undefined) {
      if (typeof ref.filePath !== "string" || !ref.filePath.startsWith(ownPrefix) || ref.filePath.includes("..")) {
        return "Attachment does not belong to this conversation.";
      }
    }
    return undefined;
  };

  const topLevel = checkRef(metadata);
  if (topLevel) return topLevel;

  if (metadata.attachments !== undefined) {
    if (!Array.isArray(metadata.attachments)) return "Attachments must be a list.";
    if (metadata.attachments.length > MESSAGE_LIMITS.attachments) {
      return `You can send up to ${MESSAGE_LIMITS.attachments} attachments at once.`;
    }
    for (const attachment of metadata.attachments) {
      if (!isPlainObject(attachment)) return "Attachment is invalid.";
      const error = checkRef(attachment);
      if (error) return error;
    }
  }
  return undefined;
}

export const messageSendSchema = z.object({
  content: z
    .string({ error: "Message must be text." })
    .max(MESSAGE_LIMITS.content, `Message cannot exceed ${MESSAGE_LIMITS.content} characters.`)
    .optional()
    .nullable()
    .transform((value) => (value ?? "").trim()),
  type: z.enum(MESSAGE_TYPES, { error: "Invalid message type." }).optional().default("text"),
  metadata: z.unknown().optional(),
});

export const conversationCreateSchema = z.object({
  participantIds: z
    .array(z.string({ error: "Participant is invalid." }).trim(), { error: "At least one participant is required." })
    .max(MESSAGE_LIMITS.participants, `A conversation can have at most ${MESSAGE_LIMITS.participants} participants.`)
    .superRefine((ids, ctx) => {
      if (ids.some((id) => !z.uuid().safeParse(id).success)) {
        ctx.addIssue({ code: "custom", message: "Participant is invalid." });
      }
    }),
});

export const messagesListQuerySchema = z.object({
  limit: zQueryInt("Limit", { min: 1, max: 100, fallback: 20 }),
  before: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Cursor is invalid.")
    .transform((value) => value || null),
});

export const messageUserActionSchema = z.object({
  action: z.enum(MESSAGE_USER_ACTIONS, { error: "Invalid action." }),
});

export const messageReportSchema = z
  .object({
    conversationId: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => value || null)
      .refine((value) => value === null || z.uuid().safeParse(value).success, "Conversation is invalid."),
    category: z.enum(MESSAGE_REPORT_CATEGORIES, { error: "Select a valid report category." }),
    details: z
      .string()
      .trim()
      .max(MESSAGE_LIMITS.reportDetails, "Report details are too long.")
      .optional()
      .nullable()
      .transform((value) => value ?? ""),
    exactMessage: z
      .string()
      .trim()
      .max(MESSAGE_LIMITS.reportExactMessage, "Exact reported message is too long.")
      .optional()
      .nullable()
      .transform((value) => value ?? ""),
    reportedMessageId: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => value || "")
      .refine((value) => !value || z.uuid().safeParse(value).success, "Message ID must be a valid message identifier."),
  });

export const messageUserSearchQuerySchema = z.object({
  q: zSearchQuery(),
  limit: zQueryInt("Limit", { min: 1, max: 20, fallback: 8 }),
});

/** Visual-planner unit ids may be unsaved draft ids; anything that is not a UUID is ignored. */
const zLenientUnitId = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value && z.uuid().safeParse(value).success ? value : null));

export const unitMessagesQuerySchema = z
  .object({
    unitId: zLenientUnitId,
    tenantName: z
      .string()
      .trim()
      .max(TEXT_LIMITS.shortText, `Tenant name cannot exceed ${TEXT_LIMITS.shortText} characters.`)
      .optional()
      .nullable()
      .transform((value) => value || null),
  })
  .refine((value) => Boolean(value.unitId || value.tenantName), { message: "unitId or tenantName is required", path: ["unitId"] });

export const unitMessageSendSchema = z.object({
  unitId: zLenientUnitId,
  tenantUserId: zUuid("Tenant").optional().nullable(),
  conversationId: zUuid("Conversation").optional().nullable(),
  content: zRequiredText("Message content", MESSAGE_LIMITS.content),
});

// ---------------------------------------------------------------------------
// IRIS
// ---------------------------------------------------------------------------

export const IRIS_MESSAGE_MAX = TEXT_LIMITS.description;

export const irisChatSchema = z.object({
  message: z
    .string({ error: "Message is required and must be a string." })
    .trim()
    .min(1, "Message is required and must be a string.")
    .max(IRIS_MESSAGE_MAX, `Message cannot exceed ${IRIS_MESSAGE_MAX} characters.`),
});

export const irisRedactSchema = z.object({
  message: z
    .string({ error: "Message is required and must be a string." })
    .max(MESSAGE_LIMITS.content, `Message cannot exceed ${MESSAGE_LIMITS.content} characters.`)
    .refine((value) => value.trim().length > 0, "Message is required and must be a string."),
});

export const irisHistoryQuerySchema = z.object({
  limit: zQueryInt("Limit", { min: 1, max: 300, fallback: 100 }),
});

// ---------------------------------------------------------------------------
// Analytics, reports, exports, search, audit logs
// ---------------------------------------------------------------------------

/** Matches the analytics page date inputs (min 2000-01-01, max 2099-12-31). */
export const ANALYTICS_DATE_BOUNDS = { min: "2000-01-01", max: "2099-12-31" } as const;

export const analyticsDateRule = (value: unknown, label: string): FieldRuleResult => {
  if (typeof value !== "string" || !value.trim()) return `${label} is required.`;
  if (!isValidIsoDate(value)) return `${label} must be a valid date.`;
  if (value < ANALYTICS_DATE_BOUNDS.min || value > ANALYTICS_DATE_BOUNDS.max) {
    return `${label} must be between 2000 and 2099.`;
  }
  return undefined;
};

const zOptionalAnalyticsDate = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value || null)
    .superRefine((value, ctx) => {
      if (value === null) return;
      const error = analyticsDateRule(value, label);
      if (error) ctx.addIssue({ code: "custom", message: error });
    });

export const analyticsOverviewQuerySchema = z
  .object({
    start: zOptionalAnalyticsDate("Start date"),
    end: zOptionalAnalyticsDate("End date"),
    propertyId: zOptionalUuidFilter("Property"),
  })
  .superRefine((value, ctx) => {
    const error = dateRangeRule(value.start, value.end);
    if (error) ctx.addIssue({ code: "custom", path: ["end"], message: error });
  });

export const REPORT_FORMATS = ["csv", "pdf"] as const;
export const REPORT_MODES = ["Simplified", "Detailed"] as const;

const zReportCell = (label: string, max: number) =>
  z.string({ error: `${label} must be text.` }).max(max, `${label} is too long.`);

export const analyticsReportSchema = z.object({
  format: z.enum(REPORT_FORMATS, { error: "Select a valid report format." }),
  mode: z.enum(REPORT_MODES, { error: "Select a valid report mode." }),
  includeExpandedKpis: z.boolean().optional().default(false),
  range: zRequiredText("Report range", TEXT_LIMITS.shortText),
  generatedAt: z.string().trim().max(100).optional(),
  rows: z
    .array(
      z.object({
        metric: zReportCell("Metric", TEXT_LIMITS.shortText),
        value: zReportCell("Value", TEXT_LIMITS.shortText),
        change: zReportCell("Change", TEXT_LIMITS.shortText),
        trend: zReportCell("Trend", 20_000),
      }),
      { error: "Report rows are required." },
    )
    .max(100, "Too many report rows."),
});

export const analyticsReportHistoryQuerySchema = z.object({
  limit: zQueryInt("Limit", { min: 1, max: 50, fallback: 10 }),
  offset: zQueryInt("Offset", { min: 0, max: 100_000, fallback: 0 }),
});

export const analyticsInsightsSchema = z
  .object({
    rangeStart: zIsoDate("Start date"),
    rangeEnd: zIsoDate("End date"),
    kpis: z
      .array(
        z.object({
          title: zRequiredText("KPI title", TEXT_LIMITS.shortText),
          value: z.string().max(TEXT_LIMITS.shortText),
          change: z.string().max(TEXT_LIMITS.shortText),
          trendData: z.array(z.number().finite()).max(400),
          changeType: z.enum(["positive", "negative", "neutral"]),
        }),
      )
      .min(1, "No valid KPI records found.")
      .max(30, "Too many KPI records."),
  })
  .superRefine((value, ctx) => {
    const error = dateRangeRule(value.rangeStart, value.rangeEnd);
    if (error) ctx.addIssue({ code: "custom", path: ["rangeEnd"], message: error });
  });

export const EXPORT_CATEGORIES = ["financials", "properties", "rent_roll"] as const;
export const EXPORT_RANGES = ["ytd", "12m", "all"] as const;

export const landlordExportQuerySchema = z.object({
  category: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value || "financials")
    .pipe(z.enum(EXPORT_CATEGORIES, { error: "Invalid export category." })),
  range: z
    .string()
    .optional()
    .nullable()
    .transform((value) => value || "ytd")
    .pipe(z.enum(EXPORT_RANGES, { error: "Select a valid export range." })),
});

export const landlordSearchQuerySchema = z.object({
  q: zSearchQuery(),
});

export const AUDIT_CATEGORIES = ["all", "billing", "security", "settings", "properties", "maintenance", "general"] as const;
export const AUDIT_SEVERITIES = ["all", "info", "warning", "critical"] as const;

export const auditLogQuerySchema = z.object({
  category: z.enum(AUDIT_CATEGORIES, { error: "Select a valid category." }).optional().nullable(),
  severity: z.enum(AUDIT_SEVERITIES, { error: "Select a valid severity." }).optional().nullable(),
  search: zSearchQuery(),
  export: z.string().optional().nullable(),
  limit: zQueryInt("Limit", { min: 1, max: 500, fallback: 100 }),
});
