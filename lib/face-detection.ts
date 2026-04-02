import * as faceapi from "@vladmandic/face-api";
import type { Mood, MoodReading } from "./mood-types";

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectMood(
  video: HTMLVideoElement
): Promise<MoodReading | null> {
  if (!modelsLoaded) return null;

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!detection) return null;

  const expressions = detection.expressions;
  const allExpressions: Record<Mood, number> = {
    happy: expressions.happy,
    sad: expressions.sad,
    angry: expressions.angry,
    disgusted: expressions.disgusted,
    fearful: expressions.fearful,
    neutral: expressions.neutral,
    surprised: expressions.surprised,
  };

  const sorted = Object.entries(allExpressions).sort(([, a], [, b]) => b - a);
  const [topMood, topConfidence] = sorted[0];

  return {
    mood: topMood as Mood,
    confidence: topConfidence,
    timestamp: Date.now(),
    allExpressions,
  };
}
