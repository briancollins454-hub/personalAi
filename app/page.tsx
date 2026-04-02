"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MoodReading, Mood } from "@/lib/mood-types";
import Orb from "@/components/Orb";
import ChatPanel from "@/components/ChatPanel";
import MoodDisplay from "@/components/MoodDisplay";
import MoodHistory from "@/components/MoodHistory";
import useVoicePlayer from "@/components/useVoicePlayer";
import { MOOD_EMOJI } from "@/lib/mood-types";

const WebcamFeed = dynamic(() => import("@/components/WebcamFeed"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [currentReading, setCurrentReading] = useState<MoodReading | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodReading[]>([]);
  const [currentMood, setCurrentMood] = useState<Mood>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);

  const { speak } = useVoicePlayer({
    onSpeakingChange: setIsSpeaking,
  });

  const handleMoodChange = useCallback((reading: MoodReading) => {
    setCurrentReading(reading);
    setCurrentMood(reading.mood);
    setMoodHistory((prev) => [...prev, reading]);
    if (reading.recognizedName) {
      setRecognizedName(reading.recognizedName);
    }
  }, []);

  return (
    <main className="h-screen flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

      {/* Subtle radial glow behind orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-white/80 font-light text-lg tracking-wide">
            MoodAI
          </h1>
          {currentReading && (
            <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
              {recognizedName && (
                <span className="text-white/60 text-xs font-medium">{recognizedName}</span>
              )}
              <span className="text-sm">{MOOD_EMOJI[currentMood]}</span>
              <span className="text-white/40 text-xs capitalize">{currentMood}</span>
              <span className="text-white/20 text-xs">
                {Math.round((currentReading.confidence ?? 0) * 100)}%
              </span>
            </div>
          )}
          {!currentReading && (
            <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
              <span className="text-white/20 text-xs">No face detected</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWebcam(!showWebcam)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
              showWebcam
                ? "bg-white/10 text-white/70 border border-white/20"
                : "text-white/30 hover:text-white/50 border border-transparent"
            }`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
              showAnalytics
                ? "bg-white/10 text-white/70 border border-white/20"
                : "text-white/30 hover:text-white/50 border border-transparent"
            }`}
          >
            📊 Analytics
          </button>
        </div>
      </header>

      {/* Center: The Orb */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-16">
        <Orb
          isSpeaking={isSpeaking}
          isListening={!!currentReading}
          isThinking={isThinking}
          isRecording={isRecording}
          isActive={isActive}
          onToggle={() => setIsActive(!isActive)}
        />
      </div>

      {/* Bottom: Chat input + messages */}
      <div className="relative z-20 px-4 pb-6">
        {isActive && (
          <ChatPanel
            currentMood={currentMood}
            onSpeak={speak}
            isSpeaking={isSpeaking}
            onThinkingChange={setIsThinking}
            onVoiceListeningChange={setIsRecording}
            userName={recognizedName}
          />
        )}
      </div>

      {/* Webcam — always running for face detection */}
      <div className={showWebcam ? "absolute top-16 left-4 z-30 w-64" : "hidden"}>
        <div className="relative">
          {showWebcam && (
            <button
              onClick={() => setShowWebcam(false)}
              className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 text-white/60 text-xs flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
          )}
          <WebcamFeed onMoodChange={handleMoodChange} />
        </div>
        {showWebcam && (
          <div className="mt-2">
            <MoodDisplay reading={currentReading} />
          </div>
        )}
      </div>

      {/* Analytics panel (right overlay) */}
      {showAnalytics && (
        <div className="absolute top-16 right-4 z-30 w-72">
          <div className="relative">
            <button
              onClick={() => setShowAnalytics(false)}
              className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 text-white/60 text-xs flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
            <MoodHistory readings={moodHistory} />
          </div>
        </div>
      )}
    </main>
  );
}
