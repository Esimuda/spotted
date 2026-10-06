import { describe, expect, it } from "vitest";
import { decideLocation, snapToCellCenter } from "@/lib/privacy";

describe("location privacy", () => {
  it("hides a pin when sharing is off", () => {
    const decision = decideLocation({ lat: 6.4419, lng: 3.5355, share: false, sensitive: false });
    expect(decision.precision).toBe("hidden");
    expect(decision.publicLat).toBeNull();
    expect(decision.privateLat).toBe(6.4419);
  });

  it("keeps an exact public pin for a common species", () => {
    const decision = decideLocation({ lat: 6.4419, lng: 3.5355, share: true, sensitive: false });
    expect(decision.precision).toBe("exact");
    expect(decision.publicLat).toBe(6.4419);
    expect(decision.publicLng).toBe(3.5355);
  });

  it("coarsens a sensitive species before the server would ever see it", () => {
    const decision = decideLocation({ lat: 9.7518, lng: 10.5108, share: true, sensitive: true });
    expect(decision.precision).toBe("coarse");
    expect(decision.publicLat).toBe(snapToCellCenter(9.7518));
    expect(decision.publicLng).toBe(snapToCellCenter(10.5108));
    expect(decision.publicLat).not.toBe(9.7518);
    expect(Math.abs((decision.publicLat ?? 0) - 9.7518)).toBeLessThanOrEqual(0.05);
  });

  it("snaps negative coordinates to the cell center", () => {
    expect(snapToCellCenter(-0.14)).toBe(-0.15);
  });

  it("rejects a pin that is not a real coordinate", () => {
    const decision = decideLocation({ lat: 120, lng: 10, share: true, sensitive: false });
    expect(decision.precision).toBe("hidden");
    expect(decision.publicLat).toBeNull();
  });
});
