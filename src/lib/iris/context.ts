import { createClient } from "@/lib/supabase/server";
import { IrisContextService } from "@/lib/services/iris";
import type { TenantAiContext } from "@/lib/services/iris";

/**
 * Retrieves relevant context for the iRis AI assistant based on the tenant's information.
 * @deprecated Prefer importing `IrisContextService` directly from `@/lib/services/iris`.
 */
export async function getTenantContext(tenantId: string): Promise<TenantAiContext> {
    const supabase = await createClient();
    const contextService = new IrisContextService(supabase);
    return contextService.getTenantContext(tenantId);
}

/**
 * Formats the context into a system prompt for the AI.
 * @deprecated Prefer importing `IrisContextService` directly from `@/lib/services/iris`.
 */
export function formatContextForAI(context: TenantAiContext): string {
    const contextService = new IrisContextService(null as any);
    return contextService.formatContextForAi(context);
}


