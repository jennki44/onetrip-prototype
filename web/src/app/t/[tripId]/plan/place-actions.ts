"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { dayCount, dayLabel } from "@/lib/trip/derive";
import { searchPlaces, type FoundPlace } from "@/lib/places";
import { geocode, metresBetween } from "@/lib/geocode";

export type PlaceHit = FoundPlace & { km: number | null };
const Found = z.object({ name: z.string().max(120), lat: z.number().finite(), lng: z.number().finite(), address: z.string().max(160).nullable(), area: z.string().max(60).nullable(), country: z.string().max(60).nullable().optional() });

async function editor(tripId: string) {
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, sb] = await Promise.all([loadTrip(tripId), supabaseServer()]); if (!b) throw new Error("Trip not found");
  const me = b.members.find(m => m.user_id === user.id); if (!me || !["owner", "admin", "traveller"].includes(me.role)) throw new Error("Only travellers can change saved places");
  return { user, me, b, sb };
}

/** 📍 search: near the trip city first, then anywhere; each hit says how far it is from the trip (to spot wrong matches). */
export async function findPlaces(raw: { tripId: string; q: string }): Promise<PlaceHit[]> {
  const p = z.object({ tripId: z.string().uuid(), q: z.string().trim().min(2).max(120) }).safeParse(raw); if (!p.success) return [];
  if (!(await currentUser())) return [];
  const [b, locale] = await Promise.all([loadTrip(p.data.tripId), getLocale()]); if (!b) return [];
  const pins = b.places.filter(x => x.lat != null && x.lng != null);
  const centre = pins.length ? { lat: pins.reduce((a, x) => a + x.lat!, 0) / pins.length, lng: pins.reduce((a, x) => a + x.lng!, 0) / pins.length } : await geocode(b.trip.destination);
  const hits = await searchPlaces(p.data.q, b.trip.destination, locale);
  return hits.map(h => ({ ...h, km: centre ? Math.round(metresBetween(centre, h) / 1000) : null }));
}

/** Save a place for later (⭐ on the map, no time). Without a map match it is saved by name only and can get a location later. */
export async function savePlace(raw: { tripId: string; name: string; place: FoundPlace | null }) {
  const p = z.object({ tripId: z.string().uuid(), name: z.string().trim().min(1).max(120), place: Found.nullable() }).parse(raw);
  const { user, b, sb } = await editor(p.tripId);
  const dup = p.place && b.places.find(x => x.lat != null && x.lng != null && Math.abs(x.lat - p.place!.lat) < 0.0003 && Math.abs(x.lng - p.place!.lng) < 0.0003);
  if (dup) { if (!dup.saved) await sb.from("places").update({ saved: true }).eq("id", dup.id); revalidatePath(`/t/${p.tripId}`, "layout"); return { id: dup.id, existed: true }; }
  const { data, error } = await sb.from("places").insert({ trip_id: p.tripId, name: p.name, type: "saved", area: p.place?.area ?? null, address: p.place?.address ?? null, lat: p.place?.lat ?? null, lng: p.place?.lng ?? null, emoji: "⭐", saved: true, created_by: user.id }).select("id").single();
  if (error || !data) throw new Error(error?.message || "Could not save");
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Saved ${p.name} to the map.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { id: (data as { id: string }).id, existed: false };
}

/** 編輯: rename a saved place and/or give it a (new) location from a search result. */
export async function updatePlace(raw: { tripId: string; placeId: string; name?: string; place?: FoundPlace | null }) {
  const p = z.object({ tripId: z.string().uuid(), placeId: z.string().uuid(), name: z.string().trim().min(1).max(120).optional(), place: Found.nullable().optional() }).parse(raw);
  const { user, b, sb } = await editor(p.tripId); const pl = b.places.find(x => x.id === p.placeId); if (!pl) throw new Error("That place is gone");
  const patch: Record<string, unknown> = {};
  if (p.name !== undefined) { patch.name = p.name; patch.name_zh = null; }
  if (p.place) Object.assign(patch, { lat: p.place.lat, lng: p.place.lng, address: p.place.address, area: p.place.area });
  if (!Object.keys(patch).length) return;
  const { error } = await sb.from("places").update(patch).eq("id", p.placeId).eq("trip_id", p.tripId); if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Updated the saved place ${p.name ?? pl.name}.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

/** 刪除: remove from the saved list. A place already used by an activity keeps existing (just un-starred) so the plan isn't affected. */
export async function removeSavedPlace(raw: { tripId: string; placeId: string }) {
  const p = z.object({ tripId: z.string().uuid(), placeId: z.string().uuid() }).parse(raw);
  const { user, b, sb } = await editor(p.tripId); const pl = b.places.find(x => x.id === p.placeId); if (!pl) return { removed: false };
  const used = b.items.some(i => i.place_id === p.placeId);
  const { error } = used ? await sb.from("places").update({ saved: false }).eq("id", p.placeId).eq("trip_id", p.tripId) : await sb.from("places").delete().eq("id", p.placeId).eq("trip_id", p.tripId);
  if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Removed ${pl.name} from saved places.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { removed: true, keptForPlan: used };
}

/** 加入行程: turn a saved place into a proposed activity on a day and time (the family can confirm or vote). */
export async function scheduleSavedPlace(raw: { tripId: string; placeId: string; day: number; start: string }) {
  const p = z.object({ tripId: z.string().uuid(), placeId: z.string().uuid(), day: z.number().int().min(1).max(60), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).parse(raw);
  const { user, me, b, sb } = await editor(p.tripId); const pl = b.places.find(x => x.id === p.placeId); if (!pl) throw new Error("That place is gone");
  if (p.day > dayCount(b.trip)) throw new Error("That day is not in this trip");
  const cat = pl.type === "restaurant" ? "food" : pl.type === "hotel" ? "stay" : pl.type === "shopping" ? "shopping" : pl.type === "transport" ? "transport" : "activity";
  const { data, error } = await sb.from("itinerary_items").insert({ trip_id: p.tripId, day: p.day, start_time: p.start, title: pl.name, title_zh: pl.name_zh, place_id: pl.id, emoji: pl.emoji === "⭐" ? "📍" : pl.emoji, category: cat, status: "proposed", participant_ids: b.members.map(m => m.user_id), created_by: user.id }).select("id").single();
  if (error || !data) throw new Error(error?.message || "Could not add");
  const id = (data as { id: string }).id;
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${pl.name} to ${dayLabel(b.trip, p.day)} from saved places.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "⭐", text: `${me.profile.name} suggested ${pl.name} for ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id } });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { id, day: p.day };
}
