import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { SPECIES, speciesIsSensitive, speciesPrompt } from "@/data/species";
import { GUIDE_MARGIN_FLOOR, GUIDE_SCORE_FLOOR, matchStrength, rankScores } from "@/lib/identify/rank";
import { acceptableNote, gemmaMessages } from "@/lib/identify/narrate";
import { acceptableLook, firstLookSentence, guideLook, lookMessages, lookPrompt } from "@/lib/identify/look";
import { SEED_SIGHTINGS } from "@/data/seed";

describe("field guide", () => {
  it("has unique ids and prompts", () => {
    const ids = SPECIES.map((species) => species.id);
    const prompts = SPECIES.map((species) => speciesPrompt(species));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(prompts).size).toBe(prompts.length);
    expect(SPECIES.length).toBeGreaterThanOrEqual(100);
    expect(SPECIES.length).toBeLessThanOrEqual(130);
    expect(SPECIES.some((species) => species.id === "unknown")).toBe(false);
    for (const species of SPECIES) {
      expect(species.sourceUrl.startsWith("https://")).toBe(true);
      expect(species.habitat.length).toBeGreaterThan(8);
      expect(species.behaviour.length).toBeGreaterThan(8);
    }
  });

  it("softens every threatened species", () => {
    for (const species of SPECIES) {
      if (species.status === "VU" || species.status === "EN" || species.status === "CR") {
        expect(speciesIsSensitive(species)).toBe(true);
      }
    }
    expect(speciesIsSensitive(SPECIES.find((species) => species.id === "forest-elephant")!)).toBe(true);
    expect(speciesIsSensitive(SPECIES.find((species) => species.id === "agama")!)).toBe(false);
  });

  it("only seeds species and photos that exist in the guide", () => {
    const ids = new Set(SPECIES.map((species) => species.id));
    for (const sighting of SEED_SIGHTINGS) {
      expect(ids.has(sighting.speciesId)).toBe(true);
      expect(sighting.image.startsWith("/seed/")).toBe(true);
    }
  });
});

describe("ranking", () => {
  it("picks the kingfisher when that prompt wins", () => {
    const kingfisher = SPECIES.find((species) => species.id === "pied-kingfisher")!;
    const robin = SPECIES.find((species) => species.id === "european-robin")!;
    const result = rankScores([
      { label: speciesPrompt(kingfisher), score: 0.72 },
      { label: speciesPrompt(robin), score: 0.2 },
    ]);
    expect(result.top.speciesId).toBe("pied-kingfisher");
    expect(result.strength).toBe("strong");
    expect(result.alternatives[0]?.speciesId).toBe("european-robin");
  });

  it("marks a thin margin or a weak top score as uncertain", () => {
    expect(matchStrength(0.16, 0.15)).toBe("uncertain");
    expect(matchStrength(GUIDE_SCORE_FLOOR - 0.01, 0.01)).toBe("uncertain");
    expect(matchStrength(0.2, 0.2 - GUIDE_MARGIN_FLOOR + 0.001)).toBe("uncertain");
    expect(matchStrength(0.2, 0.15)).toBe("possible");
    expect(matchStrength(0.18, 0.09)).toBe("strong");
  });
});

describe("gemma notes", () => {
  it("asks for a grounded rewrite and rejects empty model output", () => {
    const species = SPECIES.find((item) => item.id === "pied-kingfisher")!;
    const messages = gemmaMessages(species);
    expect(messages[1]?.content).toContain("Ceryle rudis");
    expect(messages[1]?.content).toContain("Least concern");
    expect(acceptableNote("Too short", species)).toBe(false);
    expect(acceptableNote("The pied kingfisher hovers over the lagoon and dives for fish.", species)).toBe(true);
    expect(acceptableNote("**Trail Note** Locals enjoy the cuisine and assist with field work.", species)).toBe(false);
    expect(acceptableNote("Species: Pied kingfisher. Habitat: rivers. Start with the common name.", species)).toBe(false);
    expect(SPECIES.find((item) => item.id === "monarch")?.status).toBe("EN");
  });
});

describe("look up", () => {
  it("asks for one grounded watch prompt and keeps a guide sentence when Gemma wanders", () => {
    const species = SPECIES.find((item) => item.id === "african-thrush")!;
    const messages = lookMessages(species);
    expect(messages[1]?.content).toContain("African thrush");
    expect(messages[1]?.content).toContain(species.behaviour);
    expect(lookPrompt(species)).toContain(species.behaviour);
    expect(acceptableLook("Watch it cock its head before it pulls something from the grass.")).toBe(true);
    expect(acceptableLook("As an AI I recommend looking up.")).toBe(false);
    expect(acceptableLook("Species: African thrush. Behaviour fact: hops.")).toBe(false);
    expect(firstLookSentence("Watch it cock its head. Watch it cock its head.")).toBe("Watch it cock its head.");
    expect(guideLook(species).toLowerCase()).toContain("watch");
    expect(guideLook(species).length).toBeGreaterThan(20);
    for (const file of ["public/models/gemma/model_q4.onnx", "public/models/gemma/model_q4f16.onnx"]) {
      const bytes = fs.readFileSync(file);
      expect(bytes.byteLength).toBeGreaterThan(100_000);
      expect(bytes.includes(Buffer.from("cast_input_ids_for_wasm_gather"))).toBe(true);
      expect(bytes.includes(Buffer.from("model_q4"))).toBe(true);
    }
  });
});
