"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function updateTrip(form: FormData) {
  const tripId = String(form.get("tripId") || ""); if (!/^[0-9a-f-]{36}$/i.test(tripId)) redirect("/trips");
  const here = `/t/${tripId}/settings/trip`;
  const p = z.object({ name: z.string().trim().min(2).max(80), destination: z.string().trim().min(2).max(80), emoji: z.string().trim().min(1).max(8), start: DATE, end: DATE, drop: z.string().optional() })
    .safeParse({ name: form.get("name"), destination: form.get("destination"), emoji: form.get("emoji"), start: form.get("start"), end: form.get("end"), drop: form.get("drop") ?? undefined });
  if (!p.success) redirect(`${here}?error=form`);
  if (p.data.end < p.data.start) redirect(`${here}?error=order`);
  const sb = await supabaseServer();
  const { error: e1 } = await sb.from("trips").update({ name: p.data.name, destination: p.data.destination, emoji: p.data.emoji }).eq("id", tripId);
  if (e1) redirect(`${here}?error=${encodeURIComponent(e1.message)}`);
  const { data: outside, error: e2 } = await sb.rpc("update_trip_dates", { p_trip: tripId, p_start: p.data.start, p_end: p.data.end, p_drop: p.data.drop === "1" });
  if (e2) {
    const m = /OUT_OF_RANGE:(\d+)/.exec(e2.message);
    redirect(m ? `${here}?error=outside&n=${m[1]}` : `${here}?error=${encodeURIComponent(e2.message)}`);
  }
  revalidatePath(`/t/${tripId}`, "layout");
  redirect(`${here}?saved=1${Number(outside) > 0 ? `&dropped=${outside}` : ""}`);
}
