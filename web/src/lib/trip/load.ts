import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { setRates, type ItemPhoto, type TripBundle } from "./derive";
import { loadRates } from "@/lib/rates";
import type { Profile, TripMember } from "@/lib/supabase/types";

/** Load everything about a trip in one round of parallel queries. RLS guarantees the caller is a member. Cached per request. */
export const loadTrip = cache(async (tripId: string): Promise<TripBundle | null> => {
  const sb = await supabaseServer();
  const q = <T,>(table: string, order?: string) => { let r = sb.from(table).select("*").eq("trip_id", tripId); if (order) r = r.order(order); return r as unknown as Promise<{ data: T[] | null }>; };
  type TripRow = TripBundle["trip"];
  const ratesP = loadRates();
  const [trip, days, members, places, items, bookings, decisions, options, votes, expenses, shares, settlements, notifications, activity, notes, documents] = await Promise.all([
    sb.from("trips").select("*").eq("id", tripId).maybeSingle() as unknown as Promise<{ data: TripRow | null }>,
    q<TripBundle["days"][number]>("trip_days", "day"), q<TripMember>("trip_members"), q<TripBundle["places"][number]>("places", "name"),
    q<TripBundle["items"][number]>("itinerary_items", "start_time"), q<TripBundle["bookings"][number]>("bookings", "date"), q<TripBundle["decisions"][number]>("decisions", "created_at"),
    q<TripBundle["options"][number]>("decision_options", "sort"), q<TripBundle["votes"][number]>("votes"), q<TripBundle["expenses"][number]>("expenses", "date"),
    q<TripBundle["shares"][number]>("expense_shares"), q<TripBundle["settlements"][number]>("settlements", "date"), q<TripBundle["notifications"][number]>("notifications", "created_at"),
    q<TripBundle["activity"][number]>("activity_log", "created_at"), q<TripBundle["notes"][number]>("notes", "created_at"), q<TripBundle["documents"][number]>("documents", "created_at"),
  ]);
  setRates(await ratesP);
  if (!trip.data) return null;
  const ids = (members.data || []).map(m => m.user_id);
  // Activity photos live in the private documents bucket; one batched call turns them into links that last an hour.
  const photoDocs = (documents.data || []).filter(d => d.linked_type === "item" && d.linked_id && d.storage_path && d.category === "Photos").sort((x, y) => x.created_at.localeCompare(y.created_at)).slice(0, 400);
  const [{ data: profiles }, signed] = await Promise.all([
    sb.from("profiles").select("*").in("id", ids) as unknown as Promise<{ data: Profile[] | null }>,
    photoDocs.length ? sb.storage.from("documents").createSignedUrls(photoDocs.map(d => d.storage_path as string), 3600).then(r => r.data || []) : Promise.resolve([]),
  ]);
  const itemPhotos: Record<string, ItemPhoto[]> = {};
  photoDocs.forEach((d, k) => { const url = signed[k]?.signedUrl; if (url) (itemPhotos[d.linked_id as string] ||= []).push({ id: d.id, url, name: d.name, added_by: d.added_by, created_at: d.created_at }); });
  const pmap = new Map((profiles || []).map(p => [p.id, p]));
  return {
    trip: trip.data, days: days.data || [], members: (members.data || []).map(m => ({ ...m, profile: pmap.get(m.user_id) || { id: m.user_id, name: "Traveller", initials: "?", color: "#8A949C", locale: "en", reporting_currency: null, created_at: "" } })),
    places: places.data || [], items: items.data || [], bookings: bookings.data || [], decisions: decisions.data || [], options: options.data || [], votes: votes.data || [],
    expenses: expenses.data || [], shares: shares.data || [], settlements: settlements.data || [], notifications: (notifications.data || []).reverse(), activity: (activity.data || []).reverse(), notes: notes.data || [], documents: (documents.data || []).reverse(), itemPhotos,
  };
});

export async function myTrips() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser(); if (!user) return [];
  // Only this user's own memberships — members can read the whole member list of a trip, so filter explicitly.
  const { data } = (await sb.from("trip_members").select("role, trips(*)").eq("user_id", user.id).order("joined_at", { ascending: false })) as unknown as { data: { role: TripMember["role"]; trips: TripBundle["trip"] | null }[] | null };
  return (data || []).filter(r => r.trips).map(r => ({ role: r.role, trip: r.trips as TripBundle["trip"] }));
}
