"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { fmtTime } from "@/lib/trip/derive";
import { kindInfo } from "@/lib/ai/kinds";
import type { FoundPlace } from "@/lib/places";
import { aiCheckPlace, aiCreateTrip, aiPlanTrip, aiSwapItem, type PlanItemT, type PlanT } from "@/app/new/ai-actions";

const INTERESTS = [["🛍", "shopping"], ["🍜", "food"], ["☕", "coffee"], ["🏯", "sightseeing"], ["🌳", "nature"], ["👶", "kids"], ["🎨", "culture"], ["🌃", "nightlife"]] as const;
const PACES = [["🧘", "relaxed"], ["⚖️", "balanced"], ["⚡", "busy"]] as const;
const CURRENCIES = ["AUD", "HKD", "USD", "GBP", "EUR", "JPY", "SGD", "TWD", "CNY", "KRW", "THB"];

type Card = PlanItemT & { key: string; keep: boolean; check: "pending" | "found" | "missing"; place: FoundPlace | null; swapping?: boolean };
type Day = { day: number; theme: string; theme_zh: string; cards: Card[] };

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.8125rem] font-extrabold text-ink-2">{label}{children}</label>; }
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" onClick={onClick} aria-pressed={on} className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-[0.8125rem] font-extrabold ${on ? "border-teal bg-teal-soft" : "border-line bg-surface"}`}>{children}</button>;

/** ✨ Guided trip planner: where & when → what you love → area & wishes → draft cards to keep / remove / swap → create the trip. */
export function AiPlanner() {
  const { t, locale } = useT(); const router = useRouter(); const zh = locale.startsWith("zh");
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ destination: "", start: "", end: "", adults: 2, kids: 0, interests: [] as string[], style: "balanced" as "relaxed" | "balanced" | "busy", areas: "", hotel: "", wishes: "" });
  const [busy, setBusy] = useState<"" | "planning" | "creating">(""); const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(""); const [base, setBase] = useState("AUD"); const [home, setHome] = useState("HKD"); const [days, setDays] = useState<Day[] | null>(null);
  const checking = useRef(0); const [tip, setTip] = useState(0);
  useEffect(() => { if (busy !== "planning") return; const id = setInterval(() => setTip(x => x + 1), 3500); return () => clearInterval(id); }, [busy]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }));
  const errText = (e: string) => t(`ai.err.${["limit", "not_configured", "refused", "busy", "dates", "input"].includes(e) ? e : "failed"}`);
  const nights = f.start && f.end ? Math.round((Date.parse(f.end) - Date.parse(f.start)) / 86400000) : null;
  const step1ok = f.destination.trim().length >= 2 && !!f.start && !!f.end && nights != null && nights >= 0 && nights <= 20;

  // Find each kept card on the map, one at a time (the free map service allows about one lookup a second).
  const checkAll = async (list: Day[], token: number) => {
    for (const d of list) for (const c of d.cards) {
      if (token !== checking.current) return;
      const place = await aiCheckPlace({ search: c.search, title: c.title, destination: f.destination }).catch(() => null);
      if (token !== checking.current) return;
      setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === c.key ? { ...y, place, check: place ? "found" : "missing", keep: place ? y.keep : false } : y)) })));
    }
  };

  const plan = async () => {
    setErr(null); setBusy("planning");
    const r = await aiPlanTrip(f).catch(() => ({ ok: false as const, error: "failed" }));
    setBusy("");
    if (!r.ok) { setErr(errText(r.error)); return; }
    const p: PlanT = r.plan; setName(p.name); setBase(CURRENCIES.includes(p.currency) ? p.currency : "AUD");
    const list: Day[] = p.days.map(d => ({ day: d.day, theme: d.theme, theme_zh: d.theme_zh, cards: d.items.map((it, k) => ({ ...it, key: `${d.day}-${k}-${Math.random().toString(36).slice(2, 7)}`, keep: true, check: "pending", place: null })) }));
    setDays(list); setStep(4); checkAll(list, ++checking.current);
  };

  const swap = async (day: Day, card: Card) => {
    setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === card.key ? { ...y, swapping: true } : y)) })));
    const avoid = (days || []).flatMap(d => d.cards.map(c => c.title));
    const r = await aiSwapItem({ destination: f.destination, day: day.day, theme: day.theme, item: card, avoid }).catch(() => ({ ok: false as const, error: "failed" }));
    if (!r.ok) { setErr(errText(r.error)); setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === card.key ? { ...y, swapping: false } : y)) }))); return; }
    const place = await aiCheckPlace({ search: r.item.search, title: r.item.title, destination: f.destination }).catch(() => null);
    setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === card.key ? { ...r.item, key: card.key, keep: !!place, check: place ? "found" : "missing", place, swapping: false } : y)) })));
  };

  const toggle = (card: Card) => setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === card.key ? { ...y, keep: !y.keep } : y)) })));
  const kept = (days || []).reduce((n, d) => n + d.cards.filter(c => c.keep).length, 0);
  const total = (days || []).reduce((n, d) => n + d.cards.filter(c => c.keep).reduce((a, c) => a + (c.cost || 0), 0), 0);

  const create = async () => {
    if (!days) return; setErr(null); setBusy("creating"); checking.current++;
    const r = await aiCreateTrip({ name: name.trim() || f.destination, destination: f.destination, start: f.start, end: f.end, base, home, style: f.style, interests: f.interests, days: days.map(d => ({ day: d.day, theme: d.theme, theme_zh: d.theme_zh, items: d.cards.filter(c => c.keep).map(({ key: _k, keep: _keep, check: _c, swapping: _s, ...it }) => it) })) }).catch(() => ({ ok: false as const, error: "failed" }));
    if (!r.ok) { setBusy(""); setErr(errText(r.error)); return; }
    router.push(`/t/${r.tripId}/plan?day=1`);
  };

  const tips = [t("ai.tip1"), t("ai.tip2"), t("ai.tip3")];

  return (
    <div className="flex flex-col gap-4">
      {step < 4 && <div className="flex gap-1.5" aria-hidden>{[1, 2, 3].map(s => <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-teal" : "bg-line"}`} />)}</div>}

      {step === 1 && (<>
        <h2 className="text-[1.25rem]">{t("ai.s1")}</h2>
        <Field label={t("create.destination")}><input value={f.destination} onChange={e => set("destination", e.target.value)} maxLength={80} className="input text-[1.125rem]" placeholder={t("ai.destPh")} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-2"><Field label={t("create.start")}><input type="date" value={f.start} onChange={e => set("start", e.target.value)} className="input" /></Field><Field label={t("create.end")}><input type="date" value={f.end} min={f.start || undefined} onChange={e => set("end", e.target.value)} className="input" /></Field></div>
        {nights != null && nights >= 0 && <p className="font-bold text-ink-2">{t("ai.daysNights", { d: nights + 1, n: nights })}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("ai.adults")}><input type="number" min={1} max={20} value={f.adults} onChange={e => set("adults", Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="input" /></Field>
          <Field label={t("ai.kids")}><input type="number" min={0} max={20} value={f.kids} onChange={e => set("kids", Math.max(0, Math.min(20, Number(e.target.value) || 0)))} className="input" /></Field>
        </div>
        <button type="button" disabled={!step1ok} onClick={() => setStep(2)} className="btn btn-sun w-full py-4 text-[1.0625rem] disabled:opacity-60">{t("ai.next")}</button>
      </>)}

      {step === 2 && (<>
        <h2 className="text-[1.25rem]">{t("ai.s2")}</h2>
        <div className="grid grid-cols-4 gap-2">{INTERESTS.map(([e, k]) => <Chip key={k} on={f.interests.includes(k)} onClick={() => set("interests", f.interests.includes(k) ? f.interests.filter(x => x !== k) : [...f.interests, k])}><span className="text-[1.5rem]">{e}</span>{t(`ai.i.${k}`)}</Chip>)}</div>
        <div className="eyebrow">{t("ai.pace")}</div>
        <div className="grid grid-cols-3 gap-2">{PACES.map(([e, k]) => <Chip key={k} on={f.style === k} onClick={() => set("style", k)}><span className="text-[1.5rem]">{e}</span>{t(`create.styles.${k}`)}<span className="text-[0.75rem] font-semibold text-ink-3">{t(`ai.paceN.${k}`)}</span></Chip>)}</div>
        <div className="flex gap-2"><button type="button" onClick={() => setStep(1)} className="btn flex-1">{t("common.back")}</button><button type="button" onClick={() => setStep(3)} className="btn btn-sun flex-[2] py-4 text-[1.0625rem]">{t("ai.next")}</button></div>
      </>)}

      {step === 3 && (<>
        <h2 className="text-[1.25rem]">{t("ai.s3")}</h2>
        <Field label={t("ai.areas")}><input value={f.areas} onChange={e => set("areas", e.target.value)} maxLength={200} className="input" placeholder={t("ai.areasPh")} /></Field>
        <Field label={t("ai.hotel")}><input value={f.hotel} onChange={e => set("hotel", e.target.value)} maxLength={120} className="input" placeholder={t("ai.hotelPh")} /></Field>
        <Field label={t("ai.wishes")}><textarea value={f.wishes} onChange={e => set("wishes", e.target.value)} maxLength={400} className="input min-h-20" placeholder={t("ai.wishesPh")} /></Field>
        {busy === "planning" ? (
          <div className="card flex flex-col items-center gap-3 p-6 text-center"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-teal border-b-transparent" /><b>{t("ai.planning")}</b><p className="text-ink-2">{tips[tip % tips.length]}</p></div>
        ) : (
          <div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="btn flex-1">{t("common.back")}</button><button type="button" onClick={plan} className="btn btn-sun flex-[2] py-4 text-[1.0625rem]">✨ {t("ai.planIt")}</button></div>
        )}
      </>)}

      {step === 4 && days && (<>
        <div className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">✨ {t("ai.draftHint")}</div>
        <Field label={t("ui.tripName")}><input value={name} onChange={e => setName(e.target.value)} maxLength={80} className="input text-[1.125rem]" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("create.tripCurrency")}><select value={base} onChange={e => setBase(e.target.value)} className="input">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label={t("create.homeCurrency")}><select value={home} onChange={e => setHome(e.target.value)} className="input">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        </div>
        {days.map(d => (
          <section key={d.day} className="flex flex-col gap-2">
            <h3 className="mt-2 text-[1.0625rem]">{t("ui.dayN", { n: d.day })} · {zh && d.theme_zh ? d.theme_zh : d.theme}</h3>
            {d.cards.map(c => (
              <div key={c.key} className={`card flex gap-3 p-3 ${c.keep ? "" : "opacity-50"}`}>
                <span className="text-[1.75rem]">{kindInfo(c.kind).emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold">{zh && c.title_zh ? c.title_zh : c.title}</div>
                  <div className="text-[0.8125rem] text-ink-2">{fmtTime(c.start, locale)}{c.end ? `–${fmtTime(c.end, locale)}` : ""} · {c.area}{c.cost > 0 ? ` · ≈ ${base} ${Math.round(c.cost).toLocaleString()}` : ""}</div>
                  <div className="text-[0.8125rem]">{zh && c.why_zh ? c.why_zh : c.why}</div>
                  <div className="mt-1 text-[0.75rem]">{c.swapping ? `⟳ ${t("ai.swapping")}` : c.check === "pending" ? <span className="text-ink-3">📍 {t("ai.checking")}</span> : c.check === "found" ? <span className="text-ink-2">📍 {c.place?.address || c.place?.area || c.place?.name}</span> : <span className="font-bold text-warn">⚠️ {t("ai.noAddress")}</span>}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button type="button" onClick={() => toggle(c)} aria-pressed={c.keep} aria-label={c.keep ? t("ai.remove") : t("ai.keep")} className={`h-10 w-10 rounded-full text-[1.125rem] font-extrabold ${c.keep ? "bg-teal text-white" : "border-2 border-line"}`}>{c.keep ? "✓" : "✕"}</button>
                  <button type="button" disabled={c.swapping} onClick={() => swap(d, c)} aria-label={t("ai.swap")} className="h-10 w-10 rounded-full border-2 border-line text-[1.125rem] disabled:opacity-50">⟳</button>
                </div>
              </div>
            ))}
          </section>
        ))}
        <div className="sticky bottom-3 mt-2 flex flex-col gap-2 rounded-[22px] bg-surface p-3 shadow-card">
          <div className="text-center text-[0.875rem] font-bold text-ink-2">{t("ai.summary", { n: kept })}{total > 0 ? ` · ≈ ${base} ${Math.round(total).toLocaleString()}` : ""}</div>
          <button type="button" disabled={!!busy || kept === 0} onClick={create} className="btn btn-sun w-full py-4 text-[1.0625rem] disabled:opacity-60">{busy === "creating" ? t("snap.saving") : t("ai.create")}</button>
          <button type="button" onClick={() => { checking.current++; setDays(null); setStep(3); }} className="text-[0.8125rem] font-bold text-ink-2 underline">{t("ai.startOver")}</button>
        </div>
      </>)}

      {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
    </div>
  );
}
