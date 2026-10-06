import type { Iucn, SpeciesGroup } from "@/data/species";

export type Precision = "exact" | "coarse" | "hidden";
export type Engine = "browser" | "server" | "guide";
export type TrailNoteSource = "gemma" | "guide" | "ollama";
export type ReactionKind = "wonder" | "seen" | "protect";
export type MatchStrength = "strong" | "possible" | "uncertain";

export type ReactionSummary = {
  wonder: number;
  seen: number;
  protect: number;
  mine: ReactionKind | null;
};

export type Comment = {
  id: string;
  sightingId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Profile = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  homeBase: string;
  hue: string;
};

export type Sighting = {
  id: string;
  authorId: string;
  authorName: string;
  speciesId: string;
  commonName: string;
  scientificName: string;
  group: SpeciesGroup;
  confidence: number;
  strength: MatchStrength;
  imageUrl: string;
  note: string;
  placeName: string;
  region: string;
  lat: number | null;
  lng: number | null;
  precision: Precision;
  createdAt: string;
  modelId: string;
  engine: Engine;
  trailNote: string;
  trailNoteSource: TrailNoteSource;
  habitat: string;
  diet: string;
  behaviour: string;
  conservation: Iucn;
  sensitive: boolean;
  demo: boolean;
  pending?: boolean;
  comments: Comment[];
  reactions: ReactionSummary;
};

export type RankedMatch = {
  speciesId: string;
  commonName: string;
  scientificName: string;
  group: SpeciesGroup;
  score: number;
};

export type IdentifyResult = {
  top: RankedMatch;
  alternatives: RankedMatch[];
  strength: MatchStrength;
  modelId: string;
  engine: "browser" | "server";
};

export type ModelProgress = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

export const EMPTY_REACTIONS: ReactionSummary = {
  wonder: 0,
  seen: 0,
  protect: 0,
  mine: null,
};
