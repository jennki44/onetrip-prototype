"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { fmtTime } from "@/lib/trip/derive";
import { reorderItems } from "@/app/t/[tripId]/plan/reorder-actions";
import { proposeMove, type Proposal, type ReorderItem } from "@/lib/trip/reorder";
export type { ReorderItem } from "@/lib/trip/reorder";

/** 排序 mode: drag a card by its ≡ handle (works with touch), or use ↑ ↓. A box confirms the new time before saving. */
export function ReorderDay({ tripId, day, items }: { tripId: string; day: number; items: ReorderItem[] }) {
  const { t, locale } = useT(); const router = useRouter();
  const [order, setOrder] = useState(items); const [drag, setDrag] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const rows = useRef<Record<string, HTMLDivElement | null>>({}); const orderRef = useRef(items);
  // Keep the latest order in a ref (set in handlers, never during render) so pointer events read it without stale state.
  const apply = (n: ReorderItem[]) => { orderRef.current = n; setOrder(n); };

  const finishMove = (list: ReorderItem[], movedId: string) => {
    const before = items.findIndex(i => i.id === movedId), after = list.findIndex(i => i.id === movedId);
    if (before === after && list.every((x, k) => x.id === items[k]?.id)) { apply(items); return; }
    const it = items[before]; const pr = proposeMove(list, movedId);
    if (pr.start === it.start && !pr.push) { apply(items); return; }
    setProposal({ ...pr, title: it.title, from: it.start, to: pr.start });
  };

  // Pointer drag: swap with a neighbour once the pointer passes its middle.
  const onDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrag(id); setErr(null);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return; const list = orderRef.current; const k = list.findIndex(x => x.id === drag);
    const up = list[k - 1], down = list[k + 1];
    const mid = (id: string) => { const r = rows.current[id]?.getBoundingClientRect(); return r ? r.top + r.height / 2 : 0; };
    if (up && e.clientY < mid(up.id)) { const n = [...list]; [n[k - 1], n[k]] = [n[k], n[k - 1]]; apply(n); }
    else if (down && e.clientY > mid(down.id)) { const n = [...list]; [n[k + 1], n[k]] = [n[k], n[k + 1]]; apply(n); }
  };
  const onUp = () => { if (!drag) return; const id = drag; setDrag(null); finishMove(orderRef.current, id); };
  const nudge = (id: string, dir: -1 | 1) => { const k = order.findIndex(x => x.id === id); const j = k + dir; if (j < 0 || j >= order.length) return; const n = [...order]; [n[j], n[k]] = [n[k], n[j]]; apply(n); finishMove(n, id); };

  const save = async (withPush: boolean) => {
    if (!proposal) return; setBusy(true); setErr(null);
    try { await reorderItems({ tripId, day, movedId: proposal.movedId, changes: withPush && proposal.push ? proposal.push.changes : proposal.changes }); setProposal(null); router.refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); apply(items); setProposal(null); }
    finally { setBusy(false); }
  };
  const cancel = () => { setProposal(null); apply(items); };

  return (
    <div className="flex flex-col gap-2" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <p className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">↕️ {t("reorder.hint")}</p>
      {order.map((it, k) => (
        <div key={it.id} ref={el => { rows.current[it.id] = el; }} className={`card flex items-center gap-3 p-3 transition-shadow ${drag === it.id ? "scale-[1.02] shadow-lg ring-2 ring-teal" : ""}`}>
          <button type="button" aria-label={t("reorder.drag")} onPointerDown={onDown(it.id)} className="flex h-11 w-9 flex-none cursor-grab touch-none items-center justify-center rounded-xl bg-surface-2 text-[1.25rem] text-ink-2 active:cursor-grabbing">≡</button>
          <span className="text-[1.4rem]">{it.emoji}</span>
          <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{it.title}</div><div className="text-[0.8125rem] text-ink-2">{fmtTime(it.start, locale)}{it.end ? `–${fmtTime(it.end, locale)}` : ""}</div></div>
          <div className="flex flex-col gap-1"><button type="button" disabled={k === 0 || busy} onClick={() => nudge(it.id, -1)} aria-label={t("reorder.up")} className="h-7 w-8 rounded-lg border-2 border-line text-[0.75rem] disabled:opacity-30">▲</button><button type="button" disabled={k === order.length - 1 || busy} onClick={() => nudge(it.id, 1)} aria-label={t("reorder.down")} className="h-7 w-8 rounded-lg border-2 border-line text-[0.75rem] disabled:opacity-30">▼</button></div>
        </div>
      ))}
      {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}

      {proposal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(12,20,24,.45)] p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t("reorder.confirmTitle")}>
          <div className="w-full max-w-[460px] rounded-[24px] bg-surface p-5">
            <h3 className="text-[1.125rem]">🕘 {t("reorder.confirmTitle")}</h3>
            <p className="mt-2">{t("reorder.timeChange", { name: proposal.title, from: fmtTime(proposal.from, locale), to: fmtTime(proposal.to, locale) })}</p>
            {proposal.push && <p className="mt-2 rounded-xl bg-warn-soft p-3 text-[0.875rem] font-bold">⚠️ {t("reorder.overlap", { n: proposal.push.count, m: proposal.push.minutes })}{proposal.push.clamped ? ` ${t("reorder.clamped")}` : ""}</p>}
            <div className="mt-4 flex flex-col gap-2">
              {proposal.push && <button type="button" disabled={busy} onClick={() => save(true)} className="btn btn-sun w-full py-3.5 disabled:opacity-60">{t("reorder.pushAll", { n: proposal.push.count, m: proposal.push.minutes })}</button>}
              <button type="button" disabled={busy} onClick={() => save(false)} className={`btn w-full py-3.5 disabled:opacity-60 ${proposal.push ? "" : "btn-sun"}`}>{proposal.push ? t("reorder.onlyThis") : t("reorder.ok")}</button>
              <button type="button" disabled={busy} onClick={cancel} className="btn btn-sm self-center">{t("snap.cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
