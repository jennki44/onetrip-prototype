"use client";
import { useState } from "react";
import Form from "next/form";
import { useFormStatus } from "react-dom";
import { useT } from "@/lib/i18n/provider";

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function PreviewButton({ disabled }: { disabled: boolean }) {
  const { t } = useT(); const { pending } = useFormStatus();
  return (
    <button className="btn btn-teal shrink-0 disabled:opacity-50" disabled={disabled || pending} aria-busy={pending}>
      {pending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent" />{t("join.finding")}</> : t("join.preview")}
    </button>
  );
}

/** Code box + preview. Arriving from an invite link with a valid code, it stays folded away behind a small link so the trip card is the only next step. */
export function JoinCodeForm({ initial, shownCode, collapsed }: { initial: string; shownCode: string | null; collapsed: boolean }) {
  const { t } = useT(); const [open, setOpen] = useState(!collapsed); const [value, setValue] = useState(initial);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[0.875rem] text-ink-2 underline underline-offset-4">{t("join.otherCode")}</button>;
  const same = !!shownCode && norm(value) === shownCode;
  return (
    <Form action="/join" className="flex gap-2">
      <input name="code" value={value} onChange={e => setValue(e.target.value)} autoFocus={collapsed} className="input font-mono text-center text-[1.375rem] uppercase tracking-[.15em]" placeholder="SYDNEY-26" maxLength={12} />
      <PreviewButton disabled={same || norm(value).length < 6} />
    </Form>
  );
}
