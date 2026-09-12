"use client";
import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/provider";

type Mode = "auto" | "light" | "dark";
const KEY = "onetrip-theme"; const listeners = new Set<() => void>();
function read(): Mode { try { return (localStorage.getItem(KEY) as Mode) || "auto"; } catch { return "auto"; } }
function apply(m: Mode) {
  const root = document.documentElement; root.classList.remove("dark-auto");
  if (m === "auto") { delete root.dataset.theme; if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark-auto"); } else root.dataset.theme = m;
}
function subscribe(cb: () => void) { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb); }; }

export function ThemeSwitch() {
  const { t } = useT();
  const mode = useSyncExternalStore(subscribe, read, () => "auto" as Mode);
  const set = (m: Mode) => { try { localStorage.setItem(KEY, m); } catch {} apply(m); listeners.forEach(l => l()); };
  return <div className="seg">{(["auto", "light", "dark"] as Mode[]).map(m => <button key={m} type="button" onClick={() => set(m)} className={mode === m ? "on" : ""}>{t(`settings.${m}`)}</button>)}</div>;
}
