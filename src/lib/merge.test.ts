import { describe, expect, it } from "vitest";
import { mergeSightings } from "@/lib/merge";
import { EMPTY_REACTIONS, type Sighting } from "@/lib/types";

function note(id: string, createdAt: string, pending = false): Sighting {
  return {
    id,
    authorId: "you",
    authorName: "You",
    speciesId: "agama",
    commonName: "Rainbow agama",
    scientificName: "Agama agama",
    group: "reptile",
    confidence: 0.5,
    strength: "possible",
    imageUrl: "/seed/agama.jpg",
    note: "",
    placeName: "Lagos",
    region: "Nigeria",
    lat: null,
    lng: null,
    precision: "hidden",
    createdAt,
    modelId: "test",
    engine: "browser",
    trailNote: "",
    trailNoteSource: "guide",
    habitat: "",
    diet: "",
    behaviour: "",
    conservation: "LC",
    sensitive: false,
    demo: false,
    pending,
    comments: [],
    reactions: EMPTY_REACTIONS,
  };
}

describe("offline merge", () => {
  it("keeps unsynced notes and drops ones the server already has", () => {
    const remote = [note("server", "2026-10-06T10:00:00.000Z")];
    const pending = [note("local", "2026-10-06T12:00:00.000Z", true), note("server", "2026-10-06T10:00:00.000Z", true)];
    const merged = mergeSightings(remote, pending);
    expect(merged.map((item) => item.id)).toEqual(["local", "server"]);
    expect(merged[0]?.pending).toBe(true);
  });
});
