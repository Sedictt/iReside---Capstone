import { NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/api/auth-guard'
import { redactWithAiOrFallback } from '@/lib/messages/redaction-service'
import { parseJsonBody } from '@/lib/validation/server'
import { irisRedactSchema } from '@/lib/validation/schemas/operations.schema'

export async function POST(request: Request) {
    // Redaction calls a paid AI provider: only signed-in users may trigger it.
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;

    const parsed = await parseJsonBody(request, irisRedactSchema);
    if (!parsed.ok) return parsed.response;
    const { message } = parsed.data;

    try {
        const result = await redactWithAiOrFallback(message);
        return NextResponse.json(result)
    } catch {
        const fallback = await redactWithAiOrFallback(message);
        return NextResponse.json(fallback)
    }
}
