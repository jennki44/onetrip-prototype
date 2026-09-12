import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { demoNow } from "@/lib/trip/clock";
import { dayDate, isoDate, nowSlots } from "@/lib/trip/derive";
import { ExpenseForm } from "@/components/ExpenseForm";

export default async function NewExpense({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ for?: string; mode?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const day = nowSlots(b, demoNow(b.trip)).day; const today = isoDate(day >= 1 ? dayDate(b.trip, day) : new Date());
  const item = sp.for ? b.items.find(i => i.id === sp.for) : undefined;
  if (!sp.mode && !item) return (
    <div className="mx-auto max-w-[560px]"><Link href={`${base}/money`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("money.title")}</Link><h1 className="text-[28px]">{t("money.addExpense")}</h1><p className="mb-4 text-ink-2">{t("ui.fastest")}</p>
      <div className="flex flex-col gap-3">{[["📷", t("money.scan"), t("ui.scanSub"), `${base}/money/scan`], ["✍️", t("money.manual"), t("ui.manualSub"), `${base}/money/new?mode=manual`]].map(([e, title, sub, href]) => <Link key={href} href={href} className="card flex items-center gap-3.5"><span className="text-[30px]">{e}</span><div className="flex-1"><div className="text-[16px] font-bold">{title}</div><div className="text-[12.5px] text-ink-3">{sub}</div></div><span className="text-ink-3">›</span></Link>)}</div></div>);
  return (
    <div className="mx-auto max-w-[560px]"><Link href={`${base}/money`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("money.title")}</Link><h1 className="mb-4 text-[28px]">{item ? `${t("money.addExpense")} · ${item.title}` : t("money.manual")}</h1>
      <ExpenseForm tripId={tripId} baseCurrency={b.trip.base_currency} members={b.members.map(m => ({ id: m.user_id, name: m.profile.name, initials: m.profile.initials, color: m.profile.color }))} meId={user?.id || b.members[0].user_id} categories={Object.keys(b.trip.budget_categories || { Other: 0 })} defaultDate={today} places={b.places.map(p => ({ id: p.id, name: p.name }))} item={item ? { id: item.id, placeId: item.place_id, title: item.title } : null} />
    </div>
  );
}
