"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { dayCount, dayDate, dayLabel, isoDate, itemTitle, minutes, placeName } from "@/lib/trip/derive";
import { toMinor } from "@/lib/money";
import { aiJson, takeAi } from "@/lib/ai/client";
import { AI_KINDS, kindInfo, type AiKind } from "@/lib/ai/kinds";
import { placeProvider } from "@/lib/places";
import { metresBetween, reverseGeocode } from "@/lib/geocode";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

/** What the AI reads from a photo and/or a few words ("6號下午3點 Blue Bottle 清澄白河"). Every field is a best guess the traveller can edit. */
const QuickRead = z.object({
  title: z.string().describe("Short name of the place or activity in English, e.g. 'Ichiran Ramen Shibuya'"),
  title_zh: z.string().describe("Same name in Traditional Chinese (Hong Kong usage)"),
  day: z.number().int().nullable().describe("Trip day number (1 = first day) if the words name a date; null otherwise"),
  start: z.string().nullable().describe("Start time HH:MM 24-hour if the words name a time; null otherwise"),
  end: z.string().nullable().describe("End time HH:MM 24-hour if said; null otherwise"),
  search: z.string().describe("Text to type into a map search to find this exact place, with neighbourhood and city"),
  nearbyIndex: z.number().int().nullable().describe("If the stop is one of the numbered 'trip places nearby', its number; otherwise null"),
  kind: z.enum(AI_KINDS),
  note: z.string().describe("One short useful line in English: what the photo shows or a tip (opening hours, what to order). Include anything personal the traveller said. Empty if nothing useful."),
  note_zh: z.string().describe("The same line in Traditional Chinese (Hong Kong usage). Empty if note is empty."),
  cost: z.number().nullable().describe("Rough total cost for the whole group in the trip currency, or null if unknown"),
});

type FoundPin = { name: string; lat: number; lng: number; address: string | null; area: string | null };
export type QuickDraft = {
  title: string; title_zh: string; day: number; start: string; end: string; note: string; note_zh: string; cost: string; kind: AiKind;
  placeId: string | null; place: FoundPin | null; status: "completed" | "proposed";
  match: { id: string; title: string; start: string } | null;
  days: { day: number; label: string }[]; today: number | null;
};
export type QuickResult = { ok: true; draft: QuickDraft } | { ok: false; error: string };

const Read = z.object({
  tripId: z.string().uuid(), text: z.string().trim().max(300), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), now: hhmm,
  lat: z.number().finite().nullable(), lng: z.number().finite().nullable(),
  image: z.object({ data: z.string().max(1_400_000), mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]) }).nullable(),
});

/** Turn a photo and/or a few words, plus where and when, into one editable activity card. */
export async function aiQuickRead(raw: z.input<typeof Read>): Promise<QuickResult> {
  const p = Read.safeParse(raw); if (!p.success) return { ok: false, error: "input" };
  const { text, image, lat, lng } = p.data; if (!image && text.length < 2) return { ok: false, error: "empty" };
  const user = await currentUser(); if (!user) return { ok: false, error: "signin" };
  const [b, locale, sb] = await Promise.all([loadTrip(p.data.tripId), getLocale(), supabaseServer()]); if (!b) return { ok: false, error: "trip" };
  if (!(await takeAi(sb, "quick", p.data.tripId))) return { ok: false, error: "limit" };
  const total = dayCount(b.trip); const days = Array.from({ length: total }, (_, k) => ({ day: k + 1, label: dayLabel(b.trip, k + 1, locale) }));
  const fromToday = Math.round((Date.parse(p.data.today + "T00:00:00Z") - Date.parse(b.trip.start_date + "T00:00:00Z")) / 86400000) + 1;
  const today = fromToday >= 1 && fromToday <= total ? fromToday : null;
  const here = lat != null && lng != null ? { lat, lng } : null;

  // What the map knows about this spot, and the trip's own saved places close by.
  const nearby = here ? b.places.filter(x => x.lat != null && x.lng != null).map(x => ({ x, m: Math.round(metresBetween(here, { lat: x.lat!, lng: x.lng! })) })).filter(n => n.m <= 300).sort((a, c) => a.m - c.m).slice(0, 5) : [];
  const spot = here ? await reverseGeocode(here.lat, here.lng, locale) : null;

  const calendar = days.map(d => `Day ${d.day} = ${isoDate(dayDate(b.trip, d.day))}`).join(", ");
  const system = "You help a family record stops on their trip. You may get a photo taken on the spot, a few words (Cantonese, Mandarin or English, often informal), the phone's location and the time. Work out the most likely real place or activity. Read signs, shop names, landmarks, menus and tickets in the photo. Never invent a place that does not exist; if unsure, describe it plainly (e.g. 'Ramen lunch in Shibuya').";
  const prompt = [
    `Trip: ${b.trip.name} in ${b.trip.destination}. Currency: ${b.trip.base_currency}.`,
    `Trip calendar: ${calendar}.`,
    `Phone date and time now: ${p.data.today} ${p.data.now}${today ? ` (trip day ${today})` : " (not a trip day)"}.`,
    here ? `Phone location: ${here.lat.toFixed(5)}, ${here.lng.toFixed(5)}${spot ? ` — the map says: ${[spot.name, spot.area].filter(Boolean).join(", ")}` : ""}.` : "Phone location: unknown.",
    nearby.length ? `Trip places nearby:\n${nearby.map((n, i) => `${i + 1}. ${n.x.name} (${n.m} m)`).join("\n")}` : "Trip places nearby: none.",
    text ? `Traveller said: """${text}"""` : "The traveller said nothing; use the photo.",
    image ? "A photo taken just now is attached." : "",
  ].filter(Boolean).join("\n");
  const r = await aiJson(QuickRead, system, prompt, { effort: "low", maxTokens: 2000, image: image ?? undefined });
  if (!r.ok) return { ok: false, error: r.error };
  const a = r.data;

  // Place: a nearby trip place the AI picked, a name match, the phone's own position, or a map search.
  const lc = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const picked = a.nearbyIndex && nearby[a.nearbyIndex - 1] ? nearby[a.nearbyIndex - 1].x : null;
  // Same place in other words: every real word of a saved place's name appears in the AI's name ("Echo Point — Three Sisters" ≈ "Three Sisters at Echo Point Lookout").
  const words = (t: string) => t.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3);
  const sameWords = (place: string, title: string) => { const pw = words(place), tw = new Set(words(title)); return pw.length >= 2 && pw.every(w => tw.has(w)); };
  const named = picked ?? b.places.find(x => lc(x.name) && (lc(x.name) === lc(a.title) || sameWords(x.name, a.title) || (x.name_zh && lc(x.name_zh) === lc(a.title_zh)))) ?? null;
  let place: FoundPin | null = null;
  if (named) place = named.lat != null && named.lng != null ? { name: placeName(named, locale), lat: named.lat, lng: named.lng, address: named.address, area: named.area } : null;
  else if (here && !a.day) place = { name: a.title, lat: Math.round(here.lat * 1e5) / 1e5, lng: Math.round(here.lng * 1e5) / 1e5, address: spot?.name && spot?.area ? `${spot.name}, ${spot.area}` : spot?.area ?? null, area: spot?.area ?? null };
  else place = await placeProvider().find(a.search || a.title, b.trip.destination, locale);

  const ok = (t: string | null) => (t && hhmm.safeParse(t).success ? t : "");
  const day = a.day && a.day >= 1 && a.day <= total ? a.day : today ?? 1;
  const start = ok(a.start) || (day === today ? p.data.now : "12:00");
  // Happening now (today, within an hour of the phone's clock) → done; anything later → a proposal for the family.
  const status: QuickDraft["status"] = day === today && Math.abs(minutes(start) - minutes(p.data.now)) <= 60 ? "completed" : "proposed";

  // A planned stop on that day, close in time and (when both have a position) close in distance.
  let match: QuickDraft["match"] = null; let best = Infinity;
  for (const it of b.items.filter(i => i.day === day && i.status !== "cancelled")) {
    const s = minutes(it.start_time), e = it.end_time ? minutes(it.end_time) : s + 60; const at = minutes(start);
    const off = at < s ? s - at : at > e ? at - e : 0;
    const pl = it.place_id ? b.places.find(x => x.id === it.place_id) : null;
    const d = place && pl?.lat != null && pl?.lng != null ? metresBetween(place, { lat: pl.lat, lng: pl.lng }) : null;
    const same = named && it.place_id === named.id;
    const okMatch = same ? off <= 240 : d != null ? d <= 400 && off <= 180 : off <= 45 && lc(itemTitle(it, "en")) === lc(a.title);
    const score = off + (same ? 0 : (d ?? 300) / 10);
    if (okMatch && score < best) { best = score; match = { id: it.id, title: itemTitle(it, locale), start: it.start_time.slice(0, 5) }; }
  }

  return { ok: true, draft: {
    title: locale.startsWith("zh") && a.title_zh ? a.title_zh : a.title, title_zh: a.title_zh, day, start, end: ok(a.end),
    note: locale.startsWith("zh") && a.note_zh ? a.note_zh : a.note, note_zh: a.note_zh,
    cost: a.cost != null && a.cost > 0 ? String(Math.round(a.cost)) : "", kind: a.kind,
    placeId: named?.id ?? null, place, status, match, days, today,
  } };
}

const Save = z.object({
  tripId: z.string().uuid(), itemId: z.string().uuid(), join: z.boolean(),
  title: z.string().trim().max(120), titleEn: z.string().max(120), titleZh: z.string().max(120),
  day: z.number().int().min(1).max(60), start: hhmm, end: z.union([hhmm, z.literal("")]),
  note: z.string().max(500), noteEn: z.string().max(500), noteZh: z.string().max(500), cost: z.string().max(20),
  kind: z.enum(AI_KINDS), status: z.enum(["completed", "proposed"]), placeId: z.string().uuid().nullable(),
  place: z.object({ name: z.string().max(120), lat: z.number().finite(), lng: z.number().finite(), address: z.string().max(160).nullable(), area: z.string().max(60).nullable() }).nullable(),
  photo: z.object({ fileName: z.string().trim().min(1).max(200), storagePath: z.string().max(400), sizeBytes: z.number().int().nonnegative() }).nullable(),
});

/** Save the reviewed card: a new activity (photo in its album), or just the photo into the planned activity it matched. */
export async function aiQuickSave(raw: z.input<typeof Save>) {
  const p = Save.parse(raw);
  if (p.photo && !p.photo.storagePath.startsWith(`${p.tripId}/items/${p.itemId}/`)) throw new Error("Bad storage path");
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, locale, sb] = await Promise.all([loadTrip(p.tripId), getLocale(), supabaseServer()]); if (!b) throw new Error("Trip not found");
  const me = b.members.find(m => m.user_id === user.id); if (!me || !["owner", "admin", "traveller"].includes(me.role)) throw new Error("Only travellers can add activities");
  if (p.day > dayCount(b.trip)) throw new Error("That day is not in this trip");
  let title = p.title; const id = p.itemId;
  if (p.join) {
    const it = b.items.find(i => i.id === id); if (!it) throw new Error("That activity is not in this trip");
    title = it.title;
    if (p.status === "completed" && it.status !== "completed") await sb.from("itinerary_items").update({ status: "completed" }).eq("id", id).eq("trip_id", p.tripId);
  } else {
    if (!title) throw new Error("Give it a name");
    const info = kindInfo(p.kind); const zh = locale.startsWith("zh");
    // The traveller edited the text in their own language: keep the AI's other-language version only if they left it unchanged.
    const titleShown = zh ? p.titleZh : p.titleEn; const same = p.title === titleShown;
    title = same ? p.titleEn || p.title : p.title; const title_zh = same ? p.titleZh || null : null;
    const noteShown = zh ? p.noteZh : p.noteEn; const noteSame = p.note === noteShown;
    const note = noteSame ? p.noteEn || p.note || null : p.note || null; const note_zh = noteSame ? p.noteZh || null : null;
    let placeId = p.placeId && b.places.some(x => x.id === p.placeId) ? p.placeId : null;
    if (!placeId && p.place) {
      const { data: pl } = await sb.from("places").insert({ trip_id: p.tripId, name: title, name_zh: title_zh, type: info.placeType, area: p.place.area, address: p.place.address, lat: p.place.lat, lng: p.place.lng, emoji: info.emoji, saved: false, created_by: user.id }).select("id").single();
      placeId = (pl as { id: string } | null)?.id ?? null;
    }
    const cost = p.cost ? toMinor(Number(p.cost.replace(/[^\d.]/g, "")) || 0, b.trip.base_currency) : null;
    const { error } = await sb.from("itinerary_items").insert({ id, trip_id: p.tripId, day: p.day, start_time: p.start, end_time: p.end || null, title, title_zh, note, note_zh, place_id: placeId, emoji: info.emoji, category: info.category, status: p.status, participant_ids: b.members.map(m => m.user_id), cost_minor: cost, created_by: user.id });
    if (error) throw new Error(error.message);
    await sb.from("notifications").insert({ trip_id: p.tripId, icon: p.photo ? "📷" : "✨", text: `${me.profile.name} ${p.status === "completed" ? "added" : "suggested"} ${title} for ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id } });
  }
  if (p.photo) {
    const { error } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.photo.fileName, category: "Photos", storage_path: p.photo.storagePath, size_bytes: p.photo.sizeBytes, linked_type: "item", linked_id: id, added_by: user.id });
    if (error) throw new Error(error.message);
  }
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: p.join ? `Added a photo to ${title}.` : `Added ${title} to ${dayLabel(b.trip, p.day)} with the AI helper.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { day: p.day, id };
}
