import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { getTenantContext, formatContextForAI } from '@/lib/iris/context'

// Initialize OpenAI client for Groq (Free Tier API)
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1', // Using Groq's OpenAI-compatible endpoint
})

export async function POST(request: Request) {
    try {
        // Authenticate user
        const supabase = await createClient()
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in.' },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { message, conversationHistory } = body

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string.' },
                { status: 400 }
            )
        }

        // Get tenant context for RAG
        const context = await getTenantContext(user.id)
        const systemPrompt = formatContextForAI(context)

        // Build conversation messages
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: systemPrompt,
            },
        ]

        // Add conversation history if provided
        if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.forEach((msg: any) => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({
                        role: msg.role,
                        content: msg.content,
                    })
                }
            })
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: message,
        })

        // Call Groq API (OpenAI-compatible)
        const completion = await openai.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Completely free, lightning-fast model
            messages,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
        })

        const aiResponse = completion.choices[0]?.message?.content

        if (!aiResponse) {
            return NextResponse.json(
                { error: 'Failed to generate response from AI.' },
                { status: 500 }
            )
        }

        // Check if response mentions WiFi to trigger data card
        const hasWifiInfo = message.toLowerCase().includes('wifi') || 
                           message.toLowerCase().includes('internet') ||
                           message.toLowerCase().includes('network')

        // Return response
        return NextResponse.json({
            response: aiResponse,
            hasDataCard: hasWifiInfo && context.property?.amenities?.some(a => 
                a.toLowerCase().includes('wifi') || a.toLowerCase().includes('internet')
            ),
            metadata: {
                model: 'llama-3.1-8b-instant',
                tokens: completion.usage?.total_tokens || 0,
            },
        })
    } catch (error: any) {
        console.error('Error in iRis chat API:', error)

        // Handle specific API format errors
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
            { error: 'An error occurred while processing your request.' },
            { status: 500 }
        )
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'iRis Chat API',
        version: '1.0.0',
    })
}

