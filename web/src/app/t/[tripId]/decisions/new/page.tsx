import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { dayCount, dayLabel } from "@/lib/trip/derive";
import { createDecision } from "./actions";

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{label}{children}</label>; }

export default async function NewDecision({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ place?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const pl = sp.place ? b.places.find(p => p.id === sp.place) : null;
  return (
    <div className="mx-auto max-w-[560px]"><Link href={`${base}/decisions`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("decisions.title")}</Link><h1 className="text-[28px]">{t("ui.startDecision")}</h1><p className="mb-4 text-ink-2">{t("ui.startDecisionSub")}</p>
      <form action={createDecision} className="flex flex-col gap-3"><input type="hidden" name="tripId" value={tripId} />
        <Field label={t("ui.deciding")}><input name="title" required maxLength={80} className="input" placeholder="e.g. Thursday dinner" defaultValue={pl ? "Dinner" : ""} /></Field>
        <Field label={t("ui.question")}><input name="question" maxLength={120} className="input" defaultValue={t("ui.whereEat")} /></Field>
        <div className="grid grid-cols-3 gap-2"><Field label={t("ui.day")}><select name="day" className="input" defaultValue={7}>{Array.from({ length: dayCount(b.trip) }, (_, k) => k + 1).map(d => <option key={d} value={d}>{dayLabel(b.trip, d, locale)}</option>)}</select></Field><Field label={t("ui.time")}><input name="slot" type="time" defaultValue="19:00" className="input" /></Field><Field label={t("money.category")}><select name="category" className="input" defaultValue="Food">{Object.keys(b.trip.budget_categories || { Food: 0 }).map(c => <option key={c}>{c}</option>)}</select></Field></div>
        <Field label={t("ui.closesOn")}><input name="deadline" type="date" className="input" /></Field>
        <div><div className="eyebrow mb-2">{t("ui.options")}</div><div className="grid grid-cols-2 gap-1.5">{b.places.filter(p => p.type === "restaurant" || p.type === "activity" || p.type === "shopping").map(p => <label key={p.id} className="flex items-center gap-2 rounded-xl border-2 border-line bg-surface px-2.5 py-2 text-[13px] font-bold has-[:checked]:border-teal has-[:checked]:bg-teal-soft"><input type="checkbox" name="places" value={p.id} defaultChecked={p.id === pl?.id} className="hidden" /><span>{p.emoji}</span><span className="truncate">{(locale.startsWith("zh") && p.name_zh) || p.name}</span></label>)}</div></div>
        <button className="btn btn-sun w-full py-4 text-[16px]">{t("ui.createDecision")}</button>
      </form>
    </div>
  );
}
