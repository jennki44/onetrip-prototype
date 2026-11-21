/** The kinds of stop the AI helper uses, and how each maps onto OneTRIP's place types, activity categories and icons. */
export const AI_KINDS = ["food", "coffee", "sightseeing", "shopping", "nature", "culture", "nightlife", "kids", "transport", "stay", "other"] as const;
export type AiKind = (typeof AI_KINDS)[number];

const MAP: Record<AiKind, { placeType: "restaurant" | "activity" | "hotel" | "shopping" | "transport" | "saved"; category: string; emoji: string }> = {
  food: { placeType: "restaurant", category: "food", emoji: "🍜" },
  coffee: { placeType: "restaurant", category: "food", emoji: "☕" },
  sightseeing: { placeType: "activity", category: "activity", emoji: "🏯" },
  shopping: { placeType: "shopping", category: "shopping", emoji: "🛍️" },
  nature: { placeType: "activity", category: "activity", emoji: "🌳" },
  culture: { placeType: "activity", category: "activity", emoji: "🎨" },
  nightlife: { placeType: "activity", category: "activity", emoji: "🌃" },
  kids: { placeType: "activity", category: "activity", emoji: "👶" },
  transport: { placeType: "transport", category: "transport", emoji: "🚆" },
  stay: { placeType: "hotel", category: "stay", emoji: "🏨" },
  other: { placeType: "activity", category: "activity", emoji: "📍" },
};
export const kindInfo = (k: AiKind) => MAP[k] ?? MAP.other;
