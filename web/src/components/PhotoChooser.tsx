"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fmtTime, isoDate } from "@/lib/trip/derive";
import { setPendingPhoto } from "@/lib/pendingPhoto";
import { addPhoto, photoTargets, type PhotoTargets } from "@/app/t/[tripId]/plan/photo-actions";
import { hhmmNow, locate, toJpeg } from "./AiAdd";

function Option({ icon, title, sub, onClick, primary, disabled }: { icon: string; title: string; sub?: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex w-full items-center gap-3 rounded-[18px] border-2 px-4 py-3.5 text-left disabled:opacity-60 ${primary ? "border-teal bg-teal-soft/50" : "border-line bg-surface"}`}>
      <span className="text-[1.6rem]">{icon}</span><span className="min-w-0 flex-1"><b className="block">{title}</b>{sub && <span className="block text-[0.8125rem] text-ink-2">{sub}</span>}</span>
    </button>
  );
}

/**
 * 📷 "Use this photo for…": an activity's album (suggested: what's happening now), a new activity (✨ AI),
 * the trip album only, or a receipt. Albums need no AI, so most everyday photos cost nothing.
 */
export function PhotoChooser({ tripId, photo, onClose, onNewActivity, onSaved }: { tripId: string; photo: File; onClose: () => void; onNewActivity: (f: File) => void; onSaved: (msg: string) => void }) {
  const { t, locale } = useT(); const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null); const [targets, setTargets] = useState<PhotoTargets | null>(null);
  const [day, setDay] = useState<number | null>(null); const [pick, setPick] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const geo = useRef<{ lat: number; lng: number } | null>(null); const shot = useRef(new Date());

  useEffect(() => {
    const url = URL.createObjectURL(photo); shot.current = new Date(); let live = true;
    queueMicrotask(() => setPreview(url));
    (async () => {
      geo.current = await locate(); if (!live) return;
      const r = await photoTargets({ tripId, today: isoDate(shot.current), now: hhmmNow(shot.current), lat: geo.current?.lat ?? null, lng: geo.current?.lng ?? null }).catch(() => null);
      if (!live || !r) return; setTargets(r); setDay(r.day); if (!r.suggested) setPick(false);
    })();
    return () => { live = false; URL.revokeObjectURL(url); };
  }, [photo, tripId]);

  const changeDay = async (d: number) => {
    setDay(d); setPick(true);
    const r = await photoTargets({ tripId, today: isoDate(shot.current), now: hhmmNow(shot.current), lat: geo.current?.lat ?? null, lng: geo.current?.lng ?? null, day: d }).catch(() => null);
    if (r) setTargets(r);
  };

  const save = async (target: "item" | "trip", itemId: string | null, label: string) => {
    if (!day) return; setErr(null); setBusy(true);
    try {
      const big = (await toJpeg(photo, 1600)) ?? photo; const ext = big.type === "image/jpeg" ? "jpg" : (photo.name.split(".").pop() || "jpg");
      const key = target === "item" ? `${tripId}/items/${itemId}/${crypto.randomUUID()}.${ext}` : `${tripId}/days/${day}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabaseBrowser().storage.from("documents").upload(key, big, { contentType: big.type || photo.type }); if (error) throw error;
      await addPhoto({ tripId, target, itemId, day, fileName: (photo.name || "photo.jpg").slice(0, 200), storagePath: key, sizeBytes: big.size });
      onSaved(t("photo.saved", { where: label })); onClose(); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); setBusy(false); }
  };

  const suggested = targets?.items.find(i => i.id === targets.suggested) || null;
  const dayLabelOf = (d: number | null) => (d && targets ? (d === targets.today ? t("snap.today") : targets.days.find(x => x.day === d)?.label || "") : "");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("photo.useFor")}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-3 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between"><button type="button" onClick={onClose} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">{t("photo.useFor")}</h2><span className="w-16" /></div>
        {preview && <img src={preview} alt="" className="max-h-[32vh] w-full rounded-[22px] bg-surface-2 object-cover" />}
        {!targets && <div className="card flex items-center gap-3 p-4" role="status"><span className="h-5 w-5 animate-spin rounded-full border-[3px] border-teal border-b-transparent" />{t("photo.finding")}</div>}

        {targets && (<>
          {suggested && !pick && <Option disabled={busy} primary icon="📍" title={t("photo.toActivity", { name: suggested.title })} sub={`${fmtTime(suggested.start, locale)} · ${t("photo.free")}`} onClick={() => save("item", suggested.id, suggested.title)} />}
          {(!suggested || pick) ? (
            <div className="card flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2"><b>📍 {t("photo.activityAlbum")}</b><select value={day ?? ""} onChange={e => changeDay(Number(e.target.value))} className="input max-w-[55%] py-1.5" aria-label={t("snap.day")}>{targets.days.map(d => <option key={d.day} value={d.day}>{d.day === targets.today ? t("snap.today") : d.label}</option>)}</select></div>
              {targets.items.length ? targets.items.map(i => (
                <button key={i.id} type="button" disabled={busy} onClick={() => save("item", i.id, i.title)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left disabled:opacity-60 ${i.id === targets.suggested ? "bg-teal-soft/50" : "bg-surface-2"}`}><span>{i.emoji}</span><span className="flex-1 font-bold">{i.title}</span><span className="text-[0.8125rem] text-ink-3">{fmtTime(i.start, locale)}</span></button>
              )) : <p className="text-[0.875rem] text-ink-2">{t("photo.noActivities")}</p>}
            </div>
          ) : <button type="button" onClick={() => setPick(true)} className="-mt-1 self-start text-[0.875rem] font-bold text-ink-2 underline underline-offset-4">{t("photo.otherActivity")}</button>}
          <Option disabled={busy} icon="✨" title={t("photo.newActivity")} sub={t("photo.newActivitySub")} onClick={() => { onClose(); onNewActivity(photo); }} />
          <Option disabled={busy} icon="🖼️" title={t("photo.tripAlbum")} sub={`${dayLabelOf(day)} · ${t("photo.free")}`} onClick={() => save("trip", null, t("photo.tripAlbumShort"))} />
          <Option disabled={busy} icon="🧾" title={t("photo.receipt")} sub={t("photo.receiptSub")} onClick={() => { setPendingPhoto(photo); onClose(); router.push(`/t/${tripId}/money/scan`); }} />
        </>)}
        {busy && <p className="text-center font-bold text-ink-2" role="status">{t("ui.uploading")}</p>}
        {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
      </div>
    </div>
  );
}
