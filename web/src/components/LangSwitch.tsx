"use client";
import { useI18n } from "@/lib/i18n/provider";

export function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-full bg-surface-2 p-0.5 text-[12.5px] font-extrabold">
      <button onClick={() => setLocale("en")} className={`rounded-full px-3 py-1 ${locale === "en" ? "bg-surface text-ink shadow-card" : "text-ink-3"}`}>EN</button>
      <button onClick={() => setLocale("zh-Hant")} className={`rounded-full px-3 py-1 ${locale === "zh-Hant" ? "bg-surface text-ink shadow-card" : "text-ink-3"}`}>繁中</button>
    </div>
  );
}
