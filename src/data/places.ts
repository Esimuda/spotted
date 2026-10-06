export type Place = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  blurb: string;
};

export const PLACES: Place[] = [
  {
    id: "lekki",
    name: "Lekki Conservation Centre",
    region: "Lagos, Nigeria",
    lat: 6.4419,
    lng: 3.5355,
    blurb: "Boardwalk, lagoon light, and a canopy you can actually stand in.",
  },
  {
    id: "okomu",
    name: "Okomu National Park",
    region: "Edo, Nigeria",
    lat: 6.35,
    lng: 5.34,
    blurb: "Lowland rainforest. A good place to practice a soft pin.",
  },
  {
    id: "obudu",
    name: "Obudu Mountain Resort",
    region: "Cross River, Nigeria",
    lat: 6.4167,
    lng: 9.3667,
    blurb: "Highland air above the forest. Cooler than the coast expects.",
  },
  {
    id: "yankari",
    name: "Yankari Game Reserve",
    region: "Bauchi, Nigeria",
    lat: 9.7518,
    lng: 10.5108,
    blurb: "Savanna, the Wikki spring, and tracks that are not a secret.",
  },
];

export function placeById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}
