import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { REACT_EMOJI, dayLabel, fmtTime, inCurrency, leadingOption, optionScore, place, votersOf } from "@/lib/trip/derive";
import { Bar, Empty, PageHead, Pill } from "@/components/ui";

export default async function Decisions({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound(); const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const open = b.decisions.filter(d => d.status !== "confirmed"), done = b.decisions.filter(d => d.status === "confirmed");
  const name = (oid: string) => { const o = b.options.find(x => x.id === oid); return o ? (o.place_id ? place(b, o.place_id)?.name : o.label) || "" : ""; };
  return (
    <div>
      <PageHead title={t("decisions.title")} sub={t("decisions.sub")} right={<Link href={`${base}/decisions/new`} className="btn btn-sun btn-sm">{t("ui.newBtn")}</Link>} />
      {open.length ? <div className="flex flex-col gap-3 md:grid md:grid-cols-2">{open.map(d => { const n = votersOf(b, d).size; const opts = b.options.filter(o => o.decision_id === d.id); const lead = leadingOption(b, d); const mine = b.votes.some(v => v.decision_id === d.id && v.user_id === user?.id); const est = opts.map(o => o.est_pp_minor); return (
        <Link key={d.id} href={`${base}/decisions/${d.id}`} className="card block">
          <div className="flex items-start justify-between gap-2"><div><div className="text-[16px] font-bold">{d.title}</div><div className="text-[12.5px] text-ink-3">{d.question}</div></div><Pill tone="warn">{n >= b.members.length - 1 ? t("decisions.almost") : t("decisions.needsVotes")}</Pill></div>
          <div className="mt-3 flex items-center gap-2"><div className="flex-1"><Bar pct={n / b.members.length * 100} /></div><span className="num text-[12.5px] font-bold">{n} / {b.members.length}</span></div>
          <div className="mt-3">{opts.map(o => { const votes = b.votes.filter(v => v.option_id === o.id); const counts = (["love", "good", "maybe", "no"] as const).map(r => [r, votes.filter(v => v.reaction === r).length] as const).filter(([, c]) => c); return <div key={o.id} className="flex items-center justify-between py-1 text-[12.5px]"><span className={o.id === lead?.id ? "font-bold" : ""}>{name(o.id)}</span><span className="flex gap-2 text-[12px] font-bold text-ink-2">{counts.map(([r, c]) => <span key={r}>{REACT_EMOJI[r]} {c}</span>)}</span></div>; })}</div>
          <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-3 text-[12.5px]"><span>⏳ {d.deadline ? new Date(d.deadline + "T00:00:00").toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "short", day: "numeric", month: "short" }) : ""}</span><span>💰 {inCurrency(b, Math.min(...est), rc)}–{inCurrency(b, Math.max(...est), rc)}{t("decisions.perPerson")}</span>{mine ? <Pill tone="good">✓</Pill> : <Pill tone="sun">{t("home.needsVote")}</Pill>}</div>
        </Link>); })}</div>
        : <Empty emoji="🗳️" title={t("decisions.empty")} sub={t("decisions.emptySub")} action={<Link href={`${base}/map`} className="btn btn-sun">{t("decisions.find")}</Link>} />}
      {done.length > 0 && <section className="mt-6"><div className="eyebrow mb-2">{t("decisions.decided")}</div><div className="card divide-y divide-line-2 p-0">{done.map(d => <Link key={d.id} href={`${base}/decisions/${d.id}`} className="flex items-center gap-3 px-4 py-3"><span className="text-[19px]">✅</span><div className="flex-1"><b>{d.title}</b><div className="text-[12.5px] text-ink-3">{d.confirmed_option_id ? name(d.confirmed_option_id) : ""}{d.day ? ` · ${dayLabel(b.trip, d.day, locale)}${d.slot ? ` ${fmtTime(d.slot.slice(0, 5), locale)}` : ""}` : ""}</div></div><span className="text-ink-3">›</span></Link>)}</div></section>}
    </div>
  );
}
