import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { REACT_EMOJI, catBudgetBase, dayLabel, decQuestion, decTitle, fmtTime, inCurrency, leadingOption, nowSlots, optionLabel, optionScore, optionSub, place, spentByCategory, votersOf } from "@/lib/trip/derive";
import { Avatars, Bar, Pill } from "@/components/ui";
import { castVote, confirmDecision, keepVoting } from "../actions";

export default async function DecisionDetail({ params }: { params: Promise<{ tripId: string; decisionId: string }> }) {
  const { tripId, decisionId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound(); const d = b.decisions.find(x => x.id === decisionId); if (!d) notFound();
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const opts = [...b.options.filter(o => o.decision_id === d.id)].sort((x, y) => optionScore(b, y.id) - optionScore(b, x.id));
  const lead = leadingOption(b, d); const second = opts[1]; const voters = votersOf(b, d); const confirmed = d.status === "confirmed";
  const name = (o: typeof opts[number]) => optionLabel(b, o, locale);
  const spentCat = spentByCategory(b)[d.category] || 0; const budCat = catBudgetBase(b, d.category);
  const today = nowSlots(b, demoNow(b.trip)).day;
  const canManage = ["owner", "admin"].includes(b.members.find(m => m.user_id === user?.id)?.role || "");
  return (
    <div>
      <Link href={`${base}/decisions`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("decisions.title")}</Link>
      <div className="mb-3 flex items-start justify-between gap-3"><div><h1 className="text-[28px] leading-tight">{decTitle(d, locale)}</h1><p className="text-[14.5px] text-ink-2">{decQuestion(d, locale)}</p></div><Pill tone={confirmed ? "good" : "warn"}>{confirmed ? t("decisions.confirmed") : voters.size >= b.members.length - 1 ? t("decisions.almost") : t("decisions.needsVotes")}</Pill></div>
      <div className="mb-4 flex items-center gap-2 text-[12.5px]"><div className="flex-1"><Bar pct={voters.size / b.members.length * 100} tone={confirmed ? "good" : undefined} /></div><b className="num">{voters.size} / {b.members.length}</b><span className="text-ink-3">· {voters.size === b.members.length ? t("decisions.everyoneVoted") : `${b.members.filter(m => !voters.has(m.user_id)).map(m => m.profile.name).join(", ")} ${t("decisions.stillToVote")}`}</span></div>
      {confirmed && d.confirmed_option_id && <div className="mb-4 flex gap-2 rounded-xl bg-good-soft p-3 text-[14px]">✅<span><b>{name(opts.find(o => o.id === d.confirmed_option_id)!)}</b> {t("decisions.confirmed").toLowerCase()}. {d.day ? t("decisions.addedTo", { day: dayLabel(b.trip, d.day, locale), time: d.slot ? fmtTime(d.slot.slice(0, 5), locale) : "" }) : ""} <Link href={`${base}/plan?day=${d.day}`} className="font-extrabold text-teal-text">{t("plan.title")} ›</Link></span></div>}
      <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
        <div className="flex flex-col gap-3">
          {opts.map(o => { const p = place(b, o.place_id); const votes = b.votes.filter(v => v.option_id === o.id); const mine = votes.find(v => v.user_id === user?.id)?.reaction; const isLead = o.id === lead?.id && !confirmed; const isConf = confirmed && d.confirmed_option_id === o.id; return (
            <div key={o.id} className={`card ${isConf ? "bg-teal-soft" : ""} ${isLead ? "outline outline-2 outline-teal" : ""}`}>
              <div className="flex items-start justify-between gap-2"><div className="flex gap-3">{p?.photo_url ? <img src={p.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="text-[28px]">{p?.emoji || "🗳"}</span>}<div><div className="text-[16px] font-bold">{name(o)}</div><div className="text-[12.5px] text-ink-3">{p ? `${p.price_level || ""}${p.rating ? ` · ${p.rating} ⭐` : ""}${p.from_hotel_min != null ? ` · ${p.from_hotel_min} min` : ""}` : optionSub(o, locale)}</div><div className="text-[12.5px] text-ink-3">{t("decisions.estimated")} <b>{inCurrency(b, o.est_pp_minor, rc)}{t("decisions.perPerson")}</b></div></div></div>{isConf ? <Pill tone="good">{t("decisions.confirmed")}</Pill> : isLead ? <Pill tone="teal">{t("home.leading")}</Pill> : null}</div>
              <div className="mt-3 flex items-center gap-2 text-[13px] font-bold text-ink-2">{(["love", "good", "maybe", "no"] as const).map(r => <span key={r}>{REACT_EMOJI[r]} {votes.filter(v => v.reaction === r).length}</span>)}<span className="ml-auto"><Avatars people={votes.map(v => b.members.find(m => m.user_id === v.user_id)?.profile).filter(Boolean) as { name: string; initials: string; color: string }[]} /></span></div>
              {!confirmed && <form action={castVote} className="mt-3 grid grid-cols-4 gap-1.5"><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="decisionId" value={d.id} /><input type="hidden" name="optionId" value={o.id} />{(["love", "good", "maybe", "no"] as const).map(r => <button key={r} name="reaction" value={r} className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-2 text-[18px] ${mine === r ? "border-teal bg-teal-soft" : "border-transparent bg-surface-2"}`}>{REACT_EMOJI[r]}<small className="text-[10.5px] font-extrabold text-ink-2">{t(`decisions.${r}`)}</small></button>)}</form>}
            </div>); })}
          {!confirmed && <Link href={`${base}/map`} className="btn btn-outline">{t("decisions.suggestAnother")}</Link>}
        </div>
        <div>
          {!confirmed && lead && (
            <div className="mt-4 rounded-[20px] border border-line bg-gradient-to-br from-teal-soft to-surface p-4 md:mt-0">
              <div className="eyebrow mb-2 text-teal-text">✨ {t("decisions.recommendation")}</div>
              <div className="mb-2 text-[16px] font-bold">{t("decisions.strongest", { name: name(lead) })}</div>
              <div className="text-[12.5px] font-bold text-ink-2">{t("decisions.why")}</div>
              <ul className="mt-1 list-disc pl-5 text-[14px] text-ink-2">
                <li>{t("ui.likeIt", { n: b.votes.filter(v => v.option_id === lead.id && (v.reaction === "love" || v.reaction === "good")).length, total: b.members.length, love: b.votes.filter(v => v.option_id === lead.id && v.reaction === "love").length, good: b.votes.filter(v => v.option_id === lead.id && v.reaction === "good").length })}</li>
                {place(b, lead.place_id)?.rating ? <li>{t("ui.rated", { r: place(b, lead.place_id)!.rating!, min: place(b, lead.place_id)!.from_hotel_min || 0 })}</li> : null}
                <li>{spentCat + lead.est_pp_minor * b.members.length <= budCat ? t("ui.withinBudget", { cat: t(`money.categories.${d.category}`), left: inCurrency(b, budCat - spentCat, rc) }) : t("ui.overBudget", { cat: t(`money.categories.${d.category}`), over: inCurrency(b, spentCat + lead.est_pp_minor * b.members.length - budCat, rc) })}</li>
              </ul>
              {second && <p className="mt-2 text-[12.5px] text-ink-2">{t("ui.costsMore", { amount: inCurrency(b, Math.abs(lead.est_pp_minor - second.est_pp_minor), rc), dir: t(lead.est_pp_minor >= second.est_pp_minor ? "ui.more" : "ui.less"), name: name(second) })}</p>}
              <p className="mt-2 text-[12px] text-ink-3">{t("ui.assumes", { n: b.members.length })}</p>
              <div className="mt-3 flex gap-2">
                <form action={confirmDecision} className="flex-1"><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="decisionId" value={d.id} /><input type="hidden" name="optionId" value={lead.id} /><button className="btn btn-sun w-full" disabled={!canManage && voters.size < b.members.length - 1}>{t("decisions.confirmX", { name: name(lead) })}</button></form>
                <form action={keepVoting}><input type="hidden" name="tripId" value={tripId} /><button className="btn">{t("decisions.keepVoting")}</button></form>
              </div>
            </div>)}
          {today > 0 && d.day && d.day < today && !confirmed && <p className="mt-3 text-[12.5px] text-warn">{t("ui.dayPassed")}</p>}
        </div>
      </div>
    </div>
  );
}
