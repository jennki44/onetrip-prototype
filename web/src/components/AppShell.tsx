"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

const TABS = [
  { key: "today", ic: "☀️", path: "" },
  { key: "plan", ic: "🗓️", path: "/plan" },
  { key: "map", ic: "🗺️", path: "/map" },
  { key: "money", ic: "💵", path: "/money" },
  { key: "more", ic: "☰", path: "/more" },
];
const ADD = [
  ["📍", "place", "/map"], ["📅", "activity", "/plan/new"], ["🏨", "booking", "/inbox"], ["💰", "expense", "/money/new"], ["🧾", "receipt", "/money/scan"],
  ["📄", "document", "/inbox"], ["🗳", "decision", "/decisions/new"], ["📝", "note", "/notes/new"], ["🎤", "voice", "/money/new?voice=1"], ["📷", "photo", "/inbox"],
] as const;

export function AppShell({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const path = usePathname(); const { t } = useT(); const [add, setAdd] = useState(false);
  const base = `/t/${tripId}`;
  const active = (p: string) => (p === "" ? path === base || path.startsWith(`${base}/today`) : path.startsWith(base + p));
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[640px] flex-col md:max-w-[1120px]">
      <main className="flex-1 px-4 pb-28 pt-4 md:px-9 md:pt-7">{children}</main>
      <button aria-label={t("nav.add")} onClick={() => setAdd(true)} className="fixed bottom-24 right-4 z-30 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-coral text-[30px] font-light text-white shadow-[0_8px_22px_rgba(255,107,74,.45)] transition active:scale-95 md:right-8">+</button>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-[78px] grid-cols-5 items-end border-t-2 border-line bg-surface px-1 pb-3 pt-2">
        {TABS.map(tab => (
          <Link key={tab.key} href={base + tab.path} className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-extrabold ${active(tab.path) ? "text-teal-text" : "text-ink-3"}`}>
            <span className={`text-[22px] leading-none ${active(tab.path) ? "" : "opacity-70 grayscale"}`}>{tab.ic}</span>{t(`nav.${tab.key}`)}
          </Link>
        ))}
      </nav>
      {add && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(12,20,24,.45)]" onClick={() => setAdd(false)}>
          <div className="w-full max-w-[640px] rounded-t-[28px] bg-surface px-5 pb-8 pt-3" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
            <h2 className="text-[20px]">{t("nav.add")}</h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {ADD.map(([e, l, p]) => <Link key={l} href={base + p} onClick={() => setAdd(false)} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-2 px-1 py-3 text-[11.5px] font-extrabold text-ink-2"><span className="text-[24px]">{e}</span>{t(`ui.add.${l}`)}</Link>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
