"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export async function addNote(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), text: z.string().trim().min(1).max(500) }).parse({ tripId: form.get("tripId"), text: form.get("text") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  await sb.from("notes").insert({ trip_id: p.tripId, user_id: user.id, text: p.text });
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added a note: "${p.text.slice(0, 60)}${p.text.length > 60 ? "…" : ""}"` });
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}`);
}
