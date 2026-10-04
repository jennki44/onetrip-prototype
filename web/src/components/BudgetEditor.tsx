"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { BUILTIN_CATEGORIES, catEmoji, catLabel } from "@/lib/categories";

type Row = { name: string; amount: string; locked: boolean; used: number };

/** Edit the trip budget and its categories. Built-in categories keep their names; added ones can be renamed or removed while unused. */
export function BudgetEditor({ currency, total, rows: initial }: { currency: string; total: string; rows: Row[] }) {
  const { t } = useT(); const [rows, setRows] = useState<Row[]>(initial); const [tot, setTot] = useState(total);
  const sum = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const set = (k: number, patch: Partial<Row>) => setRows(a => a.map((r, i) => (i === k ? { ...r, ...patch } : r)));
  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="categories" value={JSON.stringify(rows.map(r => ({ name: r.name.trim(), amount: Number(r.amount) || 0 })).filter(r => r.name))} />
      <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("budget.total", { cur: currency })}<input name="total" inputMode="decimal" value={tot} onChange={e => setTot(e.target.value)} className="input num font-display text-[1.4rem] font-bold" placeholder="0" /></label>
      <div>
        <div className="eyebrow mb-2">{t("budget.categories")}</div>
        <div className="flex flex-col gap-2">
          {rows.map((r, k) => (
            <div key={k} className="rounded-2xl border-2 border-line bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="text-[1.3rem]">{catEmoji(r.name)}</span>
                {r.locked ? <span className="min-w-0 flex-1 font-bold">{catLabel(t, r.name)}</span> : <input value={r.name} maxLength={24} onChange={e => set(k, { name: e.target.value })} placeholder={t("budget.newName")} aria-label={t("budget.newName")} className="input min-w-0 flex-1 py-2" />}
                {!r.locked && (r.used === 0 ? <button type="button" onClick={() => setRows(a => a.filter((_, i) => i !== k))} aria-label={t("budget.remove")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-3">✕</button> : <span className="shrink-0 text-[0.75rem] text-ink-3">{t("budget.inUse", { n: r.used })}</span>)}
              </div>
              <label className="mt-2 flex items-center gap-2 text-[0.8125rem] font-bold text-ink-2">{t("budget.amount", { cur: currency })}<input inputMode="decimal" value={r.amount} onChange={e => set(k, { amount: e.target.value })} className="input num ml-auto w-36 py-2 text-right" placeholder="0" /></label>
            </div>))}
        </div>
        {rows.length < 12 && <button type="button" onClick={() => setRows(a => [...a, { name: "", amount: "", locked: false, used: 0 }])} className="btn btn-teal btn-sm mt-3">{t("budget.add")}</button>}
        <p className={`mt-3 rounded-xl p-2.5 text-[0.85rem] font-bold ${tot && Math.abs(sum - (Number(tot) || 0)) > 0.5 ? "bg-warn-soft" : "bg-surface-2"}`}>{t("budget.sum", { sum: sum.toLocaleString(), cur: currency })}{tot && Math.abs(sum - (Number(tot) || 0)) > 0.5 ? ` · ${t("budget.sumDiffers")}` : ""}</p>
        <p className="mt-2 text-[0.75rem] text-ink-3">{t("budget.builtinNote", { list: BUILTIN_CATEGORIES.map(c => catLabel(t, c)).join(", ") })}</p>
      </div>
    </div>
  );
}
