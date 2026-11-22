"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import type { FoundPlace } from "@/lib/places";
import { findPlaces, savePlace } from "@/app/t/[tripId]/plan/place-actions";

/** 📍 收藏地點: search a place and keep it as a ⭐ on the trip map, with no time set. */
export function SavePlace({ tripId, onClose, onSaved }: { tripId: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const { t } = useT(); const router = useRouter();
  const [q, setQ] = useState(""); const [results, setResults] = useState<FoundPlace[] | null>(null); const [busy, setBusy] = useState<"" | "search" | "save">(""); const [err, setErr] = useState<string | null>(null);

  const search = async () => {
    if (q.trim().length < 2) return; setErr(null); setBusy("search");
    const r = await findPlaces({ tripId, q }).catch(() => null); setBusy("");
    if (!r) { setErr(t("ai.err.failed")); return; } setResults(r);
  };
  const save = async (place: FoundPlace | null) => {
    setErr(null); setBusy("save");
    try { await savePlace({ tripId, name: (place?.name || q).trim().slice(0, 120), place }); onSaved(t("savePlace.saved", { name: place?.name || q.trim() })); onClose(); router.refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); setBusy(""); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("savePlace.title")}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-3 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between"><button type="button" onClick={onClose} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">📍 {t("savePlace.title")}</h2><span className="w-16" /></div>
        <p className="text-ink-2">{t("savePlace.hint")}</p>
        <form onSubmit={e => { e.preventDefault(); search(); }} className="flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} maxLength={120} autoFocus className="input flex-1 text-[1.0625rem]" placeholder={t("savePlace.placeholder")} />
          <button disabled={busy !== "" || q.trim().length < 2} className="btn btn-teal disabled:opacity-60">{busy === "search" ? "…" : t("savePlace.search")}</button>
        </form>
        {results && (results.length ? results.map((r, k) => (
          <button key={k} type="button" disabled={busy !== ""} onClick={() => save(r)} className="card flex items-center gap-3 p-3 text-left disabled:opacity-60"><span className="text-[1.4rem]">⭐</span><span className="min-w-0 flex-1"><b className="block">{r.name}</b><span className="block truncate text-[0.8125rem] text-ink-2">{r.address || r.area}</span></span><span className="text-teal">＋</span></button>
        )) : <div className="card flex flex-col gap-2 p-4"><span className="text-ink-2">{t("savePlace.none")}</span><button type="button" disabled={busy !== ""} onClick={() => save(null)} className="btn btn-sm self-start">{t("savePlace.saveName", { name: q.trim() })}</button></div>)}
        {busy === "save" && <p className="text-center font-bold text-ink-2" role="status">{t("snap.saving")}</p>}
        {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
      </div>
    </div>
  );
}
