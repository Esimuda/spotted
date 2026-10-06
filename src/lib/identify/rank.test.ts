import { describe, expect, it } from "vitest";
import { SPECIES, speciesIsSensitive, speciesPrompt } from "@/data/species";
import { matchStrength, rankScores } from "@/lib/identify/rank";
import { acceptableNote, gemmaMessages } from "@/lib/identify/narrate";
import { SEED_SIGHTINGS } from "@/data/seed";

describe("field guide", () => {
  it("has unique ids and prompts", () => {
    const ids = SPECIES.map((species) => species.id);
    const prompts = SPECIES.map((species) => speciesPrompt(species));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(prompts).size).toBe(prompts.length);
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

  it("marks a thin margin as uncertain", () => {
    expect(matchStrength(0.16, 0.15)).toBe("uncertain");
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
  });
});
