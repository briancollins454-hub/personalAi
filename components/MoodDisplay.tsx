"use client";

import type { MoodReading, Mood } from "@/lib/mood-types";
import { MOOD_EMOJI, MOOD_COLOR } from "@/lib/mood-types";

interface MoodDisplayProps {
  reading: MoodReading | null;
}

export default function MoodDisplay({ reading }: MoodDisplayProps) {
  if (!reading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">🎭</span> Emotion Breakdown
        </h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Waiting for face detection...
        </p>
      </div>
    );
  }

  const sorted = Object.entries(reading.allExpressions).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🎭</span> Emotion Breakdown
      </h3>

      <div className="space-y-3">
        {sorted.map(([mood, value]) => (
          <div key={mood} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{MOOD_EMOJI[mood as Mood]}</span>
                <span className="text-gray-300 text-sm capitalize">{mood}</span>
              </div>
              <span className="text-gray-400 text-xs">
                {Math.round(value * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(value * 100, 1)}%`,
                  backgroundColor: MOOD_COLOR[mood as Mood],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
