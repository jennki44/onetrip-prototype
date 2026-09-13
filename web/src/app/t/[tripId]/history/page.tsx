import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { Avatar, PageHead } from "@/components/ui";

export default async function History({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const groups = new Map<string, typeof b.activity>(); for (const a of b.activity) { const k = new Date(a.created_at).toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "long", day: "numeric", month: "short" }); groups.set(k, [...(groups.get(k) || []), a]); }
  return (
    <div className="mx-auto max-w-[600px]">
      <PageHead title={t("more.history")} sub={t("ui.historySub")} />
      <div className="card">{[...groups.entries()].map(([k, as]) => <div key={k}><div className="eyebrow pb-1 pt-2">{k}</div>{as.map(a => { const p = b.members.find(m => m.user_id === a.user_id)?.profile; return <div key={a.id} className="flex items-start gap-3 border-t border-line-2 py-2.5"><span className="num w-[62px] shrink-0 pt-0.5 text-[0.7813rem] text-ink-3">{new Date(a.created_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}</span>{p && <Avatar p={p} size="sm" />}<div><b>{p?.name || t("ui.someone")}</b> <span className="text-ink-2">{a.text}</span></div></div>; })}</div>)}{!b.activity.length && <p className="text-ink-2">{t("ui.nothingYet")}</p>}</div>
    </div>
  );
}
