"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Leaf } from "lucide-react";
import { SAMPLE_PHOTOS } from "@/data/seed";
import { IUCN_LABEL, speciesById, speciesIsSensitive } from "@/data/species";
import { PLACES } from "@/data/places";
import { VISION_MODEL } from "@/config/models";
import { fileToDataUrl } from "@/lib/images";
import { readEngine, readShareDefault, writeEngine, writeShareDefault, type EngineChoice } from "@/lib/prefs";
import { runClip } from "@/lib/identify/run-clip";
import { formatScore } from "@/lib/format";
import type { IdentifyResult, ModelProgress, TrailNoteSource } from "@/lib/types";
import { useTrail } from "@/components/trail-provider";
import { FactGrid } from "@/components/fact-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/badge";

type Phase = "idle" | "camera" | "matching" | "result";

export function IdentifyFlow() {
  const router = useRouter();
  const { createSighting, online, serverModels } = useTrail();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [engine, setEngine] = useState<EngineChoice>("phone");
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState("Opening the field guide");
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [chosenId, setChosenId] = useState("");
  const [share, setShare] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [region, setRegion] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [note, setNote] = useState("");
  const [trailNote, setTrailNote] = useState("");
  const [trailSource, setTrailSource] = useState<TrailNoteSource>("guide");
  const [narrating, setNarrating] = useState(false);
  const [gemmaHint, setGemmaHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [geoNote, setGeoNote] = useState("");

  useEffect(() => {
    setEngine(readEngine());
    setShare(readShareDefault());
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (phase === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [phase]);

  function selectEngine(next: EngineChoice) {
    setEngine(next);
    writeEngine(next);
  }

  function onProgress(update: ModelProgress) {
    if (typeof update.progress === "number") setPercent(Math.round(update.progress));
    if (update.status === "progress" || update.status === "download") setProgress("Downloading the open model");
    else if (update.status === "ready" || update.status === "done") setProgress("Matching the field guide");
    else setProgress("Preparing CLIP on this phone");
  }

  async function identify(source: Blob | string) {
    setError("");
    setResult(null);
    setPhase("matching");
    setProgress(engine === "server" ? "Asking the server to run CLIP" : "Preparing CLIP on this phone");
    setPercent(null);
    const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
    const display = await fileToDataUrl(blob, 1400, 0.82);
    const small = await fileToDataUrl(blob, 384, 0.72);
    setPreview(display);
    try {
      const named =
        engine === "server"
          ? await identifyOnServer(small)
          : await runClip(small, { device: "wasm", onProgress });
      applyResult(named);
    } catch (phoneError) {
      if (engine === "phone" && online) {
        try {
          setProgress("The phone model missed. Trying the same model on the server.");
          const named = await identifyOnServer(small);
          applyResult(named);
          return;
        } catch (serverError) {
          setError(messageFrom(serverError) || messageFrom(phoneError));
          setPhase("idle");
          return;
        }
      }
      setError(messageFrom(phoneError));
      setPhase("idle");
    }
  }

  function applyResult(named: IdentifyResult) {
    const species = speciesById(named.top.speciesId);
    setResult(named);
    setChosenId(named.top.speciesId);
    setTrailNote(species?.guideNote ?? "");
    setTrailSource("guide");
    setPhase("result");
  }

  async function openCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
    } catch {
      cameraInput.current?.click();
    }
  }

  function shutter() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    canvas.toBlob((blob) => {
      if (blob) void identify(blob);
    }, "image/jpeg", 0.9);
  }

  function chooseSpecies(id: string) {
    setChosenId(id);
    const species = speciesById(id);
    if (species && trailSource === "guide") setTrailNote(species.guideNote);
  }

  async function toggleShare(next: boolean) {
    setShare(next);
    writeShareDefault(next);
    if (!next) {
      setGeoNote("");
      return;
    }
    if (!navigator.geolocation) {
      setGeoNote("This browser has no location. Pick a place name instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoNote("Pin ready. Sensitive species are rounded before they leave this phone.");
      },
      () => setGeoNote("Location stayed off. The place name can still be shared."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }

  function choosePlace(id: string) {
    const place = PLACES.find((item) => item.id === id);
    if (!place) return;
    setPlaceName(place.name);
    setRegion(place.region);
    setPoint({ lat: place.lat, lng: place.lng });
  }

  async function askGemma() {
    const species = speciesById(chosenId);
    if (!species) return;
    setNarrating(true);
    setError("");
    try {
      const response = await fetch("/api/narrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ speciesId: species.id }),
      });
      const payload = (await response.json()) as { text?: string; source?: TrailNoteSource; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "Gemma did not answer.");
      setTrailNote(payload.text);
      setTrailSource(payload.source ?? "guide");
      setGemmaHint(
        payload.source === "guide"
          ? "Gemma did not stay with the facts, so the field guide note stayed."
          : "",
      );
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setNarrating(false);
    }
  }

  async function save() {
    const species = speciesById(chosenId);
    if (!species || !result) return;
    const chosen = [result.top, ...result.alternatives].find((match) => match.speciesId === chosenId) ?? result.top;
    setSaving(true);
    setError("");
    try {
      const saved = await createSighting({
        id: crypto.randomUUID(),
        speciesId: species.id,
        confidence: chosen.score,
        strength: chosenId === result.top.speciesId ? result.strength : "possible",
        imageDataUrl: preview,
        note,
        placeName: placeName || "Unnamed place",
        region,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        shareLocation: share,
        modelId: result.modelId,
        engine: result.engine,
        trailNote,
        trailNoteSource: trailSource,
      });
      router.push(`/s/${saved.id}`);
    } catch (err) {
      setError(messageFrom(err));
      setSaving(false);
    }
  }

  const species = speciesById(chosenId);
  const headline =
    result?.strength === "uncertain" ? "Closest name in the guide" : result?.strength === "possible" ? "Looks like" : "This looks like";

  return (
    <div className="mx-auto max-w-lg px-4 pb-8">
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void identify(file);
        }}
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void identify(file);
        }}
      />

      {phase === "camera" ? (
        <div className="photo-frame relative aspect-[3/4] bg-dusk">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <Finder />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
            <Button variant="paper" onClick={() => { streamRef.current?.getTracks().forEach((track) => track.stop()); setPhase("idle"); }}>
              Cancel
            </Button>
            <button type="button" aria-label="Take photo" onClick={shutter} className="h-16 w-16 rounded-full border-4 border-paper bg-clay" />
          </div>
        </div>
      ) : null}

      {phase === "matching" ? (
        <div className="photo-frame relative aspect-[3/4] bg-dusk" aria-live="polite">
          {preview ? <img src={preview} alt="" /> : null}
          <Finder scanning />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dusk via-dusk/70 to-transparent p-5 text-cream">
            <p className="kicker text-gold">Open model</p>
            <p className="mt-2 font-display text-3xl leading-none">{progress}</p>
            {percent != null ? <p className="mt-2 text-sm text-cream/80">{percent}%</p> : null}
            <p className="mt-3 max-w-xs text-sm text-cream/75">The name is the short part. You can look up again in a moment.</p>
          </div>
        </div>
      ) : null}

      {phase === "result" && species && result ? (
        <div className="space-y-5">
          <div className="photo-frame relative aspect-[4/5] bg-dusk">
            <img src={preview} alt="" />
            <div className="absolute right-4 top-4 stamp rounded-md border-2 border-gold px-2 py-1 text-xs font-bold uppercase tracking-[0.16em] text-gold">
              Noted
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dusk via-dusk/55 to-transparent p-5 text-cream">
              <p className="kicker text-gold">{headline}</p>
              <h1 className="font-display text-5xl leading-[0.9]">{species.commonName}</h1>
              <p className="mt-2 italic text-cream/80">{species.scientificName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={species.status} label={IUCN_LABEL[species.status]} />
                <span className="text-sm text-cream/80">
                  {formatScore(([result.top, ...result.alternatives].find((match) => match.speciesId === chosenId) ?? result.top).score)} guide match · {result.engine === "browser" ? "on this phone" : "on the server"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm leading-6 text-ink-soft">
            That is the name. The interesting part is still in front of you.
          </p>

          <div className="flex flex-wrap gap-2" aria-label="Other names">
            {[result.top, ...result.alternatives].map((match) => (
              <button
                key={match.speciesId}
                type="button"
                onClick={() => chooseSpecies(match.speciesId)}
                className={`rounded-full px-3 py-2 text-sm ${chosenId === match.speciesId ? "bg-moss text-cream" : "bg-paper text-ink"}`}
              >
                {match.commonName}
                <span className="ml-1 opacity-70">{formatScore(match.score)}</span>
              </button>
            ))}
          </div>

          <FactGrid habitat={species.habitat} diet={species.diet} behaviour={species.behaviour} conservation={species.status} />

          <div className="rounded-3xl bg-paper p-4">
            <p className="kicker text-moss">{trailSource === "guide" ? "Field guide" : trailSource === "ollama" ? "Gemma, via your endpoint" : "Gemma 3 270M"}</p>
            <p className="mt-2 text-sm leading-6">{trailNote}</p>
            <Button variant="outline" className="mt-3" onClick={() => void askGemma()} disabled={narrating}>
              {narrating ? "Writing…" : "Rewrite with Gemma"}
            </Button>
            {gemmaHint ? <p className="mt-2 text-xs leading-5 text-ink-soft">{gemmaHint}</p> : null}
            <p className="mt-2 text-xs leading-5 text-ink-soft">
              Gemma only rewrites these facts, on the server or an Ollama endpoint. If the note does not name the species, the guide stays. Naming on this phone is CLIP, not this rewrite.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="place">Place label</Label>
            <Input id="place" value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="A path, a park, a compound wall" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PLACES.map((place) => (
                <button key={place.id} type="button" onClick={() => choosePlace(place.id)} className="shrink-0 rounded-full bg-paper px-3 py-2 text-sm">
                  {place.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
              <div>
                <p className="font-semibold">Share a pin</p>
                <p className="text-sm text-ink-soft">Off unless you turn it on.</p>
              </div>
              <Switch checked={share} onCheckedChange={(value) => void toggleShare(value)} aria-label="Share a pin" />
            </div>
            {geoNote ? <p className="text-sm text-ink-soft">{geoNote}</p> : null}
            {share && speciesIsSensitiveClient(species.id) ? (
              <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm leading-6">
                This species is sensitive. The shared pin is rounded to about 11 km before it is saved. The exact spot does not go to the server.
              </p>
            ) : null}
            <Dialog>
              <DialogTrigger className="text-sm font-semibold text-moss underline-offset-4 hover:underline">
                Why soften a pin?
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>A name is not a map pin</DialogTitle>
                <DialogDescription>
                  Threatened species, and a few timber trees, are stored as a grid cell about 11 kilometres across. The server never receives the exact point. Sharing itself stays off until you opt in.
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Label htmlFor="note">A line for later</Label>
            <Textarea id="note" value={note} maxLength={280} onChange={(event) => setNote(event.target.value)} placeholder="What were you doing when you looked up?" />
          </div>

          {error ? <p className="text-sm text-clay-deep">{error}</p> : null}
          <Button className="w-full" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save the note"}
          </Button>
          <button type="button" className="w-full text-sm text-ink-soft" onClick={() => { setPhase("idle"); setPreview(""); }}>
            Discard and look again
          </button>
          <p className="text-center text-xs text-ink-soft">{VISION_MODEL.name} · {VISION_MODEL.license} · this guide only, not every species on earth</p>
        </div>
      ) : null}

      {phase === "idle" || phase === "camera" ? (
        <div className={phase === "camera" ? "mt-6" : ""}>
          {phase === "idle" ? (
            <>
              <p className="kicker text-clay">Out here</p>
              <h1 className="mt-2 font-display text-5xl leading-[0.92]">What did you just meet?</h1>
              <p className="mt-3 text-base leading-7 text-ink-soft">
                One photo. An open model suggests a name from the field guide. Then the phone&apos;s job is done.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button onClick={() => void openCamera()}>
                  <Camera className="h-4 w-4" aria-hidden /> Camera
                </Button>
                <Button variant="outline" onClick={() => libraryInput.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden /> Upload
                </Button>
              </div>
              <fieldset className="mt-4">
                <legend className="text-sm font-semibold">Where the model runs</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <EngineButton current={engine} value="phone" onPick={selectEngine} label="This phone" detail="Works with no signal, after one download" />
                  <EngineButton current={engine} value="server" onPick={selectEngine} label="Server" detail={serverModels ? "Same CLIP, already warm here" : "Same CLIP, if the host allows it"} />
                </div>
              </fieldset>
              {!online ? <p className="mt-3 text-sm text-clay-deep">You are offline. The phone model is the one that can still answer.</p> : null}
              {error ? <p className="mt-3 text-sm text-clay-deep">{error}</p> : null}
              <div className="mt-8">
                <p className="kicker flex items-center gap-2 text-moss">
                  <Leaf className="h-3.5 w-3.5" aria-hidden /> Try a reference photo
                </p>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {SAMPLE_PHOTOS.map((sample) => {
                    const item = speciesById(sample.speciesId);
                    if (!item) return null;
                    return (
                      <button key={sample.speciesId} type="button" onClick={() => void identify(sample.image)} className="w-28 shrink-0 text-left">
                        <span className="photo-frame block aspect-square">
                          <img src={sample.image} alt="" />
                        </span>
                        <span className="mt-2 block text-sm font-semibold leading-tight">{item.commonName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EngineButton({
  current,
  value,
  label,
  detail,
  onPick,
}: {
  current: EngineChoice;
  value: EngineChoice;
  label: string;
  detail: string;
  onPick: (value: EngineChoice) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onPick(value)}
      className={`rounded-2xl px-3 py-3 text-left ${active ? "bg-moss text-cream" : "bg-paper text-ink"}`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className={`mt-1 block text-xs leading-4 ${active ? "text-cream/75" : "text-ink-soft"}`}>{detail}</span>
    </button>
  );
}

function Finder({ scanning = false }: { scanning?: boolean }) {
  return (
    <>
      <span className="finder-corner finder-tl" />
      <span className="finder-corner finder-tr" />
      <span className="finder-corner finder-bl" />
      <span className="finder-corner finder-br" />
      {scanning ? <span className="scanline" /> : null}
    </>
  );
}

function speciesIsSensitiveClient(id: string): boolean {
  const species = speciesById(id);
  return species ? speciesIsSensitive(species) : false;
}

async function identifyOnServer(image: string): Promise<IdentifyResult> {
  const response = await fetch("/api/identify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const payload = (await response.json()) as IdentifyResult & { error?: string };
  if (!response.ok) throw new Error(payload.error || "The server model could not name that photo.");
  return payload;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "The model could not name that photo.";
}
