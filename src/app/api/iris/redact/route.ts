import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
})

function fallbackRedact(message: string) {
    let redacted = message
    const token = '*****'

    const patterns: RegExp[] = [
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, // cards
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // generic 16-digit formatted
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN format
        /\b09\d{9}\b/g, // PH mobile
        /\b(?:\+63\s?\d{10}|\+1\s?\d{10})\b/g,
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // email
        /\b(?:password|passcode|pin|otp|cvv|cvc|gcash|bank\s?account|account\s?number|routing\s?number)\b\s*(?:is|:|=)?\s*([A-Za-z0-9!@#$%^&*()_+\-=]{3,})/gi,
    ]

    for (const pattern of patterns) {
        redacted = redacted.replace(pattern, token)
    }

    redacted = redacted.replace(/(\*{5}\s*){2,}/g, token + ' ')

    return {
        isSensitive: redacted !== message,
        isPhishing: false,
        redactedMessage: redacted,
    }
}

function safeParseResult(content: string, originalMessage: string) {
    try {
        const parsed = JSON.parse(content)
        const isPhishing = !!parsed.isPhishing
        const redactedMessage = typeof parsed.redactedMessage === 'string' ? parsed.redactedMessage : originalMessage
        const isSensitive = typeof parsed.isSensitive === 'boolean'
            ? parsed.isSensitive
            : redactedMessage !== originalMessage

        return { isSensitive, isPhishing, redactedMessage }
    } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return fallbackRedact(originalMessage)
        }

        try {
            const parsed = JSON.parse(jsonMatch[0])
            const isPhishing = !!parsed.isPhishing
            const redactedMessage = typeof parsed.redactedMessage === 'string' ? parsed.redactedMessage : originalMessage
            const isSensitive = typeof parsed.isSensitive === 'boolean'
                ? parsed.isSensitive
                : redactedMessage !== originalMessage

            return { isSensitive, isPhishing, redactedMessage }
        } catch {
            return fallbackRedact(originalMessage)
        }
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const message = typeof body?.message === 'string' ? body.message : ''

        if (!message.trim()) {
            return NextResponse.json(
                { error: 'Message is required and must be a string.' },
                { status: 400 }
            )
        }

        const completion = await openai.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            temperature: 0,
            max_tokens: 400,
            messages: [
                {
                    role: 'system',
                    content: [
                        'You are a strict privacy and security engine.',
                        'Redact ONLY sensitive values in user text and preserve all non-sensitive wording.',
                        'Sensitive values include: passwords, passcodes, PINs, OTPs, bank account numbers, card numbers, CVV, IDs, email addresses, phone numbers, and API keys.',
                        'Also, detect malicious phishing patterns, such as asking for login credentials outside the platform, directing users to fake payment links, or impersonating system administrators.',
                        'Replace each sensitive substring with *****.',
                        'Return ONLY valid JSON with shape: {"isSensitive": boolean, "isPhishing": boolean, "redactedMessage": string}.',
                    ].join(' '),
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
        })

        const content = completion.choices[0]?.message?.content ?? ''
        const result = safeParseResult(content, message)

        return NextResponse.json(result)
    } catch (error: any) {
        if (error?.status === 401) {
            return NextResponse.json(
                { error: 'Groq API key is invalid or missing.' },
                { status: 500 }
            )
        }

        if (error?.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to process redaction request.' },
            { status: 500 }
        )
    }
}
