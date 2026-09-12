import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { sendMagicLink, signInDemo } from "./actions";
import { DEMO_USERS } from "@/lib/demo";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string; demo?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await currentUser()) redirect(sp.next || "/trips");
  const { t } = await getT();
  return (
    <div className="mx-auto w-full max-w-[440px] px-6 pt-10">
      <Link href="/" className="text-[14px] font-extrabold text-ink-2">‹ {t("common.back")}</Link>
      <h1 className="mt-3 text-[28px]">{t("auth.title")}</h1>
      {sp.sent ? (
        <div className="mt-4 rounded-2xl bg-good-soft p-4 text-[14.5px]">✉️ {t("auth.sent")}</div>
      ) : (
        <form action={sendMagicLink} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="next" value={sp.next || "/trips"} />
          <label className="text-[12.5px] font-extrabold text-ink-2">{t("auth.email")}<input name="email" type="email" required autoComplete="email" className="input mt-1" placeholder="you@example.com" /></label>
          <button className="btn btn-teal w-full py-4">{t("auth.magic")}</button>
          {sp.error && <p className="text-[13px] text-bad">{sp.error}</p>}
        </form>
      )}
      <div className="my-6 flex items-center gap-3 text-[12px] text-ink-3"><span className="h-px flex-1 bg-line" />demo<span className="h-px flex-1 bg-line" /></div>
      <form action={signInDemo} className="flex flex-col gap-2">
        <input type="hidden" name="next" value={sp.next || ""} />
        <p className="text-[13px] text-ink-2">Sign in as one of the Sydney family to explore the seeded trip.</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DEMO_USERS).map(([k, u]) => <button key={k} name="who" value={u.email} className={`btn ${k === "jennie" ? "btn-sun" : "btn-outline"} capitalize`}>{k}</button>)}
        </div>
      </form>
    </div>
  );
}
