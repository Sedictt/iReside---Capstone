# iRis AI Assistant Integration

This directory contains the AI integration for the iRis virtual assistant feature.

## Overview

iRis is an AI-powered concierge assistant that helps tenants with:
- Questions about their building, lease, and amenities
- Summarizing lease agreements and building policies
- Acting as an AI concierge for building-related requests
- Maintaining context within conversations

## Architecture

### Components

1. **API Route** (`/api/iris/chat`)
   - Handles chat requests from the frontend
   - Authenticates users via Supabase
   - Retrieves tenant context for RAG (Retrieval-Augmented Generation)
   - Calls Groq's Llama 3 API for high-speed, free AI responses

2. **Context Module** (`context.ts`)
   - `getTenantContext()`: Retrieves relevant tenant data from Supabase
   - `formatContextForAI()`: Formats context into a system prompt for the AI

3. **Frontend Components**
   - `TenantIrisChat.tsx`: Full-page chat interface
   - `ChatWidget.tsx`: Floating chat widget

## Setup

### 1. Get a Groq API Key

1. Go to [GroqConsole](https://console.groq.com/keys)
2. Sign up or log in (No credit card needed)
3. Create a new API key
4. Copy the key

### 2. Add Environment Variable

Add to your `.env.local` file:

```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Install Dependencies

The OpenAI SDK is already installed (we use it to connect to Groq's OpenAI-compatible endpoint). If needed:

```bash
npm install openai
```

## Usage

### Making a Chat Request

```typescript
const response = await fetch('/api/iris/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are the building amenities?',
    conversationHistory: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi! How can I help?' }
    ]
  }),
});

const data = await response.json();
console.log(data.response); // AI response
```

### Response Format

```typescript
{
  response: string;           // AI-generated response
  hasDataCard: boolean;       // Whether to show a data card (e.g., WiFi info)
  metadata: {
    model: string;            // Model used (e.g., llama-3.1-8b-instant)
    tokens: number;           // Total tokens used
  }
}
```

## RAG (Retrieval-Augmented Generation)

The system retrieves relevant context for each tenant:

- **Profile**: Name, email, phone
- **Property**: Building name, address, amenities, house rules
- **Unit**: Unit number, floor, bedrooms, bathrooms
- **Lease**: Status, dates, rent amount, terms
- **Maintenance Requests**: Recent requests and their status
- **Payments**: Recent payment history

This context is formatted into a system prompt that guides the AI's responses.

## Cost Considerations

**Groq Pricing:**
- **Llama 3.1 8B**: 100% Free
- **Mixtral 8x7b**: 100% Free
*(No credit card required)*

**Estimated costs:**
- Average conversation: 0
- 1,000 conversations: 0
- Extremely generous rate limits, perfect for development and low-traffic production.

## Alternative AI Models

If you want to use a different model, modify `/api/iris/chat/route.ts`:

### OpenAI (Paid)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages,
});
```

### Anthropic Claude

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 500,
  messages,
});
```

## Error Handling

The API handles common errors:
- **401**: User not authenticated
- **400**: Invalid request (missing message)
- **429**: Rate limit exceeded
- **500**: API connection or server errors

## Security

- All requests require authentication via Supabase
- API keys are stored in environment variables (never in code)
- User context is scoped to the authenticated tenant only
- No sensitive data is logged

## Future Enhancements

- [ ] Conversation history storage in database
- [ ] Streaming responses for better UX
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with maintenance request creation
- [ ] Payment processing via chat
- [ ] Scheduled reminders and notifications

