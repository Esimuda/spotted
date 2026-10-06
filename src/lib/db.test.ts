import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let dir = "";

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "fieldnote-"));
  process.env.DATA_DIR = dir;
  process.env.ENABLE_SERVER_MODELS = "false";
});

describe("trail database", () => {
  it("seeds the demo trail and coarsens the forest elephant", async () => {
    const { listSightings, closeDb } = await import("@/lib/db");
    closeDb();
    const sightings = listSightings();
    expect(sightings.length).toBeGreaterThan(10);
    const elephant = sightings.find((sighting) => sighting.id === "s-elephant");
    const kingfisher = sightings.find((sighting) => sighting.id === "s-kingfisher");
    const weaver = sightings.find((sighting) => sighting.id === "s-weaver");
    expect(elephant?.precision).toBe("coarse");
    expect(elephant?.sensitive).toBe(true);
    expect(elephant?.lng).not.toBe(5.34);
    expect(kingfisher?.precision).toBe("exact");
    expect(kingfisher?.comments.length).toBeGreaterThan(1);
    expect(weaver?.precision).toBe("hidden");
    expect(weaver?.lat).toBeNull();
  });

  it("posts a note as you, comments, and toggles a reaction", async () => {
    const { addComment, createSighting, getSighting, toggleReaction } = await import("@/lib/db");
    const created = createSighting({
      id: "note-test-agama",
      authorId: "you",
      speciesId: "agama",
      confidence: 0.62,
      strength: "strong",
      imageUrl: "/seed/agama.jpg",
      note: "On the wall.",
      placeName: "A compound in Lagos",
      region: "Lagos, Nigeria",
      lat: 6.45,
      lng: 3.4,
      shareLocation: true,
      modelId: "Xenova/clip-vit-base-patch32",
      engine: "server",
      trailNote: "The mayor of the wall.",
      trailNoteSource: "guide",
    });
    expect(created.commonName).toBe("Rainbow agama");
    expect(created.precision).toBe("exact");
    expect(created.demo).toBe(false);
    const comment = addComment(created.id, "Still there at noon.");
    expect(comment.authorId).toBe("you");
    const reactions = toggleReaction(created.id, "seen");
    expect(reactions.mine).toBe("seen");
    expect(reactions.seen).toBe(1);
    const cleared = toggleReaction(created.id, "seen");
    expect(cleared.mine).toBeNull();
    expect(getSighting(created.id)?.comments.at(-1)?.body).toContain("noon");
  });

  it("refuses a sensitive exact pin and a post as someone else", async () => {
    const { createSighting } = await import("@/lib/db");
    const elephant = createSighting({
      id: "note-test-elephant",
      speciesId: "forest-elephant",
      imageUrl: "/seed/forest-elephant.jpg",
      lat: 6.3522,
      lng: 5.3411,
      shareLocation: true,
      placeName: "Okomu National Park",
    });
    expect(elephant.precision).toBe("coarse");
    expect(elephant.lat).not.toBe(6.3522);
    expect(() => createSighting({ authorId: "amina", speciesId: "agama", imageUrl: "/seed/agama.jpg" })).toThrow(
      /you/,
    );
  });
});
