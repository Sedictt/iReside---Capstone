import { NextResponse } from 'next/server'
import { redactWithAiOrFallback } from '@/lib/messages/redaction-service'

export async function POST(request: Request) {
    let message = "";
    try {
        const body = await request.json();
        message = typeof body?.message === "string" ? body.message : "";

        if (!message.trim()) {
            return NextResponse.json(
                { error: "Message is required and must be a string." },
                { status: 400 }
            )
        }

        const result = await redactWithAiOrFallback(message);

        return NextResponse.json(result)
    } catch {
        if (!message.trim()) {
            return NextResponse.json(
                { error: "Message is required and must be a string." },
                { status: 400 }
            )
        }
        const fallback = await redactWithAiOrFallback(message);
        return NextResponse.json(fallback)
    }
}
