import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { supabaseServer, currentUser } from "@/lib/supabase/server";
import { joinTrip } from "./actions";

export default async function Join({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const sp = await searchParams; const { t } = await getT(); const code = (sp.code || "").toUpperCase().replace(/-/g, "");
  type Preview = { id: string; name: string; destination: string; emoji: string; start_date: string; end_date: string; members: number; plans: number };
  let preview: Preview | null = null;
  if (code.length >= 6) { const sb = await supabaseServer(); const { data } = await sb.rpc("preview_trip", { p_code: code }); preview = ((data as Preview[] | null) || [])[0] || null; }
  const user = await currentUser();
  return (
    <div className="mx-auto w-full max-w-[440px] px-6 pt-8">
      <Link href="/" className="text-[14px] font-extrabold text-ink-2">‹ {t("common.back")}</Link>
      <h1 className="mt-3 text-[28px]">{t("join.title")}</h1><p className="mb-4 text-ink-2">{t("join.sub")}</p>
      <form method="get" className="flex gap-2"><input name="code" defaultValue={sp.code || ""} className="input font-mono text-center text-[22px] uppercase tracking-[.15em]" placeholder="SYDNEY-26" maxLength={12} /><button className="btn btn-teal">{t("join.preview")}</button></form>
      {sp.error && <p className="mt-2 text-[13px] text-bad">{sp.error}</p>}
      {code.length >= 6 && !preview && <p className="mt-4 text-[14px] text-ink-2">{t("ui.noMatch")}</p>}
      {preview && (
        <div className="card mt-4"><div className="flex items-center gap-3"><span className="text-[36px]">{preview.emoji}</span><div><div className="text-[20px] font-bold">{preview.name}</div><div className="text-ink-2">{preview.destination} · {preview.members} {t("common.travellers")} · {preview.plans} {t("plan.plans", { n: "" }).trim()}</div></div></div>
          <form action={joinTrip} className="mt-4 flex gap-2"><input type="hidden" name="code" value={code} /><Link href="/" className="btn flex-1">{t("join.notNow")}</Link><button className="btn btn-sun flex-1">{user ? t("welcome.join") : t("join.asGuest")}</button></form>
          {!user && <p className="mt-2 text-[12px] text-ink-3">{t("ui.join.guestNote")}</p>}
        </div>)}
    </div>
  );
}
