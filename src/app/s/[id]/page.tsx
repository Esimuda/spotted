"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IUCN_LABEL } from "@/data/species";
import { formatScore, formatWhen } from "@/lib/format";
import { useTrail } from "@/components/trail-provider";
import { FactGrid } from "@/components/fact-grid";
import { ReactionBar } from "@/components/reaction-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/badge";
import type { Comment } from "@/lib/types";

export default function SightingPage() {
  const params = useParams<{ id: string }>();
  const { sightings, loading, profiles, comment, react } = useTrail();
  const sighting = sightings.find((item) => item.id === params.id);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  if (loading) return <p className="px-4 py-10">Finding that note…</p>;
  if (!sighting) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="font-display text-4xl">That note is not on this trail.</h1>
        <Link href="/feed" className="mt-4 inline-block font-semibold text-moss">
          Back to the feed
        </Link>
      </div>
    );
  }

  const comments = visibleComments(sighting.comments, localComments, sighting.id);

  return (
    <article className="mx-auto max-w-lg px-4 py-4">
      <Link href="/feed" className="inline-flex items-center gap-1 text-sm font-semibold text-moss">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Trail
      </Link>
      <div className="photo-frame mt-3 aspect-[4/5] bg-dusk">
        <img src={sighting.imageUrl} alt={`${sighting.commonName}, ${sighting.scientificName}`} />
      </div>
      <p className="kicker mt-5 text-clay">{sighting.placeName}</p>
      <h1 className="font-display text-5xl leading-[0.92]">{sighting.commonName}</h1>
      <p className="mt-1 italic text-ink-soft">{sighting.scientificName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={sighting.conservation} label={IUCN_LABEL[sighting.conservation]} />
        <span className="text-sm text-ink-soft">{formatScore(sighting.confidence)} · {sighting.engine === "browser" ? "on a phone" : sighting.engine === "server" ? "on the server" : "field guide"}</span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        <Link href={`/life?u=${sighting.authorId}`} className="font-semibold text-moss">{sighting.authorName}</Link>
        {" · "}
        <time dateTime={sighting.createdAt}>{formatWhen(sighting.createdAt)}</time>
        {sighting.region ? ` · ${sighting.region}` : ""}
      </p>
      {sighting.demo ? <p className="mt-2 text-xs text-ink-soft">Demo note. The photo is an open reference, not a claim that this person took the frame.</p> : null}
      {sighting.precision === "coarse" ? (
        <p className="mt-4 rounded-2xl bg-gold/25 px-4 py-3 text-sm leading-6">
          The shared pin is a soft circle, about 11 km across. {sighting.sensitive ? "This species is sensitive, so the exact point was never stored." : ""}
        </p>
      ) : null}
      {sighting.precision === "hidden" ? (
        <p className="mt-4 rounded-2xl bg-cream-deep px-4 py-3 text-sm">The place is a label. No pin was shared.</p>
      ) : null}
      {sighting.note ? <p className="mt-4 text-base leading-7">{sighting.note}</p> : null}
      <div className="mt-5">
        <FactGrid habitat={sighting.habitat} diet={sighting.diet} behaviour={sighting.behaviour} conservation={sighting.conservation} />
      </div>
      <p className="mt-4 text-sm leading-6 text-ink">{sighting.trailNote}</p>
      <div className="mt-5">
        <ReactionBar reactions={sighting.reactions} onReact={(kind) => void react(sighting.id, kind)} />
      </div>
      <h2 className="mt-8 font-display text-3xl">Notes from the trail</h2>
      <ul className="mt-3 space-y-3" aria-live="polite">
        {comments.length === 0 ? <li className="text-sm text-ink-soft">No comments yet. Leave one, then go back outside.</li> : null}
        {comments.map((item) => (
          <li key={item.id} className="rounded-2xl bg-paper px-4 py-3">
            <p className="text-sm font-semibold text-moss">{item.authorName}</p>
            <p className="mt-1 text-sm leading-6">{item.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const text = body.trim();
          if (!text) {
            setError("Write a short comment first.");
            return;
          }
          const you = profiles.find((profile) => profile.id === "you");
          const optimistic: Comment = {
            id: `pending-${crypto.randomUUID()}`,
            sightingId: sighting.id,
            authorId: "you",
            authorName: you?.name ?? "You",
            body: text,
            createdAt: new Date().toISOString(),
          };
          setLocalComments((current) => [...current, optimistic]);
          setBody("");
          setError("");
          setPosting(true);
          void comment(sighting.id, text)
            .then((created) => {
              setLocalComments((current) => current.map((item) => (item.id === optimistic.id ? created : item)));
            })
            .catch((err: unknown) => {
              setLocalComments((current) => current.filter((item) => item.id !== optimistic.id));
              setBody(text);
              setError(err instanceof Error ? err.message : "Could not comment.");
            })
            .finally(() => setPosting(false));
        }}
      >
        <Label htmlFor="comment">Add a comment</Label>
        <Textarea id="comment" value={body} onChange={(event) => setBody(event.target.value)} placeholder="A thing you noticed, not a speech." />
        {error ? (
          <p className="rounded-2xl bg-clay/15 px-3 py-2 text-sm text-clay-deep" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={posting}>{posting ? "Posting…" : "Post comment"}</Button>
      </form>
    </article>
  );
}

function visibleComments(server: Comment[], local: Comment[], sightingId: string): Comment[] {
  const byId = new Map<string, Comment>();
  for (const item of server) byId.set(item.id, item);
  for (const item of local) {
    if (item.sightingId !== sightingId) continue;
    byId.set(item.id, item);
  }
  return [...byId.values()];
}
