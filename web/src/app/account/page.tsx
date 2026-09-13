import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { safeNext } from "@/lib/security/safeNext";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { TextSizePicker } from "@/components/TextSizePicker";
import { signOut } from "@/app/signin/actions";
import { updateName, updatePassword } from "./actions";
import type { Profile } from "@/lib/supabase/types";

export default async function Account({ searchParams }: { searchParams: Promise<{ next?: string; saved?: string; pw?: string; reset?: string; error?: string }> }) {
  const sp = await searchParams; const user = await currentUser(); if (!user) redirect("/signin?next=/account");
  const [{ t }, sb] = await Promise.all([getT(), supabaseServer()]);
  const { data: profile } = (await sb.from("profiles").select("*").eq("id", user.id).maybeSingle()) as { data: Profile | null };
  const next = safeNext(sp.next); const p = profile || { name: user.email?.split("@")[0] || "", initials: "?", color: "#8A949C" };
  return (
    <div className="mx-auto w-full max-w-[520px] px-6 pb-10 pt-8">
      <div className="flex items-center justify-between"><Logo size={40} href="/trips" /><Link href={next} className="btn btn-sm">‹ {t("account.back")}</Link></div>
      <h1 className="mt-5 text-[1.75rem]">{t("account.title")}</h1>
      <p className="text-ink-2">{t("account.signedInAs", { email: user.email || "" })}</p>
      {sp.reset && <div className="mt-3 rounded-2xl bg-sun-soft p-3 font-bold">🔑 {t("account.resetHint")}</div>}
      {sp.error && <p className="mt-3 rounded-2xl bg-bad-soft p-3 font-bold text-bad" role="alert">{sp.error}</p>}

      <form action={updateName} className="card mt-5">
        <input type="hidden" name="next" value={next} />
        <div className="flex items-center gap-3"><Avatar p={p} size="lg" /><div><div className="font-bold">{t("account.name")}</div><div className="text-[0.85rem] text-ink-2">{t("account.nameSub")}</div></div></div>
        <input name="name" required maxLength={80} defaultValue={p.name} autoComplete="name" className="input mt-3" />
        <div className="mt-3 flex items-center justify-between"><span className="text-[0.85rem] text-ink-3">{sp.saved ? `✅ ${t("account.saved")}` : ""}</span><button className="btn btn-teal">{t("account.save")}</button></div>
      </form>

      <form action={updatePassword} className="card mt-4">
        <input type="hidden" name="next" value={next} />
        <div className="font-bold">{t("account.password")}</div><div className="text-[0.85rem] text-ink-2">{t("account.passwordSub")}</div>
        <label className="mt-3 block text-[0.85rem] font-extrabold text-ink-2">{t("account.newPassword")} · {t("auth.min8")}<div className="mt-1"><PasswordInput autoComplete="new-password" minLength={8} /></div></label>
        <div className="mt-3 flex items-center justify-between"><span className="text-[0.85rem] text-ink-3">{sp.pw ? `✅ ${t("account.passwordSaved")}` : ""}</span><button className="btn btn-sun">{t("account.setPassword")}</button></div>
      </form>

      <div className="card mt-4"><div className="eyebrow mb-2">{t("settings.textSize")}</div><TextSizePicker /></div>
      <form action={signOut} className="mt-8 text-center"><button className="text-[0.9rem] font-extrabold text-ink-3">{t("auth.signout")}</button></form>
    </div>
  );
}
