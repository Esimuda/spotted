"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-display text-5xl leading-none">The trail hiccuped.</h1>
      <p className="mt-4 text-sm leading-6 text-ink-soft">{error.message}</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-cream">
        Try again
      </button>
    </main>
  );
}
