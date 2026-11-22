"use client";
import { useT } from "@/lib/i18n/provider";

/** Opens the ✨ add screen that lives in the trip shell (see AppShell). */
export function AiQuickButton({ className = "btn btn-sm", label }: { className?: string; label?: string }) {
  const { t } = useT();
  return <button type="button" onClick={() => window.dispatchEvent(new Event("onetrip:ai-quick"))} className={className}>{label ?? `✨ ${t("ai.button")}`}</button>;
}
