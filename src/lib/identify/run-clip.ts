import { VISION_MODEL } from "@/config/models";
import { SPECIES, speciesPrompt } from "@/data/species";
import { rankScores } from "@/lib/identify/rank";
import type { IdentifyResult, ModelProgress } from "@/lib/types";
import { configureOnnxWasm, installGemmaGraphPatch } from "@/lib/identify/gemma-fetch";

type Classifier = (image: string, labels: string[]) => Promise<{ label: string; score: number }[]>;

let classifierPromise: Promise<Classifier> | null = null;

export async function runClip(
  image: string,
  options: {
    device: "cpu" | "wasm";
    cacheDir?: string;
    onProgress?: (progress: ModelProgress) => void;
  },
): Promise<IdentifyResult> {
  installGemmaGraphPatch();
  const { pipeline, env } = await import("@huggingface/transformers");
  configureOnnxWasm(env);
  env.allowLocalModels = false;
  if (options.cacheDir) env.cacheDir = options.cacheDir;
  if (!classifierPromise) {
    classifierPromise = pipeline("zero-shot-image-classification", VISION_MODEL.id, {
      dtype: VISION_MODEL.dtype,
      device: options.device,
      progress_callback: (progress: ModelProgress) => options.onProgress?.(progress),
    }) as Promise<Classifier>;
  }
  const classifier = await classifierPromise;
  const labels = SPECIES.map((species) => speciesPrompt(species));
  const scores = await classifier(image, labels);
  return rankScores(scores, options.device === "cpu" ? "server" : "browser");
}

/** Test hook. The dev server keeps one classifier for the life of the process. */
export function resetClipForTests(): void {
  classifierPromise = null;
}
