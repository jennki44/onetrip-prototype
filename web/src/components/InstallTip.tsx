"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/provider";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "onetrip-install-tip-dismissed";
const noop = () => () => {};

/** Which tip fits this phone: already installed, iPhone/iPad (Share → Add to Home Screen), or Android/other (install button or browser menu). */
function platform(): "installed" | "ios" | "other" {
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : "other";
}
function dismissed() { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } }

/** "Add OneTRIP to your home screen": a full-screen app icon without an app store. Hidden once installed or dismissed. */
export function InstallTip() {
  const { t } = useT();
  const kind = useSyncExternalStore(noop, platform, () => "installed" as const);
  const wasDismissed = useSyncExternalStore(noop, dismissed, () => true);
  const [hidden, setHidden] = useState(false); const [evt, setEvt] = useState<InstallEvent | null>(null);
  // Android Chrome offers a real install prompt; keep it for our button instead of the browser's mini-bar.
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", on); return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  if (kind === "installed" || wasDismissed || hidden) return null;
  const dismiss = () => { try { localStorage.setItem(KEY, "1"); } catch { /* private mode: just hide for now */ } setHidden(true); };

  return (
    <div className="card flex flex-col gap-2 border-2 border-teal p-4" role="note">
      <div className="flex items-start justify-between gap-2"><b className="text-[1rem]">📲 {t("install.title")}</b><button type="button" onClick={dismiss} aria-label={t("install.dismiss")} className="text-[1.125rem] text-ink-3">✕</button></div>
      {kind === "ios" ? (
        <ol className="flex flex-col gap-1.5 text-[0.9375rem]">
          <li>1. {t("install.ios1")} <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-bold">⬆️ {t("install.share")}</span></li>
          <li>2. {t("install.ios2")} <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-bold">➕ {t("install.addHome")}</span></li>
        </ol>
      ) : evt ? (
        <button type="button" onClick={async () => { await evt.prompt(); const c = await evt.userChoice; if (c.outcome === "accepted") dismiss(); setEvt(null); }} className="btn btn-teal self-start">{t("install.button")}</button>
      ) : <p className="text-[0.9375rem]">{t("install.android")}</p>}
      <p className="text-[0.8125rem] text-ink-2">{t("install.why")}</p>
    </div>
  );
}
