"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { createExpense, type ExpenseInput } from "@/app/t/[tripId]/money/actions";
import { fmtMoney, splitEqual, splitItemised, splitPercent, splitShares, toMinor, type SplitType } from "@/lib/money";

type Member = { id: string; name: string; initials: string; color: string };
type Item = { name: string; amount: string; userIds: string[] };
const CURRENCIES = ["AUD", "HKD", "USD", "GBP", "EUR", "JPY", "SGD", "TWD"];

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.7813rem] font-extrabold text-ink-2">{label}{children}</label>; }

export function ExpenseForm({ tripId, baseCurrency, members, meId, categories, defaultDate, places, item, initialItems, initial }: {
  tripId: string; baseCurrency: string; members: Member[]; meId: string; categories: string[]; defaultDate: string; places: { id: string; name: string }[];
  item: { id: string; placeId: string | null; title: string } | null; initialItems?: Item[]; initial?: Partial<{ merchant: string; amount: string; date: string; category: string; receiptImagePath: string }>;
}) {
  const { t } = useT(); const router = useRouter(); const [pending, start] = useTransition(); const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState(initial?.merchant || ""); const [amount, setAmount] = useState(initial?.amount || ""); const [currency, setCurrency] = useState(baseCurrency); const [date, setDate] = useState(initial?.date || defaultDate);
  const [category, setCategory] = useState(initial?.category || categories[0]); const [payer, setPayer] = useState(meId); const [participants, setParticipants] = useState<string[]>(members.map(m => m.id));
  const [split, setSplit] = useState<SplitType>(initialItems?.length ? "itemised" : "equal"); const [vals, setVals] = useState<Record<string, string>>({}); const [items, setItems] = useState<Item[]>(initialItems || []); const [note, setNote] = useState("");
  const totalMinor = toMinor(Number(amount) || 0, currency);
  const shares = useMemo(() => {
    if (split === "equal") return splitEqual(totalMinor, participants);
    if (split === "percent") return splitPercent(totalMinor, Object.fromEntries(participants.map(id => [id, Number(vals[id]) || 0])));
    if (split === "shares") return splitShares(totalMinor, Object.fromEntries(participants.map(id => [id, Number(vals[id]) || 1])));
    if (split === "amounts") return Object.fromEntries(participants.map(id => [id, toMinor(Number(vals[id]) || 0, currency)]));
    return splitItemised(items.map(it => ({ amountMinor: toMinor(Number(it.amount) || 0, currency), userIds: it.userIds })), 0);
  }, [split, totalMinor, participants, vals, items, currency]);
  const sum = Object.values(shares).reduce((a, v) => a + v, 0); const tolerance = Math.max(1, participants.length); const diff = totalMinor - sum; const matches = Math.abs(diff) <= tolerance;
  const ok = totalMinor > 0 && matches && merchant.trim();
  const reason = !merchant.trim() ? t("ui.needMerchant") : totalMinor <= 0 ? t("ui.needAmount") : !matches ? (diff > 0 ? t("ui.mismatch", { items: fmtMoney(sum, currency), total: fmtMoney(totalMinor, currency), diff: fmtMoney(diff, currency) }) : t("ui.overBy", { items: fmtMoney(sum, currency), total: fmtMoney(totalMinor, currency), diff: fmtMoney(-diff, currency) })) : null;
  const addRemainder = () => setItems(a => { const blank = a.findIndex(it => !(Number(it.amount) > 0)); const row = { name: a[blank]?.name || "", amount: (diff / (currency === "JPY" ? 1 : 100)).toFixed(currency === "JPY" ? 0 : 2), userIds: a[blank]?.userIds?.length ? a[blank].userIds : members.map(m => m.id) }; return blank >= 0 ? a.map((it, i) => (i === blank ? row : it)) : [...a, row]; });
  const toggle = (id: string) => setParticipants(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  const submit = () => start(async () => {
    setError(null);
    try {
      const input: ExpenseInput = { tripId, merchant, amount: Number(amount), currency, date, category, payerId: payer, participants: split === "itemised" ? Object.keys(shares) : participants, split, note, itemId: item?.id || null, placeId: item?.placeId || null, emoji: category === "Food" ? "🍽️" : category === "Transport" ? "🚗" : category === "Activities" ? "🎟️" : category === "Shopping" ? "🛍️" : category === "Accommodation" ? "🏨" : "💰",
        splitValues: split === "equal" || split === "itemised" ? undefined : Object.fromEntries(participants.map(id => [id, Number(vals[id]) || 0])), items: split === "itemised" ? items.filter(it => Number(it.amount) > 0).map((it, k) => ({ name: it.name.trim() || `${merchant.trim() || t("receipt.items")} ${k + 1}`, amount: Number(it.amount) || 0, userIds: it.userIds.length ? it.userIds : participants })) : undefined, receiptImagePath: initial?.receiptImagePath || null };
      const id = await createExpense(input); router.push(`/t/${tripId}/money/${id}?saved=1`);
    } catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
  });
  return (
    <div className="flex flex-col gap-3">
      <Field label={t("money.merchant")}><input className="input" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Coles Randwick" list="places" /><datalist id="places">{places.map(p => <option key={p.id} value={p.name} />)}</datalist></Field>
      <div className="grid grid-cols-[1fr_110px] gap-2"><Field label={t("money.amount")}><input className="input num font-display text-[1.625rem] font-bold" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></Field><Field label={t("money.currency")}><select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field></div>
      <div className="grid grid-cols-2 gap-2"><Field label={t("money.date")}><input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field><Field label={t("money.category")}><select className="input" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c} value={c}>{t(`money.categories.${c}`)}</option>)}</select></Field></div>
      <Field label={t("money.payer")}><div className="flex flex-wrap gap-1.5">{members.map(m => <button type="button" key={m.id} onClick={() => setPayer(m.id)} className={`rounded-full border-2 px-3 py-1.5 text-[0.8125rem] font-extrabold ${payer === m.id ? "border-ink bg-ink text-ground" : "border-line bg-surface"}`}>{m.name}</button>)}</div></Field>
      {split !== "itemised" && <Field label={t("money.participants")}><div className="flex flex-wrap gap-1.5">{members.map(m => <button type="button" key={m.id} onClick={() => toggle(m.id)} className={`flex items-center gap-1.5 rounded-full border-2 py-1 pl-1 pr-3 text-[0.8125rem] font-extrabold ${participants.includes(m.id) ? "border-teal bg-teal-soft" : "border-line bg-surface opacity-60"}`}><span className="avatar" style={{ background: m.color, width: 22, height: 22, fontSize: 9 }}>{m.initials}</span>{m.name}</button>)}</div></Field>}
      <div className="flex gap-1.5 overflow-x-auto">{(["equal", "amounts", "percent", "shares", "itemised"] as SplitType[]).map(s => <button type="button" key={s} onClick={() => setSplit(s)} className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[0.8125rem] font-extrabold ${split === s ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{t(`money.splitTypes.${s}`)}</button>)}</div>
      <div className="card">
        {split === "itemised" ? (
          <div>{items.map((it, k) => <div key={k} className="flex flex-col gap-1.5 border-t border-line-2 py-2.5 first:border-t-0"><div className="flex gap-2"><input className="input flex-1 py-2" value={it.name} placeholder={t("receipt.items")} onChange={e => setItems(a => a.map((x, i) => (i === k ? { ...x, name: e.target.value } : x)))} /><input className="input num w-24 py-2 text-right" inputMode="decimal" value={it.amount} onChange={e => setItems(a => a.map((x, i) => (i === k ? { ...x, amount: e.target.value } : x)))} /><button type="button" onClick={() => setItems(a => a.filter((_, i) => i !== k))} className="text-ink-3">✕</button></div><div className="flex gap-1">{members.map(m => <button type="button" key={m.id} onClick={() => setItems(a => a.map((x, i) => (i === k ? { ...x, userIds: x.userIds.includes(m.id) ? x.userIds.filter(u => u !== m.id) : [...x.userIds, m.id] } : x)))} className="avatar" style={{ background: m.color, width: 26, height: 26, fontSize: 10, opacity: it.userIds.includes(m.id) ? 1 : 0.3 }}>{m.initials}</button>)}</div></div>)}<button type="button" onClick={() => setItems(a => [...a, { name: "", amount: "", userIds: members.map(m => m.id) }])} className="mt-2 text-[0.8125rem] font-extrabold text-teal-text">+ {t("receipt.items")}</button></div>
        ) : null}
        <div className={split === "itemised" ? "mt-3 border-t border-line pt-2" : ""}>
          {(split === "itemised" ? members.filter(m => shares[m.id]) : members.filter(m => participants.includes(m.id))).map(m => <div key={m.id} className="flex items-center gap-2.5 border-t border-line-2 py-2 first:border-t-0"><span className="avatar" style={{ background: m.color, width: 24, height: 24, fontSize: 9 }}>{m.initials}</span><span className="flex-1 font-semibold">{m.name}</span>
            {split === "amounts" && <input className="input num w-24 py-1.5 text-right" inputMode="decimal" value={vals[m.id] || ""} onChange={e => setVals(v => ({ ...v, [m.id]: e.target.value }))} />}{split === "percent" && <><input className="input num w-20 py-1.5 text-right" inputMode="decimal" value={vals[m.id] ?? (100 / participants.length).toFixed(0)} onChange={e => setVals(v => ({ ...v, [m.id]: e.target.value }))} /><span className="text-[0.75rem]">%</span></>}{split === "shares" && <div className="flex items-center rounded-lg bg-surface-2"><button type="button" className="px-2.5 py-1 font-bold" onClick={() => setVals(v => ({ ...v, [m.id]: String(Math.max(0, (Number(v[m.id]) || 1) - 1)) }))}>−</button><span className="px-1 font-bold">{vals[m.id] ?? 1}</span><button type="button" className="px-2.5 py-1 font-bold" onClick={() => setVals(v => ({ ...v, [m.id]: String((Number(v[m.id]) || 1) + 1) }))}>+</button></div>}
            <span className="num w-[84px] text-right font-display font-bold">{fmtMoney(shares[m.id] || 0, currency)}</span></div>)}
          <div className="flex items-center justify-between border-t-2 border-line pt-2"><b>{t("money.total")}</b><b className={`num font-display ${!matches ? "text-bad" : "text-good"}`}>{fmtMoney(sum, currency)}</b></div>
          {reason && <p className="mt-2 rounded-xl bg-warn-soft p-2.5 text-[0.85rem] font-bold text-ink" role="status">{reason}</p>}
          {split === "itemised" && totalMinor > 0 && diff > tolerance && <button type="button" onClick={addRemainder} className="btn btn-teal btn-sm mt-2">{t("ui.addRemainder", { diff: fmtMoney(diff, currency) })}</button>}
        </div>
      </div>
      <Field label={t("money.notes")}><input className="input" value={note} onChange={e => setNote(e.target.value)} /></Field>
      {error && <p className="text-[0.8125rem] text-bad">{error}</p>}
      <button type="button" disabled={!ok || pending} onClick={submit} className="btn btn-sun w-full py-4 text-[1rem] disabled:opacity-50">{pending ? t("common.loading") : t("money.saveExpense")}</button>
    </div>
  );
}
