import { cache } from "react";

export type RateTable = { perAud: Record<string, number>; updated: string | null; live: boolean };

/** Used when the rate service cannot be reached. Approximate mid-2026 values per 1 AUD. */
export const FALLBACK_PER_AUD: Record<string, number> = { AUD: 1, HKD: 5.13, USD: 0.66, GBP: 0.52, EUR: 0.60, JPY: 99.0, SGD: 0.88, NZD: 1.08, TWD: 21.2, CNY: 4.75 };

/** Daily exchange rates per 1 AUD from open.er-api.com (ExchangeRate-API open access: free, no key, updated once a day).
    Next caches the response for 12 hours across requests, so pages do not wait on it. Server-side only; falls back to the fixed table. */
export const loadRates = cache(async (): Promise<RateTable> => {
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch("https://open.er-api.com/v6/latest/AUD", { next: { revalidate: 43200 }, signal: ctrl.signal });
    clearTimeout(timer); if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { result?: string; base_code?: string; rates?: Record<string, unknown>; time_last_update_unix?: number };
    if (j.result !== "success" || j.base_code !== "AUD" || !j.rates) throw new Error("shape");
    const perAud: Record<string, number> = {};
    for (const [code, v] of Object.entries(j.rates)) if (/^[A-Z]{3}$/.test(code) && typeof v === "number" && Number.isFinite(v) && v > 0) perAud[code] = v;
    if (!perAud.HKD || !perAud.USD) throw new Error("incomplete");
    perAud.AUD = 1;
    return { perAud, updated: j.time_last_update_unix ? new Date(j.time_last_update_unix * 1000).toISOString() : null, live: true };
  } catch { return { perAud: FALLBACK_PER_AUD, updated: null, live: false }; }
});
