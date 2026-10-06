import { round4 } from "@/lib/utils";
import type { Precision } from "@/lib/types";

/** About 11 km. A cell, not a dot. */
export const COARSE_STEP = 0.1;

export type ShareDecision = {
  precision: Precision;
  publicLat: number | null;
  publicLng: number | null;
  /** Kept for the author's phone. Never written to the server for a sensitive species. */
  privateLat: number | null;
  privateLng: number | null;
};

export function snapToCellCenter(value: number, step = COARSE_STEP): number {
  const cell = Math.floor(value / step);
  return round4(cell * step + step / 2);
}

function usable(lat: number | null, lng: number | null): lat is number {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Location sharing is opt-in. Sensitive species are coarsened before anything
 * is stored on the server, so the exact point is never received.
 */
export function decideLocation(options: {
  lat: number | null;
  lng: number | null;
  share: boolean;
  sensitive: boolean;
}): ShareDecision {
  const { lat, lng, share, sensitive } = options;
  const hasPoint = usable(lat, lng);
  const privateLat = hasPoint ? lat : null;
  const privateLng = hasPoint ? lng : null;

  if (!share || !hasPoint) {
    return { precision: "hidden", publicLat: null, publicLng: null, privateLat, privateLng };
  }

  if (sensitive) {
    return {
      precision: "coarse",
      publicLat: snapToCellCenter(lat),
      publicLng: snapToCellCenter(lng as number),
      privateLat,
      privateLng,
    };
  }

  return {
    precision: "exact",
    publicLat: round4(lat),
    publicLng: round4(lng as number),
    privateLat,
    privateLng,
  };
}
