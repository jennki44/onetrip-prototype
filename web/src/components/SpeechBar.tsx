"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/provider";

// The browser's built-in speech-to-text (Chrome/Android, Safari on iPhone). Typed loosely: it isn't in the standard DOM types.
type Alt = { transcript: string };
type Recog = {
  lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<Alt> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null; onspeechstart?: (() => void) | null;
};
const getRecog = (): (new () => Recog) | null => { if (typeof window === "undefined") return null; const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog }; return w.SpeechRecognition || w.webkitSpeechRecognition || null; };
const isIOS = () => typeof navigator !== "undefined" && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export type SpeechLang = "yue" | "cmn" | "en";
/**
 * Language codes differ by engine: Safari on iPhone hears Cantonese as "zh-HK", Chrome/Android needs "yue-Hant-HK"
 * (it treats "zh-HK" as Mandarin). Mandarin: "zh-TW" on iPhone, "cmn-Hant-TW" on Chrome.
 */
export function speechCode(l: SpeechLang, ios: boolean) {
  if (l === "yue") return ios ? "zh-HK" : "yue-Hant-HK";
  if (l === "cmn") return ios ? "zh-TW" : "cmn-Hant-TW";
  return "en-US";
}
const KEY = "onetrip-speech-lang";
const SILENCE_MS = 6000, MAX_MS = 30000;
const noop = () => () => {};

/**
 * 🎤 with 廣東話 · 普通話 · English chips. Words appear live through onText; listening always ends by itself after a pause
 * (or 30 s), and tapping the mic stops it. Errors are shown instead of a silent spinner.
 */
export function SpeechBar({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const { t, locale } = useT();
  const supported = useSyncExternalStore(noop, () => !!getRecog(), () => false);
  const saved = useSyncExternalStore(noop, () => { try { return localStorage.getItem(KEY) as SpeechLang | null; } catch { return null; } }, () => null);
  const [picked, setPicked] = useState<SpeechLang | null>(null);
  const lang: SpeechLang = picked ?? saved ?? (locale.startsWith("zh") ? "yue" : "en");
  const [listening, setListening] = useState(false); const [err, setErr] = useState<string | null>(null);
  const rec = useRef<Recog | null>(null); const silence = useRef<ReturnType<typeof setTimeout> | null>(null); const cap = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => { if (silence.current) clearTimeout(silence.current); if (cap.current) clearTimeout(cap.current); silence.current = cap.current = null; };
  const stop = () => { clearTimers(); try { rec.current?.stop(); } catch { /* already stopped */ } setListening(false); };
  useEffect(() => () => { clearTimers(); try { rec.current?.abort(); } catch { /* gone */ } }, []);

  const choose = (l: SpeechLang) => { setPicked(l); try { localStorage.setItem(KEY, l); } catch { /* private mode */ } if (listening) stop(); };
  const start = () => {
    const R = getRecog(); if (!R || disabled) return;
    if (listening) { stop(); return; }
    setErr(null);
    const r = new R(); r.lang = speechCode(lang, isIOS()); r.interimResults = true; r.continuous = true;
    let finalText = "";
    const armSilence = () => { if (silence.current) clearTimeout(silence.current); silence.current = setTimeout(stop, SILENCE_MS); };
    r.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; const txt = res[0]?.transcript || ""; if (res.isFinal) finalText += txt; else interim += txt; }
      onText((finalText + interim).trim()); armSilence();
    };
    r.onerror = e => { const map: Record<string, string> = { "not-allowed": "speech.errMic", "service-not-allowed": "speech.errMic", "audio-capture": "speech.errMic", network: "speech.errNetwork", "language-not-supported": "speech.errLang", "no-speech": "speech.errNoSpeech" }; if (e.error !== "aborted") setErr(t(map[e.error] || "speech.errOther")); clearTimers(); setListening(false); };
    r.onend = () => { clearTimers(); setListening(false); };
    rec.current = r;
    try { r.start(); setListening(true); armSilence(); cap.current = setTimeout(stop, MAX_MS); } catch { setErr(t("speech.errOther")); setListening(false); }
  };

  if (!supported) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" role="radiogroup" aria-label={t("speech.lang")}>
        {(["yue", "cmn", "en"] as const).map(l => <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => choose(l)} className={`rounded-full border-2 px-3 py-1 text-[0.8125rem] font-extrabold ${lang === l ? "border-teal bg-teal-soft" : "border-line bg-surface text-ink-2"}`}>{t(`speech.${l}`)}</button>)}
      </div>
      <button type="button" onClick={start} disabled={disabled} aria-pressed={listening} className={`btn w-full py-3.5 text-[1.0625rem] disabled:opacity-60 ${listening ? "animate-pulse bg-coral text-white" : ""}`}>🎤 {listening ? t("ai.listening") : t("speech.speak", { lang: t(`speech.${lang}`) })}</button>
      {err && <p role="alert" className="rounded-xl bg-warn-soft p-2.5 text-[0.8125rem] font-bold">{err}</p>}
    </div>
  );
}
