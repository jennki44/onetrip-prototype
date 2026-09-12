import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { budgetBase, dateRange, dayCount, dayL, dayLabel, decQuestion, decTitle, fmtTime, forecastBase, healthChecks, inCurrency, itemTitle, leadingOption, nowSlots, optionLabel, photoOf, place, placeName, spentBase, votersOf } from "@/lib/trip/derive";
import { Avatars, Bar, Eyebrow, Pill } from "@/components/ui";
import { demoNow } from "@/lib/trip/clock";

export default async function TripHome({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound();
  const now = demoNow(b.trip); const { day, next, current, items } = nowSlots(b, now);
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const spent = spentBase(b), bud = budgetBase(b), fc = forecastBase(b, day);
  const open = b.decisions.filter(d => d.status !== "confirmed"); const checks = healthChecks(b, day, t, locale);
  const total = dayCount(b.trip); const dayInfo = dayL(b.days.find(d => d.day === day), locale);
  const before = day < 1, after = day > total;
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{b.trip.emoji} {b.trip.name} · {b.members.length} {t("common.travellers")}</div>
          <h1 className="text-[28px] leading-tight">{b.trip.destination.split(",")[0]}</h1>
          <p className="text-[14.5px] text-ink-2">{dateRange(b.trip, locale)}{!before && !after ? ` · ${t("common.day")} ${day} ${t("common.of")} ${total}${dayInfo?.theme ? ` · ${dayInfo.theme}` : ""}` : before ? ` · ${t("ui.startsIn", { n: Math.ceil((new Date(b.trip.start_date + "T00:00:00").getTime() - now.getTime()) / 86400000) })}` : ` · ${t("ui.completed")}`}</p>
        </div>
        <Link href={`${base}/travellers`}><Avatars people={b.members.map(m => m.profile)} /></Link>
      </div>

      <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
        <div>
          <div className="card-hero">
            <div className="flex items-center justify-between"><span className="eyebrow text-white/85">{before ? t("ui.dayN", { n: 1 }) : t("home.next")}</span><span className="text-[12px] text-white/85">{!before && !after ? dayLabel(b.trip, day, locale) : ""}</span></div>
            {(() => { const n = before ? (b.items.filter(i => i.day === 1).sort((x, y) => x.start_time.localeCompare(y.start_time))[0] || null) : next; if (!n) return <p className="mt-2 text-white/90">{t("home.nothingElse")}</p>; const ph = photoOf(b, n); const pl = place(b, n.place_id); return (
              <Link href={`${base}/plan/${n.id}`} className="mt-2 flex items-center gap-3.5">
                {ph ? <img src={ph} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/40" /> : <span className="text-[40px]">{n.emoji}</span>}
                <div className="min-w-0 flex-1"><div className="font-display text-[20px] font-bold leading-tight">{itemTitle(n, locale)}</div><div className="text-[14px] text-white/90">{fmtTime(n.start_time, locale)}{pl ? ` · ${placeName(pl, locale)}` : ""}</div>{n.travel_min ? <div className="mt-1 text-[12px] text-white/80">🚗 {t("home.minAway", { n: n.travel_min })}{current ? ` · ${t("today.now").toLowerCase()}: ${itemTitle(current, locale)}` : ""}</div> : null}</div>
                <span className="text-white/70">›</span>
              </Link>); })()}
            <div className="mt-3 flex gap-2"><Link href={`${base}/map`} className="btn btn-sun btn-sm">{t("home.directions")}</Link><Link href={`${base}/travel`} className="btn btn-sm bg-white/15 text-white">{t("home.travelMode")}</Link></div>
          </div>

          <section className="mt-5">
            <Eyebrow action={{ href: `${base}/today`, label: t("home.fullDay") }}>{t("home.today")}</Eyebrow>
            <div className="card divide-y divide-line-2 p-0">
              {(before ? b.items.filter(i => i.day === 1).sort((x, y) => x.start_time.localeCompare(y.start_time)) : items).map(i => (
                <Link key={i.id} href={`${base}/plan/${i.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="num w-[66px] shrink-0 text-[13px] font-bold text-ink-2">{fmtTime(i.start_time, locale)}</span><span>{i.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{itemTitle(i, locale)}</span>
                  {i.booking === "booked" && <Pill tone="good">🎟 {t("status.booked")}</Pill>}{i.booking === "needed" && <Pill tone="bad">{t("status.notBooked")}</Pill>}
                </Link>
              ))}
              {!items.length && !before && <div className="px-4 py-3 text-ink-2">{t("home.nothingElse")}</div>}
            </div>
          </section>

          <section className="mt-5">
            <Eyebrow action={{ href: `${base}/decisions`, label: t("home.allDecisions") }}>{t("home.decision")}</Eyebrow>
            {open.slice(0, 2).map(d => { const n = votersOf(b, d).size; const lead = leadingOption(b, d); const mine = b.votes.some(v => v.decision_id === d.id && v.user_id === user?.id); const leadName = lead ? optionLabel(b, lead, locale) : null; return (
              <Link key={d.id} href={`${base}/decisions/${d.id}`} className="card mb-3 block">
                <div className="flex items-start justify-between gap-2"><div><div className="text-[16px] font-bold">{decTitle(d, locale)}</div><div className="text-[12.5px] text-ink-3">{decQuestion(d, locale)}</div></div><Pill tone="warn">{n >= b.members.length - 1 ? t("decisions.almost") : t("decisions.needsVotes")}</Pill></div>
                <div className="mt-3 flex items-center gap-2"><div className="flex-1"><Bar pct={n / b.members.length * 100} /></div><span className="num text-[12.5px] font-bold">{t("home.voted", { n, total: b.members.length })}</span></div>
                <div className="mt-3 flex items-center justify-between text-[12.5px]"><span>{leadName ? <>{t("home.leading")}: <b>{leadName}</b>{lead ? ` · ≈ ${inCurrency(b, lead.est_pp_minor, rc)}${t("decisions.perPerson")}` : ""}</> : ""}</span>{!mine && <Pill tone="sun">{t("home.needsVote")}</Pill>}</div>
              </Link>); })}
            {!open.length && <div className="card text-ink-2">{t("decisions.empty")}</div>}
          </section>
        </div>

        <div>
          <section className="mt-5 md:mt-0">
            <Eyebrow action={{ href: `${base}/money`, label: t("home.details") }}>{t("home.money")}</Eyebrow>
            <div className="card">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><div className="text-[12.5px] text-ink-3">{t("home.budget")}</div><div className="num font-display text-[20px] font-bold">{bud != null ? inCurrency(b, bud, rc, { decimals: 0 }) : "—"}</div></div>
                <div><div className="text-[12.5px] text-ink-3">{t("home.spent")}</div><div className="num font-display text-[20px] font-bold">{inCurrency(b, spent, rc, { decimals: 0 })}</div></div>
                <div><div className="text-[12.5px] text-ink-3">{t("home.remaining")}</div><div className="num font-display text-[20px] font-bold text-good">{bud != null ? inCurrency(b, bud - spent, rc, { decimals: 0 }) : "—"}</div></div>
                <div><div className="text-[12.5px] text-ink-3">{t("home.forecast")}</div><div className={`num font-display text-[20px] font-bold ${bud != null && fc > bud ? "text-warn" : ""}`}>{inCurrency(b, fc, rc, { decimals: 0 })}</div></div>
              </div>
              {bud != null && <div className="mt-3"><Bar pct={spent / bud * 100} ghost={(fc - spent) / bud * 100} /></div>}
              {bud != null && (fc > bud ? <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-[14px]">⚠️<span>{t("home.over", { amount: inCurrency(b, fc - bud, rc, { decimals: 0 }) })}</span></div> : <div className="mt-3 flex gap-2 rounded-xl bg-good-soft p-3 text-[14px]">✅<span>{t("home.under")}</span></div>)}
            </div>
          </section>
          <section className="mt-5">
            <Eyebrow action={{ href: `${base}/health`, label: t("common.open") }}>{t("home.health")}</Eyebrow>
            <div className="card divide-y divide-line-2 p-0">
              {checks.slice(0, 5).map((c, k) => <Link key={k} href={c.link} className="flex items-center gap-3 px-4 py-3"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `var(--${c.tone})` }} /><span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{c.text}</span><span className="text-ink-3">›</span></Link>)}
            </div>
          </section>
          {b.notes.length > 0 && <section className="mt-5"><Eyebrow>{t("ui.notes")}</Eyebrow><div className="card divide-y divide-line-2 p-0">{b.notes.map(n => <div key={n.id} className="px-4 py-3 text-[14.5px]">📝 {n.text}</div>)}</div></section>}
        </div>
      </div>
    </div>
  );
}
