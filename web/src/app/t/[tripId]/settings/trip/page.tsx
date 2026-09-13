import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { dayCount, dateRange } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";
import { updateTrip } from "./actions";

export default async function TripDetails({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ saved?: string; dropped?: string; error?: string; n?: string }> }) {
  const [{ tripId }, sp] = await Promise.all([params, searchParams]);
  const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const me = b.members.find(m => m.user_id === user?.id); const canManage = !!me && ["owner", "admin"].includes(me.role);
  const error = sp.error === "form" ? t("tripEdit.errForm") : sp.error === "order" ? t("tripEdit.errOrder") : sp.error === "outside" ? t("tripEdit.outside", { n: Number(sp.n) || 0 }) : sp.error;
  return (
    <div className="mx-auto max-w-[560px]">
      <PageHead title={t("tripEdit.title")} sub={`${dateRange(b.trip, locale)} · ${t("plan.plans", { n: b.items.length })}`} right={<Link href={`${base}/settings`} className="btn btn-sm">‹ {t("common.back")}</Link>} />
      {!canManage && <div className="card text-ink-2">{t("tripEdit.managersOnly")}</div>}
      {canManage && (
        <form action={updateTrip} className="card flex flex-col gap-4">
          <input type="hidden" name="tripId" value={tripId} />
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("tripEdit.emoji")}<input name="emoji" defaultValue={b.trip.emoji} maxLength={8} className="input text-center text-[1.4rem]" /></label>
            <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("tripEdit.name")}<input name="name" defaultValue={b.trip.name} required minLength={2} maxLength={80} className="input" /></label>
          </div>
          <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("tripEdit.destination")}<input name="destination" defaultValue={b.trip.destination} required minLength={2} maxLength={80} className="input" /></label>
          <div>
            <div className="eyebrow mb-2">{t("tripEdit.dates")}</div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("create.start")}<input name="start" type="date" required defaultValue={b.trip.start_date} className="input" /></label>
              <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{t("create.end")}<input name="end" type="date" required defaultValue={b.trip.end_date} className="input" /></label>
            </div>
            <p className="mt-2 text-[0.85rem] text-ink-2">{t("tripEdit.datesHint", { n: dayCount(b.trip) })}</p>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3 text-[0.9rem]"><input type="checkbox" name="drop" value="1" className="mt-1 h-5 w-5 shrink-0" /><span><b>{t("tripEdit.drop")}</b><br /><span className="text-ink-2">{t("tripEdit.dropHint")}</span></span></label>
          {error && <p className="rounded-2xl bg-bad-soft p-3 font-bold text-bad" role="alert">{error}</p>}
          {sp.saved && <p className="rounded-2xl bg-good-soft p-3 font-bold">✅ {t("tripEdit.saved")}{sp.dropped ? ` · ${t("tripEdit.dropped", { n: Number(sp.dropped) })}` : ""}</p>}
          <div className="flex gap-2"><Link href={`${base}/plan`} className="btn flex-1">{t("plan.title")}</Link><button className="btn btn-sun flex-1">{t("tripEdit.save")}</button></div>
        </form>)}
    </div>
  );
}
