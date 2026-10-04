"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { dayLabel, fmtTime, place } from "@/lib/trip/derive";
import { toMinor } from "@/lib/money";
import { geocodeAny } from "@/lib/geocode";

const PLACE_EMOJI: Record<string, string> = { restaurant: "🍽️", activity: "🎯", hotel: "🏨", shopping: "🛍️", transport: "🚗", saved: "📍" };

const time = z.string().regex(/^\d{2}:\d{2}$/);

export async function saveActivity(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid().optional(), title: z.string().trim().min(1).max(120), day: z.coerce.number().int().min(1).max(60), start: time, end: z.union([time, z.literal("")]).optional(), placeId: z.union([z.string().uuid(), z.literal(""), z.literal("__new")]), newPlaceName: z.string().trim().max(80).optional(), newPlaceType: z.enum(["restaurant", "activity", "hotel", "shopping", "transport", "saved"]).optional(), newPlaceAddress: z.string().trim().max(160).optional(), address: z.string().trim().max(160).optional(), booking: z.enum(["none", "needed"]).optional(), people: z.array(z.string().uuid()), cost: z.string().optional(), status: z.enum(["idea", "proposed", "voting", "confirmed", "cancelled", "completed"]), note: z.string().max(500).optional() })
    .parse({ tripId: form.get("tripId"), itemId: form.get("itemId") || undefined, title: form.get("title"), day: form.get("day"), start: form.get("start"), end: form.get("end") || "", placeId: form.get("placeId") || "", newPlaceName: form.get("newPlaceName") ?? undefined, newPlaceType: form.get("newPlaceType") ?? undefined, newPlaceAddress: form.get("newPlaceAddress") ?? undefined, address: form.get("address") ?? undefined, booking: form.get("booking") ?? undefined, people: form.getAll("people"), cost: form.get("cost") || "", status: form.get("status"), note: form.get("note") || "" });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  let pl = p.placeId && p.placeId !== "__new" ? place(b, p.placeId) : null;
  if (p.placeId === "__new" && p.newPlaceName) {
    const type = p.newPlaceType || "activity"; const address = p.newPlaceAddress || null;
    const geo = await geocodeAny(address || p.newPlaceName, b.trip.destination);
    const { data: created } = await sb.from("places").insert({ trip_id: p.tripId, name: p.newPlaceName, type, address, area: address ? address.split(",").slice(-1)[0].trim().slice(0, 60) : null, emoji: PLACE_EMOJI[type], lat: geo?.lat ?? null, lng: geo?.lng ?? null, saved: false, created_by: user.id }).select("*").single();
    if (created) pl = created as NonNullable<typeof pl>;
  }
  // Address typed on the form: for a saved place it updates that place (and its map pin); with no place it is kept on the activity itself.
  let itemAddress: string | null = null;
  if (p.address !== undefined && p.placeId !== "__new") {
    if (pl && (p.address || "") !== (pl.address || "")) {
      // A changed address moves the pin; if it cannot be found the old pin is dropped so Navigate falls back to the typed address.
      const geo = p.address ? await geocodeAny(p.address, b.trip.destination) : null;
      const patch = p.address ? { address: p.address, lat: geo?.lat ?? null, lng: geo?.lng ?? null } : { address: null };
      await sb.from("places").update(patch).eq("id", pl.id); pl = { ...pl, ...patch };
    } else if (!pl) itemAddress = p.address || null;
  }
  const cost = p.cost ? toMinor(Number(String(p.cost).replace(/[^\d.]/g, "")) || 0, b.trip.base_currency) : null;
  const row = { title: p.title, day: p.day, start_time: p.start, end_time: p.end || null, place_id: pl?.id || null, emoji: pl?.emoji || "📍", category: pl ? (pl.type === "restaurant" ? "food" : pl.type === "hotel" ? "stay" : pl.type) : "activity", status: p.status, participant_ids: p.people, cost_minor: cost, address: itemAddress, note: p.note || null, photo_url: (p.itemId && b.items.find(x => x.id === p.itemId)?.photo_url?.startsWith("doc:") ? b.items.find(x => x.id === p.itemId)!.photo_url : pl?.photo_url) || null, travel_min: pl?.from_hotel_min ? Math.max(5, Math.round(pl.from_hotel_min * 0.7)) : null };
  let id = p.itemId;
  if (id) { const old = b.items.find(i => i.id === id); await sb.from("itinerary_items").update({ ...row, ...(p.booking && old?.booking !== "booked" ? { booking: p.booking } : {}), updated_at: new Date().toISOString() }).eq("id", id); await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: old && old.start_time.slice(0, 5) !== p.start ? `Changed ${p.title} from ${fmtTime(old.start_time.slice(0, 5))} to ${fmtTime(p.start)}.` : `Edited ${p.title}.` }); }
  else { const { data } = await sb.from("itinerary_items").insert({ ...row, trip_id: p.tripId, booking: p.booking || "none", created_by: user.id }).select("id").single(); id = data?.id; await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${p.title} to ${dayLabel(b.trip, p.day)}.` }); await sb.from("notifications").insert({ trip_id: p.tripId, icon: "📍", text: `${b.members.find(m => m.user_id === user.id)?.profile.name || "Someone"} added ${p.title} to ${dayLabel(b.trip, p.day)}.`, link: { screen: "item", id } }); }
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/plan/${id}`);
}

/** Record a photo uploaded to the private documents bucket as part of an activity's album. */
export async function addItemPhoto(raw: { tripId: string; itemId: string; fileName: string; storagePath: string; sizeBytes: number }) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid(), fileName: z.string().trim().min(1).max(200), storagePath: z.string().max(400), sizeBytes: z.number().int().nonnegative() }).parse(raw);
  if (!p.storagePath.startsWith(`${p.tripId}/items/${p.itemId}/`)) throw new Error("Bad storage path");
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { data: it } = await sb.from("itinerary_items").select("id, title").eq("id", p.itemId).eq("trip_id", p.tripId).maybeSingle();
  if (!it) throw new Error("That activity is not in this trip");
  const { error } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName, category: "Photos", storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: "item", linked_id: p.itemId, added_by: user.id });
  if (error) throw new Error(error.message);
  revalidatePath(`/t/${p.tripId}`, "layout");
}

/** Remove a photo from an activity's album; if it was the cover, the activity falls back to the next photo. */
export async function removeItemPhoto(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid(), docId: z.string().uuid() }).parse({ tripId: form.get("tripId"), itemId: form.get("itemId"), docId: form.get("docId") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  await sb.from("documents").delete().eq("id", p.docId).eq("trip_id", p.tripId).eq("linked_type", "item").eq("linked_id", p.itemId);
  await sb.from("itinerary_items").update({ photo_url: null }).eq("id", p.itemId).eq("trip_id", p.tripId).eq("photo_url", `doc:${p.docId}`);
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/plan/${p.itemId}`);
}

/** Choose which album photo represents the activity in the plan, on Today and on the trip home. */
export async function setItemCover(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid(), docId: z.string().uuid() }).parse({ tripId: form.get("tripId"), itemId: form.get("itemId"), docId: form.get("docId") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { data: d } = await sb.from("documents").select("id").eq("id", p.docId).eq("trip_id", p.tripId).eq("linked_type", "item").eq("linked_id", p.itemId).maybeSingle();
  if (d) await sb.from("itinerary_items").update({ photo_url: `doc:${p.docId}` }).eq("id", p.itemId).eq("trip_id", p.tripId);
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/plan/${p.itemId}`);
}

/** Remove an activity from the plan. Its photos and notes go with it; expenses are kept and simply lose the link. */
export async function deleteActivity(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid() }).safeParse({ tripId: form.get("tripId"), itemId: form.get("itemId") });
  if (!p.success) redirect("/trips");
  const { tripId, itemId } = p.data;
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(tripId); if (!b) redirect("/trips");
  const it = b.items.find(x => x.id === itemId); if (!it) redirect(`/t/${tripId}/plan`);
  await sb.from("expenses").update({ item_id: null }).eq("trip_id", tripId).eq("item_id", itemId);
  await sb.from("documents").delete().eq("trip_id", tripId).eq("linked_type", "item").eq("linked_id", itemId);
  const { error, data } = await sb.from("itinerary_items").delete().eq("id", itemId).eq("trip_id", tripId).select("id");
  if (error || !data?.length) redirect(`/t/${tripId}/plan/${itemId}?error=${encodeURIComponent(error?.message || "denied")}`);
  await sb.from("activity_log").insert({ trip_id: tripId, user_id: user.id, text: `Removed ${it.title} from ${dayLabel(b.trip, it.day)}.` });
  revalidatePath(`/t/${tripId}`, "layout"); redirect(`/t/${tripId}/plan?day=${it.day}&removed=1`);
}

/** Say whether an activity still needs a booking. "none" clears the "booking missing" reminder; "needed" puts it back. */
export async function setItemBooking(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), itemId: z.string().uuid(), booking: z.enum(["none", "needed"]) }).safeParse({ tripId: form.get("tripId"), itemId: form.get("itemId"), booking: form.get("booking") });
  if (!p.success) redirect("/trips");
  const { tripId, itemId, booking } = p.data;
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { data: it } = await sb.from("itinerary_items").select("id, title, booking").eq("id", itemId).eq("trip_id", tripId).maybeSingle();
  if (it && (it as { booking: string }).booking !== "booked") {
    await sb.from("itinerary_items").update({ booking }).eq("id", itemId).eq("trip_id", tripId);
    await sb.from("activity_log").insert({ trip_id: tripId, user_id: user.id, text: booking === "none" ? `Marked ${(it as { title: string }).title} as not needing a booking.` : `Marked ${(it as { title: string }).title} as needing a booking.` });
  }
  revalidatePath(`/t/${tripId}`, "layout"); redirect(`/t/${tripId}/plan/${itemId}`);
}
