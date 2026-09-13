import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { sendMagicLink, sendPasswordReset, signInDemo, signInWithPassword, signUpWithPassword } from "./actions";
import { DEMO_USERS } from "@/lib/demo";
import { safeNext } from "@/lib/security/safeNext";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { PasswordInput } from "@/components/PasswordInput";
import { TextSizePicker } from "@/components/TextSizePicker";

type Mode = "magic" | "password" | "signup" | "forgot";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string; demo?: string; error?: string; mode?: string; email?: string }> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect(safeNext(sp.next));
  const { t } = await getT(); const demo = process.env.ONETRIP_DEMO === "1";
  const mode: Mode = sp.mode === "password" || sp.mode === "signup" || sp.mode === "forgot" ? sp.mode : "magic";
  const next = safeNext(sp.next); const q = (m: Mode) => `/signin?mode=${m}&next=${encodeURIComponent(next)}`;
  const email = sp.email && sp.email.length < 200 ? sp.email : "";
  const error = sp.error === "exists" ? t("auth.exists") : sp.error;
  const emailField = <label className="text-[0.85rem] font-extrabold text-ink-2">{t("auth.email")}<input name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={email} className="input mt-1" placeholder="you@example.com" /></label>;
  return (
    <div className="mx-auto w-full max-w-[440px] px-6 pb-10 pt-8">
      <div className="flex items-center justify-between"><Logo size={40} /><LangSwitch /></div>
      <h1 className="mt-5 text-[1.75rem]">{mode === "signup" ? t("auth.create") : mode === "forgot" ? t("auth.forgot") : t("auth.title")}</h1>
      {mode !== "forgot" && (
        <div className="seg mt-3">
          <Link href={q("magic")} className={mode === "magic" ? "on" : ""}>{t("auth.tabMagic")}</Link>
          <Link href={q("password")} className={mode !== "magic" ? "on" : ""}>{t("auth.tabPassword")}</Link>
        </div>
      )}
      <p className="mt-2 text-[0.9rem] text-ink-2">{mode === "signup" ? t("auth.createSub") : mode === "magic" ? t("auth.magicHint") : mode === "password" ? t("auth.passwordHint") : ""}</p>

      {mode === "magic" && (sp.sent === "1" ? <div className="mt-4 rounded-2xl bg-good-soft p-4">✉️ {t("auth.sent")}</div> : (
        <form action={sendMagicLink} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />{emailField}
          <button className="btn btn-teal w-full py-4">{t("auth.magic")}</button>
        </form>))}

      {mode === "password" && (
        <form action={signInWithPassword} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />{emailField}
          <label className="text-[0.85rem] font-extrabold text-ink-2">{t("auth.password")}<div className="mt-1"><PasswordInput autoComplete="current-password" /></div></label>
          {sp.sent === "confirm" && <div className="rounded-2xl bg-good-soft p-4">✉️ {t("auth.confirmSent")}</div>}
          <button className="btn btn-teal w-full py-4">{t("auth.signin")}</button>
          <div className="flex justify-between text-[0.9rem] font-extrabold"><Link href={q("forgot")} className="text-ink-2">{t("auth.forgot")}</Link><Link href={q("signup")} className="text-teal-text">{t("auth.noAccount")}</Link></div>
        </form>)}

      {mode === "signup" && (
        <form action={signUpWithPassword} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />
          <label className="text-[0.85rem] font-extrabold text-ink-2">{t("auth.name")}<input name="name" required maxLength={80} autoComplete="name" className="input mt-1" /></label>
          {emailField}
          <label className="text-[0.85rem] font-extrabold text-ink-2">{t("auth.password")} · {t("auth.min8")}<div className="mt-1"><PasswordInput autoComplete="new-password" minLength={8} /></div></label>
          <button className="btn btn-sun w-full py-4">{t("auth.create")}</button>
          <Link href={q("password")} className="text-center text-[0.9rem] font-extrabold text-teal-text">{t("auth.haveAccount")}</Link>
        </form>)}

      {mode === "forgot" && (sp.sent === "reset" ? <div className="mt-4 rounded-2xl bg-good-soft p-4">✉️ {t("auth.resetSent")}</div> : (
        <form action={sendPasswordReset} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />{emailField}
          <button className="btn btn-teal w-full py-4">{t("auth.reset")}</button>
        </form>))}
      {mode === "forgot" && <Link href={q("password")} className="mt-3 block text-center text-[0.9rem] font-extrabold text-teal-text">{t("auth.back")}</Link>}
      {error && <p className="mt-3 rounded-2xl bg-bad-soft p-3 text-[0.9rem] font-bold text-bad" role="alert">{error}</p>}

      {demo && <><div className="my-6 flex items-center gap-3 text-[0.75rem] text-ink-3"><span className="h-px flex-1 bg-line" />demo<span className="h-px flex-1 bg-line" /></div>
      <form action={signInDemo} className="flex flex-col gap-2">
        <input type="hidden" name="next" value={sp.next || ""} />
        <p className="text-[0.8125rem] text-ink-2">Sign in as one of the Sydney family to explore the seeded trip.</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DEMO_USERS).map(([k, u]) => <button key={k} name="who" value={u.email} className={`btn ${k === "jennie" ? "btn-sun" : "btn-outline"} capitalize`}>{k}</button>)}
        </div>
      </form></>}

      <div className="mt-8 rounded-2xl border-2 border-line p-3"><div className="eyebrow mb-2">{t("settings.textSize")}</div><TextSizePicker /></div>
    </div>
  );
}
