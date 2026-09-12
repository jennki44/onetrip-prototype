import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { dayDate, isoDate, nowSlots } from "@/lib/trip/derive";
import { ReceiptCapture } from "@/components/ReceiptCapture";

export default async function Scan({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ for?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const day = nowSlots(b, demoNow(b.trip)).day; const today = isoDate(day >= 1 ? dayDate(b.trip, day) : new Date());
  const item = sp.for ? b.items.find(i => i.id === sp.for) : undefined;
  return (
    <div className="mx-auto max-w-[560px]"><Link href={`${base}/money`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("money.title")}</Link><h1 className="text-[28px]">{t("receipt.scan")}</h1><p className="mb-4 text-ink-2">{t("receipt.frame")}</p>
      <ReceiptCapture tripId={tripId} baseCurrency={b.trip.base_currency} members={b.members.map(m => ({ id: m.user_id, name: m.profile.name, initials: m.profile.initials, color: m.profile.color }))} meId={user?.id || b.members[0].user_id} categories={Object.keys(b.trip.budget_categories || { Other: 0 })} defaultDate={today} places={b.places.map(p => ({ id: p.id, name: p.name }))} item={item ? { id: item.id, placeId: item.place_id, title: item.title } : null} />
    </div>
  );
}
