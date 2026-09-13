"use client";
import { useTransition } from "react";
import { setReportingCurrency } from "@/app/t/[tripId]/money/actions";

const OPTIONS = ["HKD", "AUD", "USD", "GBP", "EUR", "JPY", "SGD", "TWD", "CNY"];

export function CurrencyPicker({ tripId, current }: { tripId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select value={current} disabled={pending} onChange={e => start(() => setReportingCurrency(tripId, e.target.value))} className="rounded-lg border-2 border-line bg-surface px-2 py-1.5 text-[0.8125rem] font-extrabold" aria-label="Reporting currency">
      {OPTIONS.map(c => <option key={c}>{c}</option>)}
    </select>
  );
}
