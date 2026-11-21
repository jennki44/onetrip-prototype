"use client";
import { useT } from "@/lib/i18n/provider";

/** Opens the ✨ quick add sheet that lives in the trip shell (see AppShell). */
export function AiQuickButton({ className = "btn btn-sm" }: { className?: string }) {
  const { t } = useT();
  return <button type="button" onClick={() => window.dispatchEvent(new Event("onetrip:ai-quick"))} className={className}>✨ {t("ai.button")}</button>;
}
