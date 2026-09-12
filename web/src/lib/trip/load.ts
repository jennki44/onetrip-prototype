import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import type { TripBundle } from "./derive";
import type { Profile, TripMember } from "@/lib/supabase/types";

/** Load everything about a trip in one round of parallel queries. RLS guarantees the caller is a member. Cached per request. */
export const loadTrip = cache(async (tripId: string): Promise<TripBundle | null> => {
  const sb = await supabaseServer();
  const q = <T,>(table: string, order?: string) => { let r = sb.from(table).select("*").eq("trip_id", tripId); if (order) r = r.order(order); return r as unknown as Promise<{ data: T[] | null }>; };
  type TripRow = TripBundle["trip"];
  const [trip, days, members, places, items, bookings, decisions, options, votes, expenses, shares, settlements, notifications, activity, notes, documents] = await Promise.all([
    sb.from("trips").select("*").eq("id", tripId).maybeSingle() as unknown as Promise<{ data: TripRow | null }>,
    q<TripBundle["days"][number]>("trip_days", "day"), q<TripMember>("trip_members"), q<TripBundle["places"][number]>("places", "name"),
    q<TripBundle["items"][number]>("itinerary_items", "start_time"), q<TripBundle["bookings"][number]>("bookings", "date"), q<TripBundle["decisions"][number]>("decisions", "created_at"),
    q<TripBundle["options"][number]>("decision_options", "sort"), q<TripBundle["votes"][number]>("votes"), q<TripBundle["expenses"][number]>("expenses", "date"),
    q<TripBundle["shares"][number]>("expense_shares"), q<TripBundle["settlements"][number]>("settlements", "date"), q<TripBundle["notifications"][number]>("notifications", "created_at"),
    q<TripBundle["activity"][number]>("activity_log", "created_at"), q<TripBundle["notes"][number]>("notes", "created_at"), q<TripBundle["documents"][number]>("documents", "created_at"),
  ]);
  if (!trip.data) return null;
  const ids = (members.data || []).map(m => m.user_id);
  const { data: profiles } = (await sb.from("profiles").select("*").in("id", ids)) as unknown as { data: Profile[] | null };
  const pmap = new Map((profiles || []).map(p => [p.id, p]));
  return {
    trip: trip.data, days: days.data || [], members: (members.data || []).map(m => ({ ...m, profile: pmap.get(m.user_id) || { id: m.user_id, name: "Traveller", initials: "?", color: "#8A949C", locale: "en", reporting_currency: null, created_at: "" } })),
    places: places.data || [], items: items.data || [], bookings: bookings.data || [], decisions: decisions.data || [], options: options.data || [], votes: votes.data || [],
    expenses: expenses.data || [], shares: shares.data || [], settlements: settlements.data || [], notifications: (notifications.data || []).reverse(), activity: (activity.data || []).reverse(), notes: notes.data || [], documents: (documents.data || []).reverse(),
  };
});

export async function myTrips() {
  const sb = await supabaseServer();
  const { data } = (await sb.from("trip_members").select("role, trips(*)").order("joined_at", { ascending: false })) as unknown as { data: { role: TripMember["role"]; trips: TripBundle["trip"] | null }[] | null };
  return (data || []).filter(r => r.trips).map(r => ({ role: r.role, trip: r.trips as TripBundle["trip"] }));
}
