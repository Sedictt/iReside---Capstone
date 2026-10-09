import { NextResponse } from 'next/server'
import { redactWithAiOrFallback } from '@/lib/messages/redaction-service'
import { parseJsonBody } from '@/lib/validation/server'
import { irisRedactSchema } from '@/lib/validation/schemas/operations.schema'

export async function POST(request: Request) {
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
