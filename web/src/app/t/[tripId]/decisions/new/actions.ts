"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";

export async function createDecision(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), title: z.string().trim().min(1).max(80), question: z.string().max(120).optional(), day: z.coerce.number().int().min(1), slot: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")), category: z.string().max(40), deadline: z.string().optional().or(z.literal("")), places: z.array(z.string().uuid()).max(4) })
    .parse({ tripId: form.get("tripId"), title: form.get("title"), question: form.get("question") || "", day: form.get("day"), slot: form.get("slot") || "", category: form.get("category"), deadline: form.get("deadline") || "", places: form.getAll("places") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  const { data: d, error } = await sb.from("decisions").insert({ trip_id: p.tripId, title: p.title, question: p.question || null, status: "open", deadline: p.deadline || null, day: p.day, slot: p.slot || null, category: p.category, created_by: user.id }).select("id").single();
  if (error || !d) redirect(`/t/${p.tripId}/decisions/new`);
  if (p.places.length) await sb.from("decision_options").insert(p.places.map((pid, k) => { const pl = b.places.find(x => x.id === pid); return { decision_id: d.id, trip_id: p.tripId, place_id: pid, est_pp_minor: pl?.est_pp_minor || 0, sort: k }; }));
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Started the ${p.title} decision with ${p.places.length} options.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "🗳", text: `${b.members.find(m => m.user_id === user.id)?.profile.name || "Someone"} started a new decision: ${p.title}.`, link: { screen: "decision", id: d.id } });
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/decisions/${d.id}`);
}
