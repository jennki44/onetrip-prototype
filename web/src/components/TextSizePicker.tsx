"use client";
import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/provider";

export type TextSize = "standard" | "large" | "xlarge";
const KEY = "onetrip-text"; const listeners = new Set<() => void>();
function read(): TextSize { try { const v = localStorage.getItem(KEY); return v === "large" || v === "xlarge" ? v : "standard"; } catch { return "standard"; } }
export function applyTextSize(s: TextSize) { const root = document.documentElement; if (s === "standard") delete root.dataset.text; else root.dataset.text = s; }
function subscribe(cb: () => void) { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb); }; }

/** Standard / Large / Extra large. Remembered on this device; applied before first paint by the boot script in layout.tsx. */
export function TextSizePicker() {
  const { t } = useT();
  const size = useSyncExternalStore(subscribe, read, () => "standard" as TextSize);
  const set = (s: TextSize) => { try { localStorage.setItem(KEY, s); } catch {} applyTextSize(s); listeners.forEach(l => l()); };
  const opts: [TextSize, string][] = [["standard", "1rem"], ["large", "1.2rem"], ["xlarge", "1.45rem"]];
  return (
    <div className="tsizes" role="radiogroup" aria-label={t("settings.textSize")}>
      {opts.map(([s, fs]) => <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => set(s)} className={`tsize ${size === s ? "on" : ""}`}><b style={{ fontSize: fs }}>Aa</b><span>{t(`settings.text_${s}`)}</span></button>)}
    </div>
  );
}
