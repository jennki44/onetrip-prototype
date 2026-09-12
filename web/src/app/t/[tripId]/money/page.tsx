import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { budgetBase, catBudgetBase, dayCount, dayDate, forecastBase, inCurrency, netBalances, nowSlots, plan, spentBase, spentByCategory, fmtBase , isoDate } from "@/lib/trip/derive";
import { Avatar, Bar, Empty, PageHead } from "@/components/ui";
import { CurrencyPicker } from "@/components/CurrencyPicker";

const CAT_COLORS: Record<string, string> = { Accommodation: "#1fae9f", Food: "#ff6b4a", Activities: "#6d28d9", Transport: "#2457c5", Shopping: "#be185d", Other: "#8a9c9a" };
const CAT_EMOJI: Record<string, string> = { Accommodation: "🏨", Food: "🍽️", Activities: "🎟️", Transport: "🚗", Shopping: "🛍️", Other: "📦" };

function Tab({ base, tab, k, label }: { base: string; tab: string; k: string; label: string }) { return <Link href={`${base}/money?tab=${k}`} className={`flex-1 rounded-lg px-3 py-2 text-center text-[13.5px] font-extrabold ${tab === k ? "bg-surface shadow-card" : "text-ink-3"}`}>{label}</Link>; }

export default async function Money({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ tab?: string; payer?: string; cat?: string }> }) {
  const { tripId } = await params; const sp = await searchParams;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const tab = sp.tab === "expenses" || sp.tab === "balances" ? sp.tab : "overview";
  const me = b.members.find(m => m.user_id === user?.id); const rc = me?.profile.reporting_currency || b.trip.home_currency;
  const day = nowSlots(b, demoNow(b.trip)).day; const spent = spentBase(b), bud = budgetBase(b), fc = forecastBase(b, day); const cats = spentByCategory(b);
  const nameOf = (id: string) => b.members.find(m => m.user_id === id)?.profile.name || "";
  return (
    <div>
      <PageHead title={t("money.title")} sub={`${b.trip.base_currency} → ${rc}`} right={<div className="flex items-center gap-2"><CurrencyPicker tripId={tripId} current={rc} /><Link href={`${base}/money/new`} className="btn btn-sun btn-sm">+ {t("money.addExpense")}</Link></div>} />
      <div className="mb-4 flex rounded-xl bg-surface-2 p-1"><Tab base={base} tab={tab} k="overview" label={t("money.overview")} /><Tab base={base} tab={tab} k="expenses" label={t("money.expenses")} /><Tab base={base} tab={tab} k="balances" label={t("money.balances")} /></div>

      {tab === "overview" && (
        <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
          <div>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {[[t("money.tripBudget"), bud != null ? inCurrency(b, bud, rc, { decimals: 0 }) : "—", `${b.members.length} ${t("common.travellers")}`], [t("home.spent"), inCurrency(b, spent, rc, { decimals: 0 }), `${fmtBase(b, spent)}${bud ? ` · ${Math.round(spent / bud * 100)}%` : ""}`], [t("home.remaining"), bud != null ? inCurrency(b, bud - spent, rc, { decimals: 0 }) : "—", ""], [t("home.forecast"), inCurrency(b, fc, rc, { decimals: 0 }), bud != null ? (fc > bud ? t("ui.over", { amount: inCurrency(b, fc - bud, rc, { decimals: 0 }) }) : t("ui.under", { amount: inCurrency(b, bud - fc, rc, { decimals: 0 }) })) : ""]].map(([l, v, s], k) => <div key={k} className="card px-4 py-3.5"><div className="eyebrow mb-1">{l}</div><div className={`num font-display text-[22px] font-bold ${k === 2 ? "text-good" : k === 3 && bud != null && fc > bud ? "text-warn" : ""}`}>{v}</div><div className="text-[12.5px] text-ink-2">{s}</div></div>)}
            </div>
            {bud != null && fc > bud && <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-[14px]">⚠️<span>{t("home.over", { amount: inCurrency(b, fc - bud, rc, { decimals: 0 }) })}</span></div>}
            <div className="card mt-3"><div className="eyebrow mb-2">{t("money.byDay")}</div>{(() => { const n = dayCount(b.trip); const byDay = Array.from({ length: n }, (_, i) => { const ds = isoDate(dayDate(b.trip, i + 1)); return b.expenses.filter(e => e.date === ds).reduce((a, e) => a + e.base_minor, 0); }); const mx = Math.max(...byDay, 1); return <svg viewBox={`0 0 ${n * 33} 56`} className="h-14 w-full" preserveAspectRatio="none">{byDay.map((v, i) => <rect key={i} x={i * 33 + 4} y={56 - v / mx * 50} width="26" height={v / mx * 50} rx="4" fill={i + 1 === day ? "var(--coral)" : i + 1 < day ? "var(--teal)" : "var(--line)"} />)}</svg>; })()}</div>
          </div>
          <div className="card mt-3 md:mt-0"><div className="eyebrow mb-3">{t("money.byCategory")}</div>
            {Object.keys(b.trip.budget_categories || {}).map(c => { const v = cats[c] || 0; const cb = catBudgetBase(b, c); const pct = cb ? v / cb * 100 : 0; return <div key={c} className="border-t border-line-2 py-2.5 first:border-t-0"><div className="mb-1.5 flex items-center justify-between text-[14px]"><span>{CAT_EMOJI[c]} {t(`money.categories.${c}`)}</span><span className="num text-[12.5px]"><b>{inCurrency(b, v, rc, { decimals: 0 })}</b> / {inCurrency(b, cb, rc, { decimals: 0 })}</span></div><Bar pct={pct} tone={pct > 100 ? "bad" : pct > 80 ? "warn" : undefined} /></div>; })}
          </div>
        </div>
      )}

      {tab === "expenses" && (b.expenses.length ? (() => { const list = [...b.expenses].sort((x, y) => (y.date + (y.time || "")).localeCompare(x.date + (x.time || ""))); const groups = new Map<string, typeof list>(); for (const e of list) { const d = new Date(e.date + "T00:00:00"); const key = d.toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "long", day: "numeric", month: "short" }); groups.set(key, [...(groups.get(key) || []), e]); } return <div>{[...groups.entries()].map(([k, es]) => <section key={k} className="mb-4"><div className="eyebrow mb-2 flex justify-between"><span>{k}</span><span>{inCurrency(b, es.reduce((a, e) => a + e.base_minor, 0), rc)}</span></div><div className="card divide-y divide-line-2 p-0">{es.map(e => <Link key={e.id} href={`${base}/money/${e.id}`} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[19px]">{e.emoji || CAT_EMOJI[e.category] || "💰"}</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{e.merchant}</div><div className="text-[13px] text-ink-2">{t("money.paidBy", { name: nameOf(e.payer_id) })} · {b.shares.filter(s => s.expense_id === e.id).length} {t("common.people")}{e.receipt_id ? " · 🧾" : ""}</div></div><div className="text-right"><div className="num font-display font-bold">{inCurrency(b, e.amount_minor, e.currency)}</div>{e.currency !== rc && <div className="text-[12px] text-ink-3">≈ {inCurrency(b, e.base_minor, rc)}</div>}</div></Link>)}</div></section>)}</div>; })() : <Empty emoji="💵" title={t("money.empty")} sub={t("money.emptySub")} action={<Link href={`${base}/money/new`} className="btn btn-sun">{t("money.addExpense")}</Link>} />)}

      {tab === "balances" && (() => { const net = netBalances(b); const pl = plan(b); const outstanding = pl.reduce((a, p) => a + p.amountMinor, 0); return (
        <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
          <div><div className="eyebrow mb-2">{t("money.whoOwes")}</div><div className="card divide-y divide-line-2 p-0">{b.members.map(m => { const v = net[m.user_id] || 0; const settled = Math.abs(v) < 1; return <div key={m.user_id} className="flex items-center gap-3 px-4 py-3"><Avatar p={m.profile} /><div className="flex-1"><div className="font-bold">{m.profile.name}{m.user_id === user?.id ? ` ${t("ui.you")}` : ""}</div><div className="text-[13px] text-ink-2">{settled ? t("money.settled") : v > 0 ? t("money.isOwed") : t("money.owes")}</div></div><div className={`num font-display text-[17px] font-bold ${settled ? "text-ink-3" : v > 0 ? "text-good" : "text-bad"}`}>{settled ? "✓" : inCurrency(b, Math.abs(v), rc)}</div></div>; })}</div><p className="mt-2 text-[12.5px] text-ink-3">{t("ui.balancesNote", { n: b.settlements.length })}</p></div>
          <div><div className="card mt-4 md:mt-0"><div className="eyebrow mb-2">{t("money.settleUp")}</div>{pl.length ? <><div className="text-[16px] font-bold">{t("money.payments", { n: pl.length })}</div><p className="text-[12.5px] text-ink-2">{t("money.outstanding")}: <b>{inCurrency(b, outstanding, rc)}</b></p><Link href={`${base}/money/settle`} className="btn btn-sun mt-3 w-full">{t("money.simplify")}</Link></> : <div className="text-[16px] font-bold">{t("ui.allSettledParty")}</div>}</div>
            <div className="card mt-3"><div className="eyebrow mb-2">{t("ui.paymentsMade")}</div>{b.settlements.length ? b.settlements.map(s => <div key={s.id} className="flex justify-between border-t border-line-2 py-1.5 text-[12.5px] first:border-t-0"><span>{nameOf(s.from_user)} → {nameOf(s.to_user)}</span><span className="num"><b>{fmtBase(b, s.amount_minor)}</b> · {new Date(s.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span></div>) : <p className="text-[12.5px] text-ink-3">{t("ui.noneYet")}</p>}</div></div>
        </div>); })()}
    </div>
  );
}
