"use server";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { toMinor } from "@/lib/money";
import { aiJson, takeAi } from "@/lib/ai/client";
import { kindInfo } from "@/lib/ai/kinds";
import { placeProvider, type FoundPlace } from "@/lib/places";
import { Input, Outline, PlanItem, SYSTEM, brief, nights, type OutlineT, type PlanInput, type PlanItemT } from "@/lib/ai/plan";
export type { OutlineT, PlanInput, PlanItemT } from "@/lib/ai/plan";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const CURRENCY = z.string().regex(/^[A-Z]{3}$/);


export type OutlineResult = { ok: true; outline: OutlineT } | { ok: false; error: string };

/** Step A (a few seconds): trip name, currency and one theme + area per day. Counts as one of today's 3 plans. */
export async function aiPlanOutline(raw: PlanInput): Promise<OutlineResult> {
  const p = Input.safeParse(raw); if (!p.success) return { ok: false, error: "input" };
  const n = nights(p.data.start, p.data.end); if (n < 0 || n > 20) return { ok: false, error: "dates" };
  const user = await currentUser(); if (!user) return { ok: false, error: "signin" };
  const sb = await supabaseServer(); if (!(await takeAi(sb, "plan"))) return { ok: false, error: "limit" };
  const r = await aiJson(Outline, SYSTEM, `${brief(p.data, n)}

Only outline the trip: give each of the ${n + 1} days (numbered 1 to ${n + 1}) a theme and a base area. Spread the days across different areas; group nearby sights on the same day. Day 1 and the last day may be lighter for travel.`, { effort: "low", maxTokens: 3000 });
  if (!r.ok) return { ok: false, error: r.error };
  const o = r.data; o.days = o.days.filter(x => x.day >= 1 && x.day <= n + 1).sort((a, b) => a.day - b.day);
  if (!CURRENCY.safeParse(o.currency).success) o.currency = "AUD";
  return { ok: true, outline: o };
}

/** Find one suggested place on the map (called card by card so the draft shows up straight away). */
export async function aiCheckPlace(raw: { search: string; title: string; destination: string }): Promise<FoundPlace | null> {
  const p = z.object({ search: z.string().max(200), title: z.string().max(120), destination: z.string().max(80) }).safeParse(raw); if (!p.success) return null;
  if (!(await currentUser())) return null;
  const locale = await getLocale();
  return (await placeProvider().find(p.data.search || p.data.title, p.data.destination, locale)) || (p.data.search !== p.data.title ? await placeProvider().find(p.data.title, p.data.destination, locale) : null);
}

/** Suggest one alternative for a stop, nearby and at the same time. Counts against today's 40 swaps. */
export async function aiSwapItem(raw: { destination: string; day: number; theme: string; item: PlanItemT; avoid: string[] }): Promise<{ ok: true; item: PlanItemT } | { ok: false; error: string }> {
  const p = z.object({ destination: z.string().max(80), day: z.number().int(), theme: z.string().max(120), item: PlanItem, avoid: z.array(z.string().max(120)).max(80) }).safeParse(raw); if (!p.success) return { ok: false, error: "input" };
  if (!(await currentUser())) return { ok: false, error: "signin" };
  const sb = await supabaseServer(); if (!(await takeAi(sb, "swap"))) return { ok: false, error: "limit" };
  const it = p.data.item;
  const prompt = `Trip to ${p.data.destination}, day ${p.data.day} (${p.data.theme}). Replace this stop with a different real place of a similar kind, near ${it.area}, for ${it.start}${it.end ? `–${it.end}` : ""}:\n${it.title} (${it.kind}).\nDo not suggest any of: ${[it.title, ...p.data.avoid].join("; ")}.`;
  const r = await aiJson(PlanItem, SYSTEM, prompt, { effort: "low", maxTokens: 2000 });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: { ...r.data, start: hhmm.safeParse(r.data.start).success ? r.data.start : it.start, end: hhmm.safeParse(r.data.end).success ? r.data.end : it.end } };
}

const Keep = PlanItem.extend({ lookup: z.boolean().optional(), place: z.object({ name: z.string().max(120), lat: z.number().finite(), lng: z.number().finite(), address: z.string().max(160).nullable(), area: z.string().max(60).nullable() }).nullable() });

/** Create the trip from the kept cards: places pinned, activities as 提議 (proposed), day themes, rough costs. */
export async function aiCreateTrip(raw: { name: string; destination: string; start: string; end: string; base: string; home: string; style: string; interests: string[]; days: { day: number; theme: string; theme_zh: string; items: z.infer<typeof Keep>[] }[] }): Promise<{ ok: true; tripId: string } | { ok: false; error: string }> {
  const p = z.object({ name: z.string().trim().min(2).max(80), destination: z.string().trim().min(2).max(80), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), base: CURRENCY, home: CURRENCY, style: z.string().max(20), interests: z.array(z.string().max(20)).max(12), days: z.array(z.object({ day: z.number().int().min(1).max(60), theme: z.string().max(80), theme_zh: z.string().max(80), items: z.array(Keep).max(12) })).max(21) }).safeParse(raw);
  if (!p.success) return { ok: false, error: "input" };
  const user = await currentUser(); if (!user) return { ok: false, error: "signin" };
  const [sb, locale] = await Promise.all([supabaseServer(), getLocale()]); const d = p.data;
  const styles = [d.style, ...(d.interests.includes("food") || d.interests.includes("coffee") ? ["food"] : []), ...(d.interests.includes("kids") ? ["family"] : [])].filter((x, i, a) => ["relaxed", "balanced", "busy", "adventure", "food", "family", "budget", "luxury"].includes(x) && a.indexOf(x) === i);
  const { data: tripId, error } = await sb.rpc("create_trip", { p_name: d.name, p_destination: d.destination, p_emoji: "✨", p_start: d.start, p_end: d.end, p_base: d.base, p_home: d.home, p_budget_minor: null, p_styles: styles });
  if (error || !tripId) return { ok: false, error: error?.message || "create" };
  const tid = tripId as string;
  const days = d.days.filter(x => x.day <= nights(d.start, d.end) + 1);
  if (days.length) await sb.from("trip_days").upsert(days.map(x => ({ trip_id: tid, day: x.day, theme: x.theme || null, theme_zh: x.theme_zh || null })), { onConflict: "trip_id,day" });
  for (const day of days) for (const it of day.items) {
    const info = kindInfo(it.kind); let placeId: string | null = null;
    // Not checked on the map yet when Create was pressed: look it up now.
    if (!it.place && it.lookup) it.place = await placeProvider().find(it.search || it.title, d.destination, locale);
    if (it.place) {
      const { data: pl } = await sb.from("places").insert({ trip_id: tid, name: it.title, name_zh: it.title_zh || null, type: info.placeType, area: it.place.area || it.area || null, address: it.place.address, lat: it.place.lat, lng: it.place.lng, emoji: info.emoji, saved: false, created_by: user.id }).select("id").single();
      placeId = (pl as { id: string } | null)?.id ?? null;
    }
    await sb.from("itinerary_items").insert({ trip_id: tid, day: day.day, start_time: it.start, end_time: it.end || null, title: it.title, title_zh: it.title_zh || null, note: it.why || null, note_zh: it.why_zh || null, place_id: placeId, emoji: info.emoji, category: info.category, status: "proposed", participant_ids: [user.id], cost_minor: it.cost > 0 ? toMinor(it.cost, d.base) : null, created_by: user.id });
  }
  await sb.from("activity_log").insert({ trip_id: tid, user_id: user.id, text: "Planned this trip with the AI helper." });
  return { ok: true, tripId: tid };
}
