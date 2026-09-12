import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { dayCount, dayLabel } from "@/lib/trip/derive";
import { saveActivity } from "../actions";

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[12.5px] font-extrabold text-ink-2">{label}{children}</label>; }

export default async function NewActivity({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ day?: string; place?: string; edit?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const edit = sp.edit ? b.items.find(i => i.id === sp.edit) : null; const pl = sp.place ? b.places.find(p => p.id === sp.place) : null;
  const i = edit || { title: pl?.name || "", day: Number(sp.day) || 1, start_time: "18:00", end_time: "19:30", place_id: pl?.id || "", participant_ids: b.members.map(m => m.user_id), cost_minor: null, status: "proposed", note: "" };
  return (
    <div className="mx-auto max-w-[560px]"><Link href={edit ? `${base}/plan/${edit.id}` : `${base}/plan`} className="mb-2 inline-block text-[14px] font-extrabold text-ink-2">‹ {t("common.back")}</Link><h1 className="mb-4 text-[28px]">{edit ? t("common.edit") : t("plan.addActivity").replace("+ ", "")}</h1>
      <form action={saveActivity} className="flex flex-col gap-3">
        <input type="hidden" name="tripId" value={tripId} />{edit && <input type="hidden" name="itemId" value={edit.id} />}
        <Field label={t("ui.activityName")}><input name="title" required maxLength={120} defaultValue={i.title} className="input" placeholder="e.g. Fish and chips at Doyles" /></Field>
        <div className="grid grid-cols-3 gap-2"><Field label={t("money.date")}><select name="day" defaultValue={i.day} className="input">{Array.from({ length: dayCount(b.trip) }, (_, k) => k + 1).map(d => <option key={d} value={d}>{dayLabel(b.trip, d, locale)}</option>)}</select></Field><Field label={t("ui.start")}><input name="start" type="time" required defaultValue={i.start_time.slice(0, 5)} className="input" /></Field><Field label={t("ui.end")}><input name="end" type="time" defaultValue={(i.end_time || "").slice(0, 5)} className="input" /></Field></div>
        <Field label={t("ui.location")}><select name="placeId" defaultValue={i.place_id || ""} className="input"><option value="">{t("ui.choosePlace")}</option>{b.places.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}</select></Field>
        <Field label={t("ui.people")}><div className="flex flex-wrap gap-1.5">{b.members.map(m => <label key={m.user_id} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-surface py-1 pl-1 pr-3 text-[13px] font-extrabold has-[:checked]:border-teal has-[:checked]:bg-teal-soft"><input type="checkbox" name="people" value={m.user_id} defaultChecked={i.participant_ids.includes(m.user_id)} className="hidden" /><span className="avatar" style={{ background: m.profile.color, width: 22, height: 22, fontSize: 9 }}>{m.profile.initials}</span>{m.profile.name}</label>)}</div></Field>
        <div className="grid grid-cols-2 gap-2"><Field label={t("ui.costGroup", { cur: b.trip.base_currency })}><input name="cost" inputMode="decimal" defaultValue={i.cost_minor != null ? i.cost_minor / 100 : ""} className="input" placeholder="0" /></Field><Field label={t("ui.status")}><select name="status" defaultValue={i.status} className="input">{["idea", "proposed", "voting", "confirmed", "cancelled", "completed"].map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></Field></div>
        <Field label={t("money.notes")}><textarea name="note" maxLength={500} defaultValue={i.note || ""} className="input min-h-20" placeholder={t("ui.noteHint")} /></Field>
        <button className="btn btn-sun w-full py-4 text-[16px]">{edit ? t("common.save") : t("ui.addToTrip")}</button>
      </form>
    </div>
  );
}
