"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, Mood } from "@/lib/mood-types";

interface ChatPanelProps {
  currentMood: Mood;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onThinkingChange: (thinking: boolean) => void;
}

export default function ChatPanel({
  currentMood,
  onSpeak,
  isSpeaking,
  onThinkingChange,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      mood: currentMood,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    onThinkingChange(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mood: currentMood,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Chat failed");

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastResponse(data.response);

      if (autoSpeak) {
        onSpeak(data.response);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      onThinkingChange(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Last response display */}
      {lastResponse && (
        <div className="text-center px-8">
          <p className="text-white/70 text-sm leading-relaxed font-light">
            {lastResponse}
          </p>
        </div>
      )}

      {/* Chat history (collapsible) */}
      {messages.length > 2 && (
        <div
          ref={scrollRef}
          className="max-h-32 overflow-y-auto px-4 space-y-2 scrollbar-thin"
        >
          {messages.slice(0, -2).map((msg, i) => (
            <div
              key={i}
              className={`text-xs ${
                msg.role === "user" ? "text-white/30 text-right" : "text-white/20"
              }`}
            >
              {msg.content.slice(0, 100)}
              {msg.content.length > 100 ? "..." : ""}
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            autoSpeak
              ? "bg-white/10 text-white/70"
              : "bg-white/5 text-white/20"
          }`}
          title={autoSpeak ? "Voice on" : "Voice off"}
        >
          {autoSpeak ? "🔊" : "🔇"}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex-1 relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Thinking..." : "Talk to MoodAI..."}
            className="w-full bg-white/5 text-white rounded-full px-6 py-3.5 text-sm border border-white/10 focus:border-white/25 focus:outline-none focus:ring-0 transition-all placeholder:text-white/20 backdrop-blur-md"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        {lastResponse && (
          <button
            onClick={() => lastResponse && onSpeak(lastResponse)}
            disabled={isSpeaking}
            className="shrink-0 w-10 h-10 rounded-full bg-white/5 text-white/30 flex items-center justify-center hover:bg-white/10 hover:text-white/50 disabled:opacity-30 transition-all"
            title="Replay last response"
          >
            🔁
          </button>
        )}
      </div>
    </div>
  );
}
