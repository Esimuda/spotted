export function formatWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diff = now.getTime() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) {
    const n = Math.floor(diff / minute);
    return `${n} min ago`;
  }
  if (diff < day) {
    const n = Math.floor(diff / hour);
    return `${n} hr ago`;
  }
  if (diff < 7 * day) {
    const n = Math.floor(diff / day);
    return n === 1 ? "Yesterday" : `${n} days ago`;
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}
