import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { dayLabel, fmtBase, inCurrency } from "@/lib/trip/derive";
import { fmtMoney } from "@/lib/money";
import { Pill } from "@/components/ui";

export default async function BookingDetail({ params }: { params: Promise<{ tripId: string; bookingId: string }> }) {
  const { tripId, bookingId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const bk = b.bookings.find(x => x.id === bookingId); if (!bk) notFound(); const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const items = b.items.filter(i => i.booking_id === bk.id); const doc = b.documents.find(d => d.id === bk.document_id); const exp = b.expenses.find(e => e.booking_id === bk.id);
  return (
    <div className="mx-auto max-w-[600px]">
      <Link href={`${base}/bookings`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("more.bookings")}</Link>
      <div className="mb-4 flex items-start justify-between gap-3"><div><div className="eyebrow">{bk.provider}</div><h1 className="text-[26px] leading-tight">{bk.title}</h1>{bk.reference && <p className="text-[14.5px] text-ink-2">{t("ui.ref")} <span className="font-mono">{bk.reference}</span></p>}</div><Pill tone={bk.status === "confirmed" ? "good" : "warn"}>{bk.status}</Pill></div>
      <div className="card">{Object.entries(bk.details || {}).map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-t border-line-2 py-2 first:border-t-0"><span className="text-[12.5px] text-ink-3">{k}</span><b className="text-right">{v}</b></div>)}
        {bk.cost_minor != null && <div className="flex justify-between border-t border-line-2 py-2"><span className="text-[12.5px] text-ink-3">{t("ui.cost")}</span><b>{fmtBase(b, bk.cost_minor)} <span className="text-[12px] font-normal text-ink-3">≈ {inCurrency(b, bk.cost_minor, rc)}</span></b></div>}
        {bk.cost_home_minor != null && <div className="flex justify-between border-t border-line-2 py-2"><span className="text-[12.5px] text-ink-3">{t("ui.cost")}</span><b>{fmtMoney(bk.cost_home_minor, b.trip.home_currency)} <span className="text-[12px] font-normal text-ink-3">{t("ui.paidBefore")}</span></b></div>}
        {bk.note && <p className="mt-2 text-[12.5px] text-ink-3">{bk.note}</p>}</div>
      <div className="card mt-3"><div className="eyebrow mb-2">{t("ui.connected")}</div><div className="flex flex-wrap gap-1.5">{items.map(i => <Link key={i.id} href={`${base}/plan/${i.id}`} className="pill pill-teal">📅 {i.title} · {dayLabel(b.trip, i.day, locale)}</Link>)}{doc && <Link href={`${base}/documents`} className="pill pill-teal">📄 {doc.name}</Link>}{exp && <Link href={`${base}/money/${exp.id}`} className="pill pill-teal">💰 {fmtBase(b, exp.base_minor)}</Link>}{bk.paid_minor != null && !exp && <Link href={`${base}/money?tab=expenses`} className="pill pill-teal">💰 Deposit {fmtBase(b, bk.paid_minor)} paid</Link>}{items[0]?.place_id && <Link href={`${base}/map?focus=${items[0].place_id}`} className="pill pill-teal">📍 Map</Link>}</div></div>
    </div>
  );
}
