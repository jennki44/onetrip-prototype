"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { isoDate } from "@/lib/trip/derive";
import { ExpenseForm } from "./ExpenseForm";
import { SpeechBar } from "./SpeechBar";
import { aiReadExpense, type SpokenExpense } from "@/app/t/[tripId]/money/ai-actions";

type Props = React.ComponentProps<typeof ExpenseForm>;

/** 🎤 講出使費: say or type the expense, AI fills the normal expense form, you check and save. */
export function VoiceExpense(props: Props) {
  const { t } = useT();
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [filled, setFilled] = useState<{ key: number; initial: Partial<SpokenExpense> } | null>(null);

  const read = async () => {
    if (text.trim().length < 2) return; setErr(null); setBusy(true);
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
        <SpeechBar onText={setText} disabled={busy} />
        <button type="button" onClick={read} disabled={busy || text.trim().length < 2} className="btn btn-sun w-full py-3.5 disabled:opacity-60">{busy ? t("ai.reading") : `✨ ${t("ai.read")}`}</button>
        {err && <p role="alert" className="rounded-xl bg-bad-soft p-2.5 text-[0.875rem] font-bold text-bad">{err}</p>}
      </div>
      {filled && <p className="rounded-2xl bg-teal-soft/40 p-3 text-[0.875rem] font-bold">✨ {t("voiceExpense.check")}</p>}
      {/* A new key remounts the form so the AI's values become its starting values; everything stays editable. */}
      <ExpenseForm key={filled?.key || 0} {...props} initial={{ ...props.initial, ...(filled?.initial || {}) }} />
    </div>
  );
}
