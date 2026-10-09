import { SPECIES, speciesById, speciesPrompt, type Species } from "@/data/species";
import { VISION_MODEL } from "@/config/models";
import type { IdentifyResult, MatchStrength, RankedMatch } from "@/lib/types";

/**
 * CLIP scores are a softmax over every prompt in the guide.
 * With a guide of about 100 names, a flat distribution sits near 0.01.
 * A photo of something the guide actually contains usually clears 0.12
 * and leaves a gap to the runner-up. Those two checks are the honesty rule.
 *
 * Unsure when the top score is below {@link GUIDE_SCORE_FLOOR} (0.12)
 * or the margin over second place is below {@link GUIDE_MARGIN_FLOOR} (0.04).
 * Strong when the top is at least 0.28, or at least 0.16 with a margin of 0.08.
 * Anything else that cleared the floors is only "possible".
 *
 * Checked against the ranking tests: 0.16 versus 0.15 stays unsure,
 * and a clear win such as 0.72 versus 0.20 stays strong.
 */
export const GUIDE_SCORE_FLOOR = 0.12;
export const GUIDE_MARGIN_FLOOR = 0.04;

export function matchStrength(top: number, second: number): MatchStrength {
  const margin = top - second;
  if (top < GUIDE_SCORE_FLOOR || margin < GUIDE_MARGIN_FLOOR) return "uncertain";
  if (top >= 0.28 || (top >= 0.16 && margin >= 0.08)) return "strong";
  return "possible";
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
