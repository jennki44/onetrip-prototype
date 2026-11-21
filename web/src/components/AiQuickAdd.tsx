"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { isoDate } from "@/lib/trip/derive";
import { aiQuickRead, aiQuickSave, type QuickDraft } from "@/app/t/[tripId]/plan/ai-actions";

// The browser's built-in speech-to-text (Chrome/Android, recent iPhones). Typed loosely: it is not in the standard DOM types.
type Recog = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const getRecog = (): (new () => Recog) | null => { const w = globalThis as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog }; return w.SpeechRecognition || w.webkitSpeechRecognition || null; };

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.8125rem] font-extrabold text-ink-2">{label}{children}</label>; }

/** ✨ Speak or type one stop ("6號下午3點 Blue Bottle 清澄白河"), check the card, add it as a proposal. */
export function AiQuickAdd({ tripId, open, onClose }: { tripId: string; open: boolean; onClose: () => void }) {
  const { t, locale } = useT(); const router = useRouter();
  const [text, setText] = useState(""); const [busy, setBusy] = useState<"" | "reading" | "saving">(""); const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuickDraft | null>(null); const [orig, setOrig] = useState<QuickDraft | null>(null);
  const [listening, setListening] = useState(false); const recog = useRef<Recog | null>(null);
  if (!open) return null;
  // The sheet only renders after a tap (never on the server), so checking the browser here is safe.
  const canSpeak = !!getRecog();

  const reset = () => { recog.current?.stop(); setText(""); setDraft(null); setOrig(null); setErr(null); setBusy(""); setListening(false); };
  const close = () => { reset(); onClose(); };
  const errText = (e: string) => t(`ai.err.${["limit", "not_configured", "refused", "busy"].includes(e) ? e : "failed"}`);

  const speak = () => {
    const R = getRecog(); if (!R) return;
    if (listening) { recog.current?.stop(); return; }
    const r = new R(); r.lang = locale.startsWith("zh") ? "zh-HK" : "en-AU"; r.interimResults = true; r.continuous = false;
    r.onresult = e => { const parts = Array.from(e.results).map(x => x[0]?.transcript || ""); setText(parts.join(" ").trim()); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    recog.current = r; setListening(true); r.start();
  };

  const read = async () => {
    if (text.trim().length < 2) return; setErr(null); setBusy("reading"); recog.current?.stop();
    const res = await aiQuickRead({ tripId, text, today: isoDate(new Date()) }).catch(() => ({ ok: false as const, error: "failed" }));
    setBusy("");
    if (!res.ok) { setErr(errText(res.error)); return; }
    setDraft(res.draft); setOrig(res.draft);
  };

  const save = async () => {
    if (!draft || !orig) return; if (!draft.title.trim()) { setErr(t("ai.needName")); return; }
    setErr(null); setBusy("saving");
    try {
      const zh = locale.startsWith("zh");
      const r = await aiQuickSave({ tripId, title: draft.title.trim(), titleEn: zh ? "" : orig.title, titleZh: orig.title_zh, day: draft.day, start: draft.start, end: draft.end, note: draft.note.trim(), noteEn: zh ? "" : orig.note, noteZh: orig.note_zh, cost: draft.cost, kind: draft.kind, placeId: draft.placeId, place: draft.place });
      close(); router.push(`/t/${tripId}/plan?day=${r.day}`); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : t("ai.err.failed")); setBusy(""); }
  };

  const set = <K extends keyof QuickDraft>(k: K, v: QuickDraft[K]) => setDraft(d => (d ? { ...d, [k]: v } : d));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t("ai.quickTitle")}>
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between"><button type="button" onClick={close} className="btn btn-sm">{t("snap.cancel")}</button><h2 className="text-[1.25rem]">✨ {t("ai.quickTitle")}</h2><span className="w-16" /></div>

        {!draft && (<>
          <p className="text-ink-2">{t("ai.quickHint")}</p>
          <textarea value={text} onChange={e => setText(e.target.value)} maxLength={300} rows={3} autoFocus className="input text-[1.125rem]" placeholder={t("ai.quickPh")} />
          <div className="flex gap-2">
            {canSpeak && <button type="button" onClick={speak} className={`btn flex-1 py-4 text-[1.0625rem] ${listening ? "bg-coral text-white animate-pulse" : ""}`} aria-pressed={listening}>🎤 {listening ? t("ai.listening") : t("ai.speak")}</button>}
            <button type="button" onClick={read} disabled={!!busy || text.trim().length < 2} className="btn btn-sun flex-1 py-4 text-[1.0625rem] disabled:opacity-60">{busy === "reading" ? t("ai.reading") : `✨ ${t("ai.read")}`}</button>
          </div>
        </>)}

        {draft && (<>
          <div className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">✨ {t("ai.checkCard")}</div>
          <Field label={t("snap.name")}><input value={draft.title} maxLength={120} onChange={e => set("title", e.target.value)} className="input text-[1.125rem]" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label={t("snap.day")}><select value={draft.day} onChange={e => set("day", Number(e.target.value))} className="input">{draft.days.map(d => <option key={d.day} value={d.day}>{d.label}</option>)}</select></Field>
            <Field label={t("ui.start")}><input type="time" value={draft.start} onChange={e => set("start", e.target.value)} className="input" /></Field>
            <Field label={t("ui.end")}><input type="time" value={draft.end} onChange={e => set("end", e.target.value)} className="input" /></Field>
          </div>
          <div className="card p-4">📍 {draft.place ? <><b>{draft.place.address || draft.place.area || draft.place.name}</b>{draft.placeId && <span className="ml-1 text-ink-3">· {t("ai.inTrip")}</span>}</> : <span className="text-warn">{t("ai.noAddress")}</span>}</div>
          <Field label={t("money.notes")}><textarea value={draft.note} maxLength={500} onChange={e => set("note", e.target.value)} className="input min-h-20" /></Field>
          <Field label={t("ai.cost")}><input value={draft.cost} inputMode="decimal" onChange={e => set("cost", e.target.value)} className="input" placeholder="0" /></Field>
          <div className="flex gap-2"><button type="button" onClick={() => { setDraft(null); setOrig(null); }} className="btn flex-1">{t("ai.again")}</button><button type="button" onClick={save} disabled={!!busy} className="btn btn-sun flex-[2] py-4 text-[1.0625rem] disabled:opacity-60">{busy === "saving" ? t("snap.saving") : t("snap.save")}</button></div>
          <p className="text-center text-[0.8125rem] text-ink-3">{t("ai.proposedNote")}</p>
        </>)}

        {err && <p role="alert" className="rounded-2xl bg-bad-soft p-3 font-bold text-bad">{err}</p>}
      </div>
    </div>
  );
}
