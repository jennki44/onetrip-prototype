/* Derived views over a loaded trip: today, spend, forecast, balances, health.
   Pure functions over the TripBundle so they run on the server and in Trip Brain. */
import type { Trip, TripDay, Profile, TripMember, Place, ItineraryItem, Booking, Decision, DecisionOption, Vote, Expense, ExpenseShare, Settlement, Notification, ActivityLog, Note, Document } from "@/lib/supabase/types";
import { balances as calcBalances, settlementPlan as calcPlan, toMinor, convertMinor, fmtMoney } from "@/lib/money";

export interface TripBundle {
  trip: Trip; days: TripDay[]; members: (TripMember & { profile: Profile })[]; places: Place[]; items: ItineraryItem[]; bookings: Booking[];
  decisions: Decision[]; options: DecisionOption[]; votes: Vote[]; expenses: Expense[]; shares: ExpenseShare[]; settlements: Settlement[];
  notifications: Notification[]; activity: ActivityLog[]; notes: Note[]; documents: Document[];
}

/* Fixed demo rates: units of `to` per 1 unit of `from`. Replace with a provider later; never invented by Trip Brain. */
const RATES_PER_AUD: Record<string, number> = { AUD: 1, HKD: 5.13, USD: 0.66, GBP: 0.52, EUR: 0.60, JPY: 99.0, SGD: 0.88, NZD: 1.08, TWD: 21.2, CNY: 4.75 };
export function rate(from: string, to: string): number { const a = RATES_PER_AUD[from], b = RATES_PER_AUD[to]; if (!a || !b) return 1; return b / a; }

export const REACT_WEIGHT = { love: 3, good: 2, maybe: 1, no: -2 } as const;
export const REACT_EMOJI = { love: "❤️", good: "👍", maybe: "🤔", no: "👎" } as const;

export const minutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const toHM = (m: number) => `${String(Math.floor(Math.max(0, Math.min(1439, m)) / 60)).padStart(2, "0")}:${String(Math.max(0, m) % 60).padStart(2, "0")}`;
export function fmtTime(t: string, locale = "en") { const [h, m] = t.split(":").map(Number); if (locale.startsWith("zh")) return `${h < 12 ? "上午" : "下午"} ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function dayDate(trip: Trip, day: number): Date { const d = new Date(trip.start_date + "T00:00:00"); d.setDate(d.getDate() + day - 1); return d; }
export function dayCount(trip: Trip): number { return Math.round((new Date(trip.end_date + "T00:00:00").getTime() - new Date(trip.start_date + "T00:00:00").getTime()) / 86400000) + 1; }
export function dayLabel(trip: Trip, day: number, locale = "en", long = false): string {
  return dayDate(trip, day).toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" });
}
export function dateRange(trip: Trip, locale = "en"): string {
  const l = locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU"; const s = new Date(trip.start_date + "T00:00:00"), e = new Date(trip.end_date + "T00:00:00");
  return `${s.toLocaleDateString(l, { day: "numeric", month: "short" })} – ${e.toLocaleDateString(l, { day: "numeric", month: "short" })}`;
}

/** Which trip day is "now"? Before the trip → 0, after → dayCount + 1. `now` is injectable so demos can pin the clock. */
export function currentDay(trip: Trip, now: Date): number {
  const start = new Date(trip.start_date + "T00:00:00"); const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((n.getTime() - start.getTime()) / 86400000) + 1;
  if (diff < 1) return 0; if (diff > dayCount(trip)) return dayCount(trip) + 1; return diff;
}
export const itemsOnDay = (b: TripBundle, day: number) => b.items.filter(i => i.day === day && i.status !== "cancelled").sort((x, y) => x.start_time.localeCompare(y.start_time));
export function nowSlots(b: TripBundle, now: Date) {
  const day = currentDay(b.trip, now); const items = day >= 1 && day <= dayCount(b.trip) ? itemsOnDay(b, day) : [];
  const nm = now.getHours() * 60 + now.getMinutes();
  const cur = items.find(i => minutes(i.start_time) <= nm && minutes(i.end_time || i.start_time) > nm) || null;
  const next = items.find(i => minutes(i.start_time) > nm) || null;
  const later = items.filter(i => minutes(i.start_time) > nm && i !== next);
  return { day, items, current: cur, next, later };
}

/* ---- localised content: show the Traditional Chinese variant when the viewer's language is Chinese and one exists ---- */
export const isZh = (locale?: string) => !!locale && locale.startsWith("zh");
export const itemTitle = (i: Pick<ItineraryItem, "title" | "title_zh">, locale?: string) => (isZh(locale) && i.title_zh) || i.title;
export const itemNote = (i: Pick<ItineraryItem, "note" | "note_zh">, locale?: string) => (isZh(locale) && i.note_zh) || i.note;
export const itemFlag = (i: Pick<ItineraryItem, "flag" | "flag_zh">, locale?: string) => (isZh(locale) && i.flag_zh) || i.flag;
export const placeName = (p: Pick<Place, "name" | "name_zh"> | null | undefined, locale?: string) => (p ? (isZh(locale) && p.name_zh) || p.name : "");
export const decTitle = (d: Pick<Decision, "title" | "title_zh">, locale?: string) => (isZh(locale) && d.title_zh) || d.title;
export const decQuestion = (d: Pick<Decision, "question" | "question_zh">, locale?: string) => (isZh(locale) && d.question_zh) || d.question;
export const optionLabel = (b: TripBundle, o: DecisionOption, locale?: string) => (o.place_id ? placeName(place(b, o.place_id), locale) : ((isZh(locale) && o.label_zh) || o.label)) || "";
export const optionSub = (o: DecisionOption, locale?: string) => (isZh(locale) && o.sub_zh) || o.sub;
export function dayL(d: TripDay | undefined, locale?: string) { if (!d) return undefined; const z = isZh(locale); return { ...d, theme: (z && d.theme_zh) || d.theme, stay: (z && d.stay_zh) || d.stay, drive: (z && d.drive_zh) || d.drive, rule: (z && d.rule_zh) || d.rule, caption: (z && d.caption_zh) || d.caption }; }

export const place = (b: TripBundle, id: string | null) => (id ? b.places.find(p => p.id === id) || null : null);
export const member = (b: TripBundle, id: string | null) => (id ? b.members.find(m => m.user_id === id) || null : null);
export const photoOf = (b: TripBundle, i: ItineraryItem) => i.photo_url || place(b, i.place_id)?.photo_url || null;

/* ---- money ---- */
export const spentBase = (b: TripBundle) => b.expenses.reduce((a, e) => a + e.base_minor, 0);
export function spentByCategory(b: TripBundle): Record<string, number> {
  const out: Record<string, number> = {}; for (const k of Object.keys(b.trip.budget_categories || {})) out[k] = 0;
  for (const e of b.expenses) out[e.category] = (out[e.category] || 0) + e.base_minor; return out;
}
/** Budget expressed in base-currency minor units. */
export const budgetBase = (b: TripBundle) => b.trip.budget_minor == null ? null : convertMinor(b.trip.budget_minor, b.trip.home_currency, b.trip.base_currency, rate(b.trip.home_currency, b.trip.base_currency));
export const catBudgetBase = (b: TripBundle, c: string) => convertMinor(b.trip.budget_categories?.[c] || 0, b.trip.home_currency, b.trip.base_currency, rate(b.trip.home_currency, b.trip.base_currency));
export function optionScore(b: TripBundle, optionId: string) { return b.votes.filter(v => v.option_id === optionId).reduce((a, v) => a + REACT_WEIGHT[v.reaction], 0); }
export function leadingOption(b: TripBundle, d: Decision) { return [...b.options.filter(o => o.decision_id === d.id)].sort((x, y) => optionScore(b, y.id) - optionScore(b, x.id))[0] || null; }
export const votersOf = (b: TripBundle, d: Decision) => new Set(b.votes.filter(v => v.decision_id === d.id).map(v => v.user_id));
export function committedBase(b: TripBundle, today: number): number {
  let c = 0;
  for (const bk of b.bookings) if (bk.cost_minor != null && bk.paid_minor != null) c += bk.cost_minor - bk.paid_minor;
  for (const i of b.items) {
    // Committed = future plans with an estimate that are confirmed (or need a booking) and have not been paid yet.
    if (i.day <= today || !i.cost_minor || ["cancelled", "voting", "idea", "proposed"].includes(i.status)) continue;
    const paid = b.expenses.some(e => e.item_id === i.id || (i.booking_id && e.booking_id === i.booking_id)); if (!paid) c += i.cost_minor;
  }
  for (const d of b.decisions) if (d.status !== "confirmed" && d.category === "Food") { const lead = leadingOption(b, d); if (lead) c += lead.est_pp_minor * b.members.length; }
  return c;
}
export const forecastBase = (b: TripBundle, today: number) => spentBase(b) + committedBase(b, today);
export function netBalances(b: TripBundle) {
  return calcBalances(b.members.map(m => m.user_id), b.expenses.map(e => ({ id: e.id, payerId: e.payer_id, baseMinor: e.base_minor })), b.shares.map(s => ({ expenseId: s.expense_id, userId: s.user_id, shareMinor: s.share_minor })), b.settlements.map(s => ({ fromUserId: s.from_user, toUserId: s.to_user, amountMinor: s.amount_minor })));
}
export const plan = (b: TripBundle) => calcPlan(netBalances(b));

/** Format a base-minor amount in a reporting currency. */
export function inCurrency(b: TripBundle, baseMinor: number, currency: string, opts?: { decimals?: number }) {
  return fmtMoney(convertMinor(baseMinor, b.trip.base_currency, currency, rate(b.trip.base_currency, currency)), currency, opts);
}
export const fmtBase = (b: TripBundle, minor: number) => fmtMoney(minor, b.trip.base_currency);
export { toMinor };

/* ---- health ---- */
export interface HealthCheck { tone: "good" | "warn" | "bad"; text: string; sub?: string; link: string; resolve?: { kind: "decision" | "booking"; id: string } }
export function healthChecks(b: TripBundle, today: number, t: (k: string, v?: Record<string, string | number>) => string, locale: string): HealthCheck[] {
  const out: HealthCheck[] = []; const base = `/t/${b.trip.id}`;
  const flight = b.bookings.find(x => x.type === "flight");
  out.push(flight ? { tone: "good", text: t("healthx.flightsOk"), link: `${base}/bookings/${flight.id}` } : { tone: "warn", text: t("healthx.noFlights"), link: `${base}/bookings` });
  const hotel = b.bookings.find(x => x.type === "hotel");
  out.push(hotel ? { tone: "good", text: t("healthx.stayOk", { name: hotel.title.split(" · ")[0] }), link: `${base}/bookings/${hotel.id}` } : { tone: "warn", text: t("healthx.noStay"), link: `${base}/bookings` });
  for (const d of b.decisions.filter(x => x.status !== "confirmed")) out.push({ tone: "warn", text: t("healthx.needsDecision", { title: decTitle(d, locale) }), sub: t("healthx.votedOf", { n: votersOf(b, d).size, total: b.members.length }), link: `${base}/decisions/${d.id}`, resolve: { kind: "decision", id: d.id } });
  for (const i of b.items.filter(x => x.booking === "needed" && x.status !== "cancelled")) out.push({ tone: i.category === "stay" ? "bad" : "warn", text: t(i.category === "stay" ? "healthx.noBooking" : "healthx.notBooked", { title: itemTitle(i, locale) }), sub: `${dayLabel(b.trip, i.day, locale)} · ${fmtTime(i.start_time, locale)}`, link: `${base}/plan/${i.id}`, resolve: { kind: "booking", id: i.id } });
  const bud = budgetBase(b); if (bud != null) { const over = forecastBase(b, today) - bud; if (over > 0) out.push({ tone: "warn", text: t("healthx.overBudget", { amount: inCurrency(b, over, b.trip.home_currency, { decimals: 0 }) }), sub: t("healthx.overSub"), link: `${base}/money` }); }
  return out;
}
export function healthOverall(checks: HealthCheck[]) { if (checks.some(c => c.tone === "bad")) return "bad"; if (checks.filter(c => c.tone === "warn").length > 1) return "warn"; return "good"; }
