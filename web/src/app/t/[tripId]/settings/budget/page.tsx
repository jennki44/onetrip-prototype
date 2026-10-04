import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import { BudgetEditor } from "@/components/BudgetEditor";
import { BUILTIN_CATEGORIES } from "@/lib/categories";
import { saveBudget } from "./actions";

const toText = (minor: number | null | undefined, cur: string) => (minor == null ? "" : cur === "JPY" ? String(minor) : String(Math.round(minor / 100)));

export default async function Budget({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ saved?: string; error?: string; list?: string }> }) {
  const [{ tripId }, sp] = await Promise.all([params, searchParams]);
  const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const role = b.members.find(m => m.user_id === user?.id)?.role || ""; const canManage = ["owner", "admin"].includes(role);
  const home = b.trip.home_currency; const cats = b.trip.budget_categories || {};
  // Show saved categories first, then any category an expense uses that is somehow missing from the list.
  const names = [...Object.keys(cats), ...[...new Set(b.expenses.map(e => e.category))].filter(c => !(c in cats))];
  const rows = names.map(name => ({ name, amount: toText(cats[name] ?? 0, home), locked: (BUILTIN_CATEGORIES as readonly string[]).includes(name) || b.expenses.some(e => e.category === name), used: b.expenses.filter(e => e.category === name).length }));
  const error = sp.error === "form" ? t("budget.errForm") : sp.error === "duplicate" ? t("budget.errDuplicate") : sp.error === "inuse" ? t("budget.errInUse", { list: sp.list || "" }) : sp.error === "denied" ? t("tripEdit.managersOnly") : sp.error;
  return (
    <div className="mx-auto max-w-[560px]">
      <PageHead title={t("budget.title")} sub={t("budget.sub", { cur: home })} right={<Link href={`${base}/money`} className="btn btn-sm">‹ {t("money.title")}</Link>} />
      {!canManage ? <div className="card text-ink-2">{t("tripEdit.managersOnly")}</div> : (
        <form action={saveBudget} className="flex flex-col gap-4">
          <input type="hidden" name="tripId" value={tripId} />
          <BudgetEditor currency={home} total={toText(b.trip.budget_minor, home)} rows={rows} />
          {error && <p className="rounded-2xl bg-bad-soft p-3 font-bold text-bad" role="alert">{error}</p>}
          {sp.saved && <p className="rounded-2xl bg-good-soft p-3 font-bold">✅ {t("budget.saved")}</p>}
          <button className="btn btn-sun w-full py-4 text-[1rem]">{t("budget.save")}</button>
        </form>)}
    </div>
  );
}
