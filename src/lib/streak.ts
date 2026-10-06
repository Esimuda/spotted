export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Consecutive local days with at least one sighting.
 * If today is still empty, yesterday can keep the streak alive.
 */
export function computeStreak(isoDates: string[], now = new Date()): number {
  const days = new Set(
    isoDates
      .map((iso) => new Date(iso))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => dayKey(date)),
  );
  const cursor = startOfLocalDay(now);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function profileStats(dates: string[], speciesIds: string[], now = new Date()) {
  return {
    sightingCount: dates.length,
    speciesCount: new Set(speciesIds).size,
    streak: computeStreak(dates, now),
  };
}
