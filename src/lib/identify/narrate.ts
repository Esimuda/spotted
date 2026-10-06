import { FACTS_MODEL } from "@/config/models";
import { IUCN_LABEL, type Species } from "@/data/species";
import type { ModelProgress, TrailNoteSource } from "@/lib/types";

type Chat = { role: string; content: string };
type Generator = (
  messages: Chat[],
  options: { max_new_tokens: number; do_sample: boolean },
) => Promise<{ generated_text: string | { role?: string; content?: string }[] }[]>;

let generatorPromise: Promise<Generator> | null = null;

export function gemmaMessages(species: Species): Chat[] {
  return [
    {
      role: "system",
      content:
        "You write two calm sentences for a pocket field guide. Use only the facts given. Do not add places, measurements, or other species. No markdown. No greeting.",
    },
    {
      role: "user",
      content: `Species: ${species.commonName} (${species.scientificName}). Habitat: ${species.habitat} Diet: ${species.diet} Behaviour: ${species.behaviour} Status: ${IUCN_LABEL[species.status]}. Start with the common name. Two sentences only.`,
    },
  ];
}

export function guideFallback(species: Species): { text: string; source: "guide"; modelId: string } {
  return { text: species.guideNote, source: "guide", modelId: "field-guide" };
}

function extractText(generated: string | { role?: string; content?: string }[] | undefined): string {
  if (!generated) return "";
  if (typeof generated === "string") return generated;
  const last = generated.at(-1);
  return typeof last?.content === "string" ? last.content : "";
}

export function acceptableNote(text: string, species: Species): boolean {
  const trimmed = text.replace(/[*#]+/g, "").replace(/\s+/g, " ").trim();
  if (trimmed.length < 24 || trimmed.length > 420) return false;
  if (/as an ai|language model|trail note|description:|species:|habitat:|diet:|behaviour:|status:|start with the common name/i.test(trimmed)) {
    return false;
  }
  const haystack = trimmed.toLowerCase();
  const genus = species.scientificName.split(" ")[0]?.toLowerCase() ?? "";
  const common = species.commonName.toLowerCase();
  return haystack.includes(common) || (genus.length > 3 && haystack.includes(genus));
}

export async function narrateWithGemma(
  species: Species,
  options: { device: "cpu" | "wasm"; cacheDir?: string; onProgress?: (progress: ModelProgress) => void },
): Promise<{ text: string; source: TrailNoteSource; modelId: string }> {
  try {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    if (options.cacheDir) env.cacheDir = options.cacheDir;
    if (!generatorPromise) {
      generatorPromise = pipeline("text-generation", FACTS_MODEL.id, {
        dtype: FACTS_MODEL.dtype,
        device: options.device,
        progress_callback: (progress: ModelProgress) => options.onProgress?.(progress),
      }) as Promise<Generator>;
    }
    const generator = await generatorPromise;
    const output = await generator(gemmaMessages(species), { max_new_tokens: 90, do_sample: false });
    const text = extractText(output?.[0]?.generated_text).replace(/[*#]+/g, "").replace(/\s+/g, " ").trim();
    if (!acceptableNote(text, species)) return guideFallback(species);
    return { text, source: "gemma", modelId: FACTS_MODEL.id };
  } catch (error) {
    console.error("Gemma trail note failed", error);
    return guideFallback(species);
  }
}

export async function narrateWithEndpoint(
  species: Species,
): Promise<{ text: string; source: TrailNoteSource; modelId: string } | null> {
  const base = process.env.GEMMA_BASE_URL;
  if (!base) return null;
  const model = process.env.GEMMA_MODEL || "gemma3:270m";
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.GEMMA_API_KEY) headers.authorization = `Bearer ${process.env.GEMMA_API_KEY}`;
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 120,
      messages: gemmaMessages(species),
    }),
  });
  if (!response.ok) throw new Error(`Gemma endpoint returned ${response.status}`);
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = (payload.choices?.[0]?.message?.content ?? "").replace(/[*#]+/g, "").replace(/\s+/g, " ").trim();
  if (!acceptableNote(text, species)) return guideFallback(species);
  return { text, source: "ollama", modelId: model };
}
