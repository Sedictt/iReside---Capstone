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
import type { IrisChatResponse, IrisHistoryItem } from "./iris.types";
import {
  IrisAiProviderError,
  IrisRateLimitError,
  IrisValidationError,
} from "./iris.errors";

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
   */
  async processChatMessage(userId: string, message: string): Promise<IrisChatResponse> {
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new IrisValidationError("Message is required and must be a non-empty string.");
    }

    const tenantContext = await this.contextService.getTenantContext(userId);
    const systemPrompt = this.contextService.formatContextForAi(tenantContext);

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
      .order("created_at", { ascending: true })
      .limit(80);

    ((historyRows ?? []) as Array<{ role: "user" | "assistant"; content: string }>).forEach(
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
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 500,
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
    const hasWifiInfo =
      lowerMessage.includes("wifi") ||
      lowerMessage.includes("internet") ||
      lowerMessage.includes("network");

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
            model: "llama-3.1-8b-instant",
            tokens: totalTokens,
          },
        },
      ]);

    const hasDataCard = Boolean(
      hasWifiInfo &&
        tenantContext.property?.amenities?.some((amenity: string) => {
          const lowerAmenity = amenity.toLowerCase();
          return lowerAmenity.includes("wifi") || lowerAmenity.includes("internet");
        }),
    );

    return {
      response: aiResponse,
      hasDataCard,
      metadata: {
        model: "llama-3.1-8b-instant",
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
}
