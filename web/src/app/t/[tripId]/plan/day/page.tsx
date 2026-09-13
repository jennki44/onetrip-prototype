import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { dayCount, dayL, dayLabel, itemTitle, itemsOnDay, photoOf } from "@/lib/trip/derive";
import { PhotoField } from "@/components/PhotoField";
import { saveDay } from "./actions";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[0.85rem] font-extrabold text-ink-2">{label}{children}{hint && <span className="text-[0.75rem] font-semibold text-ink-3">{hint}</span>}</label>; }

export default async function EditDay({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ day?: string; error?: string }> }) {
  const [{ tripId }, sp] = await Promise.all([params, searchParams]); const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const total = dayCount(b.trip); const day = Math.min(total, Math.max(1, Number(sp.day) || 1)); const base = `/t/${tripId}`;
  const raw = b.days.find(d => d.day === day); const info = dayL(raw, locale);
  const options = itemsOnDay(b, day).map(i => ({ url: photoOf(b, i) || "", label: itemTitle(i, locale) })).filter(o => o.url).filter((o, k, a) => a.findIndex(x => x.url === o.url) === k);
  return (
    <div className="mx-auto max-w-[560px]">
      <Link href={`${base}/plan?day=${day}`} className="btn btn-sm mb-3">‹ {t("common.back")}</Link>
      <h1 className="text-[1.75rem]">{t("dayEdit.title")}</h1><p className="mb-4 text-ink-2">{t("ui.dayN", { n: day })} · {dayLabel(b.trip, day, locale, true)}</p>
      <form action={saveDay} className="flex flex-col gap-4">
        <input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="day" value={day} />
        <div><div className="eyebrow mb-1.5">{t("dayEdit.photo")}</div><PhotoField name="banner_url" tripId={tripId} initial={raw?.banner_url || null} options={options} /></div>
        <Field label={t("dayEdit.theme")} hint={t("dayEdit.themeHint")}><input name="theme" maxLength={80} defaultValue={info?.theme || ""} className="input" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("dayEdit.stay")}><input name="stay" maxLength={80} defaultValue={info?.stay || ""} className="input" /></Field>
          <Field label={t("dayEdit.drive")}><input name="drive" maxLength={80} defaultValue={info?.drive || ""} className="input" placeholder="50 min" /></Field>
        </div>
        <Field label={t("dayEdit.rule")} hint={t("dayEdit.ruleHint")}><input name="rule" maxLength={200} defaultValue={info?.rule || ""} className="input" /></Field>
        <Field label={t("dayEdit.caption")}><textarea name="caption" maxLength={300} defaultValue={raw?.caption || ""} className="input min-h-20" /></Field>
        {sp.error && <p className="rounded-2xl bg-bad-soft p-3 font-bold text-bad" role="alert">{sp.error === "photo" ? t("dayEdit.badPhoto") : sp.error}</p>}
        <button className="btn btn-sun w-full py-4 text-[1rem]">{t("dayEdit.save")}</button>
      </form>
    </div>
  );
}
