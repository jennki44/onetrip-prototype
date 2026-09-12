"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { minutes, toHM, place, dayLabel, fmtTime } from "@/lib/trip/derive";

const ids = z.object({ tripId: z.string().uuid(), decisionId: z.string().uuid(), optionId: z.string().uuid() });

export async function castVote(form: FormData) {
  const p = ids.extend({ reaction: z.enum(["love", "good", "maybe", "no"]) }).parse({ tripId: form.get("tripId"), decisionId: form.get("decisionId"), optionId: form.get("optionId"), reaction: form.get("reaction") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { data: existing } = await sb.from("votes").select("reaction").eq("option_id", p.optionId).eq("user_id", user.id).maybeSingle();
  if (existing && existing.reaction === p.reaction) await sb.from("votes").delete().eq("option_id", p.optionId).eq("user_id", user.id);
  else await sb.from("votes").upsert({ option_id: p.optionId, decision_id: p.decisionId, trip_id: p.tripId, user_id: user.id, reaction: p.reaction });
  // status: almost decided when all but one have voted
  const { data: votes } = await sb.from("votes").select("user_id").eq("decision_id", p.decisionId);
  const { count } = await sb.from("trip_members").select("*", { count: "exact", head: true }).eq("trip_id", p.tripId);
  const n = new Set((votes || []).map((v: { user_id: string }) => v.user_id)).size;
  await sb.from("decisions").update({ status: n >= (count || 0) - 1 ? "almost" : "open" }).eq("id", p.decisionId).neq("status", "confirmed");
  const b = await loadTrip(p.tripId); const o = b?.options.find(x => x.id === p.optionId); const d = b?.decisions.find(x => x.id === p.decisionId);
  if (b && o && d && !(existing && existing.reaction === p.reaction)) await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Voted ${p.reaction} for ${(o.place_id ? place(b, o.place_id)?.name : o.label) || "an option"} in ${d.title}.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

/** Confirming a decision creates or updates the linked itinerary item, marks the place saved, logs and notifies. */
export async function confirmDecision(form: FormData) {
  const p = ids.parse({ tripId: form.get("tripId"), decisionId: form.get("decisionId"), optionId: form.get("optionId") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  const d = b.decisions.find(x => x.id === p.decisionId); const o = b.options.find(x => x.id === p.optionId); if (!d || !o) redirect(`/t/${p.tripId}/decisions`);
  const pl = place(b, o.place_id); const optName = (pl ? pl.name : o.label) || "Option";
  const members = b.members.map(m => m.user_id); const cost = o.est_pp_minor * members.length;
  const { data: allowed } = await sb.rpc("can_confirm_decision", { d: d.id });
  if (!allowed) redirect(`/t/${p.tripId}/decisions/${d.id}?error=notyet`);
  await sb.from("decisions").update({ status: "confirmed", confirmed_option_id: o.id }).eq("id", d.id);
  const existing = b.items.find(i => i.decision_id === d.id);
  let itemId = existing?.id; const day = existing?.day ?? d.day ?? 1; const start = existing?.start_time?.slice(0, 5) ?? d.slot?.slice(0, 5) ?? "19:00";
  if (existing) {
    const patch: Record<string, unknown> = { status: "confirmed", title: `${existing.title.split(" · ")[0]} · ${optName}`, cost_minor: cost, updated_at: new Date().toISOString() };
    if (pl) { patch.place_id = pl.id; patch.emoji = pl.emoji; if (pl.photo_url) patch.photo_url = pl.photo_url; }
    if (existing.category === "free") patch.end_time = toHM(minutes(start) + 300);
    await sb.from("itinerary_items").update(patch).eq("id", existing.id);
  } else {
    const { data } = await sb.from("itinerary_items").insert({ trip_id: p.tripId, day, start_time: start, end_time: toHM(minutes(start) + 90), title: `${d.title} · ${optName}`, place_id: pl?.id || null, emoji: pl?.emoji || "✅", category: d.category === "Food" ? "food" : "activity", status: "confirmed", booking: "none", decision_id: d.id, cost_minor: cost, travel_min: pl?.from_hotel_min ? Math.max(5, Math.round(pl.from_hotel_min * 0.7)) : 10, participant_ids: members, photo_url: pl?.photo_url || null, note: `Confirmed from the ${d.title} decision`, created_by: user.id }).select("id").single();
    itemId = data?.id;
  }
  if (pl) await sb.from("places").update({ saved: true }).eq("id", pl.id);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Confirmed ${optName} for ${d.title}.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "📍", text: `${d.title} was added to your itinerary: ${optName}, ${dayLabel(b.trip, day)} ${fmtTime(start)}.`, link: { screen: "item", id: itemId } });
  revalidatePath(`/t/${p.tripId}`, "layout");
  redirect(`/t/${p.tripId}/plan/${itemId}?added=1`);
}

export async function keepVoting(form: FormData) {
  const tripId = z.string().uuid().parse(form.get("tripId"));
  redirect(`/t/${tripId}/decisions`);
}
