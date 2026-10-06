import type { Metadata } from "next";
import Link from "next/link";
import credits from "../../../public/seed/credits.json";

export const metadata: Metadata = { title: "Photo credits" };

export default function CreditsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/" className="text-sm font-semibold text-moss">
        Back
      </Link>
      <h1 className="mt-4 font-display text-5xl leading-none">Photo credits</h1>
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        Demo notes are fictional. The photographs are reference images from Wikimedia Commons and stay under their own licenses. The application code is MIT.
      </p>
      <ul className="mt-8 space-y-5">
        {credits.map((item) => (
          <li key={item.file} className="rounded-2xl bg-paper p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{item.license}</p>
            {item.artist ? <p className="mt-1 text-sm">{item.artist}</p> : null}
            {item.source ? (
              <a href={item.source} className="mt-2 inline-block text-sm font-semibold text-moss">
                Source
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
