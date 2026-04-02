"use client";

import { useEffect, useRef } from "react";

interface OrbProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  isRecording: boolean;
  isActive: boolean;
  onToggle: () => void;
}

export default function Orb({ isSpeaking, isListening, isThinking, isRecording, isActive, onToggle }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    let time = 0;

    function draw() {
      time += 0.015;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseRadius = 90;

      // Determine animation intensity
      let intensity = isActive ? 0.3 : 0.05; // idle breathing or dormant
      let speed = isActive ? 1 : 0.3;
      let glowColor = "rgba(255, 255, 255,";
      let ringColor = "rgba(255, 255, 255,";

      if (!isActive) {
        glowColor = "rgba(100, 100, 100,";
        ringColor = "rgba(100, 100, 100,";
      } else if (isRecording) {
        intensity = 0.7 + Math.sin(time * 6) * 0.3;
        speed = 2.5;
        glowColor = "rgba(255, 100, 100,";
        ringColor = "rgba(255, 120, 120,";
      } else if (isSpeaking) {
        intensity = 0.8 + Math.sin(time * 8) * 0.3;
        speed = 3;
        glowColor = "rgba(200, 180, 255,";
        ringColor = "rgba(180, 160, 255,";
      } else if (isThinking) {
        intensity = 0.5 + Math.sin(time * 4) * 0.2;
        speed = 2;
        glowColor = "rgba(180, 200, 255,";
        ringColor = "rgba(160, 180, 255,";
      } else if (isListening) {
        intensity = 0.6 + Math.sin(time * 6) * 0.25;
        speed = 2.5;
        glowColor = "rgba(220, 255, 220,";
        ringColor = "rgba(200, 255, 200,";
      }

      // Outer glow layers
      for (let i = 5; i >= 1; i--) {
        const glowRadius = baseRadius + i * 25 * intensity;
        const alpha = 0.03 * (6 - i) * intensity;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        gradient.addColorStop(0, `${glowColor} ${alpha})`);
        gradient.addColorStop(1, `${glowColor} 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Animated ring
      const ringRadius = baseRadius + 15 + Math.sin(time * speed) * 8 * intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${ringColor} ${0.15 + intensity * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Second ring
      const ring2Radius = baseRadius + 30 + Math.cos(time * speed * 0.7) * 12 * intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, ring2Radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${ringColor} ${0.08 + intensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pulsing wave rings when speaking
      if (isSpeaking) {
        for (let w = 0; w < 3; w++) {
          const wavePhase = (time * 2 + w * 2.1) % 6.28;
          const waveRadius = baseRadius + 20 + wavePhase * 30;
          const waveAlpha = Math.max(0, 0.3 - wavePhase * 0.05);
          ctx.beginPath();
          ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 180, 255, ${waveAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Pulsing wave rings when recording voice
      if (isRecording) {
        for (let w = 0; w < 3; w++) {
          const wavePhase = (time * 3 + w * 2.1) % 6.28;
          const waveRadius = baseRadius + 15 + wavePhase * 25;
          const waveAlpha = Math.max(0, 0.35 - wavePhase * 0.06);
          ctx.beginPath();
          ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 120, 120, ${waveAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Main orb body - breathing
      const breathe = Math.sin(time * speed) * 4 * intensity;
      const orbRadius = baseRadius + breathe;

      // Orb gradient — dimmer when inactive
      const orbAlpha = isActive ? 1 : 0.3;
      const orbGradient = ctx.createRadialGradient(
        cx - orbRadius * 0.2,
        cy - orbRadius * 0.3,
        0,
        cx,
        cy,
        orbRadius
      );
      orbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * orbAlpha})`);
      orbGradient.addColorStop(0.5, `rgba(240, 240, 255, ${0.85 * orbAlpha})`);
      orbGradient.addColorStop(0.8, `rgba(220, 220, 240, ${0.7 * orbAlpha})`);
      orbGradient.addColorStop(1, `rgba(200, 200, 230, ${0.4 * orbAlpha})`);

      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGradient;
      ctx.fill();

      // Inner highlight
      const highlightGradient = ctx.createRadialGradient(
        cx - orbRadius * 0.25,
        cy - orbRadius * 0.25,
        0,
        cx - orbRadius * 0.15,
        cy - orbRadius * 0.15,
        orbRadius * 0.6
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      // Subtle edge
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + intensity * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking, isListening, isThinking, isRecording, isActive]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] cursor-pointer"
        style={{ imageRendering: "auto" }}
        onClick={onToggle}
        title={isActive ? "Click to deactivate" : "Click to activate"}
      />

      {/* Status text below orb */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <div className="text-center">
          {!isActive && (
            <span className="text-white/20 text-xs tracking-widest uppercase">
              Tap to activate
            </span>
          )}
          {isActive && isRecording && (
            <span className="text-red-400/80 text-xs tracking-widest uppercase animate-pulse">
              Listening to you
            </span>
          )}
          {isActive && isSpeaking && !isRecording && (
            <span className="text-white/60 text-xs tracking-widest uppercase animate-pulse">
              Speaking
            </span>
          )}
          {isActive && isThinking && !isRecording && (
            <span className="text-white/60 text-xs tracking-widest uppercase animate-pulse">
              Thinking
            </span>
          )}
          {isActive && isListening && !isSpeaking && !isThinking && !isRecording && (
            <span className="text-white/40 text-xs tracking-widest uppercase">
              Listening
            </span>
          )}
          {isActive && !isSpeaking && !isThinking && !isListening && !isRecording && (
            <span className="text-white/20 text-xs tracking-widest uppercase">
              Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
