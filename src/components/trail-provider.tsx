"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { speciesById, speciesIsSensitive } from "@/data/species";
import { pendingSightings, queueSighting, removePending } from "@/lib/offline/store";
import { mergeSightings } from "@/lib/merge";
import { decideLocation } from "@/lib/privacy";
import { EMPTY_REACTIONS, type Comment, type Profile, type ReactionKind, type ReactionSummary, type Sighting } from "@/lib/types";

type CreateInput = {
  id: string;
  speciesId: string;
  confidence: number;
  strength: Sighting["strength"];
  imageDataUrl?: string;
  imageUrl?: string;
  note: string;
  placeName: string;
  region: string;
  lat: number | null;
  lng: number | null;
  shareLocation: boolean;
  modelId: string;
  engine: Sighting["engine"];
  trailNote: string;
  trailNoteSource: Sighting["trailNoteSource"];
};

type TrailContextValue = {
  loading: boolean;
  online: boolean;
  serverModels: boolean;
  loadError: string;
  profiles: Profile[];
  sightings: Sighting[];
  refresh: () => Promise<void>;
  createSighting: (input: CreateInput) => Promise<Sighting>;
  comment: (id: string, body: string) => Promise<void>;
  react: (id: string, kind: ReactionKind) => Promise<void>;
  saveProfile: (patch: { name?: string; homeBase?: string; bio?: string }) => Promise<void>;
};

const TrailContext = createContext<TrailContextValue | null>(null);

function applyToggle(summary: ReactionSummary, kind: ReactionKind): ReactionSummary {
  const next: ReactionSummary = { ...summary };
  if (summary.mine) next[summary.mine] = Math.max(0, next[summary.mine] - 1);
  if (summary.mine === kind) {
    next.mine = null;
    return next;
  }
  next[kind] += 1;
  next.mine = kind;
  return next;
}

export function TrailProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [serverModels, setServerModels] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);

  const refresh = useCallback(async () => {
    const pending = await pendingSightings().catch(() => []);
    try {
      const response = await fetch("/api/bootstrap");
      if (!response.ok) throw new Error("The demo trail did not load.");
      const data = (await response.json()) as {
        profiles: Profile[];
        sightings: Sighting[];
        serverModels: boolean;
      };
      setProfiles(data.profiles);
      setServerModels(Boolean(data.serverModels));
      setSightings(mergeSightings(data.sightings, pending));
      setLoadError("");
    } catch (error) {
      setSightings(pending);
      setLoadError(error instanceof Error ? error.message : "Working from this phone only.");
    } finally {
      setLoading(false);
    }
  }, []);

  const flush = useCallback(async () => {
    const pending = await pendingSightings().catch(() => []);
    for (const sighting of pending) {
      try {
        const response = await fetch("/api/sightings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: sighting.id,
            speciesId: sighting.speciesId,
            confidence: sighting.confidence,
            strength: sighting.strength,
            imageDataUrl: sighting.imageUrl.startsWith("data:") ? sighting.imageUrl : undefined,
            imageUrl: sighting.imageUrl.startsWith("/") ? sighting.imageUrl : undefined,
            note: sighting.note,
            placeName: sighting.placeName,
            region: sighting.region,
            lat: sighting.lat,
            lng: sighting.lng,
            shareLocation: sighting.precision !== "hidden",
            modelId: sighting.modelId,
            engine: sighting.engine,
            trailNote: sighting.trailNote,
            trailNoteSource: sighting.trailNoteSource,
          }),
        });
        if (!response.ok) continue;
        await removePending(sighting.id);
      } catch {
        return;
      }
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flush]);

  const createSighting = useCallback(
    async (input: CreateInput) => {
      const imageUrl = input.imageDataUrl || input.imageUrl || "";
      const species = speciesById(input.speciesId);
      const decision = decideLocation({
        lat: input.lat,
        lng: input.lng,
        share: input.shareLocation,
        sensitive: species ? speciesIsSensitive(species) : false,
      });
      const optimistic: Sighting = {
        id: input.id,
        authorId: "you",
        authorName: profiles.find((profile) => profile.id === "you")?.name ?? "You",
        speciesId: input.speciesId,
        commonName: species?.commonName ?? "",
        scientificName: species?.scientificName ?? "",
        group: species?.group ?? "bird",
        confidence: input.confidence,
        strength: input.strength,
        imageUrl,
        note: input.note,
        placeName: input.placeName,
        region: input.region,
        lat: decision.publicLat,
        lng: decision.publicLng,
        precision: decision.precision,
        createdAt: new Date().toISOString(),
        modelId: input.modelId,
        engine: input.engine,
        trailNote: input.trailNote,
        trailNoteSource: input.trailNoteSource,
        habitat: species?.habitat ?? "",
        diet: species?.diet ?? "",
        behaviour: species?.behaviour ?? "",
        conservation: species?.status ?? "NE",
        sensitive: species ? speciesIsSensitive(species) : false,
        demo: false,
        pending: true,
        comments: [],
        reactions: EMPTY_REACTIONS,
      };
      if (!navigator.onLine) {
        await queueSighting(optimistic);
        setSightings((current) => [optimistic, ...current.filter((item) => item.id !== optimistic.id)]);
        return optimistic;
      }
      const response = await fetch("/api/sightings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        await queueSighting(optimistic);
        setSightings((current) => [optimistic, ...current]);
        if (response.status >= 500) return optimistic;
        throw new Error(payload?.error || "Could not post that note. It is saved on this phone.");
      }
      const saved = (await response.json()) as Sighting;
      setSightings((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      return saved;
    },
    [profiles],
  );

  const comment = useCallback(async (id: string, body: string) => {
    const response = await fetch(`/api/sightings/${id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const payload = (await response.json()) as Comment | { error?: string };
    if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not comment.");
    const created = payload as Comment;
    setSightings((current) =>
      current.map((sighting) =>
        sighting.id === id ? { ...sighting, comments: [...sighting.comments, created] } : sighting,
      ),
    );
  }, []);

  const react = useCallback(async (id: string, kind: ReactionKind) => {
    let previous: Sighting | undefined;
    setSightings((current) =>
      current.map((sighting) => {
        if (sighting.id !== id) return sighting;
        previous = sighting;
        return { ...sighting, reactions: applyToggle(sighting.reactions, kind) };
      }),
    );
    if (previous?.pending || !navigator.onLine) {
      const updated = { ...previous!, reactions: applyToggle(previous!.reactions, kind), pending: true };
      if (previous?.pending) await queueSighting(updated);
      return;
    }
    const response = await fetch(`/api/sightings/${id}/reactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (!response.ok || !previous) {
      setSightings((current) => current.map((sighting) => (sighting.id === id && previous ? previous : sighting)));
      return;
    }
    const summary = (await response.json()) as ReactionSummary;
    setSightings((current) => current.map((sighting) => (sighting.id === id ? { ...sighting, reactions: summary } : sighting)));
  }, []);

  const saveProfile = useCallback(async (patch: { name?: string; homeBase?: string; bio?: string }) => {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) throw new Error("Could not save your profile.");
    const profile = (await response.json()) as Profile;
    setProfiles((current) => current.map((item) => (item.id === "you" ? profile : item)));
    setSightings((current) =>
      current.map((sighting) => (sighting.authorId === "you" ? { ...sighting, authorName: profile.name } : sighting)),
    );
  }, []);

  const value = useMemo(
    () => ({
      loading,
      online,
      serverModels,
      loadError,
      profiles,
      sightings,
      refresh,
      createSighting,
      comment,
      react,
      saveProfile,
    }),
    [loading, online, serverModels, loadError, profiles, sightings, refresh, createSighting, comment, react, saveProfile],
  );

  return <TrailContext.Provider value={value}>{children}</TrailContext.Provider>;
}

export function useTrail() {
  const value = useContext(TrailContext);
  if (!value) throw new Error("useTrail must be used inside TrailProvider");
  return value;
}
