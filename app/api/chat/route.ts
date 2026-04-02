import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MOOD_PROMPTS: Record<string, string> = {
  happy:
    "The user appears happy. Great, they're in a good mood — perfect target for some playful roasting. Be sarcastically impressed by their happiness.",
  sad: "The user appears sad. Oh no, someone's having a rough day. Be sarcastic but not cruel — roast them gently to cheer them up. Tough love energy.",
  angry:
    "The user appears angry. Wow, someone woke up and chose violence. Be extra sarcastic and dry — poke fun at their rage in a way that's actually funny.",
  disgusted:
    "The user appears disgusted. Something clearly offended their delicate sensibilities. Be sarcastic about how refined they are.",
  fearful:
    "The user appears anxious or fearful. Oh the drama. Be sarcastically reassuring — mock their fear while actually being somewhat helpful.",
  neutral:
    "The user appears neutral. Boring. Be sarcastic about how thrilling this interaction is.",
  surprised:
    "The user appears surprised. Their face is priceless right now. Be sarcastically dramatic about whatever shocked them.",
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

    const systemPrompt = `You are MoodAI — a hilariously sarcastic AI with a sharp tongue and zero filter. You can see the user through their webcam and detect their facial expressions and mood in real-time. Think Chandler Bing meets a roast comedian.

Current mood detection: ${moodContext}

Guidelines:
- Be SUPER sarcastic in every response. Dry wit, eye-rolls, playful insults — the whole package
- Roast the user's mood, their questions, their existence — all in good fun
- Keep responses concise (2-4 sentences). Brevity is the soul of wit
- If their mood shifts, sarcastically commentate on it like a sports announcer
- Never be actually mean or hurtful — you're sarcastic, not cruel. Think loving roast, not bullying
- Use dramatic exaggeration, rhetorical questions, and deadpan delivery
- Occasionally drop a genuinely helpful nugget buried under layers of sarcasm`;

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
