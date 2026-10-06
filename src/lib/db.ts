import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SEED_SIGHTINGS, SEED_VERSION, PROFILES, assertSeed } from "@/data/seed";
import { speciesById, speciesIsSensitive } from "@/data/species";
import { placeById } from "@/data/places";
import { decideLocation } from "@/lib/privacy";
import { cleanText } from "@/lib/utils";
import type {
  Comment,
  Engine,
  MatchStrength,
  Precision,
  Profile,
  ReactionKind,
  ReactionSummary,
  Sighting,
  TrailNoteSource,
} from "@/lib/types";

let database: DatabaseSync | null = null;

export function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function serverModelsEnabled(): boolean {
  const flag = process.env.ENABLE_SERVER_MODELS;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function closeDb(): void {
  database?.close();
  database = null;
}

export function getDb(): DatabaseSync {
  if (database) return database;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
  const db = new DatabaseSync(path.join(dir, "fieldnote.sqlite"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      handle TEXT,
      name TEXT,
      bio TEXT,
      home_base TEXT,
      hue TEXT
    );
    CREATE TABLE IF NOT EXISTS sightings (
      id TEXT PRIMARY KEY,
      author_id TEXT,
      species_id TEXT,
      common_name TEXT,
      scientific_name TEXT,
      group_name TEXT,
      confidence REAL,
      strength TEXT,
      image_url TEXT,
      note TEXT,
      place_name TEXT,
      region TEXT,
      lat REAL,
      lng REAL,
      precision TEXT,
      created_at TEXT,
      model_id TEXT,
      engine TEXT,
      trail_note TEXT,
      trail_note_source TEXT,
      habitat TEXT,
      diet TEXT,
      behaviour TEXT,
      conservation TEXT,
      sensitive INTEGER,
      demo INTEGER
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      sighting_id TEXT,
      author_id TEXT,
      body TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS reactions (
      sighting_id TEXT,
      author_id TEXT,
      kind TEXT,
      PRIMARY KEY (sighting_id, author_id)
    );
  `);
  const version = db.prepare("SELECT value FROM meta WHERE key = 'seed_version'").get() as
    | { value: string }
    | undefined;
  if (version?.value !== SEED_VERSION) {
    db.exec("DELETE FROM reactions; DELETE FROM comments; DELETE FROM sightings; DELETE FROM profiles; DELETE FROM meta;");
    seed(db);
  }
  database = db;
  return db;
}

function isoDaysAgo(days: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 12, 0, 0);
  return date.toISOString();
}

function seed(db: DatabaseSync): void {
  assertSeed();
  const demo = process.env.DEMO_MODE !== "false";
  const insertProfile = db.prepare(
    "INSERT INTO profiles (id, handle, name, bio, home_base, hue) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const profile of PROFILES) {
    if (!demo && profile.id !== "you") continue;
    insertProfile.run(profile.id, profile.handle, profile.name, profile.bio, profile.homeBase, profile.hue);
  }
  if (!demo) {
    db.prepare("INSERT INTO meta (key, value) VALUES ('seed_version', ?)").run(SEED_VERSION);
    return;
  }
  const insertSighting = db.prepare(`INSERT INTO sightings (
    id, author_id, species_id, common_name, scientific_name, group_name, confidence, strength,
    image_url, note, place_name, region, lat, lng, precision, created_at, model_id, engine,
    trail_note, trail_note_source, habitat, diet, behaviour, conservation, sensitive, demo
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertComment = db.prepare(
    "INSERT INTO comments (id, sighting_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  const insertReaction = db.prepare(
    "INSERT INTO reactions (sighting_id, author_id, kind) VALUES (?, ?, ?)",
  );

  for (const item of SEED_SIGHTINGS) {
    const species = speciesById(item.speciesId)!;
    const place = placeById(item.placeId)!;
    const sensitive = speciesIsSensitive(species);
    const decision = decideLocation({
      lat: place.lat,
      lng: place.lng,
      share: item.share,
      sensitive,
    });
    insertSighting.run(
      item.id,
      item.authorId,
      species.id,
      species.commonName,
      species.scientificName,
      species.group,
      item.confidence,
      item.strength,
      item.image,
      item.note,
      place.name,
      place.region,
      decision.publicLat,
      decision.publicLng,
      decision.precision,
      isoDaysAgo(item.daysAgo, item.hour),
      "demo-guide",
      "guide",
      species.guideNote,
      "guide",
      species.habitat,
      species.diet,
      species.behaviour,
      species.status,
      sensitive ? 1 : 0,
      1,
    );
    for (const comment of item.comments) {
      const created = new Date(Date.now() - comment.hoursAgo * 3600_000).toISOString();
      insertComment.run(comment.id, item.id, comment.authorId, comment.body, created);
    }
    for (const reaction of item.reactions) {
      insertReaction.run(item.id, reaction.authorId, reaction.kind);
    }
  }
  db.prepare("INSERT INTO meta (key, value) VALUES ('seed_version', ?)").run(SEED_VERSION);
}

function profileName(db: DatabaseSync, id: string): string {
  const row = db.prepare("SELECT name FROM profiles WHERE id = ?").get(id) as { name: string } | undefined;
  return row?.name ?? "Walker";
}

function commentsFor(db: DatabaseSync, sightingId: string): Comment[] {
  const rows = db
    .prepare("SELECT id, sighting_id, author_id, body, created_at FROM comments WHERE sighting_id = ? ORDER BY created_at ASC")
    .all(sightingId) as {
    id: string;
    sighting_id: string;
    author_id: string;
    body: string;
    created_at: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    sightingId: row.sighting_id,
    authorId: row.author_id,
    authorName: profileName(db, row.author_id),
    body: row.body,
    createdAt: row.created_at,
  }));
}

function reactionsFor(db: DatabaseSync, sightingId: string, viewerId = "you"): ReactionSummary {
  const rows = db
    .prepare("SELECT author_id, kind FROM reactions WHERE sighting_id = ?")
    .all(sightingId) as { author_id: string; kind: ReactionKind }[];
  const summary: ReactionSummary = { wonder: 0, seen: 0, protect: 0, mine: null };
  for (const row of rows) {
    if (row.kind === "wonder" || row.kind === "seen" || row.kind === "protect") {
      summary[row.kind] += 1;
      if (row.author_id === viewerId) summary.mine = row.kind;
    }
  }
  return summary;
}

type SightingRow = {
  id: string;
  author_id: string;
  species_id: string;
  common_name: string;
  scientific_name: string;
  group_name: Sighting["group"];
  confidence: number;
  strength: MatchStrength;
  image_url: string;
  note: string;
  place_name: string;
  region: string;
  lat: number | null;
  lng: number | null;
  precision: Precision;
  created_at: string;
  model_id: string;
  engine: Engine;
  trail_note: string;
  trail_note_source: TrailNoteSource;
  habitat: string;
  diet: string;
  behaviour: string;
  conservation: Sighting["conservation"];
  sensitive: number;
  demo: number;
};

function mapSighting(db: DatabaseSync, row: SightingRow): Sighting {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: profileName(db, row.author_id),
    speciesId: row.species_id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    group: row.group_name,
    confidence: row.confidence,
    strength: row.strength,
    imageUrl: row.image_url,
    note: row.note,
    placeName: row.place_name,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
    precision: row.precision,
    createdAt: row.created_at,
    modelId: row.model_id,
    engine: row.engine,
    trailNote: row.trail_note,
    trailNoteSource: row.trail_note_source,
    habitat: row.habitat,
    diet: row.diet,
    behaviour: row.behaviour,
    conservation: row.conservation,
    sensitive: row.sensitive === 1,
    demo: row.demo === 1,
    comments: commentsFor(db, row.id),
    reactions: reactionsFor(db, row.id),
  };
}

export function listProfiles(): Profile[] {
  const db = getDb();
  const rows = db.prepare("SELECT id, handle, name, bio, home_base, hue FROM profiles").all() as {
    id: string;
    handle: string;
    name: string;
    bio: string;
    home_base: string;
    hue: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    name: row.name,
    bio: row.bio,
    homeBase: row.home_base,
    hue: row.hue,
  }));
}

export function listSightings(): Sighting[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM sightings ORDER BY created_at DESC").all() as SightingRow[];
  return rows.map((row) => mapSighting(db, row));
}

export function getSighting(id: string): Sighting | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sightings WHERE id = ?").get(id) as SightingRow | undefined;
  return row ? mapSighting(db, row) : null;
}

export type NewSightingInput = {
  id?: string;
  authorId?: string;
  speciesId?: string;
  confidence?: number;
  strength?: string;
  imageDataUrl?: string;
  imageUrl?: string;
  note?: string;
  placeName?: string;
  region?: string;
  lat?: number | null;
  lng?: number | null;
  shareLocation?: boolean;
  modelId?: string;
  engine?: string;
  trailNote?: string;
  trailNoteSource?: string;
};

export function createSighting(input: NewSightingInput): Sighting {
  const db = getDb();
  if (input.authorId && input.authorId !== "you") {
    throw new Error("Demo notes are posted as you.");
  }
  const species = speciesById(input.speciesId ?? "");
  if (!species) throw new Error("That species is not in this field guide.");
  const id = typeof input.id === "string" && /^[a-zA-Z0-9_-]{6,80}$/.test(input.id) ? input.id : crypto.randomUUID();
  const existing = getSighting(id);
  if (existing) return existing;

  const sensitive = speciesIsSensitive(species);
  const lat = typeof input.lat === "number" ? input.lat : null;
  const lng = typeof input.lng === "number" ? input.lng : null;
  const decision = decideLocation({
    lat,
    lng,
    share: Boolean(input.shareLocation),
    sensitive,
  });
  const imageUrl = storeImage(id, input.imageDataUrl, input.imageUrl);
  const strength: MatchStrength =
    input.strength === "strong" || input.strength === "possible" || input.strength === "uncertain"
      ? input.strength
      : "possible";
  const engine: Engine = input.engine === "browser" || input.engine === "server" ? input.engine : "guide";
  const noteSource: TrailNoteSource =
    input.trailNoteSource === "gemma" || input.trailNoteSource === "ollama" ? input.trailNoteSource : "guide";
  const trailNote = cleanText(input.trailNote, 500) || species.guideNote;
  const confidence = typeof input.confidence === "number" && input.confidence >= 0 && input.confidence <= 1 ? input.confidence : 0;

  db.prepare(
    `INSERT INTO sightings (
      id, author_id, species_id, common_name, scientific_name, group_name, confidence, strength,
      image_url, note, place_name, region, lat, lng, precision, created_at, model_id, engine,
      trail_note, trail_note_source, habitat, diet, behaviour, conservation, sensitive, demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(
    id,
    "you",
    species.id,
    species.commonName,
    species.scientificName,
    species.group,
    confidence,
    strength,
    imageUrl,
    cleanText(input.note, 280),
    cleanText(input.placeName, 80) || "Unnamed place",
    cleanText(input.region, 80),
    decision.publicLat,
    decision.publicLng,
    decision.precision,
    new Date().toISOString(),
    cleanText(input.modelId, 120) || "guide",
    engine,
    trailNote,
    noteSource,
    species.habitat,
    species.diet,
    species.behaviour,
    species.status,
    sensitive ? 1 : 0,
  );
  return getSighting(id)!;
}

function storeImage(id: string, dataUrl?: string, imageUrl?: string): string {
  if (imageUrl && (imageUrl.startsWith("/seed/") || imageUrl.startsWith("/api/media/"))) {
    return imageUrl;
  }
  if (!dataUrl) throw new Error("Add a photo before saving the note.");
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Use a JPEG, PNG, or WebP photo.");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length < 32 || buffer.length > 1_800_000) throw new Error("That photo is too large to save.");
  const ext = match[1] === "png" ? "png" : match[1] === "webp" ? "webp" : "jpg";
  const filename = `${id}.${ext}`;
  fs.writeFileSync(path.join(dataDir(), "uploads", filename), buffer);
  return `/api/media/${id}`;
}

export function addComment(sightingId: string, body: string): Comment {
  const db = getDb();
  if (!getSighting(sightingId)) throw new Error("That note is not on the trail.");
  const text = cleanText(body, 400);
  if (text.length < 1) throw new Error("Write a short comment first.");
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO comments (id, sighting_id, author_id, body, created_at) VALUES (?, ?, 'you', ?, ?)").run(
    id,
    sightingId,
    text,
    createdAt,
  );
  return {
    id,
    sightingId,
    authorId: "you",
    authorName: profileName(db, "you"),
    body: text,
    createdAt,
  };
}

export function toggleReaction(sightingId: string, kind: ReactionKind): ReactionSummary {
  const db = getDb();
  if (!getSighting(sightingId)) throw new Error("That note is not on the trail.");
  if (kind !== "wonder" && kind !== "seen" && kind !== "protect") throw new Error("Unknown reaction.");
  const current = db
    .prepare("SELECT kind FROM reactions WHERE sighting_id = ? AND author_id = 'you'")
    .get(sightingId) as { kind: string } | undefined;
  if (current?.kind === kind) {
    db.prepare("DELETE FROM reactions WHERE sighting_id = ? AND author_id = 'you'").run(sightingId);
  } else {
    db.prepare(
      `INSERT INTO reactions (sighting_id, author_id, kind) VALUES (?, 'you', ?)
       ON CONFLICT(sighting_id, author_id) DO UPDATE SET kind = excluded.kind`,
    ).run(sightingId, kind);
  }
  return reactionsFor(db, sightingId);
}

export function updateProfile(patch: { name?: string; homeBase?: string; bio?: string }): Profile {
  const db = getDb();
  const current = listProfiles().find((profile) => profile.id === "you");
  if (!current) throw new Error("Missing demo profile.");
  const name = cleanText(patch.name ?? current.name, 40) || current.name;
  const homeBase = cleanText(patch.homeBase ?? current.homeBase, 60);
  const bio = cleanText(patch.bio ?? current.bio, 180);
  db.prepare("UPDATE profiles SET name = ?, home_base = ?, bio = ? WHERE id = 'you'").run(name, homeBase, bio);
  return { ...current, name, homeBase, bio };
}
