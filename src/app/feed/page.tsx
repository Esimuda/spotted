"use client";

import { useMemo, useState } from "react";
import { GROUP_LABEL, type SpeciesGroup } from "@/data/species";
import { useTrail } from "@/components/trail-provider";
import { SightingCard } from "@/components/sighting-card";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "bird", "mammal", "reptile", "insect", "plant"] as const;

export default function FeedPage() {
  const { sightings, loading } = useTrail();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const visible = useMemo(
    () => (filter === "all" ? sightings : sightings.filter((sighting) => sighting.group === filter)),
    [filter, sightings],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <p className="kicker text-clay">The trail</p>
      <h1 className="mt-2 font-display text-5xl leading-none">What people met</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Demo notes use open reference photos, so you can try the feed before you add your own. Pins for sensitive species are already soft.
      </p>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter the trail">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={cn("shrink-0 rounded-full px-3 py-2 text-sm font-semibold", filter === item ? "bg-moss text-cream" : "bg-paper text-ink")}
          >
            {item === "all" ? "All" : GROUP_LABEL[item as SpeciesGroup]}
          </button>
        ))}
      </div>
      {loading ? <FeedSkeleton /> : null}
      {!loading && visible.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-paper p-6 text-sm leading-6">Nothing in that group yet. The field tab is how a note gets here.</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {visible.map((sighting) => (
            <SightingCard key={sighting.id} sighting={sighting} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="mt-4 grid gap-5 sm:grid-cols-2" aria-hidden>
      <div className="h-80 animate-pulse rounded-[1.6rem] bg-cream-deep" />
      <div className="h-80 animate-pulse rounded-[1.6rem] bg-cream-deep" />
    </div>
  );
}
