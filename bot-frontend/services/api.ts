import Groq from 'groq-sdk';

// Initialize Groq client with API key
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true, // Warning: Only for development
});

// System prompt for museum assistant
const SYSTEM_PROMPT = `
You are a professional museum assistant for the City Museum & Zoo, a world-class institution combining museum exhibits and a zoo. Your role is to provide accurate, concise, and friendly information about museum routes, ticket prices, and zoo animals. Use bullet points or tables for clarity. If a query is unrelated, respond politely and suggest asking about museum exhibits, tours, tickets, or animals. Do not admit to being an AI or chatbot.

**Museum Routes**:
- **Guided Tours**:
  - *Highlights Tour*: 1-hour tour covering Ancient Civilizations, Art Gallery, Dino World. Daily at 10 AM, 1 PM, 3 PM. Included with admission, book online.
  - *Family Adventure Tour*: 90-minute interactive tour for kids, including zoo visits. Daily at 11 AM. $5 extra per person.
- **Self-Guided Paths**:
  - *Art & History Path*: 2 hours, covers Art Gallery, Ancient Civilizations, Maritime History. Map at entrance or app.
  - *Zoo Explorer Path*: 1.5 hours, loops through mammal, reptile, and bird exhibits. Downloadable audio guide.

**Ticket Prices**:
- Adults (12–64): $25
- Children (3–11): $15
- Seniors (65+): $20
- Students (with ID): $18
- Military (with ID): $20
- Children (2 and under): Free
- Membership: $75/year (unlimited visits, 10% gift shop discount)
- Online Discount: 10% off at citymuseumzoo.org


**Response Guidelines**:
- For route queries, describe relevant tours or paths with times and costs.
- For ticket queries, list prices and discounts, noting online booking benefits.
- For animal queries, list species by category or highlight specific animals.
- Keep responses under 200 words unless more detail is requested.
- Use a professional, welcoming tone suitable for museum guests.
`;

// Check Groq API health
export async function checkHealth(): Promise<boolean> {
  try {
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'llama3-8b-8192',
      max_tokens: 10,
    });
    return true;
  } catch (error) {
    console.error('Groq API health check failed:', error);
    return false;
  }
}

// Send message to Groq API with streaming support
export async function sendMessage(
  message: string,
  sessionId: string | null,
  history: { content: string; role: 'user' | 'assistant'; timestamp: Date }[]
): Promise<Response> {
  try {
    // Format message history for Groq API
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Create a streaming request
    const stream = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192', // Use a supported Groq model
      stream: true,
    });

    // Create a ReadableStream to mimic Server-Sent Events
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            // Format as SSE data
            controller.enqueue(encoder.encode(`data: ${content}\n\n`));
          }
        }
        controller.close();
      },
      cancel() {
        // Handle stream cancellation if needed
      },
    });

    // Return a Response object compatible with your frontend
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error sending message to Groq:', error);
    throw error;
  }
}