import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LangSwitch } from "@/components/LangSwitch";

export default async function Welcome() {
  const user = await currentUser();
  if (user) redirect("/trips");
  const { t } = await getT();
  const fragments = ["WhatsApp", "Google Maps", "Notes", "Spreadsheet", "Calendar", "Email", "Splitwise", "Booking sites", "Camera roll"];
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-end px-7 pb-10 pt-8">
      <div className="flex items-center justify-between"><span className="font-display text-[14px] font-extrabold tracking-[.14em] text-teal-text">ONETRIP</span><LangSwitch /></div>
      <h1 className="mt-3 text-[40px] leading-[1.05]">{t("app.tagline")}</h1>
      <p className="mt-2 text-[16px] text-ink-2">{t("app.sub")}</p>
      <div className="relative my-6 overflow-hidden rounded-[22px] shadow-lift">
        <Image src="/photos/banner2.jpg" alt="Sydney Opera House and the Harbour Bridge" width={900} height={504} priority className="h-[230px] w-full object-cover" />
        <div className="absolute left-3 bottom-3 rounded-xl bg-surface px-3 py-2 shadow-card"><div className="eyebrow">Friday family dinner</div><div className="font-display text-[15px] font-bold">Harbour view · ❤️ 3</div></div>
        <div className="absolute right-3 top-3 rounded-xl bg-sun px-3 py-2 font-display text-[15px] font-bold text-[#17302f]">A$3,445 ≈ HK$17,670</div>
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {fragments.map(f => <span key={f} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-3 line-through">{f}</span>)}
        <span className="rounded-full bg-teal px-2.5 py-1 text-[12px] font-extrabold text-white">One trip</span>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/signin?next=/new" className="btn btn-sun w-full py-4 text-[16px]">{t("welcome.create")}</Link>
        <Link href="/join" className="btn btn-outline w-full py-4 text-[16px]">{t("welcome.join")}</Link>
        <p className="mt-2 text-center text-[12.5px] text-ink-3"><Link href="/signin" className="font-extrabold text-teal-text">{t("welcome.signin")}</Link> · <Link href="/signin?demo=1" className="font-extrabold text-teal-text">{t("welcome.demo")}</Link></p>
      </div>
    </div>
  );
}
