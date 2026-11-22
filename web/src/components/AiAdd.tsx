"use client";
import { useEffect, useRef, useState } from "react";
import { SpeechBar } from "./SpeechBar";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fmtTime, isoDate } from "@/lib/trip/derive";
import { aiQuickRead, aiQuickSave, type QuickDraft } from "@/app/t/[tripId]/plan/ai-actions";

/** The one camera input on trip screens: any <label htmlFor={SNAP_INPUT}> opens the camera, and the photo lands in the ✨ add screen. */
export const SNAP_INPUT = "snap-photo";
/** The ✨ add screen's own camera input, for "a photo of this new activity". */
export const AI_PHOTO_INPUT = "ai-photo";
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];


/** Resize to a JPEG: max 1024px for the AI to read, max 1600px for the trip album. Null if the browser can't decode it (e.g. HEIC on some phones). */
export async function toJpeg(f: File, max: number): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(f); const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    return await new Promise<Blob | null>(res => c.toBlob(b => res(b), "image/jpeg", max > 1100 ? 0.85 : 0.8));
  } catch { return null; }
}
const b64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(b); });
/**
 * The phone's position, or null. Always settles within limitMs: the browser's own timeout only starts after the
 * "Allow location?" prompt is answered, and some browsers never answer at all.
 */
export function locate(limitMs = 6000): Promise<{ lat: number; lng: number } | null> {
  return new Promise(res => {
    let done = false; const finish = (v: { lat: number; lng: number } | null) => { if (!done) { done = true; res(v); } };
    setTimeout(() => finish(null), limitMs);
    try {
      if (!("geolocation" in navigator)) return finish(null);
      navigator.geolocation.getCurrentPosition(p => finish({ lat: p.coords.latitude, lng: p.coords.longitude }), () => finish(null), { enableHighAccuracy: true, timeout: limitMs, maximumAge: 120000 });
    } catch { finish(null); }
  });
}
export const hhmmNow = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.8125rem] font-extrabold text-ink-2">{label}{children}</label>; }

/**
 * ✨ One add screen for during the trip: an optional photo plus optional spoken or typed words.
 * Claude reads them with the phone's location and time and fills in one card to check and save.
 */
export function AiAdd({ tripId, open, photo, onClose, onPhoto }: { tripId: string; open: boolean; photo: File | null; onClose: () => void; onPhoto: (f: File) => void }) {
  const { t, locale } = useT(); const router = useRouter(); const zh = locale.startsWith("zh");
  const [text, setText] = useState(""); const [busy, setBusy] = useState<"" | "locating" | "reading" | "saving">(""); const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuickDraft | null>(null); const [orig, setOrig] = useState<QuickDraft | null>(null);
  const [preview, setPreview] = useState<string | null>(null); const geo = useRef<{ lat: number; lng: number } | null>(null); const shotAt = useRef<Date | null>(null);
  const run = useRef(0);

  // A new photo: show it, find where we are, and read it straight away (one tap from camera to card).
  useEffect(() => {
    if (!open || !photo) return;
    const token = ++run.current; const url = URL.createObjectURL(photo); shotAt.current = new Date();
    queueMicrotask(() => { setPreview(url); setDraft(null); setOrig(null); setErr(null); setBusy("locating"); });
    locate().then(pos => { if (token !== run.current) return; geo.current = pos; read(token, ""); });
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, photo]);

  if (!open) return null;
    const errText = (e: string) => t(`ai.err.${["limit", "not_configured", "refused", "busy"].includes(e) ? e : "failed"}`);

  const close = () => { run.current++; setText(""); setDraft(null); setOrig(null); setErr(null); setBusy(""); setPreview(null); geo.current = null; onClose(); };


  async function read(token: number, words: string) {
    setErr(null); setBusy("reading");
    const when = shotAt.current ?? new Date();
    let image: { data: string; mediaType: "image/jpeg" } | null = null;
    if (photo) { const small = await toJpeg(photo, 1024); if (small) image = { data: await b64(small), mediaType: "image/jpeg" }; }
    if (!image && words.trim().length < 2) { setBusy(""); if (photo) setErr(t("ai.photoNoRead")); return; }
    const res = await aiQuickRead({ tripId, text: words.trim(), today: isoDate(when), now: hhmmNow(when), lat: geo.current?.lat ?? null, lng: geo.current?.lng ?? null, image }).catch(() => ({ ok: false as const, error: "failed" }));
    if (token !== run.current) return;
    setBusy("");
    if (!res.ok) { setErr(errText(res.error)); return; }
    setDraft(res.draft); setOrig(res.draft);
  }

  const save = async (join: boolean) => {
    if (!draft || !orig) return; if (!join && !draft.title.trim()) { setErr(t("ai.needName")); return; }
    setErr(null); setBusy("saving");
    try {
      const itemId = join && draft.match ? draft.match.id : crypto.randomUUID();
      let stored: { fileName: string; storagePath: string; sizeBytes: number } | null = null;
      if (photo) {
        const big = (await toJpeg(photo, 1600)) ?? photo; const ext = big.type === "image/jpeg" ? "jpg" : (photo.name.split(".").pop() || "jpg");
        const key = `${tripId}/items/${itemId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabaseBrowser().storage.from("documents").upload(key, big, { contentType: big.type || photo.type }); if (error) throw error;
        stored = { fileName: (photo.name || "photo.jpg").slice(0, 200), storagePath: key, sizeBytes: big.size };
      }
      const r = await aiQuickSave({ tripId, itemId, join, title: draft.title.trim(), titleEn: zh ? "" : orig.title, titleZh: orig.title_zh, day: draft.day, start: draft.start, end: draft.end, note: draft.note.trim(), noteEn: zh ? "" : orig.note, noteZh: orig.note_zh, cost: draft.cost, kind: draft.kind, status: draft.status, placeId: draft.placeId, place: draft.place, photo: stored });
      close(); router.push(`/t/${tripId}/plan?day=${r.day}`); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); setBusy(""); }
  };

  const set = <K extends keyof QuickDraft>(k: K, v: QuickDraft[K]) => setDraft(d => (d ? { ...d, [k]: v } : d));
  const working = busy === "locating" || busy === "reading";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("ai.addTitle")}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between"><button type="button" onClick={close} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">✨ {t("ai.addTitle")}</h2><label htmlFor={AI_PHOTO_INPUT} className="btn btn-sm cursor-pointer">📷 {preview ? t("snap.retake") : t("ai.addPhoto")}</label></div>
        <input id={AI_PHOTO_INPUT} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0] || null; e.target.value = ""; if (f && PHOTO_TYPES.includes(f.type) && f.size <= 15 * 1024 * 1024) onPhoto(f); }} />

        {preview && <img src={preview} alt="" className="max-h-[34vh] w-full rounded-[22px] bg-surface-2 object-cover" />}

        {working && (
          <div className="card flex items-center gap-3 p-4" role="status" aria-live="polite"><span className="h-6 w-6 flex-none animate-spin rounded-full border-[3px] border-teal border-b-transparent" /><div><b>{busy === "locating" ? t("snap.locating") : photo ? t("ai.readingPhoto") : t("ai.reading")}</b><div className="text-[0.8125rem] text-ink-2">{t("ai.readingSub")}</div></div></div>
        )}

        {!draft && !working && (<>
          <p className="text-ink-2">{photo ? t("ai.photoWordsHint") : t("ai.quickHint")}</p>
          {!photo && <a href={`/t/${tripId}/plan/new`} onClick={close} className="-mt-2 self-start text-[0.875rem] font-bold text-ink-2 underline underline-offset-4">{t("ai.manualForm")}</a>}
          <textarea value={text} onChange={e => setText(e.target.value)} maxLength={300} rows={photo ? 2 : 3} autoFocus={!photo} className="input text-[1.125rem]" placeholder={photo ? t("ai.photoWordsPh") : t("ai.quickPh")} />
          <SpeechBar onText={setText} />
          <button type="button" onClick={() => read(++run.current, text)} disabled={!photo && text.trim().length < 2} className="btn btn-sun w-full py-4 text-[1.0625rem] disabled:opacity-60">✨ {t("ai.read")}</button>
        </>)}

        {draft && !working && (<>
          {draft.match && photo && (
            <div className="rounded-[22px] border-2 border-teal bg-teal-soft/40 p-4">
              <p className="font-extrabold">{t("snap.maybe", { name: draft.match.title, time: fmtTime(draft.match.start, locale) })}</p>
              <button type="button" disabled={!!busy} onClick={() => save(true)} className="btn btn-teal mt-3 w-full disabled:opacity-60">{t("snap.joinIt")}</button>
              <p className="mt-2 text-center text-[0.8125rem] text-ink-2">{t("snap.orNew")}</p>
            </div>
          )}
          <Field label={t("snap.name")}><input value={draft.title} maxLength={120} onChange={e => set("title", e.target.value)} className="input text-[1.125rem]" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label={t("snap.day")}><select value={draft.day} onChange={e => set("day", Number(e.target.value))} className="input">{draft.days.map(d => <option key={d.day} value={d.day}>{d.day === draft.today ? t("snap.today") : d.label}</option>)}</select></Field>
            <Field label={t("ui.start")}><input type="time" value={draft.start} onChange={e => set("start", e.target.value)} className="input" /></Field>
            <Field label={t("ui.end")}><input type="time" value={draft.end} onChange={e => set("end", e.target.value)} className="input" /></Field>
          </div>
          <div className="card p-4">📍 {draft.place ? <><b>{draft.place.address || draft.place.area || draft.place.name}</b>{draft.placeId && <span className="ml-1 text-ink-3">· {t("ai.inTrip")}</span>}</> : <span className="text-warn">{t("ai.noAddress")}</span>}</div>
          <Field label={t("money.notes")}><textarea value={draft.note} maxLength={500} onChange={e => set("note", e.target.value)} className="input min-h-20" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("ai.cost")}><input value={draft.cost} inputMode="decimal" onChange={e => set("cost", e.target.value)} className="input" placeholder="0" /></Field>
            <Field label={t("ui.status")}><div className="flex rounded-xl bg-surface-2 p-1">{(["completed", "proposed"] as const).map(s => <button key={s} type="button" onClick={() => set("status", s)} aria-pressed={draft.status === s} className={`flex-1 rounded-lg py-2 text-[0.875rem] font-extrabold ${draft.status === s ? "bg-surface text-ink shadow-card" : "text-ink-3"}`}>{t(`status.${s}`)}</button>)}</div></Field>
          </div>
          <div className="flex gap-2"><button type="button" onClick={() => { setDraft(null); setOrig(null); }} className="btn flex-1">{t("ai.addWords")}</button><button type="button" onClick={() => save(false)} disabled={!!busy} className="btn btn-sun flex-[2] py-4 text-[1.0625rem] disabled:opacity-60">{busy === "saving" ? t("snap.saving") : t("snap.save")}</button></div>
        </>)}

        {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
      </div>
    </div>
  );
}
