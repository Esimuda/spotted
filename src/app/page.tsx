import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/config/brand";
import { FACTS_MODEL, VISION_MODEL } from "@/config/models";
import { PLACES } from "@/data/places";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark />
        <Button asChild size="sm" variant="clay">
          <Link href="/field">Open the field</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
        <div>
          <p className="kicker text-clay">A pocket field guide</p>
          <h1 className="mt-3 font-display text-[clamp(3.4rem,8vw,6.6rem)] leading-[0.9] tracking-tight text-ink">
            Name it.
            <span className="mt-1 block italic text-moss">Then look up.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
            {APP_NAME} is for the moment you meet a bird, a lizard, a tree, or something you cannot place.
            An open model suggests a name. The screen&apos;s job ends there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/field">Name something</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/feed">Walk the demo trail</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-md text-sm leading-6 text-ink-soft">{APP_TAGLINE} The demo runs through Lekki, Okomu, Obudu, and Yankari, and the guide still works on a street that is not in Nigeria.</p>
        </div>

        <div className="relative pb-28 lg:pb-16">
          <div className="photo-frame aspect-[4/5] shadow-[0_30px_80px_rgba(18,36,28,0.18)] sm:aspect-[5/4]">
            <img src="/seed/canopy.jpg" alt="A canopy walkway through green forest" />
          </div>
          <article className="journal-card absolute -bottom-8 left-4 right-8 overflow-hidden sm:left-[-12%] sm:right-auto sm:w-[22rem]">
            <div className="grid grid-cols-[7.5rem_1fr]">
              <img src="/seed/pied-kingfisher.jpg" alt="" className="h-full w-full object-cover" />
              <div className="p-4">
                <p className="kicker text-clay">Demo trail</p>
                <h2 className="font-display text-2xl leading-none">Pied kingfisher</h2>
                <p className="mt-1 text-sm italic text-ink-soft">Ceryle rudis</p>
                <p className="mt-3 text-xs leading-5 text-ink-soft">Reference photo. Lekki keeps the lagoon. You keep the minute after the name.</p>
              </div>
            </div>
          </article>
        </div>
      </main>

      <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-5 sm:grid-cols-3">
        {[
          ["01", "See something", "A wall, a river, a canopy. The walk is the product. The phone is a notebook."],
          ["02", "One photo, one name", "CLIP compares the picture with this field guide. You can correct it if the guess is thin."],
          ["03", "Pocket the phone", "Habitat, diet, behaviour, and status stay on the note. Then look at the actual animal."],
        ].map(([index, title, copy]) => (
          <article key={index} className="rounded-[1.5rem] bg-paper p-5">
            <p className="font-display text-3xl text-gold">{index}</p>
            <h2 className="mt-3 font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{copy}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <div className="overflow-hidden rounded-[2rem] bg-dusk text-cream lg:grid lg:grid-cols-2">
          <div className="p-7 sm:p-10">
            <p className="kicker text-gold">Privacy by design</p>
            <h2 className="mt-3 font-display text-4xl leading-none">A rare animal does not owe you a precise dot.</h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-cream/80">
              <li>The pin is off until you opt in. A place name can still be a label.</li>
              <li>Threatened species are rounded to about 11 km before the server stores anything. The exact point is never received.</li>
              <li>Notes made with no signal stay on the phone and sync when you are back.</li>
            </ul>
          </div>
          <img src="/seed/forest-elephant.jpg" alt="An African forest elephant in a forest clearing" className="h-72 w-full object-cover lg:h-full" />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <p className="kicker text-moss">Open models</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl leading-none">The name does not have to leave for a closed API.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] bg-paper p-5">
            <h3 className="font-display text-2xl">{VISION_MODEL.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Zero-shot, in the browser, MIT. It matches your photo against this guide. Swap the guide, or later swap in BioCLIP, without renting someone else&apos;s species API.
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-paper p-5">
            <h3 className="font-display text-2xl">{FACTS_MODEL.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Optional. It rewrites the guide&apos;s habitat, diet, behaviour, and status into a short trail note. The facts stay in the app, so a small model cannot invent a conservation status.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <p className="kicker text-moss">The demo trail</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLACES.map((place) => (
            <article key={place.id} className="rounded-[1.4rem] border border-ink/10 bg-paper/70 p-4">
              <h3 className="font-display text-2xl leading-none">{place.name}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-clay">{place.region}</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{place.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-16 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-10 text-sm text-ink-soft">
        <p>Code is MIT. Reference photos keep their own licenses.</p>
        <Link href="/credits" className="font-semibold text-moss">
          Photo credits
        </Link>
      </footer>
    </div>
  );
}
