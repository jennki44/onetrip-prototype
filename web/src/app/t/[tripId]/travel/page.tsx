import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { budgetBase, dayLabel, fmtTime, inCurrency, netBalances, nowSlots, photoOf, place, plan, spentBase } from "@/lib/trip/derive";

export default async function TravelMode({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const { day, current, next, later } = nowSlots(b, demoNow(b.trip)); const after = later[0] || null;
  const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const me = user?.id || ""; const net = netBalances(b)[me] || 0; const mine = plan(b).filter(p => p.fromUserId === me || p.toUserId === me);
  const nameOf = (id: string) => b.members.find(m => m.user_id === id)?.profile.name || "";
  const money = Math.abs(net) < 1 ? "You're settled up" : mine.map(p => p.fromUserId === me ? `You owe ${nameOf(p.toUserId)}: ${inCurrency(b, p.amountMinor, rc)}` : `${nameOf(p.fromUserId)} owes you: ${inCurrency(b, p.amountMinor, rc)}`).join(" · ");
  const block = (label: string, i: typeof current, now?: boolean) => i ? <Link href={`${base}/plan/${i.id}`} className={`mt-3.5 flex items-center gap-4 rounded-[22px] p-5 shadow-card ${now ? "bg-teal text-white" : "bg-surface"}`}>{photoOf(b, i) ? <img src={photoOf(b, i)!} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="text-[40px]">{i.emoji}</span>}<div className="min-w-0 flex-1"><div className={`eyebrow ${now ? "text-white/85" : ""}`}>{label}</div><div className="font-display text-[22px] font-bold leading-tight">{i.title}</div><div className={`text-[16px] ${now ? "text-white/85" : "text-ink-2"}`}>{fmtTime(i.start_time, locale)}{place(b, i.place_id) ? ` · ${place(b, i.place_id)!.name}` : ""}{i.travel_min && !now ? ` · ${i.travel_min} min` : ""}</div></div></Link> : null;
  return (
    <div className="mx-auto max-w-[520px] pb-8">
      <div className="flex items-center justify-between"><div><div className="eyebrow">{t("travel.title")}</div><h1 className="text-[32px]">{day >= 1 ? dayLabel(b.trip, day, locale, true) : b.trip.name}</h1></div><Link href={base} className="btn btn-outline btn-sm">{t("travel.exit")}</Link></div>
      {current ? block(t("travel.now"), current, true) : <div className="mt-3.5 flex items-center gap-4 rounded-[22px] bg-teal p-5 text-white shadow-card"><span className="text-[40px]">☕</span><div><div className="eyebrow text-white/85">{t("travel.now")}</div><div className="font-display text-[22px] font-bold">{t("travel.freeTime")}</div><div className="text-[16px] text-white/85">{next ? `${t("travel.next")} ${fmtTime(next.start_time, locale)}` : ""}</div></div></div>}
      {block(t("travel.next"), next)}{block(t("travel.after"), after)}
      <Link href={`${base}/money?tab=balances`} className="mt-3.5 flex items-center gap-4 rounded-[22px] bg-surface p-5 shadow-card"><span className="text-[40px]">💵</span><div className="min-w-0 flex-1"><div className="eyebrow">{t("money.title")}</div><div className="font-display text-[22px] font-bold leading-tight">{money}</div><div className="text-[16px] text-ink-2">{t("home.spent")} {inCurrency(b, spentBase(b), rc, { decimals: 0 })}{budgetBase(b) != null ? ` / ${inCurrency(b, budgetBase(b)!, rc, { decimals: 0 })}` : ""}</div></div></Link>
      <div className="mt-3.5 grid grid-cols-2 gap-3"><Link href={`${base}/map`} className="btn rounded-[18px] py-4 text-[17px]">🗺 {t("nav.map")}</Link><Link href={`${base}/brain`} className="btn btn-teal rounded-[18px] py-4 text-[17px]">✨ Trip Brain</Link><Link href={`${base}/money/scan`} className="btn rounded-[18px] py-4 text-[17px]">🧾 {t("money.scan")}</Link><Link href={`${base}/documents`} className="btn rounded-[18px] py-4 text-[17px]">📄 {t("more.documents")}</Link></div>
    </div>
  );
}
