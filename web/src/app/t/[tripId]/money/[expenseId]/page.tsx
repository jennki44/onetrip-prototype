import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { fmtTime, inCurrency, itemTitle, place, placeName, rate } from "@/lib/trip/derive";
import { Avatar } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { supabaseServer } from "@/lib/supabase/server";
import { deleteExpense } from "../actions";
import type { ReceiptItem } from "@/lib/supabase/types";

export default async function ExpenseDetail({ params, searchParams }: { params: Promise<{ tripId: string; expenseId: string }>; searchParams: Promise<{ saved?: string; updated?: string; error?: string }> }) {
  const [{ tripId, expenseId }, sp] = await Promise.all([params, searchParams]); const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const e = b.expenses.find(x => x.id === expenseId); if (!e) notFound(); const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const shares = b.shares.filter(s => s.expense_id === e.id); const payer = b.members.find(m => m.user_id === e.payer_id)?.profile; const pl = place(b, e.place_id); const item = b.items.find(i => i.id === e.item_id); const bk = b.bookings.find(x => x.id === e.booking_id);
  // Receipt photo (private bucket → short-lived signed link) and its lines, when there is a receipt.
  const sb = await supabaseServer(); let photo: string | null = null; let lines: ReceiptItem[] = [];
  if (e.receipt_id) {
    const { data: rc } = (await sb.from("receipts").select("image_path").eq("id", e.receipt_id).maybeSingle()) as { data: { image_path: string | null } | null };
    if (rc?.image_path) photo = (await sb.storage.from("receipts").createSignedUrl(rc.image_path, 3600)).data?.signedUrl || null;
    lines = ((await sb.from("receipt_items").select("*").eq("receipt_id", e.receipt_id).order("sort")) as { data: ReceiptItem[] | null }).data || [];
  }
  const canChange = !!user && (user.id === e.payer_id || user.id === e.created_by || ["owner", "admin"].includes(b.members.find(m => m.user_id === user.id)?.role || ""));
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="mb-3 flex items-center justify-between"><Link href={`${base}/money?tab=expenses`} className="btn btn-sm">‹ {t("money.expenses")}</Link>{canChange && <Link href={`${base}/money/${e.id}/edit`} className="btn btn-sm">✏️ {t("common.edit")}</Link>}</div>
      {(sp.saved || sp.updated) && <p className="mb-3 rounded-2xl bg-good-soft p-3 font-bold">✅ {sp.updated ? t("ui.updated") : t("receipt.looksCorrect")}</p>}
      {sp.error && <p className="mb-3 rounded-2xl bg-bad-soft p-3 font-bold text-bad" role="alert">{sp.error}</p>}
      <div className="mb-4 flex items-start gap-3.5"><span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-surface-2 text-[1.625rem]">{e.emoji || "💰"}</span><div><h1 className="text-[1.75rem] leading-tight">{e.merchant}</h1><p className="text-[0.9063rem] text-ink-2">{new Date(e.date + "T00:00:00").toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "long", day: "numeric", month: "long" })}{e.time ? ` · ${fmtTime(e.time.slice(0, 5), locale)}` : ""} · {t(`money.categories.${e.category}`)}</p></div></div>
      <div className="card"><div className="num font-display text-[1.875rem] font-bold">{inCurrency(b, e.amount_minor, e.currency)} <span className="text-[0.75rem] font-normal text-ink-3">{e.currency}</span></div>{e.currency !== rc && <div className="text-ink-2">{t("money.approx")} <b>{inCurrency(b, e.base_minor, rc)}</b></div>}<div className="mt-2 text-[0.7813rem] text-ink-3">{t("money.rate")}: 1 {b.trip.base_currency} = {rate(b.trip.base_currency, rc).toFixed(2)} {rc} · {t("money.original")}</div><div className="mt-3 flex items-center gap-2 border-t border-line-2 pt-3 text-[0.8125rem]"><span className="text-ink-3">{t("money.payer")}</span>{payer && <Avatar p={payer} size="sm" />}<b>{payer?.name}</b><span className="ml-auto text-ink-3">{t("money.split")}: {t(`money.splitTypes.${e.split}`)}</span></div></div>
      <div className="card mt-3"><div className="eyebrow mb-2">{t("money.eachShare")}</div>{shares.map(s => { const p = b.members.find(m => m.user_id === s.user_id)?.profile; return <div key={s.user_id} className="flex items-center justify-between border-t border-line-2 py-1.5 first:border-t-0"><span className="flex items-center gap-2">{p && <Avatar p={p} size="sm" />} {p?.name}</span><span className="num"><b>{inCurrency(b, s.share_minor, b.trip.base_currency)}</b> <span className="text-[0.75rem] text-ink-3">≈ {inCurrency(b, s.share_minor, rc)}</span></span></div>; })}</div>
      {lines.length > 0 && <div className="card mt-3"><div className="eyebrow mb-2">{t("ui.receiptLines")}</div>{lines.map(l => <div key={l.id} className="flex items-center justify-between gap-2 border-t border-line-2 py-1.5 text-[0.9rem] first:border-t-0"><span className="min-w-0 flex-1 truncate">{l.name}</span><span className="flex -space-x-1">{l.user_ids.map(uid => { const p = b.members.find(m => m.user_id === uid)?.profile; return p ? <Avatar key={uid} p={p} size="sm" /> : null; })}</span><span className="num w-24 text-right font-bold">{inCurrency(b, l.amount_minor, e.currency)}</span></div>)}</div>}
      {photo && <div className="card mt-3"><div className="eyebrow mb-2">{t("ui.receiptPhoto")}</div><a href={photo} target="_blank" rel="noopener noreferrer"><img src={photo} alt={t("ui.receiptPhoto")} className="max-h-[420px] w-full rounded-2xl object-contain bg-surface-2" /></a></div>}
      {e.note && <div className="card mt-3 text-[0.875rem]">📝 {e.note}</div>}
      <div className="card mt-3"><div className="eyebrow mb-2">{t("ui.connected")}</div><div className="flex flex-wrap gap-1.5">{pl && <Link href={`${base}/map?focus=${pl.id}`} className="pill pill-teal">📍 {placeName(pl, locale)}</Link>}{item && <Link href={`${base}/plan/${item.id}`} className="pill pill-teal">📅 {itemTitle(item, locale)}</Link>}{bk && <Link href={`${base}/bookings/${bk.id}`} className="pill pill-teal">🎟 {bk.title}</Link>}<Link href={`${base}/money?tab=expenses&cat=${e.category}`} className="pill pill-teal">💵 {t(`money.categories.${e.category}`)}</Link><Link href={`${base}/money?tab=balances`} className="pill pill-teal">⚖️ {t("money.balances")}</Link></div></div>
      {canChange && <form action={deleteExpense} className="mt-6 text-center"><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="expenseId" value={e.id} /><ConfirmButton message={t("ui.deleteConfirm")} className="btn btn-sm text-bad">🗑️ {t("ui.deleteExpense")}</ConfirmButton></form>}
    </div>
  );
}
