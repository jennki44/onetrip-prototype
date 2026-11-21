"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { fmtTime } from "@/lib/trip/derive";
import { kindInfo } from "@/lib/ai/kinds";
import type { FoundPlace } from "@/lib/places";
import { aiCheckPlace, aiCreateTrip, aiPlanOutline, aiSwapItem, type OutlineT, type PlanItemT } from "@/app/new/ai-actions";

const INTERESTS = [["🛍", "shopping"], ["🍜", "food"], ["☕", "coffee"], ["🏯", "sightseeing"], ["🌳", "nature"], ["👶", "kids"], ["🎨", "culture"], ["🌃", "nightlife"]] as const;
const PACES = [["🧘", "relaxed"], ["⚖️", "balanced"], ["⚡", "busy"]] as const;
const CURRENCIES = ["AUD", "HKD", "USD", "GBP", "EUR", "JPY", "SGD", "TWD", "CNY", "KRW", "THB"];

type Card = PlanItemT & { key: string; keep: boolean; check: "pending" | "found" | "missing"; place: FoundPlace | null; swapping?: boolean };
type Day = { day: number; theme: string; theme_zh: string; area: string; cards: Card[]; state: "loading" | "ready" | "failed" };
type Phase = "" | "outline" | "days" | "done";
/** Rough seconds for the outline and for the parallel days, used for the "about N seconds" countdown. */
const EXPECT = { outline: 7, days: 22 };

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.8125rem] font-extrabold text-ink-2">{label}{children}</label>; }
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" onClick={onClick} aria-pressed={on} className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-[0.8125rem] font-extrabold ${on ? "border-teal bg-teal-soft" : "border-line bg-surface"}`}>{children}</button>;

/** ✨ Guided trip planner: where & when → what you love → area & wishes → draft cards to keep / remove / swap → create the trip. */
export function AiPlanner() {
  const { t, locale } = useT(); const router = useRouter(); const zh = locale.startsWith("zh");
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ destination: "", start: "", end: "", adults: 2, kids: 0, interests: [] as string[], style: "balanced" as "relaxed" | "balanced" | "busy", areas: "", hotel: "", wishes: "" });
  const [busy, setBusy] = useState<"" | "planning" | "creating">(""); const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(""); const [base, setBase] = useState("AUD"); const [home, setHome] = useState("HKD"); const [days, setDays] = useState<Day[] | null>(null);
  const checking = useRef(0); const [phase, setPhase] = useState<Phase>(""); const [areas, setAreas] = useState<string[]>([]); const outlineRef = useRef<OutlineT | null>(null);
  const [startedAt, setStartedAt] = useState(0); const [now, setNow] = useState(0); const [daysAt, setDaysAt] = useState(0);
  useEffect(() => { if (phase !== "outline" && phase !== "days") return; const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, [phase]);
  // Map checks run one at a time in the background (the free map service allows about one lookup a second).
  const queue = useRef<{ key: string; search: string; title: string }[]>([]); const running = useRef(false); const [checked, setChecked] = useState({ done: 0, total: 0 });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }));
  const errText = (e: string) => t(`ai.err.${["limit", "not_configured", "refused", "busy", "dates", "input"].includes(e) ? e : "failed"}`);
  const nights = f.start && f.end ? Math.round((Date.parse(f.end) - Date.parse(f.start)) / 86400000) : null;
  const step1ok = f.destination.trim().length >= 2 && !!f.start && !!f.end && nights != null && nights >= 0 && nights <= 20;

  const runQueue = async (token: number) => {
    if (running.current) return; running.current = true;
    while (queue.current.length && token === checking.current) {
      const c = queue.current.shift()!;
      const place = await aiCheckPlace({ search: c.search, title: c.title, destination: f.destination }).catch(() => null);
      if (token !== checking.current) break;
      setDays(ds => ds && ds.map(x => ({ ...x, cards: x.cards.map(y => (y.key === c.key ? { ...y, place, check: place ? "found" : "missing", keep: place ? y.keep : false } : y)) })));
      setChecked(x => ({ ...x, done: x.done + 1 }));
    }
    running.current = false;
  };

  // Step B: one request per day, all at once; each day's cards appear as soon as that day is ready.
  const loadDay = async (d: Pick<Day, "day">, token: number) => {
    const o = outlineRef.current; if (!o) return;
    setDays(ds => ds && ds.map(x => (x.day === d.day ? { ...x, state: "loading" } : x)));
    const res = await fetch("/api/ai/plan-day", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: f, day: d.day, outline: o.days.map(x => ({ day: x.day, theme: x.theme, area: x.area })) }) }).catch(() => null);
    const j = res ? ((await res.json().catch(() => ({}))) as { items?: PlanItemT[]; error?: string }) : { error: "failed" };
    if (token !== checking.current) return;
    if (!res?.ok || !j.items) { setDays(ds => ds && ds.map(x => (x.day === d.day ? { ...x, state: "failed" } : x))); if (j.error === "limit") setErr(errText("limit")); return; }
    const added: Card[] = j.items.map((it, k) => ({ ...it, key: d.day + "-" + k + "-" + Math.random().toString(36).slice(2, 7), keep: true, check: "pending" as const, place: null }));
    // Days are written in parallel, so drop a stop another day already has.
    setDays(ds => {
      if (!ds) return ds;
      const seen = new Set(ds.filter(x => x.day !== d.day).flatMap(x => x.cards.map(c => c.title.toLowerCase())));
      return ds.map(x => (x.day === d.day ? { ...x, cards: added.filter(c => !seen.has(c.title.toLowerCase())), state: "ready" } : x));
    });
    queue.current.push(...added.map(c => ({ key: c.key, search: c.search, title: c.title }))); setChecked(x => ({ ...x, total: x.total + added.length })); runQueue(token);
  };

  const plan = async () => {
    setErr(null); setBusy("planning"); setPhase("outline"); const t0 = Date.now(); setStartedAt(t0); setNow(t0);
    const token = ++checking.current; queue.current = []; setChecked({ done: 0, total: 0 });
    const r = await aiPlanOutline(f).catch(() => ({ ok: false as const, error: "failed" }));
    if (token !== checking.current) return;
    if (!r.ok) { setBusy(""); setPhase(""); setErr(errText(r.error)); return; }
    const o = r.outline; outlineRef.current = o; setName(o.name); setBase(CURRENCIES.includes(o.currency) ? o.currency : "AUD"); setAreas(o.areas.slice(0, 4));
    const list: Day[] = o.days.map(d => ({ day: d.day, theme: d.theme, theme_zh: d.theme_zh, area: d.area, cards: [], state: "loading" }));
    setDays(list); setStep(4); setPhase("days"); setDaysAt(Date.now());
    await Promise.all(list.map(d => loadDay(d, token)));
    if (token !== checking.current) return;
    setBusy(""); setPhase("done");
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
  const daysReady = !!days && days.every(d => d.state !== "loading");
  const unchecked = (days || []).reduce((n, d) => n + d.cards.filter(c => c.keep && c.check === "pending").length, 0);
  const kept = (days || []).reduce((n, d) => n + d.cards.filter(c => c.keep).length, 0);
  const costTotal = (days || []).reduce((n, d) => n + d.cards.filter(c => c.keep).reduce((a, c) => a + (c.cost || 0), 0), 0);

  const create = async () => {
    if (!days) return; setErr(null); setBusy("creating"); checking.current++;
    const r = await aiCreateTrip({ name: name.trim() || f.destination, destination: f.destination, start: f.start, end: f.end, base, home, style: f.style, interests: f.interests, days: days.map(d => ({ day: d.day, theme: d.theme, theme_zh: d.theme_zh, items: d.cards.filter(c => c.keep).map(({ key: _k, keep: _keep, check, swapping: _s, ...it }) => ({ ...it, lookup: check === "pending" })) })) }).catch(() => ({ ok: false as const, error: "failed" }));
    if (!r.ok) { setBusy(""); setErr(errText(r.error)); return; }
    router.push(`/t/${r.tripId}/plan?day=1`);
  };

  // Progress: outline about 15%, days about 85%. The countdown is an estimate and stops at "almost done".
  const dayCount = days?.length || 0; const ready = (days || []).filter(d => d.state !== "loading").length;
  // While days are being written the bar creeps forward with time, then jumps as each day lands.
  const sinceDays = daysAt ? (now - daysAt) / 1000 : 0;
  const pct = phase === "outline" ? Math.min(14, ((now - startedAt) / 1000 / EXPECT.outline) * 14) : phase === "days" ? 15 + Math.max(dayCount ? (ready / dayCount) * 85 : 0, Math.min(75, (sinceDays / EXPECT.days) * 75)) : phase === "done" ? 100 : 0;
  const left = Math.round(phase === "outline" ? EXPECT.outline + EXPECT.days - (now - startedAt) / 1000 : EXPECT.days - sinceDays);
  const steps = [
    { label: t("ai.stepPrefs"), state: phase === "outline" ? "on" : "done" },
    { label: areas.length ? t("ai.stepAreasN", { areas: areas.join("、") }) : t("ai.stepAreas"), state: phase === "outline" ? "wait" : "done" },
    { label: t("ai.stepDays") + (phase === "days" ? " · " + ready + "/" + dayCount : ""), state: phase === "days" ? "on" : "wait" },
    { label: t("ai.stepMap") + (checked.total ? " · " + checked.done + "/" + checked.total : ""), state: checked.total ? (checked.done >= checked.total ? "done" : "on") : "wait" },
  ];
  const progress = (phase === "outline" || phase === "days") && (
    <div className="card flex flex-col gap-2 p-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-[1.0625rem] font-extrabold"><span className="animate-pulse text-[1.375rem]">✨</span>{t("ai.planningFor", { place: f.destination.split(",")[0] })}</div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: Math.round(pct) + "%" }} /></div>
      <div className="flex justify-between text-[0.75rem] text-ink-3"><span>{Math.round(pct)}%</span><span>{left > 1 ? t("ai.secondsLeft", { n: left }) : t("ai.almost")}</span></div>
      {steps.map((st, i) => (
        <div key={i} className={"flex items-center gap-2.5 text-[0.9375rem] " + (st.state === "wait" ? "text-ink-3" : st.state === "done" ? "text-ink-2" : "font-bold")}>
          <span className={"flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-2 text-[0.75rem] " + (st.state === "done" ? "border-good bg-good-soft text-good" : st.state === "on" ? "animate-spin border-teal border-t-transparent" : "border-line")}>{st.state === "done" ? "✓" : ""}</span>{st.label}
        </div>
      ))}
      <p className="text-center text-[0.8125rem] text-ink-2">{t("ai.watchHint")}</p>
    </div>
  );

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
        {phase === "outline" ? progress : (
          <div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="btn flex-1">{t("common.back")}</button><button type="button" onClick={plan} className="btn btn-sun flex-[2] py-4 text-[1.0625rem]">✨ {t("ai.planIt")}</button></div>
        )}
      </>)}

      {step === 4 && days && (<>
        {progress || <div className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">✨ {t("ai.draftHint")}</div>}
        <Field label={t("ui.tripName")}><input value={name} onChange={e => setName(e.target.value)} maxLength={80} className="input text-[1.125rem]" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("create.tripCurrency")}><select value={base} onChange={e => setBase(e.target.value)} className="input">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label={t("create.homeCurrency")}><select value={home} onChange={e => setHome(e.target.value)} className="input">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        </div>
        {days.map(d => (
          <section key={d.day} className="flex flex-col gap-2">
            <h3 className={"mt-2 text-[1.0625rem] " + (d.state === "loading" ? "text-ink-3" : "")}>{t("ui.dayN", { n: d.day })} · {zh && d.theme_zh ? d.theme_zh : d.theme}</h3>
            {d.state === "loading" && [70, 55, 62].map((w, k) => <div key={k} className="card p-3"><div className="h-2.5 animate-pulse rounded-full bg-line" style={{ width: w + "%" }} /><div className="mt-2 h-2.5 animate-pulse rounded-full bg-line" style={{ width: (w - 25) + "%" }} /></div>)}
            {d.state === "failed" && <div className="card flex items-center justify-between gap-2 p-3"><span className="text-ink-2">{t("ai.dayFailed")}</span><button type="button" onClick={() => loadDay(d, checking.current)} className="btn btn-sm">{t("ai.again")}</button></div>}
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
          <div className="text-center text-[0.875rem] font-bold text-ink-2">{t("ai.summary", { n: kept })}{costTotal > 0 ? ` · ≈ ${base} ${Math.round(costTotal).toLocaleString()}` : ""}</div>
          <button type="button" disabled={!!busy || !daysReady || kept === 0} onClick={create} className="btn btn-sun w-full py-4 text-[1.0625rem] disabled:opacity-60">{busy === "creating" ? (unchecked ? t("ai.creatingMap", { n: unchecked }) : t("snap.saving")) : t("ai.create")}</button>
          <button type="button" onClick={() => { checking.current++; queue.current = []; setPhase(""); setBusy(""); setDays(null); setStep(3); }} className="text-[0.8125rem] font-bold text-ink-2 underline">{t("ai.startOver")}</button>
        </div>
      </>)}

      {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
    </div>
  );
}
