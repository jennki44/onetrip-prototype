import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { budgetBase, dayLabel, decTitle, fmtTime, inCurrency, itemTitle, nowSlots, photoOf, place, placeName, spentBase, votersOf, netBalances, plan } from "@/lib/trip/derive";
import { Bar, Eyebrow, PageHead } from "@/components/ui";

export default async function Today({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound();
  const now = demoNow(b.trip); const { day, current, next, later } = nowSlots(b, now); const base = `/t/${tripId}`;
  const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const spent = spentBase(b), bud = budgetBase(b);
  const openForMe = b.decisions.filter(d => d.status !== "confirmed" && !b.votes.some(v => v.decision_id === d.id && v.user_id === user?.id));
  const me = user?.id; const net = netBalances(b); const mine = plan(b).filter(p => p.fromUserId === me || p.toUserId === me);
  const nameOf = (id: string) => b.members.find(m => m.user_id === id)?.profile.name || "";
  const balanceText = Math.abs(net[me || ""] || 0) < 1 ? "You're settled up with everyone." : mine.map(p => p.fromUserId === me ? `You owe ${nameOf(p.toUserId)} ${inCurrency(b, p.amountMinor, rc)}` : `${nameOf(p.fromUserId)} owes you ${inCurrency(b, p.amountMinor, rc)}`).join(" · ");
  const block = (label: string, i: typeof current, extra?: string) => i ? (
    <section className="mt-5"><Eyebrow>{label}</Eyebrow>
      <Link href={`${base}/plan/${i.id}`} className="card flex items-center gap-3.5">
        {photoOf(b, i) ? <img src={photoOf(b, i)!} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="text-[2rem]">{i.emoji}</span>}
        <div className="min-w-0 flex-1"><div className="font-display text-[1.25rem] font-bold leading-tight">{itemTitle(i, locale)}</div><div className="text-[0.875rem] text-ink-2">{fmtTime(i.start_time, locale)}{place(b, i.place_id) ? ` · ${placeName(place(b, i.place_id), locale)}` : ""}</div>{extra && <div className="mt-1 text-[0.7813rem] text-ink-3">{extra}</div>}</div><span className="text-ink-3">›</span>
      </Link></section>) : null;
  return (
    <div>
      <PageHead title={t("common.today")} sub={day >= 1 ? dayLabel(b.trip, day, locale, true) : dayLabel(b.trip, 1, locale, true)} right={<Link href={`${base}/travel`} className="btn btn-outline btn-sm">🧭 {t("home.travelMode")}</Link>} />
      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div>
          {current ? block(t("today.now"), current, `${t("common.done")} ${fmtTime(current.end_time || current.start_time, locale)}`) : <section className="mt-5"><Eyebrow>{t("today.now")}</Eyebrow><div className="card bg-surface-2 shadow-none"><b>{next ? t("today.free", { time: fmtTime(next.start_time, locale) }) : t("today.nothing")}</b></div></section>}
          {block(t("today.next"), next, next?.travel_min ? `🚗 ${t("home.minAway", { n: next.travel_min })}${next.booking === "booked" ? " · 🎟" : ""}` : undefined)}
          {later.length > 0 && <section className="mt-5"><Eyebrow>{t("today.later")}</Eyebrow><div className="card divide-y divide-line-2 p-0">{later.map(i => <Link key={i.id} href={`${base}/plan/${i.id}`} className="flex items-center gap-3 px-4 py-3">{photoOf(b, i) ? <img src={photoOf(b, i)!} alt="" className="thumb h-10 w-10 rounded-xl" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{i.emoji}</span>}<div className="min-w-0 flex-1"><div className="font-bold">{itemTitle(i, locale)}</div><div className="text-[0.8125rem] text-ink-2">{fmtTime(i.start_time, locale)}{place(b, i.place_id) ? ` · ${placeName(place(b, i.place_id), locale)}` : ""}</div></div>{i.cost_minor ? <span className="text-[0.7813rem] text-ink-3">{inCurrency(b, i.cost_minor, rc)}</span> : null}</Link>)}</div></section>}
        </div>
        <div>
          <section className="mt-5"><Eyebrow action={{ href: `${base}/money`, label: t("common.open") }}>{t("today.tripMoney")}</Eyebrow>
            <div className="card"><div className="text-[0.7813rem] text-ink-3">{t("today.youSpent")}</div><div className="flex items-baseline gap-1.5"><span className="num font-display text-[1.875rem] font-bold">{inCurrency(b, spent, rc, { decimals: 0 })}</span>{bud != null && <span className="text-ink-2">/ {inCurrency(b, bud, rc, { decimals: 0 })}</span>}</div>{bud != null && <div className="mt-3"><Bar pct={spent / bud * 100} /></div>}<div className="mt-2 text-[0.7813rem] text-ink-3">{balanceText}</div></div></section>
          {openForMe.length > 0 && <section className="mt-5"><Eyebrow>{t("today.action")}</Eyebrow>{openForMe.map(d => <Link key={d.id} href={`${base}/decisions/${d.id}`} className="card mb-2 flex items-center gap-3"><span className="text-[1.5rem]">🗳</span><div className="flex-1"><b>{t("today.vote", { title: decTitle(d, locale) })}</b><div className="text-[0.7813rem] text-ink-3">{votersOf(b, d).size} / {b.members.length}</div></div><span className="text-ink-3">›</span></Link>)}</section>}
        </div>
      </div>
    </div>
  );
}
