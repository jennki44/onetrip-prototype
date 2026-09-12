/* Trip Brain v1: deterministic answers computed from the TripBundle. No model, no invention.
   Each handler returns HTML-safe strings assembled by the page; numbers come from the money engine. */
import type { TripBundle } from "@/lib/trip/derive";
import { budgetBase, catBudgetBase, committedBase, dayCount, dayLabel, fmtTime, forecastBase, inCurrency, itemsOnDay, leadingOption, minutes, netBalances, plan, place, spentBase, spentByCategory, votersOf } from "@/lib/trip/derive";

export interface Answer { html: string; actions?: { label: string; href: string }[]; note?: string }
export const SUGGESTIONS = ["What are we doing tomorrow?", "How much have we spent?", "Who owes me?", "What haven't we booked?", "Which day is the busiest?", "Are we over budget?", "How much have we spent on food?", "What still needs a decision?"];
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const tbl = (rows: [string, string][]) => `<table class="w-full text-[13.5px] mt-2">${rows.map(([k, v]) => `<tr class="border-t border-line-2"><td class="py-1">${k}</td><td class="py-1 text-right font-bold num">${v}</td></tr>`).join("")}</table>`;
const DAYNAMES: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export function answer(b: TripBundle, q: string, ctx: { today: number; me: string; rc: string; locale: string; base: string }): Answer {
  const l = q.toLowerCase(); const { today, me, rc, locale, base } = ctx; const money = (m: number, d?: number) => inCurrency(b, m, rc, d != null ? { decimals: d } : undefined);
  const name = (id: string) => b.members.find(m => m.user_id === id)?.profile.name || "someone";
  const dayFor = (offset: number) => Math.min(dayCount(b.trip), Math.max(1, (today >= 1 ? today : 1) + offset));
  if (l.includes("food") || l.includes("eat")) {
    const cats = spentByCategory(b); const food = b.expenses.filter(e => e.category === "Food"); const fb = catBudgetBase(b, "Food"); const left = fb - (cats.Food || 0); const daysLeft = Math.max(1, dayCount(b.trip) - Math.max(today, 0) + 1);
    return { html: `You've spent <b>${money(cats.Food || 0)}</b> on food so far across ${food.length} expenses.${tbl([["Food budget", money(fb, 0)], ["Remaining", money(left)], ["Per day for the rest of the trip", money(left / daysLeft)]])}<p class="mt-2">${left > 0 ? `That's ${Math.round((cats.Food || 0) / fb * 100)}% of the food budget with ${daysLeft} days to go.` : "You're over the food budget."}</p>`, actions: [{ label: "Open Money", href: `${base}/money` }], note: `Based on ${food.length} food expenses` };
  }
  if (l.includes("tomorrow") || l.includes("today") || l.includes("doing")) {
    const d = l.includes("tomorrow") ? dayFor(1) : dayFor(0); const items = itemsOnDay(b, d); const info = b.days.find(x => x.day === d);
    return { html: `<b>${dayLabel(b.trip, d, locale, true)}</b>${info?.theme ? ` — ${esc(info.theme)}` : ""}, ${items.length} plans.${tbl(items.map(i => [`${i.emoji} ${fmtTime(i.start_time, locale)} ${esc(i.title)}`, esc(place(b, i.place_id)?.area || "")]))}${info?.rule ? `<p class="mt-2">📌 ${esc(info.rule)}</p>` : ""}${items.some(i => i.booking === "needed") ? `<p class="mt-2"><b>${items.filter(i => i.booking === "needed").map(i => esc(i.title)).join(", ")} still has no booking.</b></p>` : ""}`, actions: [{ label: `Open ${dayLabel(b.trip, d, locale)}`, href: `${base}/plan?day=${d}` }] };
  }
  if (l.includes("owe")) {
    const net = netBalances(b); const pl = plan(b); const toMe = pl.filter(p => p.toUserId === me), fromMe = pl.filter(p => p.fromUserId === me);
    const head = toMe.length ? `<b>${toMe.map(p => `${name(p.fromUserId)} owes you ${money(p.amountMinor)}`).join(", ")}.</b>` : fromMe.length ? `You owe <b>${fromMe.map(p => `${name(p.toUserId)} ${money(p.amountMinor)}`).join(", ")}</b>.` : `<b>Nobody owes you anything right now.</b>`;
    return { html: head + tbl(b.members.map(m => [m.profile.name, Math.abs(net[m.user_id] || 0) < 1 ? "Settled" : `${net[m.user_id] > 0 ? "is owed" : "owes"} ${money(Math.abs(net[m.user_id]))}`])) + `<p class="mt-2">${pl.length} payment${pl.length === 1 ? "" : "s"} would clear everything.</p>`, actions: [{ label: "See balances", href: `${base}/money?tab=balances` }] };
  }
  if (l.includes("book")) {
    const need = b.items.filter(i => i.booking === "needed" && i.status !== "cancelled"); const done = b.bookings.filter(x => x.status === "confirmed").map(x => esc(x.title.split(" · ")[0]));
    return { html: need.length ? `${need.length} plan${need.length === 1 ? "" : "s"} still need${need.length === 1 ? "s" : ""} a booking:${tbl(need.map(i => [`${i.emoji} ${esc(i.title)}`, `${dayLabel(b.trip, i.day, locale)} ${fmtTime(i.start_time, locale)}`]))}<p class="mt-2">Already confirmed: ${done.join(", ") || "nothing yet"}.</p>` : "Everything that needs a booking has one. 🎉", actions: [{ label: "Trip Health", href: `${base}/health` }] };
  }
  if (l.includes("decid") || l.includes("vote")) {
    const open = b.decisions.filter(d => d.status !== "confirmed");
    return { html: open.length ? `${open.length} decision${open.length === 1 ? "" : "s"} still open:${tbl(open.map(d => { const lead = leadingOption(b, d); return [esc(d.title), `${votersOf(b, d).size}/${b.members.length} voted${lead ? ` · leading: ${esc((lead.place_id ? place(b, lead.place_id)?.name : lead.label) || "")}` : ""}`]; }))}` : "Nothing left to decide.", actions: open.map(d => ({ label: `Vote: ${d.title}`, href: `${base}/decisions/${d.id}` })).slice(0, 3) };
  }
  if (l.includes("busy") || l.includes("longest") || l.includes("too much")) {
    const load = Array.from({ length: dayCount(b.trip) }, (_, i) => i + 1).map(d => { const it = itemsOnDay(b, d); return { d, n: it.length, travel: it.reduce((a, x) => a + (x.travel_min || 0), 0) }; }).sort((x, y) => (y.n + y.travel / 30) - (x.n + x.travel / 30)); const t0 = load[0];
    return { html: `<b>${dayLabel(b.trip, t0.d, locale, true)}</b> is the heaviest day: ${t0.n} plans and about ${Math.round(t0.travel / 60 * 10) / 10} hours of travel.${tbl(load.slice(0, 4).map(x => [dayLabel(b.trip, x.d, locale), `${x.n} plans · ${x.travel} min`]))}`, actions: [{ label: "Open that day", href: `${base}/plan?day=${t0.d}` }] };
  }
  if (l.includes("budget") || l.includes("spent") || l.includes("spend")) {
    const spent = spentBase(b), bud = budgetBase(b), fc = forecastBase(b, today); const cats = spentByCategory(b);
    const head = bud == null ? `You've spent <b>${money(spent, 0)}</b> so far. No budget is set yet.` : fc > bud ? `<b>Forecast is about ${money(fc - bud, 0)} over the budget.</b>` : `<b>On track: forecast is ${money(bud - fc, 0)} under the budget.</b>`;
    return { html: head + tbl([["Budget", bud != null ? money(bud, 0) : "—"], ["Spent so far", money(spent, 0)], ["Committed, not yet paid", money(committedBase(b, today), 0)], ["Forecast", money(fc, 0)], ...Object.entries(cats).filter(([, v]) => v).sort((x, y) => y[1] - x[1]).map(([k, v]) => [`· ${k}`, money(v, 0)] as [string, string])]), note: `Assumes ${b.members.length} people and no new plans`, actions: [{ label: "Open Money", href: `${base}/money` }] };
  }
  const dayWord = Object.keys(DAYNAMES).find(k => l.includes(k));
  if (dayWord) { const d = Array.from({ length: dayCount(b.trip) }, (_, i) => i + 1).find(x => { const dt = new Date(b.trip.start_date + "T00:00:00"); dt.setDate(dt.getDate() + x - 1); return dt.getDay() === DAYNAMES[dayWord]; }); if (d) { const items = itemsOnDay(b, d); const gaps: string[] = []; for (let k = 1; k < items.length; k++) { const g = minutes(items[k].start_time) - minutes(items[k - 1].end_time || items[k - 1].start_time); if (g >= 60) gaps.push(`${fmtTime(items[k - 1].end_time || items[k - 1].start_time, locale)}–${fmtTime(items[k].start_time, locale)}`); } return { html: `<b>${dayLabel(b.trip, d, locale, true)}</b> has ${items.length} plans.${tbl(items.map(i => [`${i.emoji} ${fmtTime(i.start_time, locale)} ${esc(i.title)}`, esc(place(b, i.place_id)?.area || "")]))}<p class="mt-2">${gaps.length ? `Free windows: ${gaps.join(", ")}.` : "No gaps of an hour or more."}</p>`, actions: [{ label: "Open that day", href: `${base}/plan?day=${d}` }] }; } }
  return { html: `I can answer questions about this trip's itinerary, bookings, decisions, spending and balances — for example <i>“What are we doing tomorrow?”</i> or <i>“Who owes me?”</i>. I only use what's in the trip, so I won't guess.` };
}
