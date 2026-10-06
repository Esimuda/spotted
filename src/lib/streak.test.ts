import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/streak";

function at(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

describe("streaks", () => {
  it("counts today and the days behind it", () => {
    expect(computeStreak([at(0), at(-1), at(-2)])).toBe(3);
  });

  it("lets yesterday keep a streak alive", () => {
    expect(computeStreak([at(-1), at(-2)])).toBe(2);
  });

  it("breaks when yesterday and today are both empty", () => {
    expect(computeStreak([at(-2)])).toBe(0);
  });

  it("is zero with no notes", () => {
    expect(computeStreak([])).toBe(0);
  });
});
