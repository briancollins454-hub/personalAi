"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

export default function useSpeechRecognition({
  onResult,
  onListeningChange,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChange?.(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult, onListeningChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, startListening, stopListening, toggleListening };
}
