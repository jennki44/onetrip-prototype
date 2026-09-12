import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { dayLabel, fmtTime, inCurrency, photoOf, place } from "@/lib/trip/derive";
import { Avatar, Pill } from "@/components/ui";

export default async function ItemDetail({ params }: { params: Promise<{ tripId: string; itemId: string }> }) {
  const { tripId, itemId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound(); const i = b.items.find(x => x.id === itemId); if (!i) notFound();
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const pl = place(b, i.place_id); const bk = b.bookings.find(x => x.id === i.booking_id); const dec = b.decisions.find(d => d.id === i.decision_id);
  const exps = b.expenses.filter(e => e.item_id === i.id || (i.place_id && e.place_id === i.place_id && e.date === b.trip.start_date.replace(/\d+$/, m => String(Number(m) + i.day - 1).padStart(2, "0"))));
  const docs = b.documents.filter(d => (d.linked_type === "booking" && d.linked_id === i.booking_id) || (d.linked_type === "item" && d.linked_id === i.id));
  const ph = photoOf(b, i);
  const tone = i.status === "confirmed" ? "good" : i.status === "voting" ? "warn" : i.status === "cancelled" ? "bad" : i.status === "proposed" ? "teal" : undefined;
  return (
    <div>
      <Link href={`${base}/plan?day=${i.day}`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("plan.title")}</Link>
      {ph && <img src={ph} alt="" className="mb-3 h-[190px] w-full rounded-[20px] object-cover md:h-[260px]" />}
      <div className="mb-4 flex items-start gap-3.5"><span className="text-[44px]">{i.emoji}</span><div className="flex-1"><h1 className="text-[28px] leading-tight">{i.title}</h1><p className="text-[14.5px] text-ink-2">{dayLabel(b.trip, i.day, locale, true)} · {fmtTime(i.start_time, locale)}{i.end_time && i.end_time !== i.start_time ? ` – ${fmtTime(i.end_time, locale)}` : ""}</p><div className="mt-2 flex flex-wrap gap-1.5"><Pill tone={tone}>{t(`status.${i.status}`)}</Pill>{i.booking === "booked" && <Pill tone="good">🎟 {t("status.booked")}</Pill>}{i.booking === "needed" && <Pill tone="bad">{t("status.notBooked")}</Pill>}{i.cost_minor ? <Pill>est. {inCurrency(b, i.cost_minor, rc)}</Pill> : null}</div></div><Link href={`${base}/plan/${i.id}/edit`} className="btn btn-outline btn-sm">{t("common.edit")}</Link></div>
      <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
        <div>
          {pl && <Link href={`${base}/map?focus=${pl.id}`} className="card flex items-center justify-between"><div><div className="eyebrow mb-1">Place</div><b>{pl.emoji} {pl.name}</b><div className="text-[12.5px] text-ink-3">{pl.area}{pl.rating ? ` · ⭐ ${pl.rating}` : ""}{pl.price_level ? ` · ${pl.price_level}` : ""}{pl.from_hotel_min != null ? ` · ${pl.from_hotel_min} min` : ""}</div></div><span className="text-ink-3">›</span></Link>}
          <div className="card mt-3"><div className="eyebrow mb-2">{t("item.who")}</div><div className="flex flex-wrap gap-1.5">{b.members.filter(m => i.participant_ids.includes(m.user_id)).map(m => <span key={m.user_id} className="pill pl-0.5"><Avatar p={m.profile} size="sm" /> {m.profile.name}</span>)}</div>
            {i.travel_min ? <div className="mt-3 border-t border-line-2 pt-3 text-[13px] text-ink-2">🚗 {t("item.fromPrevious", { n: i.travel_min })}</div> : null}
            {i.address && <div className="mt-2 text-[13px] text-ink-2">📍 {i.address}</div>}
            {i.note && <div className="mt-2 text-[13px] text-ink-2">📝 {i.note}</div>}
            {i.flag && <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-[13px]">📌<span>{i.flag}</span></div>}</div>
        </div>
        <div>
          <div className="card mt-3 md:mt-0"><div className="eyebrow mb-2">{t("item.connected")}</div>
            <div className="divide-y divide-line-2">
              {bk ? <Link href={`${base}/bookings/${bk.id}`} className="flex items-center gap-3 py-3"><span className="text-[19px]">🎟</span><div className="flex-1"><b>{bk.title}</b><div className="text-[12.5px] text-ink-3">{bk.reference ? `Ref ${bk.reference} · ` : ""}{bk.status}</div></div><span className="text-ink-3">›</span></Link>
                : i.booking === "needed" ? <div className="flex items-center gap-3 py-3"><span className="text-[19px]">🎟</span><div className="flex-1"><b className="text-bad">{t("item.bookingMissing")}</b><div className="text-[12.5px] text-ink-3">{t("item.dropConfirmation")}</div></div><Link href={`${base}/inbox?for=${i.id}`} className="btn btn-sun btn-sm">{t("item.resolve")}</Link></div> : null}
              {dec && <Link href={`${base}/decisions/${dec.id}`} className="flex items-center gap-3 py-3"><span className="text-[19px]">🗳</span><div className="flex-1"><b>{dec.title}</b><div className="text-[12.5px] text-ink-3">{t(`decisions.${dec.status === "confirmed" ? "confirmed" : "needsVotes"}`)}</div></div><span className="text-ink-3">›</span></Link>}
              {exps.map(e => <Link key={e.id} href={`${base}/money/${e.id}`} className="flex items-center gap-3 py-3"><span className="text-[19px]">💰</span><div className="flex-1"><b>{inCurrency(b, e.base_minor, b.trip.base_currency)} · {e.merchant}</b><div className="text-[12.5px] text-ink-3">{t("money.paidBy", { name: b.members.find(m => m.user_id === e.payer_id)?.profile.name || "" })}</div></div><span className="text-ink-3">›</span></Link>)}
              {docs.map(d => <Link key={d.id} href={`${base}/documents`} className="flex items-center gap-3 py-3"><span className="text-[19px]">📄</span><div className="flex-1"><b>{d.name}</b><div className="text-[12.5px] text-ink-3">{d.category}</div></div><span className="text-ink-3">›</span></Link>)}
              {!bk && i.booking !== "needed" && !dec && !exps.length && !docs.length && <p className="py-2 text-[12.5px] text-ink-3">{t("item.nothingLinked")}</p>}
            </div></div>
          <div className="mt-4 flex gap-2.5"><Link href={`${base}/money/scan?for=${i.id}`} className="btn flex-1">🧾 {t("item.addReceipt")}</Link><Link href={`${base}/map?focus=${pl?.id || ""}`} className="btn flex-1">🗺 {t("item.map")}</Link></div>
        </div>
      </div>
    </div>
  );
}
