"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { findPlaces, type PlaceHit } from "@/app/t/[tripId]/plan/place-actions";

/** Search the map for a place. Each result shows its area, country and distance from the trip, so a wrong match is easy to spot. */
export function PlaceSearch({ tripId, initial = "", onPick, onNone, busy, autoFocus }: { tripId: string; initial?: string; onPick: (hit: PlaceHit, query: string) => void; onNone?: (query: string) => React.ReactNode; busy?: boolean; autoFocus?: boolean }) {
  const { t } = useT();
  const [q, setQ] = useState(initial); const [hits, setHits] = useState<PlaceHit[] | null>(null); const [searching, setSearching] = useState(false); const [err, setErr] = useState(false);
  const search = async () => {
    if (q.trim().length < 2) return; setSearching(true); setErr(false);
    const r = await findPlaces({ tripId, q }).catch(() => null); setSearching(false);
    if (!r) { setErr(true); return; } setHits(r);
  };
  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={e => { e.preventDefault(); search(); }} className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} maxLength={120} autoFocus={autoFocus} className="input flex-1 text-[1.0625rem]" placeholder={t("savePlace.placeholder")} />
        <button disabled={searching || busy || q.trim().length < 2} className="btn btn-teal disabled:opacity-60">{searching ? "…" : t("savePlace.search")}</button>
      </form>
      {err && <p role="alert" className="rounded-xl bg-bad-soft p-2.5 text-[0.875rem] font-bold text-bad">{t("ai.err.failed")}</p>}
      {hits && (hits.length ? hits.map((h, k) => (
        <button key={k} type="button" disabled={busy} onClick={() => onPick(h, q.trim())} className="card flex items-center gap-3 p-3 text-left disabled:opacity-60">
          <span className="text-[1.3rem]">📍</span>
          <span className="min-w-0 flex-1"><b className="block">{h.name}</b><span className="block truncate text-[0.8125rem] text-ink-2">{[h.address || h.area, h.country].filter(Boolean).join(" · ")}</span>
            {h.km != null && <span className={`block text-[0.75rem] font-bold ${h.km > 300 ? "text-warn" : "text-ink-3"}`}>{h.km > 300 ? "⚠️ " : ""}{t("savePlace.km", { n: h.km.toLocaleString() })}</span>}</span>
          <span className="text-teal">＋</span>
        </button>
      )) : <div className="card flex flex-col gap-2 p-4"><span className="text-ink-2">{t("savePlace.none")}</span>{onNone?.(q.trim())}</div>)}
    </div>
  );
}
