import { FACTS_MODEL } from "@/config/models";
import type { Species } from "@/data/species";
import { configureOnnxWasm, installGemmaGraphPatch } from "@/lib/identify/gemma-fetch";
import type { ModelProgress } from "@/lib/types";

type Chat = { role: string; content: string };
type Generator = (
  messages: string | Chat[],
  options: {
    max_new_tokens: number;
    do_sample: boolean;
    temperature?: number;
    return_full_text?: boolean;
    repetition_penalty?: number;
  },
) => Promise<{ generated_text: string | { role?: string; content?: string }[] }[]>;

export type LookSource = "gemma" | "guide";

export type LookResult = {
  text: string;
  source: LookSource;
  modelId: string;
  device: "webgpu" | "wasm" | "guide";
  loadMs: number;
  generateMs: number;
};

let browserPromise: Promise<Generator> | null = null;
let browserDevice: "webgpu" | "wasm" | null = null;

export function lookMessages(species: Species): Chat[] {
  return [
    {
      role: "system",
      content:
        "You write one calm sentence for someone standing in front of this living thing. Use only the behaviour fact. Mention one thing to watch. No greeting. No markdown. No list.",
    },
    {
      role: "user",
      content: `The ${species.commonName} does this: ${species.behaviour} In one sentence, what should a person watch?`,
    },
  ];
}

export function lookPrompt(species: Species): string {
  return [
    "Fact: Hovers over the water, then drops.",
    "Watch: Watch it hang still before it drops.",
    `Fact: ${species.behaviour}`,
    "Watch:",
  ].join("\n");
}

export function guideLook(species: Species): string {
  const sentence = species.behaviour.split(". ")[0]?.trim() || species.behaviour.trim();
  const body = sentence.replace(/\.$/, "");
  const lowered = body.charAt(0).toLowerCase() + body.slice(1);
  const text = `For the next minute, watch this: ${lowered}.`;
  if (text.length <= 180) return text;
  return `For the next minute, watch this: ${lowered.slice(0, 120).trim()}.`;
}

export function firstLookSentence(text: string): string {
  const cleaned = text.replace(/[*#]+/g, "").replace(/\s+/g, " ").trim();
  const end = cleaned.search(/[.!?]/);
  return (end === -1 ? cleaned : cleaned.slice(0, end + 1)).trim();
}

export function acceptableLook(text: string): boolean {
  const trimmed = text.replace(/[*#]+/g, "").replace(/\s+/g, " ").trim();
  if (trimmed.length < 20 || trimmed.length > 160) return false;
  if (/as an ai|language model|behaviour fact|species:/i.test(trimmed)) return false;
  return /\b(watch|look|listen|notice|count)\b/i.test(trimmed);
}

function extractText(generated: string | { role?: string; content?: string }[] | undefined): string {
  if (!generated) return "";
  if (typeof generated === "string") return generated;
  const last = [...generated].reverse().find((message) => message.role === "assistant") ?? generated.at(-1);
  return typeof last?.content === "string" ? last.content : "";
}

async function webGpuAvailable(): Promise<boolean> {
  const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } };
  if (!nav.gpu) return false;
  try {
    return Boolean(await nav.gpu.requestAdapter());
  } catch {
    return false;
  }
}

async function loadGenerator(
  device: "webgpu" | "wasm",
  onProgress?: (progress: ModelProgress) => void,
): Promise<Generator> {
  installGemmaGraphPatch();
  const { pipeline, env } = await import("@huggingface/transformers");
  configureOnnxWasm(env);
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.cacheKey = "spotted-gemma-int32-cast";
  return (await pipeline("text-generation", FACTS_MODEL.id, {
    dtype: device === "webgpu" ? FACTS_MODEL.dtype : "q4",
    device,
    progress_callback: (progress: ModelProgress) => onProgress?.(progress),
  })) as Generator;
}

function publishTiming(result: LookResult) {
  const payload = {
    event: "gemma-lookup",
    loadMs: Math.round(result.loadMs),
    generateMs: Math.round(result.generateMs),
    device: result.device,
    source: result.source,
    modelId: result.modelId,
  };
  console.info(`[spotted-gemma] ${JSON.stringify(payload)}`);
  if (typeof window !== "undefined") {
    (window as unknown as { __spottedGemma?: typeof payload }).__spottedGemma = payload;
  }
}

export async function lookUpOnDevice(
  species: Species,
  onProgress?: (progress: ModelProgress) => void,
): Promise<LookResult> {
  const started = performance.now();
  try {
    const preferred = (await webGpuAvailable()) ? "webgpu" : "wasm";
    const device = browserDevice ?? preferred;
    if (!browserPromise) {
      browserDevice = device;
      browserPromise = loadGenerator(device, onProgress).catch(async (error) => {
        browserPromise = null;
        if (device === "wasm") throw error;
        browserDevice = "wasm";
        browserPromise = loadGenerator("wasm", onProgress);
        return browserPromise;
      });
    }
    const generator = await browserPromise;
    const loadMs = performance.now() - started;
    const genStart = performance.now();
    const output = await generator(lookPrompt(species), {
      max_new_tokens: 24,
      do_sample: false,
      return_full_text: false,
      repetition_penalty: 1.15,
    });
    const generateMs = performance.now() - genStart;
    const raw = firstLookSentence(extractText(output?.[0]?.generated_text));
    const used = browserDevice ?? device;
    if (!acceptableLook(raw)) {
      const fallback: LookResult = {
        text: guideLook(species),
        source: "guide",
        modelId: "field-guide",
        device: used,
        loadMs,
        generateMs,
      };
      publishTiming(fallback);
      return fallback;
    }
    const result: LookResult = {
      text: raw,
      source: "gemma",
      modelId: FACTS_MODEL.id,
      device: used,
      loadMs,
      generateMs,
    };
    publishTiming(result);
    return result;
  } catch (error) {
    console.error("Gemma look-up failed", error);
    browserPromise = null;
    browserDevice = null;
    const fallback: LookResult = {
      text: guideLook(species),
      source: "guide",
      modelId: "field-guide",
      device: "guide",
      loadMs: performance.now() - started,
      generateMs: 0,
    };
    publishTiming(fallback);
    return fallback;
  }
}
