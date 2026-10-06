import { SPECIES, speciesById, speciesPrompt, type Species } from "@/data/species";
import { VISION_MODEL } from "@/config/models";
import type { IdentifyResult, MatchStrength, RankedMatch } from "@/lib/types";

export function matchStrength(top: number, second: number): MatchStrength {
  const margin = top - second;
  if (top >= 0.45 || (top >= 0.22 && margin >= 0.1)) return "strong";
  if (top >= 0.1 && margin >= 0.035) return "possible";
  return "uncertain";
}

export function rankScores(
  scores: { label: string; score: number }[],
  engine: "browser" | "server" = "browser",
): IdentifyResult {
  const prompts = new Map<string, Species>(SPECIES.map((species) => [speciesPrompt(species), species]));
  const ranked = scores
    .map((row) => {
      const species = prompts.get(row.label) ?? speciesById(row.label);
      if (!species || !Number.isFinite(row.score)) return null;
      const match: RankedMatch = {
        speciesId: species.id,
        commonName: species.commonName,
        scientificName: species.scientificName,
        group: species.group,
        score: row.score,
      };
      return match;
    })
    .filter((row): row is RankedMatch => row != null)
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top) {
    throw new Error("The model returned no names from this field guide.");
  }
  const second = ranked[1]?.score ?? 0;
  return {
    top,
    alternatives: ranked.slice(1, 3),
    strength: matchStrength(top.score, second),
    modelId: VISION_MODEL.id,
    engine,
  };
}
