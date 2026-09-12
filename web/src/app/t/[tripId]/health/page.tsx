import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { demoNow } from "@/lib/trip/clock";
import { healthChecks, healthOverall, nowSlots } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";

export default async function Health({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const day = nowSlots(b, demoNow(b.trip)).day; const checks = healthChecks(b, day, t, locale); const ov = healthOverall(checks);
  const label = ov === "bad" ? t("health.attention") : ov === "warn" ? t("health.mostly") : t("health.good");
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("health.title")} sub={t("health.sub")} />
      <div className="card flex items-center gap-3.5"><span className="h-[18px] w-[18px] rounded-full" style={{ background: `var(--${ov})` }} /><div><div className="eyebrow">{t("health.overall")}</div><div className="text-[20px] font-bold">{label}</div></div><span className="ml-auto text-[12.5px] text-ink-3">{checks.filter(c => c.tone === "good").length} ✓ · {checks.filter(c => c.tone === "warn").length} ⚠ · {checks.filter(c => c.tone === "bad").length} !</span></div>
      <div className="card mt-3 divide-y divide-line-2 p-0">
        {checks.map((c, k) => <Link key={k} href={c.link} className="flex items-center gap-3 px-4 py-3"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `var(--${c.tone})` }} /><div className="min-w-0 flex-1"><div className="font-semibold">{c.text}</div>{c.sub && <div className="text-[12.5px] text-ink-3">{c.sub}</div>}</div>{c.resolve ? <span className="btn btn-sun btn-sm">{t("health.resolve")}</span> : <span className="text-ink-3">›</span>}</Link>)}
      </div>
    </div>
  );
}
