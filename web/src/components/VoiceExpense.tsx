"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/provider";
import { isoDate } from "@/lib/trip/derive";
import { ExpenseForm } from "./ExpenseForm";
import { getRecog, type Recog } from "./AiAdd";
import { aiReadExpense, type SpokenExpense } from "@/app/t/[tripId]/money/ai-actions";

type Props = React.ComponentProps<typeof ExpenseForm>;
const noop = () => () => {};

/** 🎤 講出使費: say or type the expense, AI fills the normal expense form, you check and save. */
export function VoiceExpense(props: Props) {
  const { t, locale } = useT();
  const [text, setText] = useState(""); const [listening, setListening] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [filled, setFilled] = useState<{ key: number; initial: Partial<SpokenExpense> } | null>(null); const recog = useRef<Recog | null>(null);
  // Server render says "no microphone"; the browser then reports what it supports, without a hydration mismatch.
  const canSpeak = useSyncExternalStore(noop, () => !!getRecog(), () => false);

  const speak = () => {
    const R = getRecog(); if (!R) return; if (listening) { recog.current?.stop(); return; }
    const r = new R(); r.lang = locale.startsWith("zh") ? "zh-HK" : "en-AU"; r.interimResults = true; r.continuous = false;
    r.onresult = e => setText(Array.from(e.results).map(x => x[0]?.transcript || "").join(" ").trim());
    r.onend = () => setListening(false); r.onerror = () => setListening(false); recog.current = r; setListening(true); r.start();
  };
  const read = async () => {
    if (text.trim().length < 2) return; recog.current?.stop(); setErr(null); setBusy(true);
    const r = await aiReadExpense({ tripId: props.tripId, text, today: isoDate(new Date()) }).catch(() => ({ ok: false as const, error: "failed" }));
    setBusy(false);
    if (!r.ok) { setErr(t(`ai.err.${["limit", "not_configured", "refused", "busy"].includes(r.error) ? r.error : "failed"}`)); return; }
    setFilled(f => ({ key: (f?.key || 0) + 1, initial: r.initial }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="card flex flex-col gap-2 p-3">
        <p className="text-[0.875rem] text-ink-2">{t("voiceExpense.hint")}</p>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={300} rows={2} className="input text-[1.0625rem]" placeholder={t("voiceExpense.placeholder")} />
        <div className="flex gap-2">
          {canSpeak && <button type="button" onClick={speak} aria-pressed={listening} className={`btn flex-1 py-3 ${listening ? "animate-pulse bg-coral text-white" : ""}`}>🎤 {listening ? t("ai.listening") : t("ai.speak")}</button>}
          <button type="button" onClick={read} disabled={busy || text.trim().length < 2} className="btn btn-sun flex-1 py-3 disabled:opacity-60">{busy ? t("ai.reading") : `✨ ${t("ai.read")}`}</button>
        </div>
        {err && <p role="alert" className="rounded-xl bg-bad-soft p-2.5 text-[0.875rem] font-bold text-bad">{err}</p>}
      </div>
      {filled && <p className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">✨ {t("voiceExpense.check")}</p>}
      {/* A new key remounts the form so the AI's values become its starting values; everything stays editable. */}
      <ExpenseForm key={filled?.key || 0} {...props} initial={{ ...props.initial, ...(filled?.initial || {}) }} />
    </div>
  );
}
