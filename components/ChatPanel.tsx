"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, Mood } from "@/lib/mood-types";
import useSpeechRecognition from "./useSpeechRecognition";

interface ChatPanelProps {
  currentMood: Mood;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onThinkingChange: (thinking: boolean) => void;
  onVoiceListeningChange?: (listening: boolean) => void;
  userName?: string | null;
  observation?: string | null;
  onObservationHandled?: () => void;
}

export default function ChatPanel({
  currentMood,
  onSpeak,
  isSpeaking,
  onThinkingChange,
  onVoiceListeningChange,
  userName,
  observation,
  onObservationHandled,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userNameRef = useRef(userName);
  const currentMoodRef = useRef(currentMood);
  const messagesRef = useRef(messages);

  // Keep refs in sync to avoid stale closures
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { currentMoodRef.current = currentMood; }, [currentMood]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const callChat = useCallback(async (text: string, isObservation: boolean = false) => {
    if (isLoading) return;

    if (!isObservation) {
      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim(),
        mood: currentMoodRef.current,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInput("");
    setIsLoading(true);
    onThinkingChange(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          mood: currentMoodRef.current,
          userName: userNameRef.current || null,
          isObservation,
          history: messagesRef.current.map((m) => ({
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble responding. Please try again.", timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
      onThinkingChange(false);
    }
  }, [isLoading, autoSpeak, onSpeak, onThinkingChange]);

  // Handle incoming observations from the page
  useEffect(() => {
    if (observation && !isLoading && !isSpeaking) {
      callChat(observation, true);
      onObservationHandled?.();
    }
  }, [observation, isLoading, isSpeaking, callChat, onObservationHandled]);

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      callChat(transcript);
    },
    [callChat]
  );

  const { isListening: isVoiceListening, isSupported: voiceSupported } =
    useSpeechRecognition({
      onResult: handleVoiceResult,
      onListeningChange: onVoiceListeningChange,
      alwaysOn: true,
      paused: isSpeaking || isLoading,
    });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
            if (input.trim()) callChat(input);
          }}
          className="flex-1 relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Thinking..." : isSpeaking ? "Speaking..." : isVoiceListening ? "🎙 Listening..." : "Talk or type..."}
            className="w-full bg-white/5 text-white rounded-full px-6 py-3.5 text-sm border border-white/10 focus:border-white/25 focus:outline-none focus:ring-0 transition-all placeholder:text-white/20 backdrop-blur-md"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        {/* Listening indicator */}
        {voiceSupported && (
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isVoiceListening
                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                : isSpeaking
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                : isLoading
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-white/20 border border-white/10"
            }`}
            title={isVoiceListening ? "Listening..." : isSpeaking ? "Speaking..." : isLoading ? "Thinking..." : "Mic paused"}
          >
            {isVoiceListening ? "🎙" : isSpeaking ? "🔊" : isLoading ? "💭" : "⏸"}
          </div>
        )}

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
