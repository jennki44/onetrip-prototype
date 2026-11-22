"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { dayLabel, fmtTime } from "@/lib/trip/derive";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Save new times after 排序 (reorder): the moved activity plus any later ones the traveller chose to push back. */
export async function reorderItems(raw: { tripId: string; day: number; movedId: string; changes: { id: string; start: string; end: string | null }[] }) {
  const p = z.object({ tripId: z.string().uuid(), day: z.number().int().min(1).max(60), movedId: z.string().uuid(), changes: z.array(z.object({ id: z.string().uuid(), start: hhmm, end: hhmm.nullable() })).min(1).max(30) }).parse(raw);
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, sb] = await Promise.all([loadTrip(p.tripId), supabaseServer()]); if (!b) throw new Error("Trip not found");
  const me = b.members.find(m => m.user_id === user.id); if (!me || !["owner", "admin", "traveller"].includes(me.role)) throw new Error("Only travellers can change the plan");
  // Every item must still be on this day (someone may have moved or deleted it meanwhile).
  for (const c of p.changes) { const it = b.items.find(i => i.id === c.id); if (!it || it.day !== p.day) throw new Error("The plan changed meanwhile. Reload and try again."); }
  const now = new Date().toISOString();
  for (const c of p.changes) {
    const { error } = await sb.from("itinerary_items").update({ start_time: c.start, end_time: c.end, updated_at: now }).eq("id", c.id).eq("trip_id", p.tripId);
    if (error) throw new Error(error.message);
  }
  const moved = b.items.find(i => i.id === p.movedId)!; const mc = p.changes.find(c => c.id === p.movedId);
  const others = p.changes.length - (mc ? 1 : 0);
  const text = `Moved ${moved.title} from ${fmtTime(moved.start_time.slice(0, 5))} to ${fmtTime(mc?.start || moved.start_time.slice(0, 5))} on ${dayLabel(b.trip, p.day)}${others ? ` and pushed back ${others} later activit${others === 1 ? "y" : "ies"}` : ""}.`;
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "🕘", text: `${me.profile.name}: ${text}`, link: { screen: "item", id: p.movedId } });
  revalidatePath(`/t/${p.tripId}`, "layout");
}
