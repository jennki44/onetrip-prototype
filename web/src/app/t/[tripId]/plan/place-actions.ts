"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { searchPlaces, type FoundPlace } from "@/lib/places";

/** 📍 收藏地點: search the map near the trip's destination. */
export async function findPlaces(raw: { tripId: string; q: string }): Promise<FoundPlace[]> {
  const p = z.object({ tripId: z.string().uuid(), q: z.string().trim().min(2).max(120) }).safeParse(raw); if (!p.success) return [];
  if (!(await currentUser())) return [];
  const [b, locale] = await Promise.all([loadTrip(p.data.tripId), getLocale()]); if (!b) return [];
  return searchPlaces(p.data.q, b.trip.destination, locale);
}

/** Save a place for later (⭐ on the map, no time). Without a map match it is saved by name only. */
export async function savePlace(raw: { tripId: string; name: string; place: FoundPlace | null }) {
  const p = z.object({ tripId: z.string().uuid(), name: z.string().trim().min(1).max(120), place: z.object({ name: z.string().max(120), lat: z.number().finite(), lng: z.number().finite(), address: z.string().max(160).nullable(), area: z.string().max(60).nullable() }).nullable() }).parse(raw);
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, sb] = await Promise.all([loadTrip(p.tripId), supabaseServer()]); if (!b) throw new Error("Trip not found");
  if (!["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user.id)?.role || "")) throw new Error("Only travellers can save places");
  const dup = p.place && b.places.find(x => x.lat != null && x.lng != null && Math.abs(x.lat - p.place!.lat) < 0.0003 && Math.abs(x.lng - p.place!.lng) < 0.0003);
  if (dup) { if (!dup.saved) await sb.from("places").update({ saved: true }).eq("id", dup.id); revalidatePath(`/t/${p.tripId}`, "layout"); return { id: dup.id, existed: true }; }
  const { data, error } = await sb.from("places").insert({ trip_id: p.tripId, name: p.name, type: "saved", area: p.place?.area ?? null, address: p.place?.address ?? null, lat: p.place?.lat ?? null, lng: p.place?.lng ?? null, emoji: "⭐", saved: true, created_by: user.id }).select("id").single();
  if (error || !data) throw new Error(error?.message || "Could not save");
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Saved ${p.name} to the map.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { id: (data as { id: string }).id, existed: false };
}
