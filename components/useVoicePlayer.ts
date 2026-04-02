"use client";

import { useState, useRef, useCallback } from "react";

interface VoicePlayerProps {
  onSpeakingChange: (speaking: boolean) => void;
}

export default function useVoicePlayer({ onSpeakingChange }: VoicePlayerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      if (isSpeaking && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsSpeaking(true);
      onSpeakingChange(true);

      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error("TTS failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          onSpeakingChange(false);
          URL.revokeObjectURL(url);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          onSpeakingChange(false);
          URL.revokeObjectURL(url);
        };

        await audio.play();
      } catch (err) {
        console.error("Voice error:", err);
        setIsSpeaking(false);
        onSpeakingChange(false);
      }
    },
    [isSpeaking, onSpeakingChange]
  );

  return { speak, isSpeaking };
}
