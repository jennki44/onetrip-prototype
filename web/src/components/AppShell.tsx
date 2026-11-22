"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { AiAdd, PHOTO_TYPES, SNAP_INPUT } from "./AiAdd";
import { PhotoChooser } from "./PhotoChooser";
import { SavePlace } from "./SavePlace";

/** Any button can open the ✨ quick add sheet by dispatching this event. */
export const AI_QUICK_EVENT = "onetrip:ai-quick";

/* Line icons (24px grid), one colour per tab. Emoji stay for content, not for navigation. */
const ICONS: Record<string, React.ReactNode> = {
  today: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" /></svg>,
  plan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 13.5h3M13.5 13.5h3M7.5 17h3" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.5h.01M18 14.5h.01" /></svg>,
  more: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
};
const TABS = [
  { key: "today", path: "", color: "#f2b705", ink: "#17302f" },
  { key: "plan", path: "/plan", color: "var(--teal)", ink: "#fff" },
  { key: "map", path: "/map", color: "#2b8fd6", ink: "#fff" },
  { key: "money", path: "/money", color: "#22a35d", ink: "#fff" },
  { key: "more", path: "/more", color: "#7c5cff", ink: "#fff" },
];

export function AppShell({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const path = usePathname(); const { t } = useT(); const [add, setAdd] = useState(false); const [ai, setAi] = useState(false); const [savePlace, setSavePlace] = useState(false); const [photo, setPhoto] = useState<File | null>(null); const [photoErr, setPhotoErr] = useState(false); const [choosing, setChoosing] = useState<File | null>(null); const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 3500); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { const open = () => { setPhoto(null); setAi(true); }; window.addEventListener(AI_QUICK_EVENT, open); return () => window.removeEventListener(AI_QUICK_EVENT, open); }, []);
  const base = `/t/${tripId}`;
  const active = (p: string) => (p === "" ? path === base || path.startsWith(`${base}/today`) || path.startsWith(`${base}/travel`) : path.startsWith(base + p));
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[640px] flex-col md:max-w-[1120px]">
      <main className="flex-1 px-4 pb-32 pt-4 md:px-9 md:pt-7">{children}</main>
      {/* The one camera input: any <label htmlFor={SNAP_INPUT}> opens it; the photo then goes to "Use this photo for…". */}
      <input id={SNAP_INPUT} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0] || null; e.target.value = ""; if (!f) return; if (!PHOTO_TYPES.includes(f.type) || f.size > 15 * 1024 * 1024) { setPhotoErr(true); return; } setPhotoErr(false); setChoosing(f); }} />
      {photoErr && <div role="alert" onClick={() => setPhotoErr(false)} className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-bad-soft p-3 font-bold text-bad">{t("snap.badFile")}</div>}
      {choosing && <PhotoChooser tripId={tripId} photo={choosing} onClose={() => setChoosing(null)} onNewActivity={f => { setPhoto(f); setAi(true); }} onSaved={setToast} />}
      <AiAdd tripId={tripId} open={ai} photo={photo} onPhoto={setPhoto} onClose={() => { setAi(false); setPhoto(null); }} />
      {savePlace && <SavePlace tripId={tripId} onClose={() => setSavePlace(false)} onSaved={setToast} />}
      {toast && <div role="status" className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-[520px] rounded-2xl bg-good-soft p-3 text-center font-bold">✅ {toast}</div>}
      <button aria-label={t("nav.add")} onClick={() => setAdd(true)} className="fixed right-4 z-30 flex h-[3.6rem] w-[3.6rem] items-center justify-center rounded-full bg-coral text-[1.9rem] font-light text-white shadow-[0_8px_22px_rgba(255,107,74,.45)] md:right-8" style={{ bottom: "calc(5.4rem + env(safe-area-inset-bottom))" }}>+</button>
      <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 items-stretch border-t-2 border-line bg-surface px-1 pt-1.5" style={{ paddingBottom: "calc(0.4rem + env(safe-area-inset-bottom))" }}>
        {TABS.map(tab => { const on = active(tab.path); return (
          <Link key={tab.key} href={base + tab.path} aria-current={on ? "page" : undefined} className={`tab ${on ? "on" : ""}`} style={{ "--tab": tab.color, "--tab-ink": tab.ink } as React.CSSProperties}>
            {ICONS[tab.key]}<span>{t(`nav.${tab.key}`)}</span>
          </Link>); })}
      </nav>
      {add && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(12,20,24,.45)]" onClick={() => setAdd(false)}>
          <div className="w-full max-w-[640px] rounded-t-[28px] bg-surface px-5 pb-8 pt-3" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
            <h2 className="text-[1.25rem]">{t("nav.add")}</h2>
            {/* Three big jobs people do most on a trip, then four smaller ones. One entry per job. */}
            <button type="button" onClick={() => { setAdd(false); setPhoto(null); setAi(true); }} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-sun-soft px-4 py-4 text-left font-extrabold text-ink"><span className="text-[1.8rem]">✨</span><span><span className="block text-[1.0625rem]">{t("ai.addTitle")}</span><span className="block text-[0.8125rem] font-semibold text-ink-2">{t("ai.addSub")}</span></span></button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {/* Open the camera before closing the menu: a button removed in the same tap never reaches the input. */}
              <button type="button" onClick={() => { document.getElementById(SNAP_INPUT)?.click(); setAdd(false); }} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-4 text-left font-extrabold"><span className="text-[1.6rem]">📷</span><span><span className="block">{t("menu.photo")}</span><span className="block text-[0.75rem] font-semibold text-ink-2">{t("menu.photoSub")}</span></span></button>
              <Link href={`${base}/money/new`} onClick={() => setAdd(false)} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-4 font-extrabold"><span className="text-[1.6rem]">💰</span><span><span className="block">{t("menu.expense")}</span><span className="block text-[0.75rem] font-semibold text-ink-2">{t("menu.expenseSub")}</span></span></Link>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {([["📄", "docs", `${base}/inbox`], ["🗳", "vote", `${base}/decisions/new`], ["📝", "note", `${base}/notes`]] as const).map(([e, k, href]) => <Link key={k} href={href} onClick={() => setAdd(false)} className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center text-[0.75rem] font-extrabold text-ink-2"><span className="text-[1.4rem]">{e}</span>{t(`menu.${k}`)}</Link>)}
              <button type="button" onClick={() => { setAdd(false); setSavePlace(true); }} className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center text-[0.75rem] font-extrabold text-ink-2"><span className="text-[1.4rem]">📍</span>{t("menu.place")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
