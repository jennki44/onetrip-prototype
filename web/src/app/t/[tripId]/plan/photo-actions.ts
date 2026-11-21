"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { getLocale } from "@/lib/i18n/server";
import { dayCount, dayLabel, itemTitle, itemsOnDay, minutes } from "@/lib/trip/derive";
import { metresBetween } from "@/lib/geocode";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

export type PhotoTargets = {
  days: { day: number; label: string }[]; today: number | null; day: number;
  items: { id: string; title: string; start: string; emoji: string }[];
  suggested: string | null;
};

/** Where a just-taken photo most likely belongs: the activity happening now (or nearest by place) on that day. No AI, so it's free. */
export async function photoTargets(raw: { tripId: string; today: string; now: string; lat: number | null; lng: number | null; day?: number | null }): Promise<PhotoTargets | null> {
  const p = z.object({ tripId: z.string().uuid(), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), now: hhmm, lat: z.number().finite().nullable(), lng: z.number().finite().nullable(), day: z.number().int().min(1).max(60).nullish() }).safeParse(raw);
  if (!p.success || !(await currentUser())) return null;
  const [b, locale] = await Promise.all([loadTrip(p.data.tripId), getLocale()]); if (!b) return null;
  const total = dayCount(b.trip); const days = Array.from({ length: total }, (_, k) => ({ day: k + 1, label: dayLabel(b.trip, k + 1, locale) }));
  const fromDate = Math.round((Date.parse(p.data.today + "T00:00:00Z") - Date.parse(b.trip.start_date + "T00:00:00Z")) / 86400000) + 1;
  const today = fromDate >= 1 && fromDate <= total ? fromDate : null;
  const day = p.data.day ?? today ?? 1;
  const list = itemsOnDay(b, day).filter(i => i.status !== "cancelled");
  const here = p.data.lat != null && p.data.lng != null ? { lat: p.data.lat, lng: p.data.lng } : null;
  // Only suggest on the real "today": the activity whose time covers now, or the closest by place and time.
  let suggested: string | null = null;
  if (day === today) {
    let best = Infinity; const at = minutes(p.data.now);
    for (const it of list) {
      const s = minutes(it.start_time), e = it.end_time ? minutes(it.end_time) : s + 60; const off = at < s ? s - at : at > e ? at - e : 0;
      const pl = it.place_id ? b.places.find(x => x.id === it.place_id) : null;
      const d = here && pl?.lat != null && pl?.lng != null ? metresBetween(here, { lat: pl.lat, lng: pl.lng }) : null;
      if (d != null ? d > 600 || off > 180 : off > 60) continue;
      const score = off + (d ?? 300) / 10; if (score < best) { best = score; suggested = it.id; }
    }
  }
  return { days, today, day, suggested, items: list.map(i => ({ id: i.id, title: itemTitle(i, locale), start: i.start_time.slice(0, 5), emoji: i.emoji })) };
}

/** Record an uploaded photo in an activity's album (活動相片) or the trip album (旅程相簿) for a day. */
export async function addPhoto(raw: { tripId: string; target: "item" | "trip"; itemId: string | null; day: number; fileName: string; storagePath: string; sizeBytes: number }) {
  const p = z.object({ tripId: z.string().uuid(), target: z.enum(["item", "trip"]), itemId: z.string().uuid().nullable(), day: z.number().int().min(1).max(60), fileName: z.string().trim().min(1).max(200), storagePath: z.string().max(400), sizeBytes: z.number().int().nonnegative() }).parse(raw);
  const prefix = p.target === "item" ? `${p.tripId}/items/${p.itemId}/` : `${p.tripId}/days/${p.day}/`;
  if ((p.target === "item" && !p.itemId) || !p.storagePath.startsWith(prefix)) throw new Error("Bad storage path");
  const user = await currentUser(); if (!user) throw new Error("Please sign in again");
  const [b, sb] = await Promise.all([loadTrip(p.tripId), supabaseServer()]); if (!b) throw new Error("Trip not found");
  if (!["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user.id)?.role || "")) throw new Error("Only travellers can add photos");
  const item = p.target === "item" ? b.items.find(i => i.id === p.itemId) : null; if (p.target === "item" && !item) throw new Error("That activity is not in this trip");
  if (p.day > dayCount(b.trip)) throw new Error("That day is not in this trip");
  const { error } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName, category: "Photos", storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: p.target, linked_id: p.target === "item" ? p.itemId : p.tripId, added_by: user.id });
  if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: item ? `Added a photo to ${item.title}.` : `Added a photo to the trip album for ${dayLabel(b.trip, p.day)}.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return { day: item?.day ?? p.day, itemId: item?.id ?? null };
}
