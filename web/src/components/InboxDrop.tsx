"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { addBookingFromInbox, registerDocument } from "@/app/t/[tripId]/inbox/actions";

const CATS = ["Flights", "Hotels", "Transport", "Activities", "Insurance", "Receipts", "Other"];

export function InboxDrop({ tripId, forItem, bookings }: { tripId: string; forItem: { id: string; title: string; day: number } | null; bookings: { id: string; title: string }[] }) {
  const { t } = useT(); const router = useRouter(); const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null); const [cat, setCat] = useState(forItem ? "Activities" : "Other"); const [asBooking, setAsBooking] = useState(!!forItem); const [linkBooking, setLinkBooking] = useState(""); const [err, setErr] = useState<string | null>(null);
  const [bk, setBk] = useState({ title: forItem ? forItem.title : "", provider: "", reference: "", cost: "" });
  const submit = () => start(async () => {
    setErr(null);
    try {
      let path: string | null = null;
      if (file) { if (file.size > 15 * 1024 * 1024) throw new Error("Files must be under 15 MB."); if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf", "text/plain", "message/rfc822"].includes(file.type)) throw new Error("Photos, PDFs, text and email exports only."); const key = `${tripId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`; const { error } = await supabaseBrowser().storage.from("documents").upload(key, file, { contentType: file.type || "application/octet-stream" }); if (error) throw error; path = key; }
      if (asBooking) await addBookingFromInbox({ tripId, title: bk.title, provider: bk.provider, reference: bk.reference, cost: bk.cost, itemId: forItem?.id || null, category: cat, fileName: file?.name || null, storagePath: path, sizeBytes: file?.size || null });
      else await registerDocument({ tripId, fileName: file?.name || "Untitled", storagePath: path, sizeBytes: file?.size || null, category: cat, linkedBookingId: linkBooking || null });
      router.push(forItem ? `/t/${tripId}/plan/${forItem.id}` : `/t/${tripId}/documents`);
    } catch (e) { setErr(e instanceof Error ? e.message : t("errors.generic")); }
  });
  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[22px] border-2 border-dashed border-line bg-surface px-4 py-8 text-center"><span className="text-[2.25rem]">📥</span><span className="font-bold">{file ? file.name : t("ui.inbox.types")}</span><span className="text-[0.7813rem] text-ink-3">{file ? `${Math.round(file.size / 1024)} KB` : t("ui.inbox.choose")}</span><input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.eml,.txt" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">{CATS.map(c => <button key={c} type="button" onClick={() => setCat(c)} className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[0.8125rem] font-extrabold ${cat === c ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{c}</button>)}</div>
      <div className="card"><label className="flex items-center justify-between font-bold"><span>{t("ui.inbox.isBooking")}</span><input type="checkbox" checked={asBooking} onChange={e => setAsBooking(e.target.checked)} className="h-5 w-5 accent-[var(--teal)]" /></label>
        {asBooking ? <div className="mt-3 flex flex-col gap-2">{forItem && <div className="rounded-xl bg-teal-soft px-3 py-2 text-[0.8125rem]">{t("ui.inbox.willLink", { title: forItem.title, day: forItem.day })}</div>}<input className="input" placeholder={t("ui.inbox.whatBooked")} value={bk.title} onChange={e => setBk({ ...bk, title: e.target.value })} /><div className="grid grid-cols-2 gap-2"><input className="input" placeholder={t("ui.inbox.provider")} value={bk.provider} onChange={e => setBk({ ...bk, provider: e.target.value })} /><input className="input" placeholder={t("ui.inbox.reference")} value={bk.reference} onChange={e => setBk({ ...bk, reference: e.target.value })} /></div><input className="input" inputMode="decimal" placeholder={t("ui.inbox.costOpt")} value={bk.cost} onChange={e => setBk({ ...bk, cost: e.target.value })} /></div>
          : bookings.length ? <div className="mt-3"><div className="text-[0.7813rem] text-ink-3">{t("ui.inbox.linkExisting")}</div><select className="input mt-1" value={linkBooking} onChange={e => setLinkBooking(e.target.value)}><option value="">{t("ui.notLinked")}</option>{bookings.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></div> : null}</div>
      {err && <p className="text-[0.8125rem] text-bad">{err}</p>}
      <button type="button" disabled={pending || (!file && !asBooking) || (asBooking && !bk.title.trim())} onClick={submit} className="btn btn-sun w-full py-4 text-[1rem] disabled:opacity-50">{pending ? t("inbox.reading") : asBooking ? t("inbox.addBooking") : t("ui.inbox.saveDocs")}</button>
    </div>
  );
}
