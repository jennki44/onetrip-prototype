import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { dayCount, dayLabel, nowSlots, placeName } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";
import { SavedPlaces } from "@/components/SavedPlaces";

export default async function Saved({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ tripId }, sp] = await Promise.all([params, searchParams]); const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const canEdit = ["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user?.id)?.role || "");
  const total = dayCount(b.trip); const today = nowSlots(b, demoNow(b.trip)).day;
  const days = Array.from({ length: total }, (_, k) => ({ day: k + 1, label: dayLabel(b.trip, k + 1, locale) }));
  // Newly saved first, then by when they were added (newest first).
  const rows = b.places.filter(p => p.saved).sort((x, y) => Number(y.id === sp.new) - Number(x.id === sp.new) || y.created_at.localeCompare(x.created_at))
    .map(p => ({ id: p.id, name: placeName(p, locale), emoji: p.emoji, address: p.address, area: p.area, lat: p.lat, lng: p.lng, usedOn: [...new Set(b.items.filter(i => i.place_id === p.id).map(i => i.day))].sort((a, c) => a - c) }));
  return (
    <div className="mx-auto max-w-[640px]">
      <Link href={`/t/${tripId}/more`} className="btn btn-sm mb-3">‹ {t("common.back")}</Link>
      <PageHead title={`⭐ ${t("saved.title")}`} sub={t("saved.sub")} right={<Link href={`/t/${tripId}/map?filter=saved`} className="btn btn-sm">🗺 {t("saved.map")}</Link>} />
      <SavedPlaces tripId={tripId} places={rows} days={days} defaultDay={today >= 1 && today <= total ? today : 1} destination={b.trip.destination} highlight={sp.new || null} canEdit={canEdit} />
    </div>
  );
}
