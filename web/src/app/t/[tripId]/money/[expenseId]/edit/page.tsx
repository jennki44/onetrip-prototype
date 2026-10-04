import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { ExpenseForm } from "@/components/ExpenseForm";
import type { ReceiptItem } from "@/lib/supabase/types";

const minorToText = (minor: number, cur: string) => (cur === "JPY" ? String(minor) : (minor / 100).toFixed(2));

export default async function EditExpense({ params }: { params: Promise<{ tripId: string; expenseId: string }> }) {
  const { tripId, expenseId } = await params; const [b, { t }, user, sb] = await Promise.all([loadTrip(tripId), getT(), currentUser(), supabaseServer()]); if (!b) notFound();
  const e = b.expenses.find(x => x.id === expenseId); if (!e) notFound(); const base = `/t/${tripId}`;
  const shares = b.shares.filter(s => s.expense_id === e.id);
  const { data: lines } = e.receipt_id ? ((await sb.from("receipt_items").select("*").eq("receipt_id", e.receipt_id).order("sort")) as { data: ReceiptItem[] | null }) : { data: null };
  // Reconstruct the split the way it was saved. Equal and itemised come back exactly; the others come back as fixed amounts in the receipt currency.
  const factor = e.base_minor ? e.amount_minor / e.base_minor : 1;
  const initialSplit = e.split === "equal" ? "equal" : e.split === "itemised" && lines?.length ? "itemised" : "amounts";
  const initialVals = initialSplit === "amounts" ? Object.fromEntries(shares.map(s => [s.user_id, minorToText(Math.round(s.share_minor * factor), e.currency)])) : undefined;
  const initialItems = initialSplit === "itemised" ? (lines || []).map(l => ({ name: l.name, amount: minorToText(l.amount_minor, e.currency), userIds: l.user_ids })) : undefined;
  return (
    <div className="mx-auto max-w-[560px]">
      <Link href={`${base}/money/${e.id}`} className="btn btn-sm mb-3">‹ {t("common.back")}</Link>
      <h1 className="mb-1 text-[1.75rem]">{t("money.editExpense")}</h1><p className="mb-4 text-ink-2">{e.merchant}</p>
      <ExpenseForm tripId={tripId} expenseId={e.id} baseCurrency={b.trip.base_currency} members={b.members.map(m => ({ id: m.user_id, name: m.profile.name, initials: m.profile.initials, color: m.profile.color }))} meId={user?.id || b.members[0].user_id} categories={Object.keys(b.trip.budget_categories || { Other: 0 })} defaultDate={e.date} places={b.places.map(p => ({ id: p.id, name: p.name }))} item={null}
        initial={{ merchant: e.merchant, amount: minorToText(e.amount_minor, e.currency), currency: e.currency, date: e.date, category: e.category, note: e.note || "", payerId: e.payer_id, participants: shares.map(s => s.user_id), split: initialSplit, vals: initialVals }} initialItems={initialItems} />
    </div>
  );
}
