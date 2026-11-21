"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fmtTime, isoDate } from "@/lib/trip/derive";
import { snapSave, snapSuggest, type SnapSuggestion } from "@/app/t/[tripId]/plan/snap-actions";

/** One camera input per trip screen; any <label htmlFor={SNAP_INPUT}> opens it. */
export const SNAP_INPUT = "snap-photo";
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Shrink to 1600px JPEG before upload: plenty for a trip album and far lighter on mobile data. Falls back to the original. */
async function shrink(f: File): Promise<{ blob: Blob; ext: string }> {
  try {
    const bmp = await createImageBitmap(f); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    const blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
    return { blob, ext: "jpg" };
  } catch { return { blob: f, ext: f.name.split(".").pop() || "jpg" }; }
}

/** The phone's position, or null after a short wait (denied, indoors, no GPS). */
function locate(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(res => {
    if (!("geolocation" in navigator)) return res(null);
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(null), { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 });
  });
}

/**
 * Snap to add: a hidden camera input (open it with <label htmlFor={inputId}>) and the one-screen sheet that follows.
 * Time and place fill themselves in from the phone; the name is suggested from saved trip places or the map.
 */
export function SnapAdd({ tripId, inputId }: { tripId: string; inputId: string }) {
  const { t, locale } = useT(); const router = useRouter();
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null); const [phase, setPhase] = useState<"locating" | "looking" | "ready">("locating");
  const [sugg, setSugg] = useState<SnapSuggestion | null>(null);
  const [title, setTitle] = useState(""); const touched = useRef(false); const [placeId, setPlaceId] = useState<string | null>(null);
  const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [day, setDay] = useState<number | null>(null); const [editWhen, setEditWhen] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const run = useRef(0);

  const suggest = async (pos: { lat: number; lng: number } | null, d: string, tm: string, pickedDay: number | null, token: number) => {
    setPhase("looking");
    const s = await snapSuggest({ tripId, lat: pos?.lat ?? null, lng: pos?.lng ?? null, date: d, time: tm, day: pickedDay }).catch(() => null);
    if (token !== run.current) return;
    setSugg(s); setPhase("ready");
    if (!s) return;
    const dd = pickedDay ?? s.day; setDay(dd ?? s.days[0]?.day ?? 1); if (dd == null) setEditWhen(true);
    if (!touched.current) { const first = s.places[0]; if (first) { setTitle(first.label); setPlaceId(first.id); } else if (s.spot?.name) { setTitle(s.spot.name); setPlaceId(null); } }
  };

  const onFile = async (f: File | null) => {
    if (!f) return; setErr(null);
    if (!TYPES.includes(f.type) || f.size > 15 * 1024 * 1024) { setErr(t("snap.badFile")); setFile(null); return; }
    const token = ++run.current; const now = new Date(); const d = isoDate(now); const tm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setFile(f); setPreview(URL.createObjectURL(f)); setSugg(null); setTitle(""); touched.current = false; setPlaceId(null); setDate(d); setTime(tm); setDay(null); setEditWhen(false); setGeo(null); setPhase("locating");
    const pos = await locate(); if (token !== run.current) return; setGeo(pos);
    await suggest(pos, d, tm, null, token);
  };

  const close = () => { run.current++; if (preview) URL.revokeObjectURL(preview); setFile(null); setPreview(null); setSugg(null); setErr(null); setBusy(false); };

  const save = async (join: boolean) => {
    if (!file || !day) return; setErr(null);
    if (!join && !title.trim()) { setErr(t("snap.needName")); return; }
    setBusy(true);
    try {
      const itemId = join && sugg?.match ? sugg.match.id : crypto.randomUUID();
      const { blob, ext } = await shrink(file);
      const key = `${tripId}/items/${itemId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabaseBrowser().storage.from("documents").upload(key, blob, { contentType: blob.type || file.type }); if (error) throw error;
      const r = await snapSave({ tripId, itemId, join, title: title.trim(), day, time, lat: geo?.lat ?? null, lng: geo?.lng ?? null, area: sugg?.spot?.area ?? null, placeId: join ? null : placeId, fileName: (file.name || "photo.jpg").slice(0, 200), storagePath: key, sizeBytes: blob.size });
      close(); router.push(`/t/${tripId}/plan?day=${r.day}`); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("errors.generic")); setBusy(false); }
  };

  const chips = sugg ? [...sugg.places.map(p => ({ key: p.id, label: p.label, sub: `${p.emoji} ${p.metres} m`, placeId: p.id as string | null })), ...(sugg.spot?.name && !sugg.places.some(p => p.label === sugg.spot!.name) ? [{ key: "spot", label: sugg.spot.name, sub: "🗺️", placeId: null }] : [])] : [];
  const dayLabel = sugg?.days.find(x => x.day === day)?.label;
  const whereText = phase === "locating" ? t("snap.locating") : geo ? (sugg?.spot?.area || sugg?.spot?.name || `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`) : t("snap.noLocation");

  return (
    <>
      <input id={inputId} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { onFile(e.target.files?.[0] || null); e.target.value = ""; }} />
      {err && !file && <div role="alert" className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-bad-soft p-3 font-bold text-bad" onClick={() => setErr(null)}>{err}</div>}
      {file && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("snap.title")}>
          <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
            <div className="flex items-center justify-between"><button type="button" onClick={close} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">{t("snap.title")}</h2><label htmlFor={inputId} className="btn btn-sm cursor-pointer">{t("snap.retake")}</label></div>
            {preview && <img src={preview} alt="" className="max-h-[38vh] w-full rounded-[22px] bg-surface-2 object-cover" />}

            {sugg?.match && (
              <div className="rounded-[22px] border-2 border-teal bg-teal-soft/40 p-4">
                <p className="font-extrabold">{t("snap.maybe", { name: sugg.match.title, time: fmtTime(sugg.match.start, locale) })}</p>
                <button type="button" disabled={busy} onClick={() => save(true)} className="btn btn-teal mt-3 w-full disabled:opacity-60">{t("snap.joinIt")}</button>
                <p className="mt-2 text-center text-[0.8125rem] text-ink-2">{t("snap.orNew")}</p>
              </div>
            )}

            <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("snap.name")}
              <input value={title} maxLength={120} onChange={e => { touched.current = true; setTitle(e.target.value); if (!chips.some(c => c.placeId && c.label === e.target.value)) setPlaceId(null); }} placeholder={phase === "ready" ? t("snap.namePh") : t("snap.looking")} className="input text-[1.125rem]" autoFocus={phase === "ready" && !title} />
            </label>
            {chips.length > 0 && (
              <div><div className="eyebrow mb-1.5">{t("snap.nearby")}</div><div className="flex flex-wrap gap-2">{chips.map(c => (
                <button key={c.key} type="button" onClick={() => { touched.current = true; setTitle(c.label); setPlaceId(c.placeId); }} className={`rounded-full border-2 px-3 py-1.5 text-left text-[0.875rem] font-extrabold ${title === c.label ? "border-teal bg-teal-soft" : "border-line bg-surface"}`}>{c.label} <span className="font-semibold text-ink-3">{c.sub}</span></button>
              ))}</div></div>
            )}

            <div className="card flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2"><span>🕒 <b>{day && dayLabel ? (sugg?.day === day ? t("snap.today") : dayLabel) : "…"}</b> · {time ? fmtTime(time, locale) : "…"}</span><button type="button" onClick={() => setEditWhen(v => !v)} className="btn btn-sm" aria-label={t("snap.when")}>✎</button></div>
              {editWhen && sugg && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={day ?? ""} onChange={e => { const d = Number(e.target.value); setDay(d); suggest(geo, date, time, d, ++run.current); }} className="input" aria-label={t("snap.day")}>{sugg.days.map(x => <option key={x.day} value={x.day}>{x.label}</option>)}</select>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" aria-label={t("snap.when")} />
                </div>
              )}
              <div>📍 <span className={geo ? "font-bold" : "text-ink-2"}>{whereText}</span></div>
            </div>

            {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
            <button type="button" disabled={busy || !day || phase !== "ready"} onClick={() => save(false)} className="btn btn-sun w-full py-4 text-[1.0625rem] disabled:opacity-60">{busy ? t("snap.saving") : t("snap.save")}</button>
          </div>
        </div>
      )}
    </>
  );
}
