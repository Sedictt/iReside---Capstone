/**
 * IrisService — orchestrator for iRis AI conversational assistant and history.
 *
 * Scoped to an injected SupabaseClient instance.
 * Never imports createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { Database } from "@/types/database";
import { IrisContextService } from "./iris-context.service";
import {
  IrisOperationsService,
  type LandlordOperationsContext,
} from "./iris-operations.service";
import type { IrisCardData, IrisChatResponse, IrisHistoryItem } from "./iris.types";
import {
  IrisAiProviderError,
  IrisRateLimitError,
  IrisValidationError,
} from "./iris.errors";
import { isPreseededPhone, isPreseededEmail } from "@/lib/validation/brand-setup";

export interface IrisAiClient {
  chat: {
    completions: {
      create(params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming): Promise<OpenAI.Chat.ChatCompletion>;
    };
  };
}

export class IrisService {
  private readonly contextService: IrisContextService;
  private readonly aiClient: IrisAiClient;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    injectedAiClient?: IrisAiClient,
  ) {
    this.contextService = new IrisContextService(supabase);
    this.aiClient =
      injectedAiClient ??
      new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
  }

  /**
   * Process a user chat message with context injection, AI completion, and persistence.
   *
   * @param userId - Authenticated user ID.
   * @param message - User text message.
   * @param userRole - Authenticated user role ("landlord" | "tenant" | etc.).
   */
  async processChatMessage(
    userId: string,
    message: string,
    userRole?: string,
  ): Promise<IrisChatResponse> {
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new IrisValidationError("Message is required and must be a non-empty string.");
    }

    const isLandlord = userRole === "landlord";
    let landlordContext: LandlordOperationsContext | null = null;
    let tenantContext: Awaited<ReturnType<IrisContextService["getTenantContext"]>> | null = null;
    let systemPrompt: string;

    if (isLandlord) {
      landlordContext = await IrisOperationsService.getLandlordOperationalContext(
        this.supabase,
        userId,
      );
      systemPrompt = this.formatLandlordContextForAi(landlordContext);
    } else {
      tenantContext = await this.contextService.getTenantContext(userId);
      systemPrompt = this.contextService.formatContextForAi(tenantContext);
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    const { data: historyRows } = await (this.supabase as any)
      .from("iris_chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80);

    // Newest 80 rows were fetched; restore chronological order for the model.
    ((historyRows ?? []) as Array<{ role: "user" | "assistant"; content: string }>).reverse().forEach(
      (entry) => {
        if (
          (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.content === "string"
        ) {
          messages.push({
            role: entry.role,
            content: entry.content,
          });
        }
      },
    );

    messages.push({
      role: "user",
      content: message,
    });

    let completion: OpenAI.Chat.ChatCompletion;
    try {
      completion = await this.aiClient.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });
    } catch (error: any) {
      if (error?.status === 429) {
        throw new IrisRateLimitError();
      }
      throw new IrisAiProviderError(error?.message || "Failed to generate response from AI.");
    }

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new IrisAiProviderError("Received empty response from AI model.");
    }

    const lowerMessage = message.toLowerCase();
    let card: IrisCardData | null = null;
    let isWifiQuery = false;

    if (isLandlord && landlordContext) {
      card = this.detectLandlordCard(lowerMessage, landlordContext);
    } else if (tenantContext) {
      isWifiQuery =
        lowerMessage.includes("wifi") ||
        lowerMessage.includes("wi-fi") ||
        lowerMessage.includes("internet") ||
        lowerMessage.includes("network");

      const isLandlordQuery =
        lowerMessage.includes("landlord") ||
        lowerMessage.includes("may-ari") ||
        lowerMessage.includes("mayari") ||
        lowerMessage.includes("property manager") ||
        lowerMessage.includes("pangalan ng landlord") ||
        lowerMessage.includes("contact information") ||
        lowerMessage.includes("contact details") ||
        (lowerMessage.includes("contact") && (lowerMessage.includes("owner") || lowerMessage.includes("manager")));

      const isRentQuery =
        lowerMessage.includes("rent status") ||
        lowerMessage.includes("monthly rent") ||
        lowerMessage.includes("magkano ang upa") ||
        lowerMessage.includes("magkano renta") ||
        lowerMessage.includes("rent due") ||
        lowerMessage.includes("payment status");

      if (isWifiQuery && tenantContext.wifiInfo) {
        card = {
          type: "wifi",
          ssid: tenantContext.wifiInfo.ssid,
          password: tenantContext.wifiInfo.password,
          notes: tenantContext.wifiInfo.notes || undefined,
        };
      } else if (isLandlordQuery && tenantContext.landlord) {
        const phone = tenantContext.landlord.phone && !isPreseededPhone(tenantContext.landlord.phone)
          ? tenantContext.landlord.phone
          : undefined;
        const email = tenantContext.landlord.email && !isPreseededEmail(tenantContext.landlord.email)
          ? tenantContext.landlord.email
          : undefined;
        card = {
          type: "landlord",
          name: tenantContext.landlord.full_name || "Building Management",
          businessName: tenantContext.landlord.business_name ?? undefined,
          phone,
          email,
        };
      } else if (isRentQuery && tenantContext.lease) {
        card = {
          type: "rent",
          monthlyRent: Number(tenantContext.lease.monthly_rent || 0),
          securityDeposit: tenantContext.lease.security_deposit ? Number(tenantContext.lease.security_deposit) : undefined,
          status: tenantContext.payments[0]?.status || tenantContext.lease.status || "active",
          dueDate: (tenantContext.lease.terms as any)?.paymentDueDay
            ? `Day ${(tenantContext.lease.terms as any).paymentDueDay} of each month`
            : undefined,
          lastPaymentDate: tenantContext.payments[0]?.created_at
            ? new Date(tenantContext.payments[0].created_at).toLocaleDateString()
            : undefined,
        };
      }
    }

    const totalTokens = completion.usage?.total_tokens ?? 0;

    await (this.supabase as any)
      .from("iris_chat_messages")
      .insert([
        {
          user_id: userId,
          role: "user",
          content: message,
          metadata: null,
        },
        {
          user_id: userId,
          role: "assistant",
          content: aiResponse,
          metadata: {
            model: "openai/gpt-oss-120b",
            tokens: totalTokens,
            card: card ?? null,
          },
        },
      ]);

    const hasDataCard = Boolean(card !== null || isWifiQuery);

    return {
      response: aiResponse,
      hasDataCard,
      card,
      metadata: {
        model: "openai/gpt-oss-120b",
        tokens: totalTokens,
      },
    };
  }


  /**
   * Fetch chat history for the user.
   *
   * @param userId - Authenticated user ID.
   * @param limit - Maximum messages to return (clamped between 1 and 300).
   */
  async getChatHistory(userId: string, limit = 100): Promise<IrisHistoryItem[]> {
    const clampedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100;

    const { data, error } = await (this.supabase as any)
      .from("iris_chat_messages")
      .select("id, role, content, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(clampedLimit);

    if (error) {
      throw new Error(`Failed to fetch iRis chat history: ${error.message}`);
    }

    return (data ?? []) as IrisHistoryItem[];
  }

  private formatLandlordContextForAi(ctx: LandlordOperationsContext): string {
    const overdueLines =
      ctx.overdueLeases.length > 0
        ? ctx.overdueLeases
            .slice(0, 10)
            .map(
              (l) =>
                `- ${l.tenantName} (${l.unitName}, ${l.propertyName}): ₱${l.outstandingBalance.toLocaleString()} overdue (${l.daysOverdue}d)`,
            )
            .join("\n")
        : "- None";

    const ticketLines =
      ctx.openTickets.length > 0
        ? ctx.openTickets
            .slice(0, 10)
            .map(
              (t) =>
                `- ${t.title} (${t.unitName}, ${t.tenantName}): priority=${t.priority}, status=${t.status}`,
            )
            .join("\n")
        : "- None";

    const expiringLines =
      (ctx.expiringLeases?.length ?? 0) > 0
        ? (ctx.expiringLeases ?? [])
            .slice(0, 10)
            .map(
              (l) =>
                `- ${l.tenantName} (${l.unitName}): ends ${l.endDate}, rent ₱${l.monthlyRent.toLocaleString()}`,
            )
            .join("\n")
        : "- None";

    const activeLines =
      ctx.activeLeases.length > 0
        ? ctx.activeLeases
            .slice(0, 20)
            .map(
              (l) =>
                `- ${l.tenantName} | ${l.unitName} (${l.propertyName}) | rent ₱${l.monthlyRent.toLocaleString()} | balance ₱${l.outstandingBalance.toLocaleString()}`,
            )
            .join("\n")
        : "- None";

    return [
      "You are iRis, a friendly, practical AI property management assistant for a landlord in iReside.",
      "Use everyday, plain English (or Taglish if the landlord writes in Taglish). Be concise, accurate, and never invent numbers or tenants.",
      "Only cite facts from the live portfolio data below. If asked to create an invoice, record a payment, or send a broadcast notice, explain clearly and point out the quick-action button or Quick Tools tab.",
      "",
      `PORTFOLIO SUMMARY:`,
      `- Properties: ${ctx.properties.map((p) => `${p.name} (${p.occupiedUnits}/${p.totalUnits} occupied)`).join(", ") || "None"}`,
      `- Occupancy Rate: ${ctx.occupancyRate}% (${ctx.activeLeases.length} active leases)`,
      `- Total Unpaid Balance: ₱${ctx.totalReceivables.toLocaleString()} (${ctx.overdueLeases.length} overdue)`,
      `- Open Repair Tickets: ${ctx.openTickets.length}`,
      `- Leases Expiring Within 60 Days: ${ctx.expiringLeases?.length ?? 0}`,
      "",
      "UNPAID / OVERDUE RENT:",
      overdueLines,
      "",
      "OPEN REPAIRS & MAINTENANCE:",
      ticketLines,
      "",
      "EXPIRING LEASES (60 DAYS):",
      expiringLines,
      "",
      "ACTIVE RESIDENTS:",
      activeLines,
    ].join("\n");
  }

  private detectLandlordCard(
    lowerMessage: string,
    ctx: LandlordOperationsContext,
  ): IrisCardData | null {
    if (
      lowerMessage.includes("unpaid") ||
      lowerMessage.includes("overdue") ||
      lowerMessage.includes("collect") ||
      lowerMessage.includes("balance") ||
      lowerMessage.includes("utang") ||
      lowerMessage.includes("bayad")
    ) {
      return {
        type: "landlord_unpaid",
        totalReceivables: ctx.totalReceivables,
        leases: ctx.overdueLeases.slice(0, 5).map((l) => ({
          id: l.id,
          tenantName: l.tenantName,
          unitName: l.unitName,
          outstandingBalance: l.outstandingBalance,
          daysOverdue: l.daysOverdue,
        })),
      };
    }

    if (
      lowerMessage.includes("repair") ||
      lowerMessage.includes("maintenance") ||
      lowerMessage.includes("ticket") ||
      lowerMessage.includes("sira")
    ) {
      return {
        type: "landlord_maintenance",
        tickets: ctx.openTickets.slice(0, 5).map((t) => ({
          id: t.id,
          title: t.title,
          unitName: t.unitName,
          tenantName: t.tenantName,
          priority: t.priority,
          status: t.status,
        })),
      };
    }

    if (
      lowerMessage.includes("expir") ||
      lowerMessage.includes("renew") ||
      lowerMessage.includes("contract")
    ) {
      return {
        type: "landlord_renewals",
        leases: (ctx.expiringLeases ?? []).slice(0, 5).map((l) => ({
          id: l.id,
          tenantName: l.tenantName,
          unitName: l.unitName,
          endDate: l.endDate,
          monthlyRent: l.monthlyRent,
        })),
      };
    }

    if (
      lowerMessage.includes("summary") ||
      lowerMessage.includes("overview") ||
      lowerMessage.includes("status") ||
      lowerMessage.includes("occupancy") ||
      lowerMessage.includes("how are my properties")
    ) {
      return {
        type: "landlord_overview",
        totalReceivables: ctx.totalReceivables,
        overdueCount: ctx.overdueLeases.length,
        openTicketsCount: ctx.openTickets.length,
        expiringLeasesCount: ctx.expiringLeases?.length ?? 0,
        occupancyRate: ctx.occupancyRate,
        activeLeasesCount: ctx.activeLeases.length,
      };
    }

    return null;
  }
}
