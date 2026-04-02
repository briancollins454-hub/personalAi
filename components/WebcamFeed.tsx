"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadModels, detectScene, registerFace, getRegisteredNames } from "@/lib/face-detection";
import type { MoodReading, Mood, SceneReading } from "@/lib/mood-types";
import { MOOD_EMOJI, MOOD_GRADIENT } from "@/lib/mood-types";

interface WebcamFeedProps {
  onMoodChange: (reading: MoodReading) => void;
  onSceneChange?: (scene: SceneReading) => void;
  onFaceLost?: () => void;
  registerNameFromChat?: string | null;
  onRegistrationComplete?: (name: string, success: boolean) => void;
}

export default function WebcamFeed({ onMoodChange, onSceneChange, onFaceLost, registerNameFromChat, onRegistrationComplete }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>("neutral");
  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);

  const startDetection = useCallback(async () => {
    if (!videoRef.current || !isReady) return;

    const scene = await detectScene(videoRef.current);
    if (scene && scene.primaryFace) {
      setCurrentMood(scene.primaryFace.mood);
      setConfidence(scene.primaryFace.confidence);
      setFaceDetected(true);
      setFaceCount(scene.faceCount);
      setRecognizedName(scene.primaryFace.recognizedName);
      onMoodChange(scene.primaryFace);
      onSceneChange?.(scene);
    } else {
      setFaceDetected(false);
      setFaceCount(0);
      onFaceLost?.();
    }
  }, [isReady, onMoodChange, onSceneChange, onFaceLost]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function init() {
      try {
        await loadModels();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (err) {
        console.error("Webcam init error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to access webcam. Please allow camera permission."
        );
      }
    }

    init();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(startDetection, 1000);
    return () => clearInterval(interval);
  }, [isReady, startDetection]);

  // Register face from chat when name is provided
  useEffect(() => {
    if (registerNameFromChat && videoRef.current && isReady) {
      registerFace(videoRef.current, registerNameFromChat).then((ok) => {
        onRegistrationComplete?.(registerNameFromChat, ok);
      });
    }
  }, [registerNameFromChat, isReady, onRegistrationComplete]);

  if (error) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-red-500/30 p-8 text-center">
        <div className="text-red-400 text-lg mb-2">📷 Camera Error</div>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Mood-based glow border */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r ${MOOD_GRADIENT[currentMood]} rounded-2xl opacity-50 blur-sm group-hover:opacity-75 transition-all duration-500`}
      />

      <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-white/10">
        <video
          ref={videoRef}
          className="w-full h-auto mirror"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
        />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading face detection models...</p>
            </div>
          </div>
        )}

        {/* Mood badge */}
        {isReady && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div
              className={`bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-300 ${
                faceDetected ? "opacity-100" : "opacity-50"
              }`}
            >
              <span className="text-2xl">{MOOD_EMOJI[currentMood]}</span>
              <div>
                <div className="text-white text-sm font-semibold capitalize">
                  {recognizedName ? recognizedName : currentMood}
                </div>
                <div className="text-gray-400 text-xs">
                  {faceDetected
                    ? recognizedName
                      ? `${currentMood} · ${Math.round(confidence * 100)}%${faceCount > 1 ? ` · ${faceCount} faces` : ""}`
                      : `${Math.round(confidence * 100)}% confidence${faceCount > 1 ? ` · ${faceCount} faces` : ""}`
                    : "No face detected"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Register face button */}
              <button
                onClick={() => setShowRegister(!showRegister)}
                className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 text-white/60 text-xs hover:text-white/90 transition-all"
              >
                {getRegisteredNames().length > 0 ? "👤" : "➕ Register"}
              </button>

              {/* Live indicator */}
              <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-medium">LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Register face overlay */}
        {showRegister && isReady && (
          <div className="absolute top-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-xl p-3 z-10">
            <div className="text-white text-xs font-medium mb-2">
              {getRegisteredNames().length > 0
                ? `Registered: ${getRegisteredNames().join(", ")}`
                : "Register your face"}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 border border-white/10 focus:border-white/30 focus:outline-none placeholder:text-white/30"
                maxLength={30}
              />
              <button
                onClick={async () => {
                  if (!registerName.trim() || !videoRef.current) return;
                  setRegisterStatus("Scanning...");
                  const ok = await registerFace(videoRef.current, registerName.trim());
                  if (ok) {
                    setRegisterStatus(`Registered ${registerName.trim()}!`);
                    setRegisterName("");
                    setTimeout(() => {
                      setRegisterStatus(null);
                      setShowRegister(false);
                    }, 1500);
                  } else {
                    setRegisterStatus("No face found — look at camera");
                    setTimeout(() => setRegisterStatus(null), 2000);
                  }
                }}
                className="bg-white/20 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-white/30 transition-all"
              >
                Save
              </button>
            </div>
            {registerStatus && (
              <div className="text-white/60 text-xs mt-2">{registerStatus}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
