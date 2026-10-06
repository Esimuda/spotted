import type { Sighting } from "@/lib/types";

/** Pending notes on this phone sit above the server feed until they sync. */
export function mergeSightings(remote: Sighting[], pending: Sighting[]): Sighting[] {
  const remoteIds = new Set(remote.map((sighting) => sighting.id));
  const localOnly = pending.filter((sighting) => sighting.pending && !remoteIds.has(sighting.id));
  return [...localOnly, ...remote].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
