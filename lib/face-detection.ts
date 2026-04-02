import * as faceapi from "@vladmandic/face-api";
import type { Mood, MoodReading } from "./mood-types";

let modelsLoaded = false;

interface StoredFace {
  name: string;
  descriptor: number[];
}

const STORAGE_KEY = "moodai_faces";

function loadStoredFaces(): StoredFace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredFaces(faces: StoredFace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faces));
}

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function registerFace(
  video: HTMLVideoElement,
  name: string
): Promise<boolean> {
  if (!modelsLoaded) return false;

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return false;

  const faces = loadStoredFaces();
  // Remove existing entry with same name (re-register)
  const filtered = faces.filter((f) => f.name.toLowerCase() !== name.toLowerCase());
  filtered.push({
    name,
    descriptor: Array.from(detection.descriptor),
  });
  saveStoredFaces(filtered);
  return true;
}

export function getRegisteredNames(): string[] {
  return loadStoredFaces().map((f) => f.name);
}

export function clearRegisteredFaces() {
  localStorage.removeItem(STORAGE_KEY);
}

function matchFace(descriptor: Float32Array): string | null {
  const faces = loadStoredFaces();
  if (faces.length === 0) return null;

  const labeledDescriptors = faces.map(
    (f) =>
      new faceapi.LabeledFaceDescriptors(f.name, [
        new Float32Array(f.descriptor),
      ])
  );

  const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  const match = matcher.findBestMatch(descriptor);

  if (match.label === "unknown") return null;
  return match.label;
}

export async function detectMood(
  video: HTMLVideoElement
): Promise<MoodReading | null> {
  if (!modelsLoaded) return null;

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions()
    .withFaceDescriptor();

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

  const recognizedName = matchFace(detection.descriptor);

  return {
    mood: topMood as Mood,
    confidence: topConfidence,
    timestamp: Date.now(),
    allExpressions,
    recognizedName,
  };
}
