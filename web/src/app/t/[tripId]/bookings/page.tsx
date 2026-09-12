import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { dayLabel, fmtTime, itemTitle } from "@/lib/trip/derive";
import { Empty, PageHead, Pill } from "@/components/ui";

const ICON: Record<string, string> = { flight: "✈️", hotel: "🏨", activity: "🎟️", transport: "🚗" };

export default async function Bookings({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const needed = b.items.filter(i => i.booking === "needed" && i.status !== "cancelled");
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("more.bookings")} sub={t("ui.bookingsSub")} />
      {b.bookings.length ? <div className="card divide-y divide-line-2 p-0">{b.bookings.map(bk => <Link key={bk.id} href={`${base}/bookings/${bk.id}`} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[19px]">{ICON[bk.type] || "🎟️"}</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{bk.title}</div><div className="text-[13px] text-ink-2">{bk.date ? new Date(bk.date + "T00:00:00").toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { weekday: "short", day: "numeric", month: "short" }) : ""}{bk.reference ? ` · Ref ${bk.reference}` : ""}</div></div><Pill tone={bk.status === "confirmed" ? "good" : "warn"}>{bk.status}</Pill></Link>)}</div> : <Empty emoji="🎟️" title={t("ui.noBookings")} sub={t("item.dropConfirmation")} />}
      <section className="mt-6"><div className="eyebrow mb-2">{t("ui.stillToBook")}</div><div className="card divide-y divide-line-2 p-0">{needed.length ? needed.map(i => <Link key={i.id} href={`${base}/plan/${i.id}`} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[19px]">{i.emoji}</span><div className="flex-1"><div className="font-bold">{itemTitle(i, locale)}</div><div className="text-[13px] text-ink-2">{dayLabel(b.trip, i.day, locale)} · {fmtTime(i.start_time, locale)}</div></div><span className="btn btn-sun btn-sm">{t("item.resolve")}</span></Link>) : <div className="flex items-center gap-3 px-4 py-3"><span className="text-[19px]">✅</span><b>{t("ui.allBooked")}</b></div>}</div></section>
    </div>
  );
}
