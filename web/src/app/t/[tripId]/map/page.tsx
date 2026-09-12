import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { demoNow } from "@/lib/trip/clock";
import { itemsOnDay, nowSlots } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";
import { TripMap } from "@/components/TripMap";

export default async function MapPage({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ focus?: string; filter?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const day = nowSlots(b, demoNow(b.trip)).day; const todayIds = day >= 1 ? itemsOnDay(b, day).map(i => i.place_id).filter(Boolean) as string[] : [];
  const bookedIds = b.items.filter(i => i.booking === "booked" && i.place_id).map(i => i.place_id as string);
  return (
    <div>
      <PageHead title={t("nav.map")} sub="Every place in the trip — stays, food, activities, bookings and saved ideas." />
      <TripMap tripId={tripId} places={b.places} todayIds={todayIds} bookedIds={bookedIds} focus={sp.focus || null} initialFilter={sp.filter || "all"} links={Object.fromEntries(b.places.map(p => [p.id, { items: b.items.filter(i => i.place_id === p.id).map(i => ({ id: i.id, title: i.title, day: i.day })), decisions: b.decisions.filter(d => b.options.some(o => o.decision_id === d.id && o.place_id === p.id)).map(d => ({ id: d.id, title: d.title })), expenses: b.expenses.filter(e => e.place_id === p.id).length }]))} />
      <p className="mt-3 text-[12.5px] text-ink-3">Schematic map for now. Street maps with routing arrive with the mapping milestone.</p>
      <Link href={`/t/${tripId}/plan/new`} className="sr-only">{t("plan.addActivity")}</Link>
    </div>
  );
}
