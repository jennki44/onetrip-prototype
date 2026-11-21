import { z } from "zod";
import { AI_KINDS } from "./kinds";

/** Shared pieces of the AI trip planner: schemas, the group brief and the system prompt (used by server actions and the per-day API). */
export const PlanItem = z.object({
  title: z.string().describe("Place or activity name in English"),
  title_zh: z.string().describe("Same name in Traditional Chinese (Hong Kong usage)"),
  search: z.string().describe("Text to type into a map search to find this exact place, with its neighbourhood and city"),
  area: z.string().describe("Neighbourhood, e.g. 'Shinjuku'"),
  kind: z.enum(AI_KINDS),
  start: z.string().describe("Suggested start time HH:MM 24-hour"),
  end: z.string().describe("Suggested end time HH:MM 24-hour"),
  why: z.string().describe("One short line in English: why this fits the group"),
  why_zh: z.string().describe("The same line in Traditional Chinese"),
  cost: z.number().describe("Rough total cost for the whole group in the trip currency; 0 if free"),
});
export type PlanItemT = z.infer<typeof PlanItem>;

export type PlanInput = { destination: string; start: string; end: string; adults: number; kids: number; interests: string[]; style: "relaxed" | "balanced" | "busy"; areas: string; hotel: string; wishes: string };
export const Input = z.object({ destination: z.string().trim().min(2).max(80), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), adults: z.number().int().min(1).max(20), kids: z.number().int().min(0).max(20), interests: z.array(z.string().max(20)).max(12), style: z.enum(["relaxed", "balanced", "busy"]), areas: z.string().max(200), hotel: z.string().max(120), wishes: z.string().max(400) });

export const PACE = { relaxed: "about 3 stops a day, unhurried, long meals", balanced: "4 to 5 stops a day", busy: "about 6 stops a day, packed" };
export const SYSTEM = "You are a careful family trip planner. Suggest only real, currently operating places that a map search can find. Group each day by neighbourhood so travel is short, put meals at sensible times, and respect the group's wishes and pace. Prefer well-known, reliable places over obscure ones. Costs are rough estimates for the whole group.";

export function nights(start: string, end: string) { return Math.round((Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86400000); }

export const Outline = z.object({
  name: z.string().describe("Friendly trip name in English, e.g. 'Tokyo Family Trip'"),
  currency: z.string().describe("ISO 4217 currency used at the destination, e.g. JPY"),
  areas: z.array(z.string()).describe("The main neighbourhoods the trip will use, in English, 2 to 6 of them"),
  days: z.array(z.object({
    day: z.number().int(),
    theme: z.string().describe("Short day theme in English, e.g. 'Asakusa & Ueno'"),
    theme_zh: z.string().describe("Same theme in Traditional Chinese"),
    area: z.string().describe("The neighbourhood or two this day is based in, so travel stays short"),
  })),
});
export type OutlineT = z.infer<typeof Outline>;

/** The shared description of the group, used by the outline and by each day. */
export function brief(d: PlanInput, n: number) {
  return `Trip to ${d.destination} from ${d.start} to ${d.end} (${n + 1} days, ${n} nights).
Group: ${d.adults} adult(s)${d.kids ? `, ${d.kids} child(ren)` : ""}.
They love: ${d.interests.join(", ") || "a bit of everything"}.
Pace: ${PACE[d.style]}.
Preferred areas: ${d.areas || "no preference"}.
Staying at: ${d.hotel || "not decided"}.
Other wishes: ${d.wishes || "none"}.`;
}
