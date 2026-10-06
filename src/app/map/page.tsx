"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTrail } from "@/components/trail-provider";

const MapCanvas = dynamic(() => import("@/components/map-canvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-cream-deep" />,
});

export default function MapPage() {
  const { sightings } = useTrail();
  const located = useMemo(() => sightings.filter((sighting) => sighting.lat != null && sighting.lng != null), [sightings]);
  const [selectedId, setSelectedId] = useState<string | null>(located[0]?.id ?? null);
  const selected = located.find((sighting) => sighting.id === selectedId) ?? located[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <p className="kicker text-clay">Map</p>
      <h1 className="mt-2 font-display text-5xl leading-none">Soft where it should be</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
        Green dots are shared places. Clay circles are about 11 km wide, for species that should not have a precise pin.
      </p>
      <div className="mt-4 h-[58dvh] overflow-hidden rounded-[1.6rem] border border-ink/10">
        <MapCanvas sightings={located} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
      </div>
      <div className="mt-3 flex gap-4 text-xs font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-moss" /> Exact, opted in</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-clay" /> Softened</span>
      </div>
      <ul className="mt-4 grid gap-2">
        {located.map((sighting) => (
          <li key={sighting.id}>
            <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${selected?.id === sighting.id ? "bg-moss text-cream" : "bg-paper"}`}>
              <button type="button" onClick={() => setSelectedId(sighting.id)} className="min-w-0 flex-1 text-left">
                <span className="block font-display text-xl leading-none">{sighting.commonName}</span>
                <span className={`mt-1 block text-sm ${selected?.id === sighting.id ? "text-cream/75" : "text-ink-soft"}`}>
                  {sighting.placeName}
                  {sighting.precision === "coarse" ? " · soft pin" : ""}
                </span>
              </button>
              <Link href={`/s/${sighting.id}`} className={`text-sm font-semibold underline ${selected?.id === sighting.id ? "text-gold" : "text-moss"}`}>
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
