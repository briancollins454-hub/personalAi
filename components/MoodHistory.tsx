"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { MoodReading, Mood } from "@/lib/mood-types";
import { MOOD_EMOJI, MOOD_COLOR } from "@/lib/mood-types";

interface MoodHistoryProps {
  readings: MoodReading[];
}

export default function MoodHistory({ readings }: MoodHistoryProps) {
  const timelineData = useMemo(() => {
    const recent = readings.slice(-30);
    return recent.map((r, i) => ({
      index: i,
      time: new Date(r.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      happy: Math.round(r.allExpressions.happy * 100),
      sad: Math.round(r.allExpressions.sad * 100),
      angry: Math.round(r.allExpressions.angry * 100),
      neutral: Math.round(r.allExpressions.neutral * 100),
      surprised: Math.round(r.allExpressions.surprised * 100),
      fearful: Math.round(r.allExpressions.fearful * 100),
      disgusted: Math.round(r.allExpressions.disgusted * 100),
    }));
  }, [readings]);

  const pieData = useMemo(() => {
    if (readings.length === 0) return [];

    const counts: Record<string, number> = {};
    readings.forEach((r) => {
      counts[r.mood] = (counts[r.mood] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([mood, count]) => ({
        name: mood,
        value: Math.round((count / readings.length) * 100),
        emoji: MOOD_EMOJI[mood as Mood],
      }))
      .sort((a, b) => b.value - a.value);
  }, [readings]);

  if (readings.length < 3) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span> Mood Analytics
        </h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Collecting mood data... ({readings.length}/3 readings)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-6">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <span className="text-lg">📊</span> Mood Analytics
      </h3>

      {/* Mood distribution pie */}
      <div>
        <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
          Session Distribution
        </h4>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={MOOD_COLOR[entry.name as Mood]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {pieData.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-300">
                  {entry.emoji} {entry.name}
                </span>
                <span className="text-gray-400">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline chart */}
      <div>
        <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
          Mood Timeline
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="happy"
                stackId="1"
                stroke={MOOD_COLOR.happy}
                fill={MOOD_COLOR.happy}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="sad"
                stackId="1"
                stroke={MOOD_COLOR.sad}
                fill={MOOD_COLOR.sad}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="angry"
                stackId="1"
                stroke={MOOD_COLOR.angry}
                fill={MOOD_COLOR.angry}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke={MOOD_COLOR.neutral}
                fill={MOOD_COLOR.neutral}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl">{MOOD_EMOJI[readings[readings.length - 1]?.mood || "neutral"]}</div>
          <div className="text-gray-400 text-xs mt-1">Current</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
          <div className="text-white font-bold">{readings.length}</div>
          <div className="text-gray-400 text-xs mt-1">Readings</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl">{pieData[0]?.emoji || "😐"}</div>
          <div className="text-gray-400 text-xs mt-1">Dominant</div>
        </div>
      </div>
    </div>
  );
}
