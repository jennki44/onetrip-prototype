import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { dayCount, inCurrency, itemTitle, nowSlots, photoOf, placeName, spentBase } from "@/lib/trip/derive";
import { PageHead, Pill } from "@/components/ui";

export default async function Memories({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency; const day = nowSlots(b, demoNow(b.trip)).day;
  const places = new Set(b.items.filter(i => i.place_id).map(i => i.place_id)).size; const meals = b.items.filter(i => i.category === "food").length; const drive = b.items.reduce((a, i) => a + (i.travel_min || 0), 0);
  const big = [...b.expenses].sort((x, y) => y.base_minor - x.base_minor)[0]; const best = [...b.places].filter(p => p.rating).sort((x, y) => (y.rating || 0) - (x.rating || 0))[0];
  const shots = b.items.filter(i => photoOf(b, i)).filter((_, k) => k % 8 === 0).slice(0, 6);
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={b.trip.name} sub={t("ui.memoriesSub")} right={<Pill>{t("ui.dayN", { n: Math.max(0, day) })} / {dayCount(b.trip)}</Pill>} />
      <div className="grid grid-cols-3 gap-2.5">{[[places, t("ui.places")], [meals, t("ui.mealsOut")], [b.documents.length, t("ui.documents")], [inCurrency(b, spentBase(b), rc, { decimals: 0 }), t("ui.spentSoFar")], [`${Math.round(drive / 60)} h`, t("ui.driving")], [b.members.length, t("common.travellers")]].map(([v, l], k) => <div key={k} className="card px-3 py-3.5 text-center"><div className="num font-display text-[1.375rem] font-bold">{v}</div><div className="text-[0.75rem] text-ink-2">{l}</div></div>)}</div>
      <section className="mt-5"><div className="eyebrow mb-2">{t("ui.highlights")}</div><div className="card divide-y divide-line-2 p-0">{[["🏨", t("ui.biggestExpense"), big ? `${big.merchant} · ${inCurrency(b, big.base_minor, rc, { decimals: 0 })}` : "—"], ["⭐", t("ui.bestRated"), best ? `${placeName(best, locale)} · ${best.rating}` : "—"], ["📍", t("ui.mostVisited"), (() => { const c = new Map<string, number>(); for (const i of b.items) { const a = b.places.find(p => p.id === i.place_id)?.area; if (a) c.set(a, (c.get(a) || 0) + 1); } return [...c.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || "—"; })()]].map(([e, title, sub]) => <div key={title} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{e}</span><div><div className="font-bold">{title}</div><div className="text-[0.8125rem] text-ink-2">{sub}</div></div></div>)}</div></section>
      <section className="mt-5"><div className="eyebrow mb-2">{t("ui.photos")}</div><div className="grid grid-cols-3 gap-2">{shots.map(i => <div key={i.id} className="relative aspect-square overflow-hidden rounded-xl"><img src={photoOf(b, i)!} alt="" className="h-full w-full object-cover" /><span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.6875rem] font-bold text-white">{itemTitle(i, locale)}</span></div>)}</div></section>
      <button className="btn btn-sun mt-6 w-full py-4 text-[1rem]" disabled>{t("ui.storyLater")}</button>
    </div>
  );
}
