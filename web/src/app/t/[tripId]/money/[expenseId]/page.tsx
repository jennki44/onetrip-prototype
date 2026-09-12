import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { fmtTime, inCurrency, place, rate } from "@/lib/trip/derive";
import { Avatar } from "@/components/ui";

export default async function ExpenseDetail({ params }: { params: Promise<{ tripId: string; expenseId: string }> }) {
  const { tripId, expenseId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const e = b.expenses.find(x => x.id === expenseId); if (!e) notFound(); const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const shares = b.shares.filter(s => s.expense_id === e.id); const payer = b.members.find(m => m.user_id === e.payer_id)?.profile; const pl = place(b, e.place_id); const item = b.items.find(i => i.id === e.item_id); const bk = b.bookings.find(x => x.id === e.booking_id);
  return (
    <div className="mx-auto max-w-[600px]">
      <Link href={`${base}/money?tab=expenses`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("money.expenses")}</Link>
      <div className="mb-4 flex items-start gap-3.5"><span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-surface-2 text-[26px]">{e.emoji || "💰"}</span><div><h1 className="text-[28px] leading-tight">{e.merchant}</h1><p className="text-[14.5px] text-ink-2">{new Date(e.date + "T00:00:00").toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "long", day: "numeric", month: "long" })}{e.time ? ` · ${fmtTime(e.time.slice(0, 5), locale)}` : ""} · {t(`money.categories.${e.category}`)}</p></div></div>
      <div className="card"><div className="num font-display text-[30px] font-bold">{inCurrency(b, e.amount_minor, e.currency)} <span className="text-[12px] font-normal text-ink-3">{e.currency}</span></div>{e.currency !== rc && <div className="text-ink-2">{t("money.approx")} <b>{inCurrency(b, e.base_minor, rc)}</b></div>}<div className="mt-2 text-[12.5px] text-ink-3">{t("money.rate")}: 1 {b.trip.base_currency} = {rate(b.trip.base_currency, rc).toFixed(2)} {rc} · {t("money.original")}</div><div className="mt-3 flex items-center gap-2 border-t border-line-2 pt-3 text-[13px]"><span className="text-ink-3">{t("money.payer")}</span>{payer && <Avatar p={payer} size="sm" />}<b>{payer?.name}</b><span className="ml-auto text-ink-3">{t("money.split")}: {t(`money.splitTypes.${e.split}`)}</span></div></div>
      <div className="card mt-3"><div className="eyebrow mb-2">{t("money.eachShare")}</div>{shares.map(s => { const p = b.members.find(m => m.user_id === s.user_id)?.profile; return <div key={s.user_id} className="flex items-center justify-between border-t border-line-2 py-1.5 first:border-t-0"><span className="flex items-center gap-2">{p && <Avatar p={p} size="sm" />} {p?.name}</span><span className="num"><b>{inCurrency(b, s.share_minor, b.trip.base_currency)}</b> <span className="text-[12px] text-ink-3">≈ {inCurrency(b, s.share_minor, rc)}</span></span></div>; })}</div>
      {e.note && <div className="card mt-3 text-[14px]">📝 {e.note}</div>}
      <div className="card mt-3"><div className="eyebrow mb-2">Connected</div><div className="flex flex-wrap gap-1.5">{pl && <Link href={`${base}/map?focus=${pl.id}`} className="pill pill-teal">📍 {pl.name}</Link>}{item && <Link href={`${base}/plan/${item.id}`} className="pill pill-teal">📅 {item.title}</Link>}{bk && <Link href={`${base}/bookings/${bk.id}`} className="pill pill-teal">🎟 {bk.title}</Link>}<Link href={`${base}/money`} className="pill pill-teal">💵 {t(`money.categories.${e.category}`)}</Link><Link href={`${base}/money?tab=balances`} className="pill pill-teal">⚖️ {t("money.balances")}</Link></div></div>
    </div>
  );
}
