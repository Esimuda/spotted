import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <p className="kicker text-clay">Off the path</p>
      <h1 className="mt-3 font-display text-5xl leading-none">That page is not on the trail.</h1>
      <Link href="/field" className="mt-6 inline-block font-semibold text-moss">
        Back to the field
      </Link>
    </main>
  );
}
