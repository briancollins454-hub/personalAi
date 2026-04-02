"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MoodReading, Mood } from "@/lib/mood-types";
import MoodDisplay from "@/components/MoodDisplay";
import ChatPanel from "@/components/ChatPanel";
import MoodHistory from "@/components/MoodHistory";
import useVoicePlayer from "@/components/useVoicePlayer";

const WebcamFeed = dynamic(() => import("@/components/WebcamFeed"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-gray-900 border border-white/10 h-[360px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  ),
});

export default function Home() {
  const [currentReading, setCurrentReading] = useState<MoodReading | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodReading[]>([]);
  const [currentMood, setCurrentMood] = useState<Mood>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { speak } = useVoicePlayer({
    onSpeakingChange: setIsSpeaking,
  });

  const handleMoodChange = useCallback((reading: MoodReading) => {
    setCurrentReading(reading);
    setCurrentMood(reading.mood);
    setMoodHistory((prev) => [...prev, reading]);
  }, []);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">
                MoodAI
              </h1>
              <p className="text-gray-500 text-xs">
                Face Recognition · Mood Detection · AI Chat · Voice
              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4">
            {isSpeaking && (
              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1.5">
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-violet-400 rounded-full animate-pulse"
                      style={{
                        height: `${8 + Math.random() * 12}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-violet-300 text-xs">Speaking</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Claude + ElevenLabs
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Camera & Mood */}
          <div className="lg:col-span-4 space-y-6">
            <WebcamFeed onMoodChange={handleMoodChange} />
            <MoodDisplay reading={currentReading} />
          </div>

          {/* Center column - Chat */}
          <div className="lg:col-span-5">
            <ChatPanel
              currentMood={currentMood}
              onSpeak={speak}
              isSpeaking={isSpeaking}
            />
          </div>

          {/* Right column - Analytics */}
          <div className="lg:col-span-3">
            <MoodHistory readings={moodHistory} />
          </div>
        </div>
      </div>
    </main>
  );
}
