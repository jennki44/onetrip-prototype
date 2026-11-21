"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { dayCount, dayDate, dayLabel, isoDate, placeName } from "@/lib/trip/derive";
import { toMinor } from "@/lib/money";
import { aiJson, takeAi } from "@/lib/ai/client";
import { AI_KINDS, kindInfo, type AiKind } from "@/lib/ai/kinds";
import { placeProvider } from "@/lib/places";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

/** What the AI reads out of "6號下午3點 Blue Bottle 清澄白河". Every field is a best guess the traveller can edit. */
const QuickRead = z.object({
  title: z.string().describe("Short activity name in English, e.g. 'Blue Bottle Coffee Kiyosumi'"),
  title_zh: z.string().describe("Same name in Traditional Chinese (Hong Kong usage)"),
  day: z.number().int().nullable().describe("Trip day number (1 = first day) from the date words; null if no date was said"),
  start: z.string().nullable().describe("Start time as HH:MM 24-hour; null if not said"),
  end: z.string().nullable().describe("End time as HH:MM 24-hour; null if not said"),
  search: z.string().describe("What to type into a map search to find this exact place, in English or the local language, including the neighbourhood"),
  kind: z.enum(AI_KINDS),
  note: z.string().describe("One short useful tip in English (opening hours, booking, what to order). Empty if nothing useful."),
  note_zh: z.string().describe("The same tip in Traditional Chinese (Hong Kong usage). Empty if note is empty."),
  cost: z.number().nullable().describe("Rough total cost for the whole group in the trip currency, or null if unknown"),
});

export type QuickDraft = {
  title: string; title_zh: string; day: number; start: string; end: string; note: string; note_zh: string; cost: string; kind: AiKind;
  placeId: string | null; place: { name: string; lat: number; lng: number; address: string | null; area: string | null } | null;
  days: { day: number; label: string }[];
};
export type QuickResult = { ok: true; draft: QuickDraft } | { ok: false; error: string };

/** Read a spoken or typed stop into an editable activity draft, with the place found on the map. */
export async function aiQuickRead(raw: { tripId: string; text: string; today: string }): Promise<QuickResult> {
  const p = z.object({ tripId: z.string().uuid(), text: z.string().trim().min(2).max(300), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).safeParse(raw);
  if (!p.success) return { ok: false, error: "empty" };
  const user = await currentUser(); if (!user) return { ok: false, error: "signin" };
  const [b, locale, sb] = await Promise.all([loadTrip(p.data.tripId), getLocale(), supabaseServer()]); if (!b) return { ok: false, error: "trip" };
  if (!(await takeAi(sb, "quick", p.data.tripId))) return { ok: false, error: "limit" };
  const total = dayCount(b.trip); const days = Array.from({ length: total }, (_, k) => ({ day: k + 1, label: dayLabel(b.trip, k + 1, locale) }));
  const calendar = days.map(d => `Day ${d.day} = ${isoDate(dayDate(b.trip, d.day))}`).join(", ");
  const system = "You help a family add one stop to their trip itinerary. Read the traveller's words (Cantonese, Mandarin or English, often informal) and fill in the fields. Only use what they said plus well-known facts about the place; never invent a place that does not exist. If they name a chain, pick the branch in the area they mention.";
  const prompt = `Trip: ${b.trip.name} in ${b.trip.destination}. Currency: ${b.trip.base_currency}.\nTrip calendar: ${calendar}.\nToday's date on the traveller's phone: ${p.data.today}.\nPlaces already in the trip: ${b.places.slice(0, 60).map(x => x.name).join("; ") || "none"}.\n\nTraveller said: """${p.data.text}"""`;
  const r = await aiJson(QuickRead, system, prompt, { effort: "low", maxTokens: 2000 });
  if (!r.ok) return { ok: false, error: r.error };
  const a = r.data;
  // Reuse a place already in the trip when the name matches; otherwise look it up on the map.
  const lc = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const existing = b.places.find(x => lc(x.name) && (lc(x.name) === lc(a.title) || lc(a.title).includes(lc(x.name)) || (x.name_zh && lc(x.name_zh) === lc(a.title_zh))));
  const found = existing ? null : await placeProvider().find(a.search || a.title, b.trip.destination, locale);
  const todayDay = Math.round((Date.parse(p.data.today + "T00:00:00Z") - Date.parse(b.trip.start_date + "T00:00:00Z")) / 86400000) + 1;
  const day = a.day && a.day >= 1 && a.day <= total ? a.day : todayDay >= 1 && todayDay <= total ? todayDay : 1;
  const ok = (t: string | null) => (t && hhmm.safeParse(t).success ? t : "");
  return { ok: true, draft: {
    title: locale.startsWith("zh") && a.title_zh ? a.title_zh : a.title, title_zh: a.title_zh, day, start: ok(a.start) || "12:00", end: ok(a.end), note: locale.startsWith("zh") && a.note_zh ? a.note_zh : a.note, note_zh: a.note_zh,
    cost: a.cost != null && a.cost > 0 ? String(Math.round(a.cost)) : "", kind: a.kind,
    placeId: existing?.id ?? null, place: existing ? (existing.lat != null && existing.lng != null ? { name: placeName(existing, locale), lat: existing.lat, lng: existing.lng, address: existing.address, area: existing.area } : null) : found, days,
  } };
}

/** Save the reviewed draft as a proposed activity (提議), pinning a new place when the map found one. */
export async function aiQuickSave(raw: { tripId: string; title: string; titleEn: string; titleZh: string; day: number; start: string; end: string; note: string; noteEn: string; noteZh: string; cost: string; kind: AiKind; placeId: string | null; place: QuickDraft["place"] }) {
  const p = z.object({ tripId: z.string().uuid(), title: z.string().trim().min(1).max(120), titleEn: z.string().max(120), titleZh: z.string().max(120), day: z.number().int().min(1).max(60), start: hhmm, end: z.union([hhmm, z.literal("")]), note: z.string().max(500), noteEn: z.string().max(500), noteZh: z.string().max(500), cost: z.string().max(20), kind: z.enum(AI_KINDS), placeId: z.string().uuid().nullable(), place: z.object({ name: z.string().max(120), lat: z.number().finite(), lng: z.number().finite(), address: z.string().max(160).nullable(), area: z.string().max(60).nullable() }).nullable() }).parse(raw);
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, locale, sb] = await Promise.all([loadTrip(p.tripId), getLocale(), supabaseServer()]); if (!b) throw new Error("Trip not found");
  const me = b.members.find(m => m.user_id === user.id); if (!me || !["owner", "admin", "traveller"].includes(me.role)) throw new Error("Only travellers can add activities");
  if (p.day > dayCount(b.trip)) throw new Error("That day is not in this trip");
  const info = kindInfo(p.kind); const zh = locale.startsWith("zh");
  // The traveller edited the text in their own language: keep the AI's other-language version only if they left it unchanged.
  const titleShown = zh ? p.titleZh : p.titleEn; const title = p.title === titleShown ? p.titleEn || p.title : p.title; const title_zh = p.title === titleShown ? p.titleZh || null : null;
  const noteShown = zh ? p.noteZh : p.noteEn; const note = p.note === noteShown ? p.noteEn || p.note || null : p.note || null; const note_zh = p.note === noteShown ? p.noteZh || null : null;
  let placeId = p.placeId && b.places.some(x => x.id === p.placeId) ? p.placeId : null;
  if (!placeId && p.place) {
    const { data: pl } = await sb.from("places").insert({ trip_id: p.tripId, name: title, name_zh: title_zh, type: info.placeType, area: p.place.area, address: p.place.address, lat: p.place.lat, lng: p.place.lng, emoji: info.emoji, saved: false, created_by: user.id }).select("id").single();
    placeId = (pl as { id: string } | null)?.id ?? null;
  }
  const cost = p.cost ? toMinor(Number(p.cost.replace(/[^\d.]/g, "")) || 0, b.trip.base_currency) : null;
  const { data: item, error } = await sb.from("itinerary_items").insert({ trip_id: p.tripId, day: p.day, start_time: p.start, end_time: p.end || null, title, title_zh, note, note_zh, place_id: placeId, emoji: info.emoji, category: info.category, status: "proposed", participant_ids: b.members.map(m => m.user_id), cost_minor: cost, created_by: user.id }).select("id").single();
  if (error || !item) throw new Error(error?.message || "Could not save");
  const id = (item as { id: string }).id;
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${title} to ${dayLabel(b.trip, p.day)} with the AI helper.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "✨", text: `${me.profile.name} suggested ${title} for ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id } });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { day: p.day, id };
}
