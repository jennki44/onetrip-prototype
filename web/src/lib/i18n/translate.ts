import type { Dictionary } from "./dictionaries";

/** Resolve a dotted key and fill {placeholders}. Missing keys return the key itself so they are easy to spot. Safe on server and client. */
export function translate(dict: Dictionary, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
    else return key;
  }
  let s = typeof cur === "string" ? cur : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
