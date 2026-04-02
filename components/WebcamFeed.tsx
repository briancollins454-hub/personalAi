"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadModels, detectMood } from "@/lib/face-detection";
import type { MoodReading, Mood } from "@/lib/mood-types";
import { MOOD_EMOJI, MOOD_GRADIENT } from "@/lib/mood-types";

interface WebcamFeedProps {
  onMoodChange: (reading: MoodReading) => void;
}

export default function WebcamFeed({ onMoodChange }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>("neutral");
  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  const startDetection = useCallback(async () => {
    if (!videoRef.current || !isReady) return;

    const reading = await detectMood(videoRef.current);
    if (reading) {
      setCurrentMood(reading.mood);
      setConfidence(reading.confidence);
      setFaceDetected(true);
      onMoodChange(reading);
    } else {
      setFaceDetected(false);
    }
  }, [isReady, onMoodChange]);

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
                  {currentMood}
                </div>
                <div className="text-gray-400 text-xs">
                  {faceDetected
                    ? `${Math.round(confidence * 100)}% confidence`
                    : "No face detected"}
                </div>
              </div>
            </div>

            {/* Live indicator */}
            <div className="bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-medium">LIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
