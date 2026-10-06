import { speciesById, type Species } from "@/data/species";
import { PLACES, type Place } from "@/data/places";
import type { Profile } from "@/lib/types";

export const SEED_VERSION = "4";

export const PROFILES: Profile[] = [
  {
    id: "you",
    handle: "you",
    name: "You",
    bio: "The demo leaves a short streak here so the life list is not empty. Your own notes join it.",
    homeBase: "Lagos, Nigeria",
    hue: "#c4622d",
  },
  {
    id: "amina",
    handle: "amina",
    name: "Amina Balogun",
    bio: "Boardwalk mornings, before the city gets loud.",
    homeBase: "Lekki, Lagos",
    hue: "#1f4d3a",
  },
  {
    id: "chinedu",
    handle: "chinedu",
    name: "Chinedu Okeke",
    bio: "Yankari when the week allows. Otherwise the nearest tree.",
    homeBase: "Bauchi",
    hue: "#8d3e16",
  },
  {
    id: "ifeoma",
    handle: "ifeoma",
    name: "Ifeoma Eze",
    bio: "Obudu air is colder than the coast expects.",
    homeBase: "Obudu, Cross River",
    hue: "#2f6b4f",
  },
  {
    id: "tunde",
    handle: "tunde",
    name: "Tunde Adeyemi",
    bio: "Okomu, slowly. Rare things get a soft pin.",
    homeBase: "Edo",
    hue: "#243028",
  },
];

export type SeedComment = {
  id: string;
  authorId: string;
  body: string;
  hoursAgo: number;
};

export type SeedReaction = {
  authorId: string;
  kind: "wonder" | "seen" | "protect";
};

export type SeedSighting = {
  id: string;
  authorId: string;
  speciesId: string;
  image: string;
  placeId: string;
  daysAgo: number;
  hour: number;
  note: string;
  /** When false, the park name is kept and the pin is hidden. */
  share: boolean;
  confidence: number;
  strength: "strong" | "possible" | "uncertain";
  comments: SeedComment[];
  reactions: SeedReaction[];
};

function mustSpecies(id: string): Species {
  const species = speciesById(id);
  if (!species) throw new Error(`Missing species ${id}`);
  return species;
}

function mustPlace(id: string): Place {
  const place = PLACES.find((item) => item.id === id);
  if (!place) throw new Error(`Missing place ${id}`);
  return place;
}

export const SEED_SIGHTINGS: SeedSighting[] = [
  {
    id: "s-kingfisher",
    authorId: "amina",
    speciesId: "pied-kingfisher",
    image: "/seed/pied-kingfisher.jpg",
    placeId: "lekki",
    daysAgo: 0,
    hour: 8,
    note: "Demo note for the lagoon edge. The photo is an open reference so the feed is not empty. The hover is the part worth watching.",
    share: true,
    confidence: 0.86,
    strength: "strong",
    comments: [
      {
        id: "c-king-1",
        authorId: "chinedu",
        body: "The hover is the whole show. If the name comes back fast, you still get to watch the dive.",
        hoursAgo: 5,
      },
      {
        id: "c-king-2",
        authorId: "ifeoma",
        body: "We get them on the bigger rivers too. The boardwalk is an easier first meeting.",
        hoursAgo: 3,
      },
    ],
    reactions: [
      { authorId: "chinedu", kind: "wonder" },
      { authorId: "ifeoma", kind: "seen" },
      { authorId: "tunde", kind: "wonder" },
      { authorId: "you", kind: "wonder" },
    ],
  },
  {
    id: "s-agama",
    authorId: "you",
    speciesId: "agama",
    image: "/seed/agama.jpg",
    placeId: "lekki",
    daysAgo: 0,
    hour: 11,
    note: "Demo starter. Every compound wall has one. This reference photo is the dressed-up version.",
    share: true,
    confidence: 0.63,
    strength: "strong",
    comments: [
      {
        id: "c-agama-1",
        authorId: "amina",
        body: "The mayor of the wall. Mine changes colour and then pretends not to see me.",
        hoursAgo: 2,
      },
    ],
    reactions: [
      { authorId: "amina", kind: "seen" },
      { authorId: "tunde", kind: "wonder" },
    ],
  },
  {
    id: "s-weaver",
    authorId: "you",
    speciesId: "village-weaver",
    image: "/seed/village-weaver.jpg",
    placeId: "lekki",
    daysAgo: 1,
    hour: 16,
    note: "Demo starter from a garden tree. The nests are the field mark even before the yellow.",
    share: false,
    confidence: 0.71,
    strength: "strong",
    comments: [],
    reactions: [{ authorId: "ifeoma", kind: "seen" }],
  },
  {
    id: "s-egret",
    authorId: "you",
    speciesId: "cattle-egret",
    image: "/seed/cattle-egret.jpg",
    placeId: "lekki",
    daysAgo: 2,
    hour: 9,
    note: "Demo starter. Following the cattle is the behaviour. The name is the short part.",
    share: true,
    confidence: 0.58,
    strength: "possible",
    comments: [],
    reactions: [{ authorId: "chinedu", kind: "seen" }],
  },
  {
    id: "s-swallowtail",
    authorId: "amina",
    speciesId: "citrus-swallowtail",
    image: "/seed/swallowtail.jpg",
    placeId: "lekki",
    daysAgo: 1,
    hour: 15,
    note: "Demo note. If it is circling the lime tree, you already have a few minutes of watching to do.",
    share: true,
    confidence: 0.66,
    strength: "strong",
    comments: [
      {
        id: "c-sw-1",
        authorId: "you",
        body: "The tails are the giveaway. I am leaving the phone in the pocket for the next lap of the garden.",
        hoursAgo: 20,
      },
    ],
    reactions: [
      { authorId: "you", kind: "seen" },
      { authorId: "ifeoma", kind: "wonder" },
    ],
  },
  {
    id: "s-eagle",
    authorId: "chinedu",
    speciesId: "african-fish-eagle",
    image: "/seed/african-fish-eagle.jpg",
    placeId: "yankari",
    daysAgo: 3,
    hour: 7,
    note: "Demo note for a wide river. Reference photo. The call usually arrives before the bird.",
    share: true,
    confidence: 0.8,
    strength: "strong",
    comments: [
      {
        id: "c-eagle-1",
        authorId: "tunde",
        body: "That call is the sound I want on a quiet morning. The photo can be anyone's. The yell is the point.",
        hoursAgo: 40,
      },
    ],
    reactions: [
      { authorId: "amina", kind: "wonder" },
      { authorId: "tunde", kind: "wonder" },
      { authorId: "ifeoma", kind: "protect" },
    ],
  },
  {
    id: "s-baboon",
    authorId: "chinedu",
    speciesId: "olive-baboon",
    image: "/seed/olive-baboon.jpg",
    placeId: "yankari",
    daysAgo: 4,
    hour: 10,
    note: "Demo note. Troops use the open ground. Reference photo, not a claim that this frame was shot on the track.",
    share: true,
    confidence: 0.77,
    strength: "strong",
    comments: [],
    reactions: [
      { authorId: "amina", kind: "seen" },
      { authorId: "you", kind: "wonder" },
    ],
  },
  {
    id: "s-hippo",
    authorId: "chinedu",
    speciesId: "hippo",
    image: "/seed/hippo.jpg",
    placeId: "yankari",
    daysAgo: 6,
    hour: 17,
    note: "Demo note. Vulnerable, so this pin is already a soft circle. Eyes above the water are enough.",
    share: true,
    confidence: 0.9,
    strength: "strong",
    comments: [
      {
        id: "c-hippo-1",
        authorId: "amina",
        body: "Soft pin is the right call. Yankari is the place. The pool does not need a dot.",
        hoursAgo: 80,
      },
    ],
    reactions: [
      { authorId: "amina", kind: "protect" },
      { authorId: "tunde", kind: "protect" },
      { authorId: "ifeoma", kind: "wonder" },
    ],
  },
  {
    id: "s-buffalo",
    authorId: "chinedu",
    speciesId: "african-buffalo",
    image: "/seed/buffalo.jpg",
    placeId: "yankari",
    daysAgo: 8,
    hour: 12,
    note: "Demo note from the savanna side of the reserve. Reference photo. Give the herd the path.",
    share: true,
    confidence: 0.74,
    strength: "strong",
    comments: [],
    reactions: [{ authorId: "ifeoma", kind: "seen" }],
  },
  {
    id: "s-baobab",
    authorId: "chinedu",
    speciesId: "baobab",
    image: "/seed/baobab.jpg",
    placeId: "yankari",
    daysAgo: 9,
    hour: 18,
    note: "Demo note. The upside-down tree. You can stand under it longer than the screen deserves.",
    share: true,
    confidence: 0.7,
    strength: "strong",
    comments: [],
    reactions: [{ authorId: "you", kind: "wonder" }],
  },
  {
    id: "s-elephant",
    authorId: "tunde",
    speciesId: "forest-elephant",
    image: "/seed/forest-elephant.jpg",
    placeId: "okomu",
    daysAgo: 2,
    hour: 14,
    note: "Demo note. Critically endangered. The shared pin is a coarse circle around the park, not a trail.",
    share: true,
    confidence: 0.93,
    strength: "strong",
    comments: [
      {
        id: "c-el-1",
        authorId: "amina",
        body: "Thank you for the soft pin. A forest elephant does not need a precise dot.",
        hoursAgo: 30,
      },
      {
        id: "c-el-2",
        authorId: "ifeoma",
        body: "Okomu is worth the long road. The name is enough to carry home.",
        hoursAgo: 26,
      },
    ],
    reactions: [
      { authorId: "amina", kind: "protect" },
      { authorId: "ifeoma", kind: "protect" },
      { authorId: "chinedu", kind: "protect" },
      { authorId: "you", kind: "protect" },
    ],
  },
  {
    id: "s-grey",
    authorId: "tunde",
    speciesId: "african-grey",
    image: "/seed/african-grey.jpg",
    placeId: "okomu",
    daysAgo: 5,
    hour: 9,
    note: "Demo note. Endangered, so the pin is soft. This reference photo is a captive bird. Wild greys are a voice in the canopy.",
    share: true,
    confidence: 0.81,
    strength: "strong",
    comments: [
      {
        id: "c-grey-1",
        authorId: "chinedu",
        body: "Heard before seen. That is the honest field mark, and it does not need coordinates.",
        hoursAgo: 60,
      },
    ],
    reactions: [
      { authorId: "chinedu", kind: "protect" },
      { authorId: "amina", kind: "wonder" },
    ],
  },
  {
    id: "s-palm",
    authorId: "ifeoma",
    speciesId: "oil-palm",
    image: "/seed/oil-palm.jpg",
    placeId: "obudu",
    daysAgo: 1,
    hour: 13,
    note: "Demo note. Red fruit under the fronds. Native here, which is easy to forget.",
    share: true,
    confidence: 0.69,
    strength: "strong",
    comments: [],
    reactions: [{ authorId: "tunde", kind: "seen" }],
  },
  {
    id: "s-flamboyant",
    authorId: "ifeoma",
    speciesId: "flamboyant",
    image: "/seed/flamboyant.jpg",
    placeId: "obudu",
    daysAgo: 4,
    hour: 11,
    note: "Demo note for the resort path. Planted, not a forest native, and still worth stopping for.",
    share: true,
    confidence: 0.6,
    strength: "possible",
    comments: [],
    reactions: [{ authorId: "amina", kind: "wonder" }],
  },
  {
    id: "s-bee",
    authorId: "ifeoma",
    speciesId: "little-bee-eater",
    image: "/seed/bee-eater.jpg",
    placeId: "obudu",
    daysAgo: 7,
    hour: 8,
    note: "Demo note. A small bird that keeps returning to the same twig. Reference photo.",
    share: true,
    confidence: 0.64,
    strength: "possible",
    comments: [],
    reactions: [{ authorId: "you", kind: "wonder" }],
  },
];

export const SAMPLE_PHOTOS = [
  { speciesId: "pied-kingfisher", image: "/seed/pied-kingfisher.jpg" },
  { speciesId: "forest-elephant", image: "/seed/forest-elephant.jpg" },
  { speciesId: "agama", image: "/seed/agama.jpg" },
  { speciesId: "citrus-swallowtail", image: "/seed/swallowtail.jpg" },
  { speciesId: "oil-palm", image: "/seed/oil-palm.jpg" },
  { speciesId: "european-robin", image: "/seed/robin.jpg" },
] as const;

export function assertSeed(): void {
  for (const sighting of SEED_SIGHTINGS) {
    mustSpecies(sighting.speciesId);
    mustPlace(sighting.placeId);
  }
}
