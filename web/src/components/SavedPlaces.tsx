"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { navUrl } from "@/lib/nav";
import { removeSavedPlace, scheduleSavedPlace, updatePlace } from "@/app/t/[tripId]/plan/place-actions";
import { PlaceSearch } from "./PlaceSearch";
import { SavePlace } from "./SavePlace";

export type SavedRow = { id: string; name: string; emoji: string; address: string | null; area: string | null; lat: number | null; lng: number | null; usedOn: number[] };

/** ⭐ 收藏地點: every saved place (with or without a pin) and what you can do with it. */
export function SavedPlaces({ tripId, places, days, defaultDay, destination, highlight, canEdit }: { tripId: string; places: SavedRow[]; days: { day: number; label: string }[]; defaultDay: number; destination: string; highlight: string | null; canEdit: boolean }) {
  const { t } = useT(); const router = useRouter();
  const [open, setOpen] = useState<{ id: string; mode: "plan" | "edit" } | null>(null);
  const [day, setDay] = useState(defaultDay); const [time, setTime] = useState("10:00"); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null); const [adding, setAdding] = useState(false);
  const run = async (f: () => Promise<unknown>, ok: string) => { setErr(null); setBusy(true); try { await f(); setMsg(ok); setOpen(null); router.refresh(); } catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); } finally { setBusy(false); } };

  return (
    <div className="flex flex-col gap-3">
      {canEdit && <button type="button" onClick={() => setAdding(true)} className="btn btn-sun self-start">📍 {t("menu.place")}</button>}
      {msg && <p role="status" className="rounded-2xl bg-good-soft p-3 font-bold">✅ {msg}</p>}
      {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
      {places.length === 0 && <div className="card text-ink-2">{t("saved.empty")}</div>}
      {places.map(p => {
        const pinned = p.lat != null && p.lng != null; const isOpen = open?.id === p.id; const nav = navUrl({ lat: p.lat, lng: p.lng, address: p.address, name: p.name, near: destination });
        return (
          <div key={p.id} className={`card flex flex-col gap-3 p-4 ${p.id === highlight ? "border-2 border-sun" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-[1.6rem]">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <b className="block text-[1.0625rem]">{p.name}</b>
                <span className={`block text-[0.8125rem] ${pinned ? "text-ink-2" : "font-bold text-warn"}`}>{pinned ? (p.address || p.area || t("saved.onMap")) : `⚠️ ${t("saved.noPin")}`}</span>
                {p.usedOn.length > 0 && <span className="block text-[0.75rem] text-ink-3">{t("saved.inPlan", { days: p.usedOn.map(d => days.find(x => x.day === d)?.label || d).join("、") })}</span>}
              </div>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setOpen(isOpen && open?.mode === "plan" ? null : { id: p.id, mode: "plan" })} className={`btn btn-sm ${isOpen && open?.mode === "plan" ? "btn-teal" : ""}`}>📅 {t("saved.addToPlan")}</button>
                <button type="button" onClick={() => { setName(p.name); setOpen(isOpen && open?.mode === "edit" ? null : { id: p.id, mode: "edit" }); }} className={`btn btn-sm ${isOpen && open?.mode === "edit" ? "btn-teal" : ""}`}>✏️ {pinned ? t("saved.edit") : t("saved.setPin")}</button>
                {nav && <a href={nav} target="_blank" rel="noopener noreferrer" className="btn btn-sm">🧭 {t("saved.navigate")}</a>}
                <button type="button" disabled={busy} onClick={() => { if (confirm(t("saved.deleteConfirm", { name: p.name }))) run(() => removeSavedPlace({ tripId, placeId: p.id }), t("saved.deleted", { name: p.name })); }} className="btn btn-sm text-bad">🗑 {t("saved.delete")}</button>
              </div>
            )}
            {isOpen && open?.mode === "plan" && (
              <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-surface-2 p-3">
                <label className="flex flex-1 flex-col gap-1 text-[0.8125rem] font-extrabold text-ink-2">{t("snap.day")}<select value={day} onChange={e => setDay(Number(e.target.value))} className="input">{days.map(d => <option key={d.day} value={d.day}>{d.label}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-[0.8125rem] font-extrabold text-ink-2">{t("ui.start")}<input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" /></label>
                <button type="button" disabled={busy || !time} onClick={() => run(() => scheduleSavedPlace({ tripId, placeId: p.id, day, start: time }), t("saved.added", { name: p.name, day: days.find(d => d.day === day)?.label || day }))} className="btn btn-sun disabled:opacity-60">{t("saved.add")}</button>
              </div>
            )}
            {isOpen && open?.mode === "edit" && (
              <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-3">
                <div className="flex gap-2"><input value={name} onChange={e => setName(e.target.value)} maxLength={120} className="input flex-1" aria-label={t("snap.name")} /><button type="button" disabled={busy || !name.trim() || name.trim() === p.name} onClick={() => run(() => updatePlace({ tripId, placeId: p.id, name: name.trim() }), t("saved.renamed"))} className="btn btn-sm disabled:opacity-60">{t("common.save")}</button></div>
                <div className="text-[0.8125rem] font-extrabold text-ink-2">{pinned ? t("saved.moveHint") : t("saved.setPinHint")}</div>
                <PlaceSearch tripId={tripId} initial={p.name} busy={busy} onPick={h => run(() => updatePlace({ tripId, placeId: p.id, place: h }), t("saved.pinned", { name: p.name }))} />
              </div>
            )}
          </div>
        );
      })}
      {adding && <SavePlace tripId={tripId} onClose={() => setAdding(false)} onSaved={setMsg} />}
    </div>
  );
}
