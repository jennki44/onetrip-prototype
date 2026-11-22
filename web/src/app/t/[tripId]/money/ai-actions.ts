"use server";
import { z } from "zod";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { aiJson, takeAi } from "@/lib/ai/client";

/** What the AI reads from a spoken expense ("晚飯 3200 日元 我俾，三個人分"). Nothing is saved: it only fills the form. */
const Spoken = z.object({
  merchant: z.string().describe("What it was for or where, short, e.g. 'Dinner at Ichiran'"),
  amount: z.number().nullable().describe("Total amount as a plain number, or null if not said"),
  currency: z.string().nullable().describe("ISO 4217 code if a currency was said or obvious (日元/円 = JPY, 港幣/蚊 = HKD, 澳幣 = AUD); null otherwise"),
  category: z.string().describe("Best match from the given category list"),
  payer: z.string().nullable().describe("Exactly one name from the member list who paid; 'me' if the speaker paid; null if not said"),
  participants: z.array(z.string()).describe("Names from the member list who share it; empty array means everyone"),
  date: z.string().nullable().describe("YYYY-MM-DD if a day was said (today/yesterday/day N), else null"),
});

export type SpokenExpense = { merchant: string; amount: string; currency: string; category: string; payerId: string; participants: string[]; date: string };

export async function aiReadExpense(raw: { tripId: string; text: string; today: string }): Promise<{ ok: true; initial: Partial<SpokenExpense> } | { ok: false; error: string }> {
  const p = z.object({ tripId: z.string().uuid(), text: z.string().trim().min(2).max(300), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).safeParse(raw); if (!p.success) return { ok: false, error: "input" };
  const user = await currentUser(); if (!user) return { ok: false, error: "signin" };
  const [b, sb] = await Promise.all([loadTrip(p.data.tripId), supabaseServer()]); if (!b) return { ok: false, error: "trip" };
  if (!(await takeAi(sb, "quick", p.data.tripId))) return { ok: false, error: "limit" };
  const me = b.members.find(m => m.user_id === user.id); const categories = Object.keys(b.trip.budget_categories || { Other: 0 });
  const names = b.members.map(m => m.profile.name);
  const prompt = `Trip currency: ${b.trip.base_currency}. Home currency: ${b.trip.home_currency}. Today: ${p.data.today}. Trip starts ${b.trip.start_date}.\nCategories: ${categories.join(", ")}.\nMembers: ${names.join(", ")}. The speaker is ${me?.profile.name || "unknown"}.\n\nSpoken expense: """${p.data.text}"""`;
  const r = await aiJson(Spoken, "You turn a spoken travel expense (Cantonese, Mandarin or English, informal) into form fields for a family expense-splitting app. Only use names from the member list. Never guess an amount that was not said.", prompt, { effort: "low", maxTokens: 1000 });
  if (!r.ok) return { ok: false, error: r.error };
  const a = r.data; const byName = (n: string) => b.members.find(m => m.profile.name.toLowerCase() === n.trim().toLowerCase())?.user_id;
  const payerId = !a.payer ? undefined : a.payer.toLowerCase() === "me" ? user.id : byName(a.payer);
  const parts = a.participants.map(byName).filter((x): x is string => !!x);
  return { ok: true, initial: {
    merchant: a.merchant.slice(0, 120), amount: a.amount != null && a.amount > 0 ? String(a.amount) : undefined,
    currency: a.currency && /^[A-Z]{3}$/.test(a.currency) ? a.currency : undefined, category: categories.includes(a.category) ? a.category : undefined,
    payerId, participants: parts.length ? parts : undefined, date: a.date && /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : undefined,
  } };
}
