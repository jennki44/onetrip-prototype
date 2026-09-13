"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const text = (max: number) => z.string().trim().max(max).transform(v => v || null);
/** Only photos the app itself serves: bundled trip photos or this project's public photos bucket. */
function allowedPhoto(url: string) {
  if (!url) return true; if (url.startsWith("/photos/")) return true;
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/`;
  return url.startsWith(prefix) && !/[\s<>"']/.test(url);
}

export async function saveDay(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), day: z.coerce.number().int().min(1).max(60), theme: text(80), stay: text(80), drive: text(80), caption: text(300), rule: text(200), banner_url: z.string().trim().max(500) })
    .safeParse({ tripId: form.get("tripId"), day: form.get("day"), theme: form.get("theme") || "", stay: form.get("stay") || "", drive: form.get("drive") || "", caption: form.get("caption") || "", rule: form.get("rule") || "", banner_url: form.get("banner_url") || "" });
  if (!p.success) redirect("/trips");
  const here = `/t/${p.data.tripId}/plan/day?day=${p.data.day}`;
  if (!allowedPhoto(p.data.banner_url)) redirect(`${here}&error=photo`);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { error } = await sb.from("trip_days").upsert({ trip_id: p.data.tripId, day: p.data.day, theme: p.data.theme, stay: p.data.stay, drive: p.data.drive, caption: p.data.caption, rule: p.data.rule, banner_url: p.data.banner_url || null, theme_zh: null, stay_zh: null, drive_zh: null, rule_zh: null, caption_zh: null }, { onConflict: "trip_id,day" });
  if (error) redirect(`${here}&error=${encodeURIComponent(error.message)}`);
  await sb.from("activity_log").insert({ trip_id: p.data.tripId, user_id: user.id, text: `Updated the details for day ${p.data.day}.` });
  revalidatePath(`/t/${p.data.tripId}`, "layout");
  redirect(`/t/${p.data.tripId}/plan?day=${p.data.day}`);
}
