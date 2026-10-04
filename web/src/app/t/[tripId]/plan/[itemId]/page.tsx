import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { dayLabel, decTitle, fmtTime, inCurrency, itemFlag, itemNote, itemTitle, photoOf, place, placeName } from "@/lib/trip/derive";
import { Avatar, Pill } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { navUrl } from "@/lib/nav";
import { fmtMoney } from "@/lib/money";
import { setExpenseItem } from "../../money/actions";
import { removeItemPhoto, setItemCover } from "../actions";
import { ItemPhotoAdd } from "@/components/ItemPhotoAdd";

export default async function ItemDetail({ params }: { params: Promise<{ tripId: string; itemId: string }> }) {
  const { tripId, itemId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound(); const i = b.items.find(x => x.id === itemId); if (!i) notFound();
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const pl = place(b, i.place_id); const bk = b.bookings.find(x => x.id === i.booking_id); const dec = b.decisions.find(d => d.id === i.decision_id);
  const exps = b.expenses.filter(e => e.item_id === i.id); const spent = exps.reduce((a, e) => a + e.base_minor, 0);
  const unlinked = b.expenses.filter(e => e.item_id !== i.id).sort((x, y) => Number(!!x.item_id) - Number(!!y.item_id) || y.date.localeCompare(x.date));
  const titleOf = (id: string | null) => { const o = b.items.find(x => x.id === id); return o ? itemTitle(o, locale) : ""; };
  const where = pl?.address || i.address || null; const nav = navUrl({ lat: pl?.lat, lng: pl?.lng, address: where, name: pl ? pl.name : null, near: b.trip.destination });
  const album = b.itemPhotos?.[i.id] || []; const coverId = i.photo_url?.startsWith("doc:") ? i.photo_url.slice(4) : null;
  const canEdit = ["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user?.id)?.role || "");
  const docs = b.documents.filter(d => (d.linked_type === "booking" && d.linked_id === i.booking_id) || (d.linked_type === "item" && d.linked_id === i.id));
  const ph = photoOf(b, i);
  const tone = i.status === "confirmed" ? "good" : i.status === "voting" ? "warn" : i.status === "cancelled" ? "bad" : i.status === "proposed" ? "teal" : undefined;
  return (
    <div>
      <Link href={`${base}/plan?day=${i.day}`} className="mb-2 inline-block text-[0.875rem] font-extrabold text-ink-2">‹ {t("plan.title")}</Link>
      {ph && <img src={ph} alt="" className="mb-3 h-[190px] w-full rounded-[20px] object-cover md:h-[260px]" />}
      <div className="mb-4 flex items-start gap-3.5"><span className="text-[2.75rem]">{i.emoji}</span><div className="flex-1"><h1 className="text-[1.75rem] leading-tight">{itemTitle(i, locale)}</h1><p className="text-[0.9063rem] text-ink-2">{dayLabel(b.trip, i.day, locale, true)} · {fmtTime(i.start_time, locale)}{i.end_time && i.end_time !== i.start_time ? ` – ${fmtTime(i.end_time, locale)}` : ""}</p><div className="mt-2 flex flex-wrap gap-1.5"><Pill tone={tone}>{t(`status.${i.status}`)}</Pill>{i.booking === "booked" && <Pill tone="good">🎟 {t("status.booked")}</Pill>}{i.booking === "needed" && <Pill tone="bad">{t("status.notBooked")}</Pill>}{i.cost_minor ? <Pill>{t("ui.est")} {inCurrency(b, i.cost_minor, rc)}</Pill> : null}</div></div><Link href={`${base}/plan/${i.id}/edit`} className="btn btn-outline btn-sm">{t("common.edit")}</Link></div>
      <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
        <div>
          <div className="card"><div className="eyebrow mb-1">{t("item.where")}</div>
            {pl ? <Link href={`${base}/map?focus=${pl.id}`} className="flex items-center justify-between"><b>{pl.emoji} {placeName(pl, locale)}</b><span className="text-ink-3">›</span></Link> : null}
            {where ? <div className="mt-1 text-[0.9rem] text-ink-2">📍 {where}</div> : !pl ? <p className="text-[0.9rem] text-ink-2">{t("item.addWhere")}</p> : null}
            {pl && <div className="text-[0.7813rem] text-ink-3">{pl.area}{pl.rating ? ` · ⭐ ${pl.rating}` : ""}{pl.price_level ? ` · ${pl.price_level}` : ""}{pl.from_hotel_min != null ? ` · ${pl.from_hotel_min} min` : ""}</div>}
            <div className="mt-3 flex flex-wrap gap-2">{nav && <a href={nav} target="_blank" rel="noopener noreferrer" className="btn btn-teal btn-sm">{t("ui.map.navigate")}</a>}{pl && <Link href={`${base}/map?focus=${pl.id}`} className="btn btn-sm">🗺 {t("item.map")}</Link>}{canEdit && <Link href={`${base}/plan/${i.id}/edit#address`} className="btn btn-sm">✏️ {t("item.editAddress")}</Link>}</div>
          </div>
          <div className="card mt-3"><div className="eyebrow mb-2">{t("item.photos")}{album.length ? ` · ${album.length}` : ""}</div>
            {album.length > 0 && <div className="mb-3 grid grid-cols-3 gap-2">{album.map(ph2 => <div key={ph2.id} className="relative overflow-hidden rounded-xl bg-surface-2">
              <a href={ph2.url} target="_blank" rel="noopener noreferrer" className="block"><img src={ph2.url} alt={ph2.name} loading="lazy" className="aspect-square w-full object-cover" /></a>
              {coverId === ph2.id && <span className="absolute bottom-1 left-1 rounded-md bg-sun px-1.5 py-0.5 text-[0.6875rem] font-extrabold text-[#17302f]">★ {t("item.cover")}</span>}
              {canEdit && <div className="absolute right-1 top-1 flex gap-1">
                {coverId !== ph2.id && <form action={setItemCover}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="docId" value={ph2.id} /><button aria-label={t("item.setCover")} title={t("item.setCover")} className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(12,20,24,.7)] text-white">★</button></form>}
                {(ph2.added_by === user?.id || ["owner", "admin"].includes(b.members.find(m => m.user_id === user?.id)?.role || "")) && <form action={removeItemPhoto}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="docId" value={ph2.id} /><ConfirmButton message={t("item.removePhotoConfirm")} className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(12,20,24,.7)] text-white">✕</ConfirmButton></form>}
              </div>}
            </div>)}</div>}
            {canEdit && <ItemPhotoAdd tripId={tripId} itemId={i.id} />}
            <p className="mt-2 text-[0.75rem] text-ink-3">{t("item.photosHint")}</p>
          </div>
          <div className="card mt-3"><div className="eyebrow mb-2">{t("item.who")}</div><div className="flex flex-wrap gap-1.5">{b.members.filter(m => i.participant_ids.includes(m.user_id)).map(m => <span key={m.user_id} className="pill pl-0.5"><Avatar p={m.profile} size="sm" /> {m.profile.name}</span>)}</div>
            {i.travel_min ? <div className="mt-3 border-t border-line-2 pt-3 text-[0.8125rem] text-ink-2">🚗 {t("item.fromPrevious", { n: i.travel_min })}</div> : null}
            {itemNote(i, locale) && <div className="mt-2 text-[0.8125rem] text-ink-2">📝 {itemNote(i, locale)}</div>}
            {itemFlag(i, locale) && <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-[0.8125rem]">📌<span>{itemFlag(i, locale)}</span></div>}</div>
        </div>
        <div>
          <div className="card mt-3 md:mt-0"><div className="eyebrow mb-2">{t("item.connected")}</div>
            <div className="divide-y divide-line-2">
              {bk ? <Link href={`${base}/bookings/${bk.id}`} className="flex items-center gap-3 py-3"><span className="text-[1.1875rem]">🎟</span><div className="flex-1"><b>{bk.title}</b><div className="text-[0.7813rem] text-ink-3">{bk.reference ? `Ref ${bk.reference} · ` : ""}{bk.status}</div></div><span className="text-ink-3">›</span></Link>
                : i.booking === "needed" ? <div className="flex items-center gap-3 py-3"><span className="text-[1.1875rem]">🎟</span><div className="flex-1"><b className="text-bad">{t("item.bookingMissing")}</b><div className="text-[0.7813rem] text-ink-3">{t("item.dropConfirmation")}</div></div><Link href={`${base}/inbox?for=${i.id}`} className="btn btn-sun btn-sm">{t("item.resolve")}</Link></div> : null}
              {dec && <Link href={`${base}/decisions/${dec.id}`} className="flex items-center gap-3 py-3"><span className="text-[1.1875rem]">🗳</span><div className="flex-1"><b>{decTitle(dec, locale)}</b><div className="text-[0.7813rem] text-ink-3">{t(`decisions.${dec.status === "confirmed" ? "confirmed" : "needsVotes"}`)}</div></div><span className="text-ink-3">›</span></Link>}
              {docs.map(d => <Link key={d.id} href={`${base}/documents`} className="flex items-center gap-3 py-3"><span className="text-[1.1875rem]">📄</span><div className="flex-1"><b>{d.name}</b><div className="text-[0.7813rem] text-ink-3">{d.category}</div></div><span className="text-ink-3">›</span></Link>)}
              {!bk && i.booking !== "needed" && !dec && !docs.length && <p className="py-2 text-[0.7813rem] text-ink-3">{t("item.nothingLinked")}</p>}
            </div></div>
          <div className="card mt-3"><div className="eyebrow mb-2 flex items-center justify-between"><span>{t("item.spending")}</span>{exps.length > 0 && <span className="num normal-case tracking-normal text-[0.9rem] font-extrabold text-ink">{t("item.spendTotal")}: {inCurrency(b, spent, b.trip.base_currency)}</span>}</div>
            {exps.length ? <div className="divide-y divide-line-2">{exps.map(e => <div key={e.id} className="flex items-center gap-2 py-2.5"><Link href={`${base}/money/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3"><span className="text-[1.1875rem]">{e.emoji || "💰"}</span><span className="min-w-0 flex-1"><b className="block truncate">{e.merchant}</b><span className="block text-[0.7813rem] text-ink-3">{fmtMoney(e.amount_minor, e.currency)} · {t("money.paidBy", { name: b.members.find(m => m.user_id === e.payer_id)?.profile.name || "" })}{e.receipt_id ? " · 🧾" : ""}</span></span></Link>{canEdit && <form action={setExpenseItem}><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="expenseId" value={e.id} /><input type="hidden" name="itemId" value="" /><input type="hidden" name="back" value="item" /><input type="hidden" name="backItem" value={i.id} /><ConfirmButton message={t("item.unlink") + "?"} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink-3">✕</ConfirmButton></form>}</div>)}</div> : <p className="text-[0.85rem] text-ink-3">{t("item.noSpending")}</p>}
            {canEdit && <div className="mt-3 flex flex-col gap-2 border-t border-line-2 pt-3">
              <Link href={`${base}/money/scan?for=${i.id}`} className="btn btn-sun w-full">🧾 {t("item.addReceipt")}</Link>
              {unlinked.length ? <form action={setExpenseItem} className="flex flex-col gap-2"><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="back" value="item" /><input type="hidden" name="backItem" value={i.id} />
                <label className="text-[0.8125rem] font-extrabold text-ink-2">{t("item.linkExisting")}<select name="expenseId" required defaultValue="" className="input mt-1"><option value="" disabled>{t("item.pickExpense")}</option>{unlinked.map(e => <option key={e.id} value={e.id}>{new Date(e.date + "T00:00:00").toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { day: "numeric", month: "short" })} · {e.merchant} · {fmtMoney(e.amount_minor, e.currency)}{e.item_id ? ` · ${t("item.linkedTo", { name: titleOf(e.item_id) })}` : ""}</option>)}</select></label>
                <button className="btn w-full">🔗 {t("item.linkBtn")}</button></form> : <p className="text-[0.75rem] text-ink-3">{t("item.noUnlinked")}</p>}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
