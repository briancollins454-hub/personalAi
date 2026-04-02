"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

// Minimum seconds between proactive observations
const OBSERVATION_COOLDOWN = 25;

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
  const [pendingObservation, setPendingObservation] = useState<string | null>(null);

  // Observation tracking refs
  const prevMoodRef = useRef<Mood>("neutral");
  const prevNameRef = useRef<string | null>(null);
  const prevFaceDetectedRef = useRef(false);
  const lastObservationTime = useRef(0);
  const moodStableCount = useRef(0);
  const lastStableMood = useRef<Mood>("neutral");

  const { speak } = useVoicePlayer({
    onSpeakingChange: setIsSpeaking,
  });

  const queueObservation = useCallback((text: string) => {
    const now = Date.now() / 1000;
    if (now - lastObservationTime.current < OBSERVATION_COOLDOWN) return;
    lastObservationTime.current = now;
    setPendingObservation(text);
  }, []);

  const handleObservationHandled = useCallback(() => {
    setPendingObservation(null);
  }, []);

  const handleMoodChange = useCallback((reading: MoodReading) => {
    setCurrentReading(reading);
    setCurrentMood(reading.mood);
    setMoodHistory((prev) => [...prev, reading]);

    if (reading.recognizedName) {
      setRecognizedName(reading.recognizedName);
    }

    const faceDetected = !!reading;
    const wasFaceDetected = prevFaceDetectedRef.current;
    const prevName = prevNameRef.current;
    const prevMood = prevMoodRef.current;

    // Event: A known person just appeared
    if (reading.recognizedName && reading.recognizedName !== prevName) {
      if (!prevName) {
        queueObservation(
          `[OBSERVATION] I just recognized ${reading.recognizedName} on camera. Their current mood looks ${reading.mood}. Make a sarcastic greeting.`
        );
      } else {
        queueObservation(
          `[OBSERVATION] Wait — ${reading.recognizedName} just showed up, replacing ${prevName}. Their mood is ${reading.mood}. Comment on the switch.`
        );
      }
    }

    // Event: A face appeared (unknown)
    if (faceDetected && !wasFaceDetected && !reading.recognizedName) {
      queueObservation(
        `[OBSERVATION] Someone just appeared on camera but I don't recognize them. Their mood looks ${reading.mood}. Make a sarcastic remark about the stranger.`
      );
    }

    // Event: Significant mood shift (track stability to avoid noise)
    if (reading.mood === lastStableMood.current) {
      moodStableCount.current++;
    } else {
      // New mood detected — if it's been stable for 3+ readings (3 seconds), it's real
      if (moodStableCount.current >= 3 && reading.mood !== prevMood) {
        const moodShiftDramatic =
          (prevMood === "happy" && (reading.mood === "sad" || reading.mood === "angry")) ||
          (prevMood === "sad" && reading.mood === "happy") ||
          (prevMood === "neutral" && reading.mood !== "neutral") ||
          (prevMood === "angry" && reading.mood === "happy");

        if (moodShiftDramatic) {
          const who = reading.recognizedName || "the user";
          queueObservation(
            `[OBSERVATION] ${who}'s mood just shifted from ${prevMood} to ${reading.mood}. React to this mood change.`
          );
        }
      }
      moodStableCount.current = 1;
      lastStableMood.current = reading.mood;
    }

    // Update tracking refs
    prevMoodRef.current = reading.mood;
    prevNameRef.current = reading.recognizedName || null;
    prevFaceDetectedRef.current = faceDetected;
  }, [queueObservation]);

  const handleFaceLost = useCallback(() => {
    if (prevFaceDetectedRef.current) {
      const who = prevNameRef.current || "someone";
      queueObservation(
        `[OBSERVATION] ${who} just disappeared from the camera. Make a short sarcastic goodbye remark.`
      );
      prevFaceDetectedRef.current = false;
      prevNameRef.current = null;
      setCurrentReading(null);
      setRecognizedName(null);
    }
  }, [queueObservation]);

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
            observation={pendingObservation}
            onObservationHandled={handleObservationHandled}
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
          <WebcamFeed onMoodChange={handleMoodChange} onFaceLost={handleFaceLost} />
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
