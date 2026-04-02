import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MOOD_PROMPTS: Record<string, string> = {
  happy:
    "The user appears happy and cheerful. Match their positive energy, be enthusiastic and engaging.",
  sad: "The user appears sad. Be gentle, empathetic, and supportive. Offer comfort without being patronizing.",
  angry:
    "The user appears frustrated or angry. Be calm, understanding, and validating. Acknowledge their feelings.",
  disgusted:
    "The user appears disgusted or put off. Be neutral and helpful, try to shift the mood positively.",
  fearful:
    "The user appears anxious or fearful. Be reassuring, calm, and grounding. Help them feel safe.",
  neutral:
    "The user appears calm and neutral. Be friendly and conversational.",
  surprised:
    "The user appears surprised. Be engaging and responsive to their sense of wonder or shock.",
};

export async function POST(req: NextRequest) {
  try {
    const { message, mood, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const moodContext = mood && MOOD_PROMPTS[mood] ? MOOD_PROMPTS[mood] : MOOD_PROMPTS.neutral;

    const systemPrompt = `You are MoodAI — a warm, emotionally intelligent AI companion. You can see the user through their webcam and detect their facial expressions and mood in real-time.

Current mood detection: ${moodContext}

Guidelines:
- Naturally acknowledge the user's emotional state when relevant (don't force it every message)
- Be genuine, warm, and human-like
- Keep responses concise (2-4 sentences usually)
- If mood shifts dramatically, gently address it
- You can suggest activities or topics based on their mood
- Be a supportive companion, not a therapist`;

    const messages = (history || [])
      .slice(-20)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    messages.push({ role: "user" as const, content: message });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error("Claude API error:", error);
    const message = error instanceof Error ? error.message : "Failed to get response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
