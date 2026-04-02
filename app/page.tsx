"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MoodReading, Mood, SceneReading, FaceReading } from "@/lib/mood-types";
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
  const [sceneDescription, setSceneDescription] = useState<string>("");
  const [nameToRegister, setNameToRegister] = useState<string | null>(null);

  // Observation tracking refs
  const prevMoodRef = useRef<Mood>("neutral");
  const prevFaceCountRef = useRef(0);
  const prevNamesRef = useRef<Set<string>>(new Set());
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

  const handleNameDetected = useCallback((name: string) => {
    setNameToRegister(name);
    setRecognizedName(name);
  }, []);

  const handleRegistrationComplete = useCallback((name: string, success: boolean) => {
    setNameToRegister(null);
    if (success) {
      console.log(`Face registered for ${name}`);
    }
  }, []);

  const handleMoodChange = useCallback((reading: MoodReading) => {
    setCurrentReading(reading);
    setCurrentMood(reading.mood);
    setMoodHistory((prev) => [...prev, reading]);

    if (reading.recognizedName) {
      setRecognizedName(reading.recognizedName);
    }
  }, []);

  const handleSceneChange = useCallback((scene: SceneReading) => {
    // Build a scene description for the AI
    const faceDescriptions = scene.faces.map((f: FaceReading) => {
      const name = f.recognizedName || "unknown person";
      return `${name} (${f.mood}, ${Math.round(f.confidence * 100)}%)`;
    });
    setSceneDescription(
      scene.faceCount === 1
        ? `1 person visible: ${faceDescriptions[0]}`
        : `${scene.faceCount} people visible: ${faceDescriptions.join(", ")}`
    );

    const currentNames = new Set(
      scene.faces.map((f: FaceReading) => f.recognizedName).filter(Boolean) as string[]
    );
    const prevNames = prevNamesRef.current;
    const prevCount = prevFaceCountRef.current;
    const prevMood = prevMoodRef.current;

    // Event: New known person appeared
    Array.from(currentNames).forEach((name) => {
      if (!prevNames.has(name)) {
        const face = scene.faces.find((f: FaceReading) => f.recognizedName === name);
        queueObservation(
          `[OBSERVATION] I just recognized ${name} on camera. Their mood looks ${face?.mood || "neutral"}. ${scene.faceCount > 1 ? `There are ${scene.faceCount} people in frame now.` : ""} Make a sarcastic greeting.`
        );
      }
    });

    // Event: Known person left
    Array.from(prevNames).forEach((name) => {
      if (!currentNames.has(name)) {
        queueObservation(
          `[OBSERVATION] ${name} just disappeared from the camera. ${scene.faceCount > 0 ? `Still ${scene.faceCount} ${scene.faceCount === 1 ? "person" : "people"} here.` : ""} Make a sarcastic goodbye.`
        );
      }
    });

    // Event: More people showed up (unknown faces)
    if (scene.faceCount > prevCount && scene.faceCount > 1) {
      const unknownCount = scene.faces.filter((f: FaceReading) => !f.recognizedName).length;
      if (unknownCount > 0 && prevCount > 0) {
        queueObservation(
          `[OBSERVATION] Oh, the crowd is growing. I see ${scene.faceCount} people now, up from ${prevCount}. ${unknownCount} of them I don't recognize. Make a sarcastic comment about the gathering.`
        );
      }
    }

    // Event: People left (count dropped)
    if (scene.faceCount < prevCount && prevCount > 1 && scene.faceCount > 0) {
      queueObservation(
        `[OBSERVATION] Someone left the party. Down to ${scene.faceCount} ${scene.faceCount === 1 ? "person" : "people"} now from ${prevCount}. Comment on the exodus.`
      );
    }

    // Event: First unknown face appeared (no faces before)
    if (scene.faceCount > 0 && prevCount === 0 && currentNames.size === 0) {
      queueObservation(
        `[OBSERVATION] Someone just appeared on camera but I don't recognize them. Their mood looks ${scene.primaryFace?.mood || "neutral"}. Make a sarcastic remark about the stranger.`
      );
    }

    // Event: Dramatic mood shift on primary face
    const primaryMood = scene.primaryFace?.mood || "neutral";
    if (primaryMood === lastStableMood.current) {
      moodStableCount.current++;
    } else {
      if (moodStableCount.current >= 3 && primaryMood !== prevMood) {
        const moodShiftDramatic =
          (prevMood === "happy" && (primaryMood === "sad" || primaryMood === "angry")) ||
          (prevMood === "sad" && primaryMood === "happy") ||
          (prevMood === "neutral" && primaryMood !== "neutral") ||
          (prevMood === "angry" && primaryMood === "happy");

        if (moodShiftDramatic) {
          const who = scene.primaryFace?.recognizedName || "the user";
          queueObservation(
            `[OBSERVATION] ${who}'s mood just shifted from ${prevMood} to ${primaryMood}. React to this mood change.`
          );
        }
      }
      moodStableCount.current = 1;
      lastStableMood.current = primaryMood;
    }

    // Update tracking refs
    prevMoodRef.current = primaryMood;
    prevNamesRef.current = currentNames;
    prevFaceCountRef.current = scene.faceCount;
    prevFaceDetectedRef.current = scene.faceCount > 0;
  }, [queueObservation]);

  const handleFaceLost = useCallback(() => {
    if (prevFaceDetectedRef.current) {
      const names = Array.from(prevNamesRef.current);
      const who = names.length > 0 ? names.join(" and ") : "everyone";
      queueObservation(
        `[OBSERVATION] ${who} just disappeared from the camera. Nobody's here now. Make a short sarcastic remark about being alone.`
      );
      prevFaceDetectedRef.current = false;
      prevFaceCountRef.current = 0;
      prevNamesRef.current = new Set();
      setCurrentReading(null);
      setRecognizedName(null);
      setSceneDescription("");
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
              {prevFaceCountRef.current > 1 && (
                <span className="text-white/30 text-xs ml-1">
                  · {prevFaceCountRef.current} faces
                </span>
              )}
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
            sceneDescription={sceneDescription}
            onNameDetected={handleNameDetected}
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
          <WebcamFeed
            onMoodChange={handleMoodChange}
            onSceneChange={handleSceneChange}
            onFaceLost={handleFaceLost}
            registerNameFromChat={nameToRegister}
            onRegistrationComplete={handleRegistrationComplete}
          />
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
