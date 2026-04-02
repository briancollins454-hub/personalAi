"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
  alwaysOn?: boolean;
  paused?: boolean;
}

export default function useSpeechRecognition({
  onResult,
  onListeningChange,
  alwaysOn = false,
  paused = false,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldBeListeningRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef(onResult);
  const onListeningChangeRef = useRef(onListeningChange);

  // Keep callback refs fresh
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onListeningChangeRef.current = onListeningChange; }, [onListeningChange]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    onListeningChangeRef.current?.(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    shouldBeListeningRef.current = true;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChangeRef.current?.(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Get the latest final result
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0]?.transcript;
          if (transcript?.trim()) {
            onResultRef.current(transcript.trim());
          }
        }
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" are expected in always-on mode
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChangeRef.current?.(false);
      // Auto-restart if we should still be listening
      if (shouldBeListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldBeListeningRef.current) {
            startListening();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // Already started — ignore
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || shouldBeListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Always-on mode: auto-start when enabled and not paused
  useEffect(() => {
    if (alwaysOn && !paused) {
      startListening();
    } else if (alwaysOn && paused) {
      // Pause: stop recognition but keep shouldBeListening for resume
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      setIsListening(false);
      onListeningChangeRef.current?.(false);
    }
  }, [alwaysOn, paused, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  return { isListening, isSupported, startListening, stopListening, toggleListening };
}
