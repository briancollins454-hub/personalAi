export type Mood =
  | "happy"
  | "sad"
  | "angry"
  | "disgusted"
  | "fearful"
  | "neutral"
  | "surprised";

export interface MoodReading {
  mood: Mood;
  confidence: number;
  timestamp: number;
  allExpressions: Record<Mood, number>;
  recognizedName: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  mood?: Mood;
  timestamp: number;
}

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  disgusted: "🤢",
  fearful: "😨",
  neutral: "😐",
  surprised: "😮",
};

export const MOOD_COLOR: Record<Mood, string> = {
  happy: "#facc15",
  sad: "#60a5fa",
  angry: "#ef4444",
  disgusted: "#a3e635",
  fearful: "#c084fc",
  neutral: "#94a3b8",
  surprised: "#fb923c",
};

export const MOOD_GRADIENT: Record<Mood, string> = {
  happy: "from-yellow-400 to-amber-500",
  sad: "from-blue-400 to-indigo-500",
  angry: "from-red-500 to-rose-600",
  disgusted: "from-lime-400 to-green-500",
  fearful: "from-purple-400 to-violet-500",
  neutral: "from-slate-400 to-gray-500",
  surprised: "from-orange-400 to-amber-500",
};
