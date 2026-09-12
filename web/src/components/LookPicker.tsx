"use client";
import { useSyncExternalStore } from "react";

export const LOOKS = [
  { id: "sunny", name: "Sunny", sw: ["#f3fbf8", "#1fae9f", "#ffd43b", "#ff6b4a"] },
  { id: "postcard", name: "Postcard", sw: ["#fff6e5", "#ffd43b", "#1e9bd7", "#ff6b4a"] },
  { id: "gummy", name: "Gummy", sw: ["#f3f0ff", "#7c5cff", "#ff5ca8", "#b8f2e6"] },
  { id: "journal", name: "Journal", sw: ["#fbf7ee", "#3c7a5a", "#e2503c", "#f6c453"] },
  { id: "metro", name: "Metro", sw: ["#ffffff", "#f39700", "#009bbf", "#111418"] },
  { id: "classic", name: "Classic", sw: ["#f1f5f4", "#0f766e", "#e8541e", "#16232e"] },
] as const;
type LookId = (typeof LOOKS)[number]["id"];
const KEY = "onetrip-look"; const listeners = new Set<() => void>();
function read(): LookId { try { const v = localStorage.getItem(KEY) as LookId | null; return v && LOOKS.some(l => l.id === v) ? v : "sunny"; } catch { return "sunny"; } }
export function applyLook(id: LookId) { const root = document.documentElement; if (id === "sunny") delete root.dataset.look; else root.dataset.look = id; }
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

export function LookPicker() {
  const look = useSyncExternalStore(subscribe, read, () => "sunny" as LookId);
  const set = (id: LookId) => { try { localStorage.setItem(KEY, id); } catch {} applyLook(id); listeners.forEach(l => l()); };
  return (
    <div className="looks" style={{ gridTemplateColumns: `repeat(${LOOKS.length}, 1fr)` }}>
      {LOOKS.map(l => <button key={l.id} type="button" onClick={() => set(l.id)} className={`look ${look === l.id ? "on" : ""}`}><span className="sw">{l.sw.map(c => <i key={c} style={{ background: c }} />)}</span>{l.name}</button>)}
    </div>
  );
}
