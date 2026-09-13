import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { fmtMoney } from "@/lib/money";
import { dateRange } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";
import { CurrencyPicker } from "@/components/CurrencyPicker";
import { LangSwitch } from "@/components/LangSwitch";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LookPicker } from "@/components/LookPicker";
import { TextSizePicker } from "@/components/TextSizePicker";

function Row({ ic, title, sub, right }: { ic: string; title: string; sub?: string; right?: React.ReactNode }) { return <div className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{ic}</span><div className="min-w-0 flex-1"><div className="font-bold">{title}</div>{sub && <div className="text-[0.8125rem] text-ink-2">{sub}</div>}</div>{right}</div>; }

export default async function Settings({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  return (
    <div className="mx-auto max-w-[600px]">
      <PageHead title={t("more.settings")} />
      <div className="card divide-y divide-line-2 p-0">
        <Row ic="🌐" title={t("more.language")} right={<LangSwitch />} />
        <div className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">🔠</span><div className="min-w-0 flex-1"><div className="font-bold">{t("settings.textSize")}</div><div className="text-[0.8125rem] text-ink-2">{t("settings.textSizeSub")}</div></div></div><div className="mt-3"><TextSizePicker /></div></div>
        <Link href={`/account?next=${base}/settings`} className="block"><Row ic="👤" title={t("settings.profile")} sub={t("settings.profileSub")} right={<span className="text-ink-3">›</span>} /></Link>
        <Row ic="💱" title={t("settings.reporting")} sub={t("settings.reportingSub")} right={<CurrencyPicker tripId={tripId} current={rc} />} />
        <Row ic="🎯" title={t("money.tripBudget")} sub={b.trip.budget_minor != null ? `${fmtMoney(b.trip.budget_minor, b.trip.home_currency)} · ${t("ui.onGround", { cur: b.trip.base_currency })}` : t("ui.noBudget")} />
        <div className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">🎨</span><div className="min-w-0 flex-1"><div className="font-bold">{t("settings.look")}</div><div className="text-[0.8125rem] text-ink-2">{t("settings.lookSub")}</div></div></div><div className="mt-3"><LookPicker /></div></div>
        <Row ic="🌙" title={t("settings.appearance")} right={<ThemeSwitch />} />
      </div>
      <section className="mt-5"><div className="eyebrow mb-2">{t("ui.trip")}</div><div className="card divide-y divide-line-2 p-0"><Link href={`${base}/settings/trip`} className="block"><Row ic={b.trip.emoji} title={t("tripEdit.title")} sub={`${b.trip.name} · ${dateRange(b.trip, locale)}`} right={<span className="text-ink-3">›</span>} /></Link><Link href={`${base}/invite`} className="block"><Row ic="🔗" title={t("invite.link")} sub={b.trip.invite_code} right={<span className="text-ink-3">›</span>} /></Link><Link href={`${base}/travellers`} className="block"><Row ic="👥" title={t("more.travellers")} sub={`${b.members.length}`} right={<span className="text-ink-3">›</span>} /></Link></div></section>
    </div>
  );
}
