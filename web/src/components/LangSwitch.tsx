"use client";
import { useI18n } from "@/lib/i18n/provider";

export function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="seg">
      <button type="button" onClick={() => setLocale("en")} className={locale === "en" ? "on" : ""}>EN</button>
      <button type="button" onClick={() => setLocale("zh-Hant")} className={locale === "zh-Hant" ? "on" : ""}>繁中</button>
    </div>
  );
}
