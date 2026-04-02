// Copies face-api.js model files from node_modules to public/models/
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = join(__dirname, "..", "public", "models");
const SOURCE_DIR = join(__dirname, "..", "node_modules", "@vladmandic", "face-api", "model");

const MODEL_FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model.bin",
  "face_expression_model-weights_manifest.json",
  "face_expression_model.bin",
];

function copyModels() {
  if (!existsSync(MODELS_DIR)) {
    mkdirSync(MODELS_DIR, { recursive: true });
  }

  console.log("📦 Copying face-api.js models from node_modules...\n");

  for (const file of MODEL_FILES) {
    const dest = join(MODELS_DIR, file);
    const src = join(SOURCE_DIR, file);

    if (existsSync(dest)) {
      console.log(`  ✅ ${file} (already exists)`);
      continue;
    }

    if (!existsSync(src)) {
      console.error(`  ❌ Source not found: ${file}`);
      continue;
    }

    copyFileSync(src, dest);
    console.log(`  ✅ ${file}`);
  }

  console.log("\n✨ Done! Models saved to public/models/");
}

copyModels();
