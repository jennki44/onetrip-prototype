"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { dictionaries, type Dictionary } from "./dictionaries";
import { LOCALE_COOKIE, type Locale } from "./config";

type Ctx = { locale: Locale; dict: Dictionary; setLocale: (l: Locale) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const setLocale = useCallback((l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }, []);
  const value = useMemo(() => ({ locale, dict: dictionaries[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Resolve a dotted key and fill {placeholders}. Missing keys return the key itself so they are easy to spot. */
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

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useT() {
  const { dict, locale } = useI18n();
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(dict, key, vars), [dict]);
  return { t, locale };
}
