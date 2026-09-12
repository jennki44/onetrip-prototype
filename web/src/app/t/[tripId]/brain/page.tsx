import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { nowSlots } from "@/lib/trip/derive";
import { SUGGESTIONS, answer } from "@/lib/brain";
import { PageHead } from "@/components/ui";

export default async function Brain({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ q?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency; const today = nowSlots(b, demoNow(b.trip)).day;
  const q = (sp.q || "").slice(0, 200); const a = q ? answer(b, q, { today, me: user?.id || "", rc, locale, base }) : null;
  return (
    <div className="mx-auto max-w-[680px]">
      <PageHead title={t("brain.title")} sub={t("brain.sub")} />
      {a && <div className="mb-4 flex flex-col gap-3"><div className="self-end rounded-2xl rounded-br-md bg-teal px-3.5 py-3 text-[14.5px] text-white">{q}</div><div className="max-w-[92%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-3 text-[14.5px] shadow-card"><div dangerouslySetInnerHTML={{ __html: a.html }} />{a.note && <div className="mt-2 text-[11.5px] text-ink-3">{a.note}</div>}{a.actions?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{a.actions.map(x => <Link key={x.href} href={x.href} className="btn btn-sun btn-sm">{x.label}</Link>)}</div> : null}</div></div>}
      <div className="eyebrow mb-2">{a ? t("brain.another") : t("brain.try")}</div>
      <div className="mb-3 flex flex-wrap gap-2">{SUGGESTIONS.filter(s => s !== q).slice(0, a ? 4 : 8).map(s => <Link key={s} href={`${base}/brain?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-surface px-3 py-2 text-[13px] font-semibold">{s}</Link>)}</div>
      <form method="get" className="flex gap-2"><input name="q" defaultValue={q} maxLength={200} className="input rounded-full" placeholder={t("brain.ask")} /><button className="btn btn-teal">Ask</button></form>
      <p className="mt-3 text-[12.5px] text-ink-3">{t("brain.note")}</p>
    </div>
  );
}
