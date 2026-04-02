"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, Mood } from "@/lib/mood-types";
import { MOOD_EMOJI } from "@/lib/mood-types";

interface ChatPanelProps {
  currentMood: Mood;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}

export default function ChatPanel({
  currentMood,
  onSpeak,
  isSpeaking,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
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
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">MoodAI</h3>
            <p className="text-gray-400 text-xs">
              Emotionally aware companion
            </p>
          </div>
        </div>

        {/* Auto-speak toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
            autoSpeak
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              : "bg-gray-800 text-gray-500 border border-gray-700"
          }`}
          title={autoSpeak ? "Voice responses ON" : "Voice responses OFF"}
        >
          {autoSpeak ? "🔊" : "🔇"} Voice {autoSpeak ? "On" : "Off"}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-400 text-sm">
              Say hello! I can see your mood and will respond accordingly.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-md"
                  : "bg-gray-800 text-gray-200 rounded-bl-md"
              }`}
            >
              {msg.role === "user" && msg.mood && (
                <div className="text-xs opacity-70 mb-1">
                  {MOOD_EMOJI[msg.mood]} feeling {msg.mood}
                </div>
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && (
                <button
                  onClick={() => onSpeak(msg.content)}
                  disabled={isSpeaking}
                  className="mt-2 text-xs text-gray-400 hover:text-violet-400 transition-colors disabled:opacity-50"
                >
                  {isSpeaking ? "🔊 Speaking..." : "🔈 Play voice"}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
