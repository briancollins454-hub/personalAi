import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoodAI — Emotionally Intelligent AI Companion",
  description:
    "AI that sees your face, reads your mood, and responds with emotional intelligence. Powered by Claude & ElevenLabs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-grid min-h-screen">{children}</body>
    </html>
  );
}
