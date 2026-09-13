import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { fmtBase, inCurrency, plan } from "@/lib/trip/derive";
import { Avatar, Empty, PageHead } from "@/components/ui";
import { markPaid } from "../actions";

export default async function Settle({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const rc = b.members.find(m => m.user_id === user?.id)?.profile.reporting_currency || b.trip.home_currency;
  const pl = plan(b); const total = pl.reduce((a, p) => a + p.amountMinor, 0); const m = (id: string) => b.members.find(x => x.user_id === id)!.profile;
  return (
    <div className="mx-auto max-w-[560px]">
      <Link href={`${base}/money?tab=balances`} className="mb-2 inline-block text-[0.875rem] font-extrabold text-ink-2">‹ {t("money.title")}</Link>
      <PageHead title={t("money.settleUp")} sub={pl.length ? t("money.payments", { n: pl.length }) : ""} />
      {pl.length ? <div className="flex flex-col gap-3">{pl.map((p, k) => <div key={k} className="card"><div className="flex items-center gap-3"><Avatar p={m(p.fromUserId)} size="lg" /><div className="flex-1"><div className="text-[1rem] font-bold">{m(p.fromUserId).name} → {m(p.toUserId).name}</div><div className="text-[0.7813rem] text-ink-3">{p.fromUserId === user?.id ? t("ui.youPay") : p.toUserId === user?.id ? t("ui.paysYou") : t("ui.between")}</div></div><Avatar p={m(p.toUserId)} size="lg" /></div><div className="mt-3"><div className="num font-display text-[1.875rem] font-bold">{inCurrency(b, p.amountMinor, rc)}</div><div className="text-[0.7813rem] text-ink-3">{fmtBase(b, p.amountMinor)}</div></div><div className="mt-3 flex gap-2"><form action={markPaid} className="flex-1"><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="index" value={k} /><button className="btn btn-sun w-full">{t("money.markPaid")}</button></form><button className="btn flex-1" disabled>{t("money.remind")}</button></div></div>)}<div className="card flex justify-between bg-surface-2 shadow-none"><span>{t("money.outstanding")}</span><b className="num">{inCurrency(b, total, rc)}</b></div><p className="text-[0.7813rem] text-ink-3">{t("ui.settleNote")}</p></div>
        : <Empty emoji="🎉" title={t("ui.allSettled")} />}
    </div>
  );
}
