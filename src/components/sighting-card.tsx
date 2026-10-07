"use client";

import Link from "next/link";
import { GROUP_LABEL } from "@/data/species";
import { formatWhen } from "@/lib/format";
import { useTrail } from "@/components/trail-provider";
import { ReactionBar } from "@/components/reaction-bar";
import type { Sighting } from "@/lib/types";

export function SightingCard({ sighting }: { sighting: Sighting }) {
  const { react } = useTrail();
  return (
    <article className="journal-card overflow-hidden">
      <Link href={`/s/${sighting.id}`} className="block">
        <div className="relative aspect-[4/5] sm:aspect-[5/4]">
          <img src={sighting.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dusk/85 via-dusk/25 to-transparent p-4 text-cream">
            <p className="kicker text-gold">{GROUP_LABEL[sighting.group]}</p>
            <h2 className="font-display text-3xl leading-none">{sighting.commonName || "Unnamed note"}</h2>
            <p className="mt-1 text-sm italic text-cream/80">{sighting.scientificName}</p>
          </div>
        </div>
      </Link>
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3 text-sm">
          <p>
            <Link href={`/life?u=${sighting.authorId}`} className="font-semibold text-moss">
              {sighting.authorName}
            </Link>
            <span className="text-ink-soft">
              {" "}
              · {sighting.placeName}
              {sighting.precision === "coarse" ? " · soft pin" : ""}
              {sighting.precision === "hidden" ? " · pin kept private" : ""}
            </span>
          </p>
          <time className="shrink-0 text-ink-soft" dateTime={sighting.createdAt}>
            {formatWhen(sighting.createdAt)}
          </time>
        </div>
        {sighting.note ? <p className="line-clamp-3 text-sm leading-6">{sighting.note}</p> : null}
        {sighting.demo ? <p className="text-xs text-ink-soft">Demo note · reference photo</p> : null}
        {sighting.pending ? <p className="text-xs font-semibold text-clay-deep">Saved on this phone · waiting to sync</p> : null}
        <ReactionBar reactions={sighting.reactions} onReact={(kind) => void react(sighting.id, kind)} />
      </div>
    </article>
  );
}
