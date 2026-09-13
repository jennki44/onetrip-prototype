"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { dayLabel, fmtTime, place } from "@/lib/trip/derive";
import { toMinor } from "@/lib/money";
import { geocode } from "@/lib/geocode";

const PLACE_EMOJI: Record<string, string> = { restaurant: "🍽️", activity: "🎯", hotel: "🏨", shopping: "🛍️", transport: "🚗", saved: "📍" };

const time = z.string().regex(/^\d{2}:\d{2}$/);

export async function saveActivity(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid().optional(), title: z.string().trim().min(1).max(120), day: z.coerce.number().int().min(1).max(60), start: time, end: z.union([time, z.literal("")]).optional(), placeId: z.union([z.string().uuid(), z.literal(""), z.literal("__new")]), newPlaceName: z.string().trim().max(80).optional(), newPlaceType: z.enum(["restaurant", "activity", "hotel", "shopping", "transport", "saved"]).optional(), newPlaceAddress: z.string().trim().max(160).optional(), people: z.array(z.string().uuid()), cost: z.string().optional(), status: z.enum(["idea", "proposed", "voting", "confirmed", "cancelled", "completed"]), note: z.string().max(500).optional() })
    .parse({ tripId: form.get("tripId"), itemId: form.get("itemId") || undefined, title: form.get("title"), day: form.get("day"), start: form.get("start"), end: form.get("end") || "", placeId: form.get("placeId") || "", newPlaceName: form.get("newPlaceName") ?? undefined, newPlaceType: form.get("newPlaceType") ?? undefined, newPlaceAddress: form.get("newPlaceAddress") ?? undefined, people: form.getAll("people"), cost: form.get("cost") || "", status: form.get("status"), note: form.get("note") || "" });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  let pl = p.placeId && p.placeId !== "__new" ? place(b, p.placeId) : null;
  if (p.placeId === "__new" && p.newPlaceName) {
    const type = p.newPlaceType || "activity"; const address = p.newPlaceAddress || null;
    const geo = await geocode(`${address || p.newPlaceName}, ${b.trip.destination}`);
    const { data: created } = await sb.from("places").insert({ trip_id: p.tripId, name: p.newPlaceName, type, address, area: address ? address.split(",").slice(-1)[0].trim().slice(0, 60) : null, emoji: PLACE_EMOJI[type], lat: geo?.lat ?? null, lng: geo?.lng ?? null, saved: false, created_by: user.id }).select("*").single();
    if (created) pl = created as NonNullable<typeof pl>;
  }
  const cost = p.cost ? toMinor(Number(String(p.cost).replace(/[^\d.]/g, "")) || 0, b.trip.base_currency) : null;
  const row = { title: p.title, day: p.day, start_time: p.start, end_time: p.end || null, place_id: pl?.id || null, emoji: pl?.emoji || "📍", category: pl ? (pl.type === "restaurant" ? "food" : pl.type === "hotel" ? "stay" : pl.type) : "activity", status: p.status, participant_ids: p.people, cost_minor: cost, note: p.note || null, photo_url: pl?.photo_url || null, travel_min: pl?.from_hotel_min ? Math.max(5, Math.round(pl.from_hotel_min * 0.7)) : null };
  let id = p.itemId;
  if (id) { const old = b.items.find(i => i.id === id); await sb.from("itinerary_items").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id); await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: old && old.start_time.slice(0, 5) !== p.start ? `Changed ${p.title} from ${fmtTime(old.start_time.slice(0, 5))} to ${fmtTime(p.start)}.` : `Edited ${p.title}.` }); }
  else { const { data } = await sb.from("itinerary_items").insert({ ...row, trip_id: p.tripId, booking: "none", created_by: user.id }).select("id").single(); id = data?.id; await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${p.title} to ${dayLabel(b.trip, p.day)}.` }); await sb.from("notifications").insert({ trip_id: p.tripId, icon: "📍", text: `${b.members.find(m => m.user_id === user.id)?.profile.name || "Someone"} added ${p.title} to ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id } }); }
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/plan/${id}`);
}
