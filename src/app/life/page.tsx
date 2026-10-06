"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GROUP_LABEL, SPECIES } from "@/data/species";
import { profileStats } from "@/lib/streak";
import { readEngine, readShareDefault, writeEngine, writeShareDefault } from "@/lib/prefs";
import { useTrail } from "@/components/trail-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function LifePage() {
  return (
    <Suspense fallback={<p className="px-4 py-8">Opening the life list…</p>}>
      <LifeList />
    </Suspense>
  );
}

function LifeList() {
  const params = useSearchParams();
  const who = params.get("u") || "you";
  const { profiles, sightings, saveProfile, loading } = useTrail();
  const profile = profiles.find((item) => item.id === who) ?? profiles.find((item) => item.id === "you");
  const mine = sightings.filter((sighting) => sighting.authorId === (profile?.id ?? who));
  const stats = profileStats(
    mine.map((sighting) => sighting.createdAt),
    mine.map((sighting) => sighting.speciesId),
  );
  const seen = new Set(mine.map((sighting) => sighting.speciesId));
  const [name, setName] = useState(profile?.name ?? "");
  const [home, setHome] = useState(profile?.homeBase ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [message, setMessage] = useState("");
  const [shareDefault, setShareDefault] = useState(false);
  const [phoneEngine, setPhoneEngine] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setHome(profile.homeBase);
    setBio(profile.bio);
    setShareDefault(readShareDefault());
    setPhoneEngine(readEngine() === "phone");
  }, [profile]);

  const isYou = profile?.id === "you";

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full font-display text-2xl text-cream" style={{ background: profile?.hue ?? "#1e4a38" }}>
          {(profile?.name ?? "You").slice(0, 1)}
        </span>
        <div>
          <p className="kicker text-clay">{isYou ? "Your life list" : "Life list"}</p>
          <h1 className="font-display text-4xl leading-none">{profile?.name ?? "You"}</h1>
          <p className="mt-1 text-sm text-ink-soft">{profile?.homeBase}</p>
        </div>
      </div>
      <p className="mt-4 max-w-xl text-sm leading-6 text-ink-soft">{profile?.bio}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat value={loading ? "—" : String(stats.streak)} label="day streak" />
        <Stat value={loading ? "—" : String(stats.speciesCount)} label="species" />
        <Stat value={loading ? "—" : String(stats.sightingCount)} label="notes" />
      </div>

      <h2 className="mt-8 font-display text-3xl">Collected</h2>
      {loading ? (
        <div className="mt-4 grid grid-cols-3 gap-3" aria-hidden>
          <div className="aspect-square animate-pulse rounded-2xl bg-cream-deep" />
          <div className="aspect-square animate-pulse rounded-2xl bg-cream-deep" />
          <div className="aspect-square animate-pulse rounded-2xl bg-cream-deep" />
        </div>
      ) : mine.length === 0 ? (
        <p className="mt-3 rounded-3xl bg-paper p-5 text-sm leading-6">
          Nothing named yet. <Link href="/field" className="font-semibold text-moss">Open the field</Link> and the list starts.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {mine.map((sighting) => (
            <li key={sighting.id}>
              <Link href={`/s/${sighting.id}`} className="block">
                <span className="photo-frame block aspect-square">
                  <img src={sighting.imageUrl} alt="" />
                </span>
                <span className="mt-2 block text-sm font-semibold leading-tight">{sighting.commonName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-display text-3xl">Still in the guide</h2>
      <ul className="mt-3 space-y-2">
        {(["bird", "mammal", "reptile", "insect", "plant"] as const).map((group) => (
          <li key={group} className="rounded-2xl bg-paper px-4 py-3">
            <p className="kicker text-moss">{GROUP_LABEL[group]}</p>
            <p className="mt-2 text-sm leading-6">
              {SPECIES.filter((species) => species.group === group).map((species, index, list) => (
                <span key={species.id} className={seen.has(species.id) ? "font-semibold text-moss" : undefined}>
                  {seen.has(species.id) ? "✓ " : ""}
                  {species.commonName}
                  {index < list.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>

      {isYou ? (
        <form
          className="mt-8 space-y-3 rounded-[1.6rem] bg-paper p-5"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile({ name, homeBase: home, bio })
              .then(() => setMessage("Saved."))
              .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not save."));
          }}
        >
          <h2 className="font-display text-3xl">This phone</h2>
          <Label htmlFor="name">Name on your notes</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          <Label htmlFor="home">Home base</Label>
          <Input id="home" value={home} onChange={(event) => setHome(event.target.value)} />
          <Label htmlFor="bio">A line about you</Label>
          <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Prefer CLIP on this phone</p>
            <Switch
              checked={phoneEngine}
              aria-label="Prefer CLIP on this phone"
              onCheckedChange={(value) => {
                setPhoneEngine(value);
                writeEngine(value ? "phone" : "server");
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">Share pins by default</p>
            <Switch
              checked={shareDefault}
              aria-label="Share pins by default"
              onCheckedChange={(value) => {
                setShareDefault(value);
                writeShareDefault(value);
              }}
            />
          </div>
          <Button type="submit">Save profile</Button>
          {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-dusk px-3 py-4 text-cream">
      <p className="font-display text-4xl leading-none text-gold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cream/70">{label}</p>
    </div>
  );
}
