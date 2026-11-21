"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { dayCount, dayLabel, itemTitle, minutes, placeName } from "@/lib/trip/derive";
import { metresBetween, reverseGeocode } from "@/lib/geocode";

const uuid = z.string().uuid();
const coord = z.number().finite().nullable();

export type SnapSuggestion = {
  places: { id: string; label: string; emoji: string; metres: number }[];
  spot: { name: string | null; area: string | null } | null;
  match: { id: string; title: string; start: string } | null;
  /** Trip day for the phone's date (null when the trip isn't on today), and every day for the picker. */
  day: number | null; days: { day: number; label: string }[];
};

/** What the snap screen offers after a photo: saved trip places close by, the map's name for the spot, and a planned activity happening now. */
export async function snapSuggest(raw: { tripId: string; lat: number | null; lng: number | null; date: string; time: string; day?: number | null }): Promise<SnapSuggestion> {
  const p = z.object({ tripId: uuid, lat: coord, lng: coord, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), day: z.number().int().min(1).max(60).nullish() }).parse(raw);
  const [b, locale] = await Promise.all([loadTrip(p.tripId), getLocale()]); if (!b) return { places: [], spot: null, match: null, day: null, days: [] };
  const total = dayCount(b.trip); const days = Array.from({ length: total }, (_, k) => ({ day: k + 1, label: dayLabel(b.trip, k + 1, locale) }));
  const fromDate = Math.round((Date.parse(p.date + "T00:00:00Z") - Date.parse(b.trip.start_date + "T00:00:00Z")) / 86400000) + 1;
  const today = fromDate >= 1 && fromDate <= total ? fromDate : null; const day = p.day ?? today;
  const here = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;
  const near = here ? b.places.filter(pl => pl.lat != null && pl.lng != null).map(pl => ({ pl, metres: Math.round(metresBetween(here, { lat: pl.lat!, lng: pl.lng! })) })).filter(x => x.metres <= 300).sort((x, y) => x.metres - y.metres).slice(0, 3) : [];
  // A planned activity on this day: close in time, and (when both have a position) close in distance.
  const nowMin = minutes(p.time); let match: SnapSuggestion["match"] = null; let best = Infinity;
  for (const it of b.items.filter(i => i.day === day && i.status !== "cancelled")) {
    const s = minutes(it.start_time), e = it.end_time ? minutes(it.end_time) : s + 60;
    const off = nowMin < s ? s - nowMin : nowMin > e ? nowMin - e : 0;
    const pl = it.place_id ? b.places.find(x => x.id === it.place_id) : null;
    const d = here && pl?.lat != null && pl?.lng != null ? metresBetween(here, { lat: pl.lat, lng: pl.lng }) : null;
    const ok = d != null ? d <= 400 && off <= 180 : off <= 45;
    const score = off + (d ?? 200) / 10;
    if (ok && score < best) { best = score; match = { id: it.id, title: itemTitle(it, locale), start: it.start_time.slice(0, 5) }; }
  }
  const spot = here ? await reverseGeocode(here.lat, here.lng, locale) : null;
  return { places: near.map(({ pl, metres }) => ({ id: pl.id, label: placeName(pl, locale), emoji: pl.emoji, metres })), spot, match, day: today, days };
}

/** Save a snapped photo: either as a new activity at this time and place, or into a planned activity's album. */
export async function snapSave(raw: { tripId: string; itemId: string; join: boolean; title: string; day: number; time: string; lat: number | null; lng: number | null; area: string | null; placeId: string | null; fileName: string; storagePath: string; sizeBytes: number }) {
  const p = z.object({ tripId: uuid, itemId: uuid, join: z.boolean(), title: z.string().trim().max(120), day: z.number().int().min(1).max(60), time: z.string().regex(/^\d{2}:\d{2}$/), lat: coord, lng: coord, area: z.string().trim().max(60).nullable(), placeId: uuid.nullable(), fileName: z.string().trim().min(1).max(200), storagePath: z.string().max(400), sizeBytes: z.number().int().nonnegative() }).parse(raw);
  if (!p.storagePath.startsWith(`${p.tripId}/items/${p.itemId}/`)) throw new Error("Bad storage path");
  const user = await currentUser(); if (!user) redirect("/signin");
  const sb = await supabaseServer(); const b = await loadTrip(p.tripId); if (!b) throw new Error("Trip not found");
  if (p.day > dayCount(b.trip)) throw new Error("That day is not in this trip");
  const me = b.members.find(m => m.user_id === user.id); if (!me || !["owner", "admin", "traveller"].includes(me.role)) throw new Error("Only travellers can add activities");
  let title = p.title;
  if (p.join) {
    const it = b.items.find(i => i.id === p.itemId); if (!it) throw new Error("That activity is not in this trip");
    title = it.title;
  } else {
    if (!title) throw new Error("Give it a name");
    // Reuse a saved place the traveller picked, else pin this spot as a new place so Map and Navigate work later.
    let placeId = p.placeId && b.places.some(x => x.id === p.placeId) ? p.placeId : null; let emoji = "📷";
    if (placeId) emoji = b.places.find(x => x.id === placeId)!.emoji;
    else if (p.lat != null && p.lng != null) {
      const { data: pl } = await sb.from("places").insert({ trip_id: p.tripId, name: title, type: "activity", area: p.area, lat: Math.round(p.lat * 1e5) / 1e5, lng: Math.round(p.lng * 1e5) / 1e5, emoji: "📷", saved: false, created_by: user.id }).select("id").single();
      placeId = (pl as { id: string } | null)?.id || null;
    }
    const { error } = await sb.from("itinerary_items").insert({ id: p.itemId, trip_id: p.tripId, day: p.day, start_time: p.time, title, place_id: placeId, emoji, category: "activity", status: "completed", participant_ids: b.members.map(m => m.user_id), created_by: user.id });
    if (error) throw new Error(error.message);
    await sb.from("notifications").insert({ trip_id: p.tripId, icon: "📷", text: `${me.profile.name} added ${title} to ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id: p.itemId } });
  }
  const { error: docErr } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName, category: "Photos", storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: "item", linked_id: p.itemId, added_by: user.id });
  if (docErr) throw new Error(docErr.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: p.join ? `Added a photo to ${title}.` : `Snapped ${title} on ${dayLabel(b.trip, p.day)}.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { day: p.day };
}
