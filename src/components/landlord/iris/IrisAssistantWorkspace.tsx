"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  CreditCard,
  Wrench,
  FileText,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ArrowUp,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  Minus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LandlordOperationsContext,
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
  IrisCardData,
  AudienceFilterType,
  IrisTemplateKey,
} from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";
import { useOptionalAuth } from "@/context/AuthContext";

export type IrisActiveView =
  | "dashboard"
  | "settlement"
  | "maintenance"
  | "renewals"
  | "directory";

type ActiveFlow =
  | {
      kind: "invoice";
      step: "target" | "confirm_all" | "pick_tenant" | "items" | "water" | "electricity" | "confirm_single";
      lease?: ActiveLeaseSummary;
      waterReading?: number;
      waterSkipped?: boolean;
      electricReading?: number;
      electricSkipped?: boolean;
    }
  | {
      kind: "broadcast";
      step: "audience" | "pick_tenant" | "template" | "message" | "custom_text" | "confirm";
      filterType?: AudienceFilterType;
      audienceLabel?: string;
      selectedLeaseIds?: string[];
      templateKey?: IrisTemplateKey;
      templateLabel?: string;
      customMessage?: string;
    }
  | {
      kind: "payment";
      step: "pick_tenant" | "amount" | "method" | "confirm";
      lease?: ActiveLeaseSummary;
      amount?: number;
      method?: "cash" | "bank_transfer" | "in_person";
    }
  | {
      kind: "maintenance";
      step: "pick_ticket" | "pick_status";
      ticket?: MaintenanceTicketSummary;
    }
  | {
      kind: "renewals";
      step: "pick_lease" | "pick_term";
      lease?: ActiveLeaseSummary;
    }
  | null;

type BotNodeId =
  | "menu"
  | "unpaid_rent"
  | "maintenance"
  | "renewals"
  | "summary"
  | "directory";

interface BotOptionButton {
  label: string;
  action:
    | { type: "node"; nodeId: BotNodeId; userEcho?: string; page?: number }
    | { type: "flow_start"; kind: NonNullable<ActiveFlow>["kind"]; userEcho?: string }
    | { type: "flow_step"; payload: Record<string, unknown>; userEcho?: string }
    | { type: "conversation"; tenantId: string };
}

interface ResidentCardData {
  type: "resident_detail";
  lease: ActiveLeaseSummary;
}

type WorkspaceCardData = IrisCardData | ResidentCardData;

interface ChatMessage {
  id: string;
  role: "user" | "iris";
  content: string;
  timestamp: Date;
  card?: WorkspaceCardData | null;
  options?: BotOptionButton[];
}

export interface IrisAssistantWorkspaceProps {
  initialContext?: LandlordOperationsContext;
  onOpenConversation?: (participantUserId: string) => void;
  onBroadcastSuccess?: () => void;
  onBack?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
}

const getFirstName = (fullName?: string | null) => {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
};

const getUserInitials = (fullName?: string | null) => {
  if (!fullName) return "You";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "You";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "You";
};

const MAIN_MENU_OPTIONS: BotOptionButton[] = [
  { label: "Create an Invoice", action: { type: "flow_start", kind: "invoice", userEcho: "Create an Invoice" } },
  { label: "Record a Payment", action: { type: "flow_start", kind: "payment", userEcho: "Record a Payment" } },
  { label: "Broadcast a Notice", action: { type: "flow_start", kind: "broadcast", userEcho: "Broadcast a Notice" } },
  { label: "Check Unpaid Rent", action: { type: "node", nodeId: "unpaid_rent", userEcho: "Check Unpaid Rent" } },
  { label: "Open Repair Tickets", action: { type: "node", nodeId: "maintenance", userEcho: "Open Repair Tickets" } },
  { label: "Expiring Leases", action: { type: "node", nodeId: "renewals", userEcho: "Expiring Leases" } },
  { label: "Property Summary", action: { type: "node", nodeId: "summary", userEcho: "Property Summary" } },
  { label: "Find a Resident", action: { type: "node", nodeId: "directory", userEcho: "Find a Resident" } },
];

const CANCEL_OPTION: BotOptionButton = {
  label: "Cancel",
  action: { type: "flow_step", payload: { cancel: true }, userEcho: "Cancel" },
};

const QUERY_STOP_WORDS = new Set([
  "the", "and", "for", "you", "are", "can", "how", "who", "has", "have",
  "not", "all", "pay", "rent", "due", "bill", "new", "one", "two", "get",
  "set", "add", "with", "from", "this", "that", "what", "when", "where",
  "will", "want", "need", "help", "some", "any", "ang", "mga", "may",
  "ung", "yung", "para", "naman", "lang", "kasi", "pero", "dito",
]);

function findLeaseByQuery(leases: ActiveLeaseSummary[], rawQuery: string): ActiveLeaseSummary | undefined {
  const text = rawQuery.toLowerCase().trim();
  if (!text) return undefined;

  const queryWords = text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 3 && !QUERY_STOP_WORDS.has(w));

  return leases.find((l) => {
    const tenantLower = l.tenantName.toLowerCase();
    const tenantTokens = tenantLower.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, ""));
    const unitLower = l.unitName.toLowerCase();

    if (tenantLower.length >= 3 && text.includes(tenantLower)) return true;
    if (unitLower.length >= 2 && text.includes(unitLower)) return true;
    return queryWords.some((qw) => tenantTokens.includes(qw));
  });
}

function buildNodeReply(
  nodeId: BotNodeId,
  ctx: LandlordOperationsContext | null,
  firstName?: string | null,
  page = 0
): Omit<ChatMessage, "id" | "role" | "timestamp"> {
  const overdueLeases = ctx?.overdueLeases ?? [];
  const openTickets = ctx?.openTickets ?? [];
  const expiringLeases = ctx?.expiringLeases ?? [];
  const activeLeases = ctx?.activeLeases ?? [];
  const totalReceivables = ctx?.totalReceivables ?? 0;
  const occupancyRate = ctx?.occupancyRate ?? 0;

  switch (nodeId) {
    case "menu": {
      const nameSegment = firstName ? `, ${firstName}` : "";
      return {
        content: `Hi${nameSegment}! I'm iRis, your property assistant. Pick an option below or type what you need (e.g. "create an invoice", "unpaid rent", or a tenant's name).`,
        options: MAIN_MENU_OPTIONS,
      };
    }

    case "unpaid_rent":
      return {
        content:
          overdueLeases.length === 0
            ? "Good news! All active residents are up to date on rent right now."
            : `You have ${overdueLeases.length} ${overdueLeases.length === 1 ? "unit" : "units"} with unpaid rent totaling ${formatPhpCurrency(totalReceivables)}.`,
        card: {
          type: "landlord_unpaid",
          totalReceivables,
          leases: overdueLeases.slice(0, 6).map((l) => ({
            id: l.id,
            tenantName: l.tenantName,
            unitName: l.unitName,
            outstandingBalance: l.outstandingBalance,
            daysOverdue: l.daysOverdue,
          })),
        },
        options: [
          ...(overdueLeases.length > 0
            ? [{ label: "Record a Payment", action: { type: "flow_start" as const, kind: "payment" as const, userEcho: "Record a Payment" } }]
            : []),
          { label: "Send Payment Reminder", action: { type: "flow_start", kind: "broadcast", userEcho: "Send Payment Reminder" } },
          { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
        ],
      };

    case "maintenance":
      return {
        content:
          openTickets.length === 0
            ? "There are no open repair tickets right now. Everything is resolved."
            : `There ${openTickets.length === 1 ? "is" : "are"} ${openTickets.length} open repair ${openTickets.length === 1 ? "ticket" : "tickets"} needing attention.`,
        card: {
          type: "landlord_maintenance",
          tickets: openTickets.slice(0, 6).map((t) => ({
            id: t.id,
            title: t.title,
            unitName: t.unitName,
            tenantName: t.tenantName,
            priority: t.priority,
            status: t.status,
          })),
        },
        options: [
          ...(openTickets.length > 0
            ? [{ label: "Update a Ticket", action: { type: "flow_start" as const, kind: "maintenance" as const, userEcho: "Update a Ticket" } }]
            : []),
          { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
        ],
      };

    case "renewals":
      return {
        content:
          expiringLeases.length === 0
            ? "No leases are expiring within the next 60 days."
            : `You have ${expiringLeases.length} ${expiringLeases.length === 1 ? "lease" : "leases"} expiring within the next 60 days.`,
        card: {
          type: "landlord_renewals",
          leases: expiringLeases.slice(0, 6).map((l) => ({
            id: l.id,
            tenantName: l.tenantName,
            unitName: l.unitName,
            endDate: l.endDate,
            monthlyRent: l.monthlyRent,
          })),
        },
        options: [
          ...(expiringLeases.length > 0
            ? [{ label: "Send Renewal Offer", action: { type: "flow_start" as const, kind: "renewals" as const, userEcho: "Send Renewal Offer" } }]
            : []),
          { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
        ],
      };

    case "summary":
      return {
        content: `Here is your current property overview (${activeLeases.length} active leases at ${occupancyRate}% occupancy):`,
        card: {
          type: "landlord_overview",
          totalReceivables,
          overdueCount: overdueLeases.length,
          openTicketsCount: openTickets.length,
          expiringLeasesCount: expiringLeases.length,
          occupancyRate,
          activeLeasesCount: activeLeases.length,
        },
        options: [
          { label: "Check Unpaid Rent", action: { type: "node", nodeId: "unpaid_rent", userEcho: "Check Unpaid Rent" } },
          { label: "Open Repair Tickets", action: { type: "node", nodeId: "maintenance", userEcho: "Open Repair Tickets" } },
          { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
        ],
      };

    case "directory": {
      const pageSize = 6;
      const start = page * pageSize;
      const slice = activeLeases.slice(start, start + pageSize);
      const remaining = activeLeases.length - (start + slice.length);
      return {
        content:
          activeLeases.length === 0
            ? "You don't have any active residents right now."
            : page === 0
              ? `You have ${activeLeases.length} active ${activeLeases.length === 1 ? "resident" : "residents"}. Tap a resident below or type their name/room:`
              : `Showing residents ${start + 1}–${start + slice.length} of ${activeLeases.length}:`,
        options: [
          ...slice.map((l) => ({
            label: `${l.tenantName} (${l.unitName})`,
            action: { type: "flow_step" as const, payload: { residentLeaseId: l.id }, userEcho: l.tenantName },
          })),
          ...(remaining > 0
            ? [{ label: `Show More (${remaining} left)`, action: { type: "node" as const, nodeId: "directory" as const, page: page + 1, userEcho: "Show More Residents" } }]
            : []),
          { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
        ],
      };
    }
  }
}

export function IrisAssistantWorkspace({
  initialContext,
  onOpenConversation,
  onBroadcastSuccess,
  onBack,
  onMinimize,
  onClose,
  compact = false,
  className,
}: IrisAssistantWorkspaceProps) {
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;

  const firstName = getFirstName(
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? null
  );
  const userInitials = getUserInitials(
    profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? null
  );

  const [context, setContext] = useState<LandlordOperationsContext | null>(
    initialContext ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialContext);
  const [contextError, setContextError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "iris",
      ...buildNodeReply("menu", initialContext ?? null, firstName),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const msgCounterRef = useRef<number>(1);
  const nextMsgId = (prefix: "user" | "iris") => `${prefix}-${Date.now()}-${msgCounterRef.current++}`;

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setContextError(null);
    try {
      const res = await fetch("/api/landlord/iris/context");
      const json = await res.json();
      if (res.ok && json.data) {
        setContext(json.data);
      } else {
        setContextError(json.error || "Unable to load property data.");
      }
    } catch (err) {
      console.warn("Failed to load operations context:", err);
      setContextError("Unable to load property data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialContext) {
      loadContext();
    }
  }, [initialContext, loadContext]);

  const activeLeases = context?.activeLeases ?? [];
  const overdueLeases = context?.overdueLeases ?? [];
  const openTickets = context?.openTickets ?? [];
  const expiringLeases = context?.expiringLeases ?? [];

  const scheduleBotReply = (
    reply: Omit<ChatMessage, "id" | "role" | "timestamp">,
    userEcho?: string
  ) => {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (userEcho) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId("user"),
          role: "user",
          content: userEcho,
          timestamp: new Date(),
        },
      ]);
    }

    setIsTyping(true);
    typingTimeoutRef.current = window.setTimeout(() => {
      typingTimeoutRef.current = null;
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId("iris"),
          role: "iris",
          ...reply,
          timestamp: new Date(),
        },
      ]);
    }, 850);
  };

  const appendBotNode = (nodeId: BotNodeId, userEcho?: string, page = 0) => {
    if (isTyping) return;
    setActiveFlow(null);
    scheduleBotReply(buildNodeReply(nodeId, context, firstName, page), userEcho);
  };

  // Start a multi-step conversational flow right inside the chat
  const startFlow = (kind: NonNullable<ActiveFlow>["kind"], userEcho?: string) => {
    if (isTyping) return;

    if (kind === "invoice") {
      if (activeLeases.length === 0) {
        setActiveFlow(null);
        scheduleBotReply(
          {
            content: "You don't have any active leases yet to create an invoice for.",
            options: MAIN_MENU_OPTIONS,
          },
          userEcho
        );
        return;
      }
      setActiveFlow({ kind: "invoice", step: "target" });
      scheduleBotReply(
        {
          content: "Sure! Who is this invoice for?",
          options: [
            { label: `Everyone (${activeLeases.length} Active Tenants)`, action: { type: "flow_step", payload: { target: "all" }, userEcho: "Everyone" } },
            { label: "Specific Tenant", action: { type: "flow_step", payload: { target: "specific" }, userEcho: "Specific Tenant" } },
            CANCEL_OPTION,
          ],
        },
        userEcho
      );
      return;
    }

    if (kind === "broadcast") {
      setActiveFlow({ kind: "broadcast", step: "audience" });
      scheduleBotReply(
        {
          content: "Sure! Who should receive this notice?",
          options: [
            { label: "Everyone (All Active Tenants)", action: { type: "flow_step", payload: { filterType: "all_active_tenants", audienceLabel: "All Active Tenants" }, userEcho: "Everyone" } },
            ...(activeLeases.length > 0
              ? [{ label: "Specific Tenant", action: { type: "flow_step" as const, payload: { target: "specific" }, userEcho: "Specific Tenant" } }]
              : []),
            { label: "Overdue Tenants Only", action: { type: "flow_step", payload: { filterType: "overdue_5d", audienceLabel: "Overdue Tenants" }, userEcho: "Overdue Tenants" } },
            { label: "Due Soon", action: { type: "flow_step", payload: { filterType: "due_soon", audienceLabel: "Due Soon Tenants" }, userEcho: "Due Soon" } },
            { label: "Expiring Leases (60d)", action: { type: "flow_step", payload: { filterType: "expiring_leases_60d", audienceLabel: "Expiring Leases" }, userEcho: "Expiring Leases" } },
            CANCEL_OPTION,
          ],
        },
        userEcho
      );
      return;
    }

    if (kind === "payment") {
      const overdueIds = new Set(overdueLeases.map((l) => l.id));
      const candidates = [
        ...overdueLeases,
        ...activeLeases.filter((l) => !overdueIds.has(l.id)),
      ];
      if (candidates.length === 0) {
        setActiveFlow(null);
        scheduleBotReply(
          { content: "There are no active leases to record a payment for.", options: MAIN_MENU_OPTIONS },
          userEcho
        );
        return;
      }
      const slice = candidates.slice(0, 6);
      const remaining = candidates.length - slice.length;
      setActiveFlow({ kind: "payment", step: "pick_tenant" });
      scheduleBotReply(
        {
          content: "Who are we recording a payment for? Tap a resident below or type their name/room.",
          options: [
            ...slice.map((l) => ({
              label: `${l.tenantName} (${l.unitName})${l.outstandingBalance > 0 ? ` • ${formatPhpCurrency(l.outstandingBalance)}` : ""}`,
              action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
            })),
            ...(remaining > 0
              ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: 1 }, userEcho: "Show More Residents" } }]
              : []),
            CANCEL_OPTION,
          ],
        },
        userEcho
      );
      return;
    }

    if (kind === "maintenance") {
      if (openTickets.length === 0) {
        setActiveFlow(null);
        scheduleBotReply(
          { content: "There are no open repair tickets to update right now.", options: MAIN_MENU_OPTIONS },
          userEcho
        );
        return;
      }
      setActiveFlow({ kind: "maintenance", step: "pick_ticket" });
      scheduleBotReply(
        {
          content: "Which repair ticket would you like to update?",
          options: [
            ...openTickets.slice(0, 6).map((t) => ({
              label: `${t.unitName}: ${t.title} (${t.status})`,
              action: { type: "flow_step" as const, payload: { ticketId: t.id }, userEcho: t.title },
            })),
            CANCEL_OPTION,
          ],
        },
        userEcho
      );
      return;
    }

    if (kind === "renewals") {
      if (expiringLeases.length === 0) {
        setActiveFlow(null);
        scheduleBotReply(
          { content: "There are no expiring leases in the next 60 days.", options: MAIN_MENU_OPTIONS },
          userEcho
        );
        return;
      }
      setActiveFlow({ kind: "renewals", step: "pick_lease" });
      scheduleBotReply(
        {
          content: "Which resident would you like to send a lease renewal offer to?",
          options: [
            ...expiringLeases.slice(0, 6).map((l) => ({
              label: `${l.tenantName} (${l.unitName}) • Ends ${l.endDate}`,
              action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
            })),
            CANCEL_OPTION,
          ],
        },
        userEcho
      );
    }
  };

  // Execute API actions directly from chat
  const executeSingleInvoice = async (
    lease: ActiveLeaseSummary,
    waterReading?: number,
    waterSkipped?: boolean,
    electricReading?: number,
    electricSkipped?: boolean
  ) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/landlord/iris/invoices/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: lease.id,
          water: waterSkipped ? { skipped: true } : waterReading !== undefined ? { currentReading: waterReading } : { skipped: true },
          electricity: electricSkipped ? { skipped: true } : electricReading !== undefined ? { currentReading: electricReading } : { skipped: true },
        }),
      });
      const json = await res.json();
      setIsTyping(false);
      setActiveFlow(null);

      if (res.ok) {
        void loadContext();
        const invNum = json.invoiceNumber || json.data?.invoiceNumber || "";
        const total = json.totalAmount ?? json.data?.totalAmount ?? lease.monthlyRent;
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Done! Invoice ${invNum ? `(${invNum}) ` : ""}for ${formatPhpCurrency(Number(total))} has been sent to ${lease.tenantName} (${lease.unitName}).`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Could not create invoice: ${json.error || "Please try again."}`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setActiveFlow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `iris-${Date.now()}`,
          role: "iris",
          content: "Network error while sending the invoice. Please try again.",
          timestamp: new Date(),
          options: MAIN_MENU_OPTIONS,
        },
      ]);
    }
  };

  const executeBatchInvoices = async () => {
    setIsTyping(true);
    let successCount = 0;
    for (const lease of activeLeases) {
      try {
        const res = await fetch("/api/landlord/iris/invoices/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leaseId: lease.id,
            water: { skipped: true },
            electricity: { skipped: true },
          }),
        });
        if (res.ok) successCount += 1;
      } catch {
        // continue remaining
      }
    }
    setIsTyping(false);
    setActiveFlow(null);
    void loadContext();
    setMessages((prev) => [
      ...prev,
      {
        id: `iris-${Date.now()}`,
        role: "iris",
        content: `Done! Sent ${successCount} of ${activeLeases.length} monthly rent invoices.`,
        timestamp: new Date(),
        options: MAIN_MENU_OPTIONS,
      },
    ]);
  };

  const executeBroadcast = async (
    filterType: AudienceFilterType,
    templateKey: IrisTemplateKey,
    customMessage?: string,
    selectedLeaseIds?: string[]
  ) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/landlord/iris/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterType,
          templateKey,
          customMessage: customMessage || undefined,
          ...(selectedLeaseIds && selectedLeaseIds.length > 0 ? { selectedLeaseIds } : {}),
          channels: { inAppNotification: true, directMessage: true },
        }),
      });
      const json = await res.json();
      setIsTyping(false);
      setActiveFlow(null);
      if (res.ok) {
        const count = Number(json.count ?? json.sentCount ?? json.data?.sentCount ?? 0);
        if (count === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `iris-${Date.now()}`,
              role: "iris",
              content: json.message || "No matching active tenants were found to send this notice to.",
              timestamp: new Date(),
              options: MAIN_MENU_OPTIONS,
            },
          ]);
        } else {
          onBroadcastSuccess?.();
          const dmFailed = Number(json.directMessagesFailed ?? 0);
          const partialNote =
            dmFailed > 0
              ? ` (${dmFailed} direct ${dmFailed === 1 ? "message" : "messages"} could not be delivered.)`
              : "";
          setMessages((prev) => [
            ...prev,
            {
              id: `iris-${Date.now()}`,
              role: "iris",
              content: `Notice sent to ${count} ${count === 1 ? "recipient" : "recipients"} via In-App Notification and Direct Message!${partialNote}`,
              timestamp: new Date(),
              options: MAIN_MENU_OPTIONS,
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Could not send notice: ${json.error || "Please try again."}`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setActiveFlow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `iris-${Date.now()}`,
          role: "iris",
          content: "Network error while sending the notice. Please try again.",
          timestamp: new Date(),
          options: MAIN_MENU_OPTIONS,
        },
      ]);
    }
  };

  const executePayment = async (
    lease: ActiveLeaseSummary,
    amount: number,
    method: "cash" | "bank_transfer" | "in_person"
  ) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: lease.id,
          amount,
          method,
          paymentDate: new Date().toISOString().split("T")[0],
        }),
      });
      const json = await res.json();
      setIsTyping(false);
      setActiveFlow(null);
      if (res.ok) {
        void loadContext();
        const receipt = json.receiptNumber || json.data?.receiptNumber || "";
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Payment recorded! ${formatPhpCurrency(amount)} for ${lease.tenantName} (${lease.unitName})${receipt ? ` • Receipt ${receipt}` : ""}.`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Could not record payment: ${json.error || "Please try again."}`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setActiveFlow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `iris-${Date.now()}`,
          role: "iris",
          content: "Network error while recording payment. Please try again.",
          timestamp: new Date(),
          options: MAIN_MENU_OPTIONS,
        },
      ]);
    }
  };

  const executeTicketUpdate = async (
    ticket: MaintenanceTicketSummary,
    status: "in_progress" | "resolved"
  ) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/landlord/iris/maintenance/quick-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, status }),
      });
      const json = await res.json();
      setIsTyping(false);
      setActiveFlow(null);
      if (res.ok) {
        void loadContext();
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Updated "${ticket.title}" (${ticket.unitName}) to ${status.replace("_", " ")}.`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Could not update ticket: ${json.error || "Please try again."}`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setActiveFlow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `iris-${Date.now()}`,
          role: "iris",
          content: "Network error while updating the ticket. Please try again.",
          timestamp: new Date(),
          options: MAIN_MENU_OPTIONS,
        },
      ]);
    }
  };

  const executeRenewalOffer = async (lease: ActiveLeaseSummary, months: number) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: lease.id,
          proposedRent: lease.monthlyRent,
          renewalTermMonths: months,
        }),
      });
      const json = await res.json();
      setIsTyping(false);
      setActiveFlow(null);
      if (res.ok) {
        void loadContext();
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Sent a ${months}-month lease renewal offer (${formatPhpCurrency(lease.monthlyRent)}/mo) to ${lease.tenantName} (${lease.unitName}).`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `iris-${Date.now()}`,
            role: "iris",
            content: `Could not send renewal offer: ${json.error || "Please try again."}`,
            timestamp: new Date(),
            options: MAIN_MENU_OPTIONS,
          },
        ]);
      }
    } catch {
      setIsTyping(false);
      setActiveFlow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `iris-${Date.now()}`,
          role: "iris",
          content: "Network error while sending renewal offer. Please try again.",
          timestamp: new Date(),
          options: MAIN_MENU_OPTIONS,
        },
      ]);
    }
  };

  const advanceFlowStep = (payload: Record<string, unknown>, userEcho?: string) => {
    if (isTyping) return;

    if (payload.cancel) {
      setActiveFlow(null);
      scheduleBotReply({ content: "Cancelled. What else can I help you with?", options: MAIN_MENU_OPTIONS }, userEcho);
      return;
    }

    if (typeof payload.residentLeaseId === "string") {
      const lease = activeLeases.find((l) => l.id === payload.residentLeaseId);
      if (lease) {
        setActiveFlow(null);
        scheduleBotReply(
          {
            content: `Here are the details for ${lease.tenantName} (${lease.unitName}, ${lease.propertyName}):`,
            card: { type: "resident_detail", lease },
            options: [
              ...(lease.outstandingBalance > 0
                ? [{ label: "Collect Payment", action: { type: "flow_step" as const, payload: { startPaymentForLeaseId: lease.id }, userEcho: "Collect Payment" } }]
                : []),
              { label: "Create Invoice", action: { type: "flow_step", payload: { startInvoiceForLeaseId: lease.id }, userEcho: "Create Invoice" } },
              { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
            ],
          },
          userEcho
        );
        return;
      }
    }

    if (typeof payload.startInvoiceForLeaseId === "string") {
      const lease = activeLeases.find((l) => l.id === payload.startInvoiceForLeaseId);
      if (lease) {
        setActiveFlow({ kind: "invoice", step: "items", lease });
        scheduleBotReply(
          {
            content: `Got it — ${lease.tenantName} (${lease.unitName}, Monthly Rent: ${formatPhpCurrency(lease.monthlyRent)}). What should we include?`,
            options: [
              { label: `Rent Only (${formatPhpCurrency(lease.monthlyRent)})`, action: { type: "flow_step", payload: { mode: "rent_only" }, userEcho: "Rent Only" } },
              { label: "Rent + Utilities (Water/Electric)", action: { type: "flow_step", payload: { mode: "utilities" }, userEcho: "Rent + Utilities" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }
    }

    if (typeof payload.startPaymentForLeaseId === "string") {
      const lease = activeLeases.find((l) => l.id === payload.startPaymentForLeaseId);
      if (lease) {
        setActiveFlow({ kind: "payment", step: "amount", lease });
        scheduleBotReply(
          {
            content: `Recording payment for ${lease.tenantName} (${lease.unitName}, Balance: ${formatPhpCurrency(lease.outstandingBalance)}). How much did they pay? Type an amount or tap Full Balance.`,
            options: [
              ...(lease.outstandingBalance > 0
                ? [{ label: `Full Balance (${formatPhpCurrency(lease.outstandingBalance)})`, action: { type: "flow_step" as const, payload: { amount: lease.outstandingBalance }, userEcho: formatPhpCurrency(lease.outstandingBalance) } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }
    }

    if (!activeFlow) {
      scheduleBotReply(
        {
          content: "That action has already finished or expired. Pick an option below:",
          options: MAIN_MENU_OPTIONS,
        },
        userEcho
      );
      return;
    }

    // INVOICE FLOW
    if (activeFlow.kind === "invoice") {
      if (activeFlow.step === "target") {
        if (payload.target === "all") {
          setActiveFlow({ kind: "invoice", step: "confirm_all" });
          scheduleBotReply(
            {
              content: `Got it! Should I generate and send this month's rent invoice to all ${activeLeases.length} active tenants?`,
              options: [
                { label: `Yes, Send to All (${activeLeases.length})`, action: { type: "flow_step", payload: { confirmAll: true }, userEcho: "Yes, Send to All" } },
                { label: "Pick Specific Tenant", action: { type: "flow_step", payload: { target: "specific" }, userEcho: "Specific Tenant" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
          return;
        }
        if (activeFlow.step === "target" && payload.target === "specific") {
          setActiveFlow({ kind: "invoice", step: "pick_tenant" });
          const slice = activeLeases.slice(0, 6);
          const remaining = activeLeases.length - slice.length;
          scheduleBotReply(
            {
              content: "Which tenant or unit is this invoice for? Tap a name below or type their name/room.",
              options: [
                ...slice.map((l) => ({
                  label: `${l.tenantName} (${l.unitName})`,
                  action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
                })),
                ...(remaining > 0
                  ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: 1 }, userEcho: "Show More Residents" } }]
                  : []),
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
          return;
        }
      }

      if (activeFlow.step === "confirm_all" && payload.confirmAll) {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executeBatchInvoices();
        return;
      }

      if (activeFlow.step === "confirm_all" && payload.target === "specific") {
        setActiveFlow({ kind: "invoice", step: "pick_tenant" });
        const slice = activeLeases.slice(0, 6);
        const remaining = activeLeases.length - slice.length;
        scheduleBotReply(
          {
            content: "Which tenant or unit is this invoice for? Tap a name below or type their name/room.",
            options: [
              ...slice.map((l) => ({
                label: `${l.tenantName} (${l.unitName})`,
                action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
              })),
              ...(remaining > 0
                ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: 1 }, userEcho: "Show More Residents" } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "pick_tenant" && typeof payload.tenantPage === "number") {
        const overdueIds = new Set(overdueLeases.map((l) => l.id));
        const candidates = [
          ...overdueLeases,
          ...activeLeases.filter((l) => !overdueIds.has(l.id)),
        ];
        const page = payload.tenantPage;
        const pageSize = 6;
        const start = page * pageSize;
        const slice = candidates.slice(start, start + pageSize);
        const remaining = candidates.length - (start + slice.length);
        scheduleBotReply(
          {
            content: `Showing residents ${start + 1}–${start + slice.length} of ${candidates.length}:`,
            options: [
              ...slice.map((l) => ({
                label: `${l.tenantName} (${l.unitName})${l.outstandingBalance > 0 ? ` • ${formatPhpCurrency(l.outstandingBalance)}` : ""}`,
                action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
              })),
              ...(remaining > 0
                ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: page + 1 }, userEcho: "Show More Residents" } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "pick_tenant" && typeof payload.leaseId === "string") {
        const lease = activeLeases.find((l) => l.id === payload.leaseId);
        if (lease) {
          setActiveFlow({ kind: "invoice", step: "items", lease });
          scheduleBotReply(
            {
              content: `Got it — ${lease.tenantName} (${lease.unitName}, Monthly Rent: ${formatPhpCurrency(lease.monthlyRent)}). What should we include?`,
              options: [
                { label: `Rent Only (${formatPhpCurrency(lease.monthlyRent)})`, action: { type: "flow_step", payload: { mode: "rent_only" }, userEcho: "Rent Only" } },
                { label: "Rent + Utilities (Water/Electric)", action: { type: "flow_step", payload: { mode: "utilities" }, userEcho: "Rent + Utilities" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
        }
        return;
      }

      if (activeFlow.step === "items" && activeFlow.lease) {
        if (payload.mode === "rent_only") {
          setActiveFlow({ ...activeFlow, step: "confirm_single", waterSkipped: true, electricSkipped: true });
          scheduleBotReply(
            {
              content: `Ready to send a Rent Only invoice for ${formatPhpCurrency(activeFlow.lease.monthlyRent)} to ${activeFlow.lease.tenantName} (${activeFlow.lease.unitName})?`,
              options: [
                { label: "Confirm & Send Invoice", action: { type: "flow_step", payload: { confirmSingle: true }, userEcho: "Confirm & Send Invoice" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
          return;
        }
        if (payload.mode === "utilities") {
          setActiveFlow({ ...activeFlow, step: "water" });
          scheduleBotReply(
            {
              content: "What is the current water meter reading? Type a number below or tap Skip Water.",
              options: [
                { label: "Skip Water", action: { type: "flow_step", payload: { skipWater: true }, userEcho: "Skip Water" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
          return;
        }
      }

      if (activeFlow.step === "water") {
        const waterReading = typeof payload.waterReading === "number" ? payload.waterReading : undefined;
        const waterSkipped = Boolean(payload.skipWater);
        setActiveFlow({ ...activeFlow, step: "electricity", waterReading, waterSkipped });
        scheduleBotReply(
          {
            content: "Got it. Now what is the current electricity meter reading? Type a number below or tap Skip Electricity.",
            options: [
              { label: "Skip Electricity", action: { type: "flow_step", payload: { skipElectric: true }, userEcho: "Skip Electricity" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "electricity" && activeFlow.lease) {
        const electricReading = typeof payload.electricReading === "number" ? payload.electricReading : undefined;
        const electricSkipped = Boolean(payload.skipElectric);
        setActiveFlow({ ...activeFlow, step: "confirm_single", electricReading, electricSkipped });
        const waterText = activeFlow.waterSkipped ? "Skipped" : `${activeFlow.waterReading ?? 0} m³`;
        const elecText = electricSkipped ? "Skipped" : `${electricReading ?? 0} kWh`;
        scheduleBotReply(
          {
            content: `Ready to send this invoice to ${activeFlow.lease.tenantName} (${activeFlow.lease.unitName})?\n• Monthly Rent: ${formatPhpCurrency(activeFlow.lease.monthlyRent)}\n• Water Reading: ${waterText}\n• Electricity Reading: ${elecText}`,
            options: [
              { label: "Confirm & Send Invoice", action: { type: "flow_step", payload: { confirmSingle: true }, userEcho: "Confirm & Send Invoice" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "confirm_single" && payload.confirmSingle && activeFlow.lease) {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executeSingleInvoice(
          activeFlow.lease,
          activeFlow.waterReading,
          activeFlow.waterSkipped,
          activeFlow.electricReading,
          activeFlow.electricSkipped
        );
        return;
      }
    }

    // BROADCAST FLOW
    if (activeFlow.kind === "broadcast") {
      if (activeFlow.step === "audience" && payload.target === "specific") {
        setActiveFlow({ kind: "broadcast", step: "pick_tenant" });
        const slice = activeLeases.slice(0, 6);
        const remaining = activeLeases.length - slice.length;
        scheduleBotReply(
          {
            content: "Which tenant should receive this notice? Tap a name below or type their name/room.",
            options: [
              ...slice.map((l) => ({
                label: `${l.tenantName} (${l.unitName})`,
                action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
              })),
              ...(remaining > 0
                ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: 1 }, userEcho: "Show More Residents" } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "pick_tenant" && typeof payload.tenantPage === "number") {
        const overdueIds = new Set(overdueLeases.map((l) => l.id));
        const candidates = [
          ...overdueLeases,
          ...activeLeases.filter((l) => !overdueIds.has(l.id)),
        ];
        const page = payload.tenantPage;
        const pageSize = 6;
        const start = page * pageSize;
        const slice = candidates.slice(start, start + pageSize);
        const remaining = candidates.length - (start + slice.length);
        scheduleBotReply(
          {
            content: `Showing residents ${start + 1}–${start + slice.length} of ${candidates.length}:`,
            options: [
              ...slice.map((l) => ({
                label: `${l.tenantName} (${l.unitName})${l.outstandingBalance > 0 ? ` • ${formatPhpCurrency(l.outstandingBalance)}` : ""}`,
                action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
              })),
              ...(remaining > 0
                ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: page + 1 }, userEcho: "Show More Residents" } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "pick_tenant" && typeof payload.leaseId === "string") {
        const lease = activeLeases.find((l) => l.id === payload.leaseId);
        if (lease) {
          const audienceLabel = `${lease.tenantName} (${lease.unitName})`;
          setActiveFlow({
            kind: "broadcast",
            step: "template",
            filterType: "all_active_tenants",
            audienceLabel,
            selectedLeaseIds: [lease.id],
          });
          scheduleBotReply(
            {
              content: `Got it (${audienceLabel}). What kind of notice would you like to send?`,
              options: [
                { label: "Rent Reminder", action: { type: "flow_step", payload: { templateKey: "payment_gentle", templateLabel: "Rent Reminder" }, userEcho: "Rent Reminder" } },
                { label: "Overdue Rent Notice", action: { type: "flow_step", payload: { templateKey: "payment_overdue", templateLabel: "Overdue Rent Notice" }, userEcho: "Overdue Rent Notice" } },
                { label: "Maintenance Advisory", action: { type: "flow_step", payload: { templateKey: "maintenance_advisory", templateLabel: "Maintenance Advisory" }, userEcho: "Maintenance Advisory" } },
                { label: "General Announcement", action: { type: "flow_step", payload: { templateKey: "general_notice", templateLabel: "General Announcement" }, userEcho: "General Announcement" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
        }
        return;
      }

      if (activeFlow.step === "audience" && typeof payload.filterType === "string") {
        setActiveFlow({
          kind: "broadcast",
          step: "template",
          filterType: payload.filterType as AudienceFilterType,
          audienceLabel: String(payload.audienceLabel || payload.filterType),
        });
        scheduleBotReply(
          {
            content: `Got it (${payload.audienceLabel}). What kind of notice would you like to send?`,
            options: [
              { label: "Rent Reminder", action: { type: "flow_step", payload: { templateKey: "payment_gentle", templateLabel: "Rent Reminder" }, userEcho: "Rent Reminder" } },
              { label: "Overdue Rent Notice", action: { type: "flow_step", payload: { templateKey: "payment_overdue", templateLabel: "Overdue Rent Notice" }, userEcho: "Overdue Rent Notice" } },
              { label: "Maintenance Advisory", action: { type: "flow_step", payload: { templateKey: "maintenance_advisory", templateLabel: "Maintenance Advisory" }, userEcho: "Maintenance Advisory" } },
              { label: "General Announcement", action: { type: "flow_step", payload: { templateKey: "general_notice", templateLabel: "General Announcement" }, userEcho: "General Announcement" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "template" && typeof payload.templateKey === "string") {
        setActiveFlow({
          ...activeFlow,
          step: "message",
          templateKey: payload.templateKey as IrisTemplateKey,
          templateLabel: String(payload.templateLabel || payload.templateKey),
        });
        scheduleBotReply(
          {
            content: "How would you like to write the message? Choose an option below or type your message directly.",
            options: [
              { label: "Use Default Message", action: { type: "flow_step", payload: { useDefault: true }, userEcho: "Use Default Message" } },
              { label: "Write Custom Message", action: { type: "flow_step", payload: { wantCustom: true }, userEcho: "Write Custom Message" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "message" && payload.wantCustom) {
        setActiveFlow({ ...activeFlow, step: "custom_text" });
        scheduleBotReply(
          {
            content: `Okay! Type your custom message for ${activeFlow.audienceLabel} in the box below and press Send.`,
            options: [
              { label: "Use Default Message Instead", action: { type: "flow_step", payload: { useDefault: true }, userEcho: "Use Default Message" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "message" || activeFlow.step === "custom_text") {
        const customMessage = payload.useDefault
          ? undefined
          : typeof payload.customMessage === "string"
            ? payload.customMessage
            : undefined;
        setActiveFlow({ ...activeFlow, step: "confirm", customMessage });
        scheduleBotReply(
          {
            content: `Ready to send "${activeFlow.templateLabel}" to ${activeFlow.audienceLabel}${customMessage ? ` with message: "${customMessage}"` : " (using the default template)"}?`,
            options: [
              { label: "Send Notice Now", action: { type: "flow_step", payload: { confirmBroadcast: true }, userEcho: "Send Notice Now" } },
              { label: "Edit Message", action: { type: "flow_step", payload: { editMessage: true }, userEcho: "Edit Message" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "confirm" && payload.editMessage) {
        setActiveFlow({ ...activeFlow, step: "custom_text" });
        scheduleBotReply(
          {
            content: `Sure! Type your new custom message for ${activeFlow.audienceLabel} below and press Send.`,
            options: [
              { label: "Use Default Message Instead", action: { type: "flow_step", payload: { useDefault: true }, userEcho: "Use Default Message" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "confirm" && payload.confirmBroadcast && activeFlow.filterType && activeFlow.templateKey) {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executeBroadcast(
          activeFlow.filterType,
          activeFlow.templateKey,
          activeFlow.customMessage,
          activeFlow.selectedLeaseIds
        );
        return;
      }
    }

    // PAYMENT FLOW
    if (activeFlow.kind === "payment") {
      if (activeFlow.step === "pick_tenant" && typeof payload.tenantPage === "number") {
        const overdueIds = new Set(overdueLeases.map((l) => l.id));
        const candidates = [
          ...overdueLeases,
          ...activeLeases.filter((l) => !overdueIds.has(l.id)),
        ];
        const page = payload.tenantPage;
        const pageSize = 6;
        const start = page * pageSize;
        const slice = candidates.slice(start, start + pageSize);
        const remaining = candidates.length - (start + slice.length);
        scheduleBotReply(
          {
            content: `Showing residents ${start + 1}–${start + slice.length} of ${candidates.length}:`,
            options: [
              ...slice.map((l) => ({
                label: `${l.tenantName} (${l.unitName})${l.outstandingBalance > 0 ? ` • ${formatPhpCurrency(l.outstandingBalance)}` : ""}`,
                action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
              })),
              ...(remaining > 0
                ? [{ label: `Show More (${remaining} left)`, action: { type: "flow_step" as const, payload: { tenantPage: page + 1 }, userEcho: "Show More Residents" } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "pick_tenant" && typeof payload.leaseId === "string") {
        const lease = activeLeases.find((l) => l.id === payload.leaseId);
        if (lease) {
          setActiveFlow({ kind: "payment", step: "amount", lease });
          scheduleBotReply(
            {
              content: `Recording payment for ${lease.tenantName} (${lease.unitName}, Balance: ${formatPhpCurrency(lease.outstandingBalance)}). How much did they pay? Type an amount or tap Full Balance.`,
              options: [
                ...(lease.outstandingBalance > 0
                  ? [{ label: `Full Balance (${formatPhpCurrency(lease.outstandingBalance)})`, action: { type: "flow_step" as const, payload: { amount: lease.outstandingBalance }, userEcho: formatPhpCurrency(lease.outstandingBalance) } }]
                  : []),
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
        }
        return;
      }

      if (activeFlow.step === "amount" && typeof payload.amount === "number" && activeFlow.lease) {
        setActiveFlow({ ...activeFlow, step: "method", amount: payload.amount });
        scheduleBotReply(
          {
            content: `Got it (${formatPhpCurrency(payload.amount)}). How did ${activeFlow.lease.tenantName} pay?`,
            options: [
              { label: "Cash", action: { type: "flow_step", payload: { method: "cash" }, userEcho: "Cash" } },
              { label: "Bank Transfer / GCash", action: { type: "flow_step", payload: { method: "bank_transfer" }, userEcho: "Bank Transfer / GCash" } },
              { label: "In Person", action: { type: "flow_step", payload: { method: "in_person" }, userEcho: "In Person" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "method" && typeof payload.method === "string" && activeFlow.lease && activeFlow.amount) {
        const method = payload.method as "cash" | "bank_transfer" | "in_person";
        setActiveFlow({ ...activeFlow, step: "confirm", method });
        scheduleBotReply(
          {
            content: `Confirm recording ${formatPhpCurrency(activeFlow.amount)} via ${method.replace("_", " ")} for ${activeFlow.lease.tenantName} (${activeFlow.lease.unitName})?`,
            options: [
              { label: "Confirm Payment", action: { type: "flow_step", payload: { confirmPayment: true }, userEcho: "Confirm Payment" } },
              CANCEL_OPTION,
            ],
          },
          userEcho
        );
        return;
      }

      if (activeFlow.step === "confirm" && payload.confirmPayment && activeFlow.lease && activeFlow.amount && activeFlow.method) {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executePayment(activeFlow.lease, activeFlow.amount, activeFlow.method);
        return;
      }
    }

    // MAINTENANCE FLOW
    if (activeFlow.kind === "maintenance") {
      if (activeFlow.step === "pick_ticket" && typeof payload.ticketId === "string") {
        const ticket = openTickets.find((t) => t.id === payload.ticketId);
        if (ticket) {
          setActiveFlow({ kind: "maintenance", step: "pick_status", ticket });
          scheduleBotReply(
            {
              content: `Ticket "${ticket.title}" (${ticket.unitName}, currently ${ticket.status}). What should I update it to?`,
              options: [
                { label: "Mark In Progress", action: { type: "flow_step", payload: { status: "in_progress" }, userEcho: "Mark In Progress" } },
                { label: "Mark Resolved", action: { type: "flow_step", payload: { status: "resolved" }, userEcho: "Mark Resolved" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
        }
        return;
      }

      if (activeFlow.step === "pick_status" && activeFlow.ticket && (payload.status === "in_progress" || payload.status === "resolved")) {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executeTicketUpdate(activeFlow.ticket, payload.status);
        return;
      }
    }

    // RENEWALS FLOW
    if (activeFlow.kind === "renewals") {
      if (activeFlow.step === "pick_lease" && typeof payload.leaseId === "string") {
        const lease = expiringLeases.find((l) => l.id === payload.leaseId);
        if (lease) {
          setActiveFlow({ kind: "renewals", step: "pick_term", lease });
          scheduleBotReply(
            {
              content: `Send a lease renewal offer to ${lease.tenantName} (${lease.unitName}) at ${formatPhpCurrency(lease.monthlyRent)}/mo?`,
              options: [
                { label: "Send 12-Month Offer", action: { type: "flow_step", payload: { months: 12 }, userEcho: "Send 12-Month Offer" } },
                { label: "Send 6-Month Offer", action: { type: "flow_step", payload: { months: 6 }, userEcho: "Send 6-Month Offer" } },
                CANCEL_OPTION,
              ],
            },
            userEcho
          );
        }
        return;
      }

      if (activeFlow.step === "pick_term" && activeFlow.lease && typeof payload.months === "number") {
        if (userEcho) {
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: userEcho, timestamp: new Date() }]);
        }
        void executeRenewalOffer(activeFlow.lease, payload.months);
      }
    }
  };

  const handleOptionClick = (option: BotOptionButton) => {
    const { action } = option;
    if (action.type === "node") {
      appendBotNode(action.nodeId, action.userEcho ?? option.label, action.page ?? 0);
      return;
    }
    if (action.type === "flow_start") {
      startFlow(action.kind, action.userEcho ?? option.label);
      return;
    }
    if (action.type === "flow_step") {
      advanceFlowStep(action.payload, action.userEcho ?? option.label);
      return;
    }
    if (action.type === "conversation") {
      onOpenConversation?.(action.tenantId);
    }
  };

  const handleKeywordSubmit = (textOverride?: string) => {
    if (isTyping) return;
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed) return;
    if (!textOverride) setInput("");

    const lower = trimmed.toLowerCase();

    // Global cancel/reset keywords
    if (["cancel", "stop", "nevermind", "reset"].includes(lower)) {
      setActiveFlow(null);
      scheduleBotReply({ content: "Cancelled. What else can I help you with?", options: MAIN_MENU_OPTIONS }, trimmed);
      return;
    }

    // Handle active multi-step conversation flow inputs first
    if (activeFlow) {
      if (activeFlow.kind === "invoice") {
        if (activeFlow.step === "target") {
          if (lower.includes("everyone") || lower.includes("all")) {
            advanceFlowStep({ target: "all" }, trimmed);
            return;
          }
          const matched = findLeaseByQuery(activeLeases, trimmed);
          if (matched) {
            setActiveFlow({ kind: "invoice", step: "items", lease: matched });
            scheduleBotReply(
              {
                content: `Got it — ${matched.tenantName} (${matched.unitName}, Monthly Rent: ${formatPhpCurrency(matched.monthlyRent)}). What should we include?`,
                options: [
                  { label: `Rent Only (${formatPhpCurrency(matched.monthlyRent)})`, action: { type: "flow_step", payload: { mode: "rent_only" }, userEcho: "Rent Only" } },
                  { label: "Rent + Utilities (Water/Electric)", action: { type: "flow_step", payload: { mode: "utilities" }, userEcho: "Rent + Utilities" } },
                  CANCEL_OPTION,
                ],
              },
              trimmed
            );
            return;
          }
        }
        if (activeFlow.step === "pick_tenant") {
          const matched = findLeaseByQuery(activeLeases, trimmed);
          if (matched) {
            advanceFlowStep({ leaseId: matched.id }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: `I couldn't find a resident matching "${trimmed}". Please tap a name below or type another name/room.`,
              options: [
                ...activeLeases.slice(0, 6).map((l) => ({
                  label: `${l.tenantName} (${l.unitName})`,
                  action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
                })),
                CANCEL_OPTION,
              ],
            },
            trimmed
          );
          return;
        }
        if (activeFlow.step === "water") {
          if (lower.includes("skip")) {
            advanceFlowStep({ skipWater: true }, trimmed);
            return;
          }
          const num = Number(trimmed.replace(/[^0-9.]/g, ""));
          if (!trimmed.includes("-") && !Number.isNaN(num) && num <= 9_999_999 && trimmed.match(/\d/)) {
            advanceFlowStep({ waterReading: num }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: "Please enter a valid water meter number between 0 and 9,999,999 (e.g. 125) or tap Skip Water.",
              options: [{ label: "Skip Water", action: { type: "flow_step", payload: { skipWater: true }, userEcho: "Skip Water" } }, CANCEL_OPTION],
            },
            trimmed
          );
          return;
        }
        if (activeFlow.step === "electricity") {
          if (lower.includes("skip")) {
            advanceFlowStep({ skipElectric: true }, trimmed);
            return;
          }
          const num = Number(trimmed.replace(/[^0-9.]/g, ""));
          if (!trimmed.includes("-") && !Number.isNaN(num) && num <= 9_999_999 && trimmed.match(/\d/)) {
            advanceFlowStep({ electricReading: num }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: "Please enter a valid electricity meter number between 0 and 9,999,999 (e.g. 450) or tap Skip Electricity.",
              options: [{ label: "Skip Electricity", action: { type: "flow_step", payload: { skipElectric: true }, userEcho: "Skip Electricity" } }, CANCEL_OPTION],
            },
            trimmed
          );
          return;
        }
      }

      if (activeFlow.kind === "broadcast") {
        if (activeFlow.step === "pick_tenant") {
          const matched = findLeaseByQuery(activeLeases, trimmed);
          if (matched) {
            advanceFlowStep({ leaseId: matched.id }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: `I couldn't find a resident matching "${trimmed}". Please tap a name below or type another name/room.`,
              options: [
                ...activeLeases.slice(0, 6).map((l) => ({
                  label: `${l.tenantName} (${l.unitName})`,
                  action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
                })),
                CANCEL_OPTION,
              ],
            },
            trimmed
          );
          return;
        }
        if (activeFlow.step === "message") {
          if (["custom", "custom message", "write custom", "type custom", "own message", "write custom message"].includes(lower)) {
            advanceFlowStep({ wantCustom: true }, trimmed);
            return;
          }
          if (["default", "use default", "use default message", "template"].includes(lower)) {
            advanceFlowStep({ useDefault: true }, trimmed);
            return;
          }
          advanceFlowStep({ customMessage: trimmed }, trimmed);
          return;
        }
        if (activeFlow.step === "custom_text") {
          advanceFlowStep({ customMessage: trimmed }, trimmed);
          return;
        }
      }

      if (activeFlow.kind === "payment") {
        if (activeFlow.step === "pick_tenant") {
          const matched = findLeaseByQuery(activeLeases, trimmed);
          if (matched) {
            advanceFlowStep({ leaseId: matched.id }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: `I couldn't find a resident matching "${trimmed}". Please tap a name below or type another name/room.`,
              options: [
                ...activeLeases.slice(0, 6).map((l) => ({
                  label: `${l.tenantName} (${l.unitName})${l.outstandingBalance > 0 ? ` • ${formatPhpCurrency(l.outstandingBalance)}` : ""}`,
                  action: { type: "flow_step" as const, payload: { leaseId: l.id }, userEcho: l.tenantName },
                })),
                CANCEL_OPTION,
              ],
            },
            trimmed
          );
          return;
        }
        if (activeFlow.step === "amount") {
          const num = Number(trimmed.replace(/[^0-9.]/g, ""));
          if (!trimmed.includes("-") && num > 0 && num <= 9_999_999.99) {
            if (activeFlow.lease && activeFlow.lease.outstandingBalance > 0 && num > activeFlow.lease.outstandingBalance) {
              scheduleBotReply(
                {
                  content: `That exceeds the outstanding balance of ${formatPhpCurrency(activeFlow.lease.outstandingBalance)}. Please enter an amount up to ${formatPhpCurrency(activeFlow.lease.outstandingBalance)} or tap Full Balance.`,
                  options: [
                    { label: `Full Balance (${formatPhpCurrency(activeFlow.lease.outstandingBalance)})`, action: { type: "flow_step", payload: { amount: activeFlow.lease.outstandingBalance }, userEcho: formatPhpCurrency(activeFlow.lease.outstandingBalance) } },
                    CANCEL_OPTION,
                  ],
                },
                trimmed
              );
              return;
            }
            advanceFlowStep({ amount: num }, trimmed);
            return;
          }
          scheduleBotReply(
            {
              content: "Please enter a valid peso amount (e.g. 4500) or tap Full Balance.",
              options: [
                ...(activeFlow.lease && activeFlow.lease.outstandingBalance > 0
                  ? [{ label: `Full Balance (${formatPhpCurrency(activeFlow.lease.outstandingBalance)})`, action: { type: "flow_step" as const, payload: { amount: activeFlow.lease.outstandingBalance }, userEcho: formatPhpCurrency(activeFlow.lease.outstandingBalance) } }]
                  : []),
                CANCEL_OPTION,
              ],
            },
            trimmed
          );
          return;
        }
      }
    }

    // Rule-based keyword + synonym matching when starting fresh
    const matchedLease = findLeaseByQuery(activeLeases, trimmed);
    const hasAny = (keywords: string[]) => keywords.some((kw) => lower.includes(kw));

    if (hasAny(["invoice", "create bill", "send bill", "generate bill", "billing", "singil", "bill"])) {
      if (matchedLease) {
        setActiveFlow({ kind: "invoice", step: "items", lease: matchedLease });
        scheduleBotReply(
          {
            content: `Got it — ${matchedLease.tenantName} (${matchedLease.unitName}, Monthly Rent: ${formatPhpCurrency(matchedLease.monthlyRent)}). What should we include?`,
            options: [
              { label: `Rent Only (${formatPhpCurrency(matchedLease.monthlyRent)})`, action: { type: "flow_step", payload: { mode: "rent_only" }, userEcho: "Rent Only" } },
              { label: "Rent + Utilities (Water/Electric)", action: { type: "flow_step", payload: { mode: "utilities" }, userEcho: "Rent + Utilities" } },
              CANCEL_OPTION,
            ],
          },
          trimmed
        );
        return;
      }
      startFlow("invoice", trimmed);
      return;
    }

    if (hasAny(["broadcast", "notice", "announce", "announcement", "memo", "remind all", "message all"])) {
      startFlow("broadcast", trimmed);
      return;
    }

    if (hasAny(["record payment", "log payment", "collect", "settle", "mark paid", "bayad"])) {
      if (matchedLease) {
        setActiveFlow({ kind: "payment", step: "amount", lease: matchedLease });
        scheduleBotReply(
          {
            content: `Recording payment for ${matchedLease.tenantName} (${matchedLease.unitName}, Balance: ${formatPhpCurrency(matchedLease.outstandingBalance)}). How much did they pay?`,
            options: [
              ...(matchedLease.outstandingBalance > 0
                ? [{ label: `Full Balance (${formatPhpCurrency(matchedLease.outstandingBalance)})`, action: { type: "flow_step" as const, payload: { amount: matchedLease.outstandingBalance }, userEcho: formatPhpCurrency(matchedLease.outstandingBalance) } }]
                : []),
              CANCEL_OPTION,
            ],
          },
          trimmed
        );
        return;
      }
      startFlow("payment", trimmed);
      return;
    }

    if (matchedLease) {
      setActiveFlow(null);
      scheduleBotReply(
        {
          content: `Here are the details for ${matchedLease.tenantName} (${matchedLease.unitName}, ${matchedLease.propertyName}):`,
          card: { type: "resident_detail", lease: matchedLease },
          options: [
            ...(matchedLease.outstandingBalance > 0
              ? [{ label: "Collect Payment", action: { type: "flow_step" as const, payload: { startPaymentForLeaseId: matchedLease.id }, userEcho: "Collect Payment" } }]
              : []),
            { label: "Create Invoice", action: { type: "flow_step", payload: { startInvoiceForLeaseId: matchedLease.id }, userEcho: "Create Invoice" } },
            { label: "Main Menu", action: { type: "node", nodeId: "menu", userEcho: "Main Menu" } },
          ],
        },
        trimmed
      );
      return;
    }

    if (hasAny(["unpaid", "overdue", "owe", "owes", "utang", "balance", "balances", "late rent", "not paid", "delinquent", "hasn't paid", "hindi pa bayad"])) {
      appendBotNode("unpaid_rent", trimmed);
      return;
    }

    if (hasAny(["repair", "repairs", "maintenance", "ticket", "tickets", "fix", "broken", "leak", "sira", "issue", "issues"])) {
      appendBotNode("maintenance", trimmed);
      return;
    }

    if (hasAny(["expir", "renew", "renewal", "contract", "contracts", "ending", "lease end"])) {
      appendBotNode("renewals", trimmed);
      return;
    }

    if (hasAny(["summary", "overview", "status", "occupancy", "how many", "report", "stats", "properties", "property"])) {
      appendBotNode("summary", trimmed);
      return;
    }

    if (hasAny(["resident", "residents", "tenant", "tenants", "directory", "lookup", "find", "search", "who lives"])) {
      appendBotNode("directory", trimmed);
      return;
    }

    if (hasAny(["hi", "hello", "hey", "menu", "help", "start", "options", "what can you do", "tulong"])) {
      appendBotNode("menu", trimmed);
      return;
    }

    // Fallback
    setActiveFlow(null);
    scheduleBotReply(
      {
        content: "I didn't quite catch that—I work with menu options and property keywords (like \"create invoice\", \"unpaid\", \"repairs\", \"renewals\", or a tenant's name). Choose an option below:",
        options: MAIN_MENU_OPTIONS,
      },
      trimmed
    );
  };

  const handleResetChat = () => {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
    setActiveFlow(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "iris",
        ...buildNodeReply("menu", context, firstName),
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-background text-foreground",
        className
      )}
    >
      {/* Top Chat Header */}
      <div
        className={cn(
          "z-10 flex shrink-0 items-center justify-between border-b bg-card/70 backdrop-blur-md",
          compact ? "border-border/70 px-2.5 py-1.5 gap-1.5" : "border-border/40 px-4 py-3 sm:px-6"
        )}
      >
        <div className={cn("flex items-center min-w-0", compact ? "gap-2" : "gap-3")}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl neumorphic-extruded active:scale-95 transition-all shrink-0"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}

          <div
            className={cn(
              "relative rounded-full bg-white dark:bg-card flex items-center justify-center shrink-0 border border-border shadow-xs",
              compact ? "size-8" : "size-10"
            )}
          >
            <Image
              src="/logos/favicon.png"
              alt="iRis"
              width={compact ? 26 : 32}
              height={compact ? 26 : 32}
              className="object-cover rounded-full"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-background",
                compact ? "size-2" : "size-2.5"
              )}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2
                className={cn(
                  "tracking-tight text-foreground truncate",
                  compact ? "text-[13px] font-semibold leading-tight" : "text-base font-bold"
                )}
              >
                iRis Assistant
              </h2>
              {!compact && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Online
                </span>
              )}
            </div>
            {compact ? (
              <span className="flex items-center gap-1 text-[10.5px] font-medium leading-tight text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Online
              </span>
            ) : (
              <p className="text-xs text-muted-foreground truncate">
                Guided menu & keyword property assistant
              </p>
            )}
          </div>
        </div>

        <div className={cn("flex items-center shrink-0", compact ? "gap-0.5 text-muted-foreground" : "gap-2")}>
          <button
            type="button"
            onClick={handleResetChat}
            className={cn(
              "flex items-center justify-center transition-all active:scale-95",
              compact
                ? "size-7 rounded-lg hover:bg-muted hover:text-foreground"
                : "min-h-[38px] px-3 gap-1.5 rounded-xl neumorphic-extruded text-xs font-semibold text-muted-foreground hover:text-foreground"
            )}
            aria-label="Main Menu"
            title="Main Menu"
          >
            <RotateCcw className="size-3.5" />
            {!compact && <span className="hidden sm:inline">Main Menu</span>}
          </button>

          <button
            type="button"
            onClick={loadContext}
            disabled={isLoading}
            className={cn(
              "flex items-center justify-center transition-all active:scale-95",
              compact
                ? "size-7 rounded-lg hover:bg-muted hover:text-foreground"
                : "min-h-[38px] min-w-[38px] rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
            aria-label="Refresh Operations Data"
            title="Refresh Operations Data"
          >
            <RefreshCw className={cn(compact ? "size-3.5" : "size-4", isLoading && "animate-spin text-primary")} />
          </button>

          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className={cn(
                "flex items-center justify-center transition-all active:scale-95",
                compact
                  ? "size-7 rounded-lg hover:bg-muted hover:text-foreground"
                  : "min-h-[38px] min-w-[38px] rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
              aria-label="Minimize iRis Assistant"
              title="Minimize"
            >
              <Minus className="size-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex items-center justify-center transition-all active:scale-95",
                compact
                  ? "size-7 rounded-lg hover:bg-muted hover:text-foreground"
                  : "min-h-[38px] min-w-[38px] rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
              aria-label="Close iRis Assistant"
              title="Close"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Context Load Error Banner */}
      {contextError && !context && (
        <div className="shrink-0 mx-4 mt-3 sm:mx-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-rose-600 dark:text-rose-400 font-medium">{contextError}</span>
          <button
            type="button"
            onClick={loadContext}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 active:scale-95 transition-all shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Scrollable Chat Feed */}
      <div className={cn("flex-1 overflow-y-auto custom-scrollbar-premium", compact ? "px-2.5 py-2.5" : "px-4 py-6 sm:px-6")}>
        <div className={cn("max-w-3xl mx-auto", compact ? "space-y-2.5" : "space-y-5")}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                compact ? "gap-1.5" : "gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "iris" && (
                <div className="shrink-0 mt-auto">
                  <div className={cn("rounded-full bg-white dark:bg-card overflow-hidden flex items-center justify-center border border-border", compact ? "size-6" : "size-8")}>
                    <Image
                      src="/logos/favicon.png"
                      alt="iRis"
                      width={compact ? 22 : 28}
                      height={compact ? 22 : 28}
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col",
                  compact ? "gap-1.5 max-w-[85%]" : "gap-2 max-w-[88%] sm:max-w-[78%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* Text Bubble */}
                <div
                  className={cn(
                    "shadow-xs",
                    compact ? "px-3 py-1.5 text-[13px] leading-[1.35]" : "px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-[18px] rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>

                {/* Embedded Live Data Cards */}
                {msg.card?.type === "landlord_overview" && (
                  <div className="w-full bg-card border border-border rounded-2xl p-4 shadow-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                          Unpaid Balance
                        </span>
                        <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                          {formatPhpCurrency(msg.card.totalReceivables)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                          Occupancy
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {msg.card.occupancyRate}%
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                          Open Repairs
                        </span>
                        <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {msg.card.openTicketsCount}
                        </span>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                          Expiring Leases
                        </span>
                        <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                          {msg.card.expiringLeasesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {msg.card?.type === "landlord_unpaid" && (
                  <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4 text-rose-500" />
                        <span className="text-xs font-bold text-foreground">
                          Unpaid Rent ({formatPhpCurrency(msg.card.totalReceivables)})
                        </span>
                      </div>
                    </div>
                    {msg.card.leases.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <span>All rent accounts are up to date!</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {msg.card.leases.map((l) => (
                          <div
                            key={l.id}
                            className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">
                                {l.tenantName}
                              </p>
                              <p className="text-muted-foreground text-[11px]">
                                {l.unitName} • {l.daysOverdue}d overdue
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                                {formatPhpCurrency(l.outstandingBalance)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  advanceFlowStep({ startPaymentForLeaseId: l.id }, `Collect from ${l.tenantName}`)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 active:scale-95 transition-all"
                              >
                                Collect
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.card?.type === "landlord_maintenance" && (
                  <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                      <Wrench className="size-4 text-amber-500" />
                      <span className="text-xs font-bold text-foreground">
                        Open Repair Tickets
                      </span>
                    </div>
                    {msg.card.tickets.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <span>No open repair tickets right now.</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {msg.card.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{t.title}</p>
                              <p className="text-muted-foreground text-[11px]">
                                {t.unitName} • {t.tenantName}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.card?.type === "landlord_renewals" && (
                  <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                      <FileText className="size-4 text-blue-500" />
                      <span className="text-xs font-bold text-foreground">
                        Expiring Leases (Next 60 Days)
                      </span>
                    </div>
                    {msg.card.leases.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        <span>No leases expiring in the next 60 days.</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {msg.card.leases.map((l) => (
                          <div
                            key={l.id}
                            className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">
                                {l.tenantName}
                              </p>
                              <p className="text-muted-foreground text-[11px]">
                                {l.unitName} • Ends {l.endDate}
                              </p>
                            </div>
                            <span className="font-bold text-foreground tabular-nums font-mono shrink-0">
                              {formatPhpCurrency(l.monthlyRent)}/mo
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.card?.type === "resident_detail" && (
                  <div className="w-full bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {msg.card.lease.tenantName}
                        </p>
                        <p className="text-muted-foreground">
                          {msg.card.lease.unitName} • {msg.card.lease.propertyName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-bold font-mono tabular-nums",
                          msg.card.lease.outstandingBalance > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {formatPhpCurrency(msg.card.lease.outstandingBalance)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Monthly Rent</span>
                        <span className="font-semibold text-foreground tabular-nums font-mono">
                          {formatPhpCurrency(msg.card.lease.monthlyRent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Lease Ends</span>
                        <span className="font-semibold text-foreground">
                          {msg.card.lease.endDate}
                        </span>
                      </div>
                    </div>
                    {onOpenConversation && (
                      <button
                        type="button"
                        onClick={() => onOpenConversation(msg.card?.type === "resident_detail" ? msg.card.lease.tenantId : "")}
                        className="w-full min-h-[36px] rounded-xl bg-muted/60 hover:bg-muted text-foreground font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="size-3.5" />
                        Open Chat with {msg.card.lease.tenantName}
                      </button>
                    )}
                  </div>
                )}

                {/* Decision-Tree Menu Buttons */}
                {msg.role === "iris" && msg.options && msg.options.length > 0 && (
                  <div className={cn("flex flex-wrap pt-0.5", compact ? "gap-1.5" : "gap-2")}>
                    {msg.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        disabled={isTyping}
                        onClick={() => handleOptionClick(opt)}
                        className={cn(
                          "inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 active:scale-95 transition-all disabled:opacity-50",
                          compact ? "px-2.5 py-1 rounded-full text-[11.5px] font-medium" : "px-3.5 py-2 rounded-xl text-xs font-semibold"
                        )}
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className={cn("opacity-70", compact ? "size-3" : "size-3.5")} />
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={cn(
                    "text-[10px] font-medium text-muted-foreground px-1",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="shrink-0 mt-auto">
                  <div className={cn("rounded-full bg-card flex items-center justify-center font-bold text-muted-foreground border border-border", compact ? "size-6 text-[10px]" : "size-8 text-xs")}>
                    {userInitials}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className={cn("flex w-full justify-start", compact ? "gap-1.5" : "gap-3")} aria-label="iRis is typing">
              <div className="shrink-0 mt-auto">
                <div className={cn("rounded-full bg-white dark:bg-card overflow-hidden flex items-center justify-center border border-border", compact ? "size-6" : "size-8")}>
                  <Image
                    src="/logos/favicon.png"
                    alt="iRis"
                    width={compact ? 22 : 28}
                    height={compact ? 22 : 28}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={cn("rounded-2xl rounded-bl-sm bg-card border border-border flex items-center gap-1.5", compact ? "px-3 py-2" : "px-4 py-3.5")}>
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Keyword Input & Quick Action Chips */}
      <div
        className={cn(
          "shrink-0 bg-card/80 backdrop-blur-xl border-t",
          compact ? "border-border/70 px-2 pb-2 pt-1.5" : "border-border/50 px-4 py-4 sm:px-6"
        )}
      >
        <div className={cn("max-w-3xl mx-auto flex flex-col", compact ? "gap-1.5" : "gap-3")}>
          {/* Quick Action Shortcuts */}
          <div className={cn("flex items-center overflow-x-auto custom-scrollbar-premium", compact ? "gap-1 pb-0.5" : "gap-2 pb-1")}>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => appendBotNode("unpaid_rent", "Unpaid Rent")}
              className={cn(
                "whitespace-nowrap rounded-full font-semibold bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50",
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
              )}
            >
              Unpaid Rent
            </button>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => appendBotNode("maintenance", "Open Repairs")}
              className={cn(
                "whitespace-nowrap rounded-full font-semibold bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50",
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
              )}
            >
              Open Repairs
            </button>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => appendBotNode("renewals", "Expiring Leases")}
              className={cn(
                "whitespace-nowrap rounded-full font-semibold bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50",
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
              )}
            >
              Expiring Leases
            </button>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => startFlow("invoice", "Create Invoice")}
              className={cn(
                "whitespace-nowrap rounded-full font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/15 transition-all active:scale-95 disabled:opacity-50",
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
              )}
            >
              Create Invoice
            </button>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => startFlow("broadcast", "Broadcast Notice")}
              className={cn(
                "whitespace-nowrap rounded-full font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25 hover:bg-purple-500/15 transition-all active:scale-95 disabled:opacity-50",
                compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
              )}
            >
              Broadcast Notice
            </button>
          </div>

          {/* Keyword Input Box */}
          <div
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              compact
                ? "rounded-full border border-border/70 bg-muted/50 py-1 pl-3 pr-1 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15"
                : "items-end gap-2 bg-background border border-border rounded-2xl p-2 focus-within:border-primary/60"
            )}
          >
            <textarea
              maxLength={500}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleKeywordSubmit();
                }
              }}
              placeholder={compact ? "Ask iRis (e.g. unpaid, Room 301)…" : "Type what you need (e.g. create invoice, unpaid, Room 301) or tap a button..."}
              aria-label="Message iRis Assistant"
              rows={1}
              className={cn(
                "flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground",
                compact
                  ? "py-0.5 max-h-[72px] text-[13px] leading-[18px]"
                  : "pt-2 px-3 min-h-[40px] max-h-[120px] text-sm"
              )}
            />
            <button
              type="button"
              onClick={() => handleKeywordSubmit()}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className={cn(
                "shrink-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:scale-100",
                compact ? "size-8 rounded-full" : "size-10 rounded-xl"
              )}
            >
              <ArrowUp className={compact ? "size-4" : "size-5"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
