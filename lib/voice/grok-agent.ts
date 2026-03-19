/**
 * Grok AI voice agent - generates conversational responses for phone calls
 */

interface ConversationEntry {
  role: "caller" | "agent";
  text: string;
}

export async function generateVoiceResponse(
  systemPrompt: string,
  conversation: ConversationEntry[],
  callerSpeech: string,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY not configured");
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversation.map((entry) => ({
      role: (entry.role === "caller" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: entry.text,
    })),
    { role: "user" as const, content: callerSpeech },
  ];

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Grok API error:", response.status, errorText);
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I'm sorry, I didn't catch that. Could you repeat?"
  );
}
