import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { demoNow } from "@/lib/trip/clock";
import { currentUser } from "@/lib/supabase/server";
import { dayCount, dayDate, dayL, dayLabel, fmtTime, inCurrency, itemNote, itemTitle, itemsOnDay, minutes, nowSlots, photoOf, place, placeName } from "@/lib/trip/derive";
import { Avatars, PageHead, Pill } from "@/components/ui";

export default async function Plan({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ day?: string; view?: string }> }) {
  const { tripId } = await params; const sp = await searchParams;
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]);
  if (!b) notFound();
  const total = dayCount(b.trip); const now = demoNow(b.trip); const todayDay = nowSlots(b, now).day;
  const day = Math.min(total, Math.max(1, Number(sp.day) || (todayDay >= 1 && todayDay <= total ? todayDay : 1)));
  const view = sp.view === "calendar" ? "calendar" : "timeline"; const base = `/t/${tripId}`;
  const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const items = itemsOnDay(b, day); const info = dayL(b.days.find(d => d.day === day), locale);
  const conflicts = new Set<string>(); for (let k = 1; k < items.length; k++) { const p = items[k - 1], c = items[k]; if (c.travel_min && minutes(p.end_time || p.start_time) + c.travel_min > minutes(c.start_time) + 5) conflicts.add(c.id); }
  const nm = now.getHours() * 60 + now.getMinutes();
  const statusTone = (s: string) => (s === "confirmed" ? "good" : s === "voting" ? "warn" : s === "cancelled" ? "bad" : s === "proposed" ? "teal" : undefined);
  return (
    <div>
      <PageHead title={t("plan.title")} sub={t("plan.sub")} right={<div className="flex rounded-xl bg-surface-2 p-1 text-[13.5px] font-extrabold"><Link href={`${base}/plan?day=${day}`} className={`rounded-lg px-3 py-1.5 ${view === "timeline" ? "bg-surface shadow-card" : "text-ink-3"}`}>{t("plan.timeline")}</Link><Link href={`${base}/plan?view=calendar`} className={`rounded-lg px-3 py-1.5 ${view === "calendar" ? "bg-surface shadow-card" : "text-ink-3"}`}>{t("plan.calendar")}</Link></div>} />
      {view === "calendar" ? (
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: total }, (_, i) => i + 1).map(d => { const it = itemsOnDay(b, d); const di = dayL(b.days.find(x => x.day === d), locale); return (
            <Link key={d} href={`${base}/plan?day=${d}`} className={`card min-h-[120px] p-3 ${d === todayDay ? "outline outline-2 outline-coral" : ""}`}>
              <div className="font-display text-[15px] font-bold">{t("ui.dayN", { n: d })}</div><div className="mb-2 text-[11.5px] text-ink-3">{dayLabel(b.trip, d, locale)}{di?.theme ? ` · ${di.theme}` : ""}</div>
              {it.slice(0, 4).map(x => <div key={x.id} className="truncate text-[12px] text-ink-2">{x.emoji} {itemTitle(x, locale)}</div>)}{it.length > 4 && <div className="text-[12px] text-ink-3">+{it.length - 4}</div>}
              {it.some(x => x.booking === "needed") && <div className="mt-2"><Pill tone="bad">{t("status.notBooked")}</Pill></div>}
            </Link>); })}
        </div>
      ) : (
        <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
          <div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {Array.from({ length: total }, (_, i) => i + 1).map(d => { const dd = dayDate(b.trip, d); return <Link key={d} href={`${base}/plan?day=${d}`} className={`w-[54px] shrink-0 rounded-2xl border-2 px-1 py-2 text-center ${d === day ? "border-ink bg-ink text-ground" : d === todayDay ? "border-coral bg-surface" : "border-line bg-surface"}`}><div className="text-[11px] font-extrabold uppercase opacity-70">{dd.toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "short" })}</div><div className="font-display text-[19px] font-bold">{dd.getDate()}</div><div className="text-[10.5px] opacity-70">{itemsOnDay(b, d).length}</div></Link>; })}
            </div>
            {info?.banner_url && <div className="relative mt-3 overflow-hidden rounded-[28px]"><img src={info.banner_url} alt="" className="h-[170px] w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(10,16,20,.82)] to-transparent px-4 pb-3.5 pt-10 text-white"><div className="eyebrow text-white/85">{t("ui.dayN", { n: day })}{info.theme ? ` · ${info.theme}` : ""}</div><div className="font-display text-[18px] font-bold">{dayLabel(b.trip, day, locale, true)}</div><div className="text-[12.5px] text-white/85">{info.stay ? `${t("plan.stay")} ${info.stay}` : ""}{info.drive ? ` · ${t("plan.driving")} ${info.drive}` : ""}</div></div></div>}
            {info?.rule && <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-[14px]">📌<span>{info.rule}</span></div>}
            <div className="my-3 flex items-center justify-between"><span className="text-[12.5px] text-ink-3">{t("plan.plans", { n: items.length })} · {inCurrency(b, items.reduce((a, i) => a + (i.cost_minor || 0), 0), rc, { decimals: 0 })}{conflicts.size ? ` · ${conflicts.size} ⚠️` : ""}</span><Link href={`${base}/plan/new?day=${day}`} className="btn btn-sun btn-sm">{t("plan.addActivity")}</Link></div>
            {items.length ? (
              <div className="relative pl-[62px] before:absolute before:bottom-2 before:left-[52px] before:top-2 before:w-0.5 before:bg-line">
                {items.map(i => { const done = day < todayDay || (day === todayDay && minutes(i.end_time || i.start_time) <= nm); const isNow = day === todayDay && minutes(i.start_time) <= nm && minutes(i.end_time || i.start_time) > nm; const pl = place(b, i.place_id); const ph = photoOf(b, i); return (
                  <div key={i.id} className={`relative mb-3 ${done ? "opacity-70" : ""}`}>
                    <div className="num absolute -left-[62px] top-3 w-11 text-right text-[12.5px] font-bold text-ink-2">{fmtTime(i.start_time, locale).replace(" ", "\n")}</div>
                    <div className={`absolute -left-[15px] top-4 h-3 w-3 rounded-full border-[3px] bg-surface ${isNow ? "border-coral shadow-[0_0_0_4px_var(--coral-soft)]" : done ? "border-ink-3" : "border-teal"}`} />
                    {i.travel_min ? <div className={`-mt-1 mb-2 ml-1 text-[12px] ${conflicts.has(i.id) ? "font-bold text-bad" : "text-ink-3"}`}>{conflicts.has(i.id) ? "⚠️" : "↓"} {i.travel_min >= 60 ? t("plan.drive", { t: t("plan.hrs", { h: Math.floor(i.travel_min / 60), m: i.travel_min % 60 ? String(i.travel_min % 60) : "" }).trim() }) : t("plan.travel", { n: i.travel_min })}{conflicts.has(i.id) ? ` — ${t("plan.conflict")}` : ""}</div> : null}
                    <Link href={`${base}/plan/${i.id}`} className="card flex items-start gap-3 p-3.5">
                      {ph ? <img src={ph} alt="" className="thumb" /> : <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-[22px]">{i.emoji}</span>}
                      <div className="min-w-0 flex-1"><div className="font-bold">{itemTitle(i, locale)}</div><div className="text-[13px] text-ink-2">{pl ? `${placeName(pl, locale)}${pl.area ? ` · ${pl.area}` : ""}` : i.address || ""}{i.end_time && i.end_time !== i.start_time ? ` · ${fmtTime(i.end_time, locale)}` : ""}</div>{itemNote(i, locale) && <div className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{itemNote(i, locale)}</div>}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5"><Pill tone={statusTone(i.status)}>{t(`status.${i.status}`)}</Pill>{i.booking === "booked" && <Pill tone="good">🎟 {t("status.booked")}</Pill>}{i.booking === "needed" && <Pill tone="bad">{t("status.notBooked")}</Pill>}{i.cost_minor ? <Pill>{inCurrency(b, i.cost_minor, rc)}</Pill> : null}<span className="ml-auto"><Avatars people={b.members.filter(m => i.participant_ids.includes(m.user_id)).map(m => m.profile)} max={4} /></span></div></div>
                    </Link>
                  </div>); })}
              </div>
            ) : <div className="py-10 text-center text-ink-2"><div className="text-[40px]">🗓️</div><b className="text-ink">{t("plan.noPlans", { day: dayLabel(b.trip, day, locale) })}</b><p>{t("plan.noPlansSub")}</p></div>}
          </div>
          <div className="hidden md:block"><div className="sticky top-6 card"><div className="eyebrow mb-2">{dayLabel(b.trip, day, locale)}</div>{info?.caption && <p className="text-[14px] text-ink-2">{info.caption}</p>}<div className="mt-3 grid grid-cols-2 gap-2">{items.filter(i => photoOf(b, i)).slice(0, 6).map(i => <img key={i.id} src={photoOf(b, i)!} alt="" className="h-24 w-full rounded-xl object-cover" />)}</div></div></div>
        </div>
      )}
    </div>
  );
}
