"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export async function markAllRead(form: FormData) {
  const tripId = z.string().uuid().parse(form.get("tripId")); const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return;
  const { data } = await sb.from("notifications").select("id, read_by").eq("trip_id", tripId);
  for (const n of (data || []) as { id: string; read_by: string[] }[]) if (!n.read_by.includes(user.id)) await sb.from("notifications").update({ read_by: [...n.read_by, user.id] }).eq("id", n.id);
  revalidatePath(`/t/${tripId}`, "layout");
}
