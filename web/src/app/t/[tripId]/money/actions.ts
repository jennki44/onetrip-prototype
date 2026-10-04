"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import type { TripBundle } from "@/lib/trip/derive";
import { plan, rate } from "@/lib/trip/derive";
import { splitEqual, splitPercent, splitShares, splitItemised, toMinor, fmtMoney } from "@/lib/money";

export async function setReportingCurrency(tripId: string, currency: string) {
  const c = z.string().regex(/^[A-Z]{3}$/).parse(currency); const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return;
  await sb.from("profiles").update({ reporting_currency: c }).eq("id", user.id); revalidatePath(`/t/${tripId}`, "layout");
}

const expenseSchema = z.object({
  tripId: z.string().uuid(), merchant: z.string().trim().min(1).max(120), amount: z.coerce.number().positive().max(1e7), currency: z.string().regex(/^[A-Z]{3}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), category: z.string().max(40), payerId: z.string().uuid(), participants: z.array(z.string().uuid()).min(1),
  split: z.enum(["equal", "amounts", "percent", "shares", "itemised"]), splitValues: z.record(z.string().uuid(), z.coerce.number().nonnegative()).optional(),
  items: z.array(z.object({ name: z.string().trim().min(1).max(80), amount: z.coerce.number().nonnegative(), userIds: z.array(z.string().uuid()) })).optional(),
  note: z.string().max(500).optional(), itemId: z.string().uuid().optional().nullable(), placeId: z.string().uuid().optional().nullable(), emoji: z.string().max(4).optional(), receiptImagePath: z.string().max(300).optional().nullable(),
});
export type ExpenseInput = z.input<typeof expenseSchema>;
type Parsed = z.output<typeof expenseSchema>;

/** Money maths shared by create and update: amount in the receipt currency, its value in the trip currency, and each person's share. */
function compute(p: Parsed, b: TripBundle) {
  if (!b.members.some(m => m.user_id === p.payerId) || !p.participants.every(id => b.members.some(m => m.user_id === id))) throw new Error("Unknown traveller");
  const amountMinor = toMinor(p.amount, p.currency); const r = rate(p.currency, b.trip.base_currency); const baseMinor = Math.round(amountMinor / (p.currency === "JPY" ? 1 : 100) * r * (b.trip.base_currency === "JPY" ? 1 : 100));
  let shares: Record<string, number>;
  if (p.split === "equal") shares = splitEqual(baseMinor, p.participants);
  else if (p.split === "percent") shares = splitPercent(baseMinor, Object.fromEntries(p.participants.map(id => [id, p.splitValues?.[id] || 0])));
  else if (p.split === "shares") shares = splitShares(baseMinor, Object.fromEntries(p.participants.map(id => [id, p.splitValues?.[id] || 1])));
  else if (p.split === "amounts") { const factor = baseMinor / amountMinor; shares = Object.fromEntries(p.participants.map(id => [id, Math.round(toMinor(p.splitValues?.[id] || 0, p.currency) * factor)])); const sum = Object.values(shares).reduce((a, v) => a + v, 0); if (Math.abs(sum - baseMinor) > p.participants.length) throw new Error("Amounts do not add up to the total"); }
  else { const items = (p.items || []).map(it => ({ amountMinor: Math.round(toMinor(it.amount, p.currency) * baseMinor / amountMinor), userIds: it.userIds })); shares = splitItemised(items, 0); const sum = Object.values(shares).reduce((a, v) => a + v, 0); if (Math.abs(sum - baseMinor) > items.length + 1) throw new Error("Items do not add up to the total"); }
  if (p.receiptImagePath && !p.receiptImagePath.startsWith(`${p.tripId}/`)) throw new Error("Bad storage path");
  return { amountMinor, baseMinor, r, shares };
}

/** Create an expense with materialised shares (and an itemised receipt when items are given). Runs under RLS as the caller. */
export async function createExpense(raw: ExpenseInput) {
  const p = expenseSchema.parse(raw);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) throw new Error("Trip not found");
  const { amountMinor, baseMinor, r, shares } = compute(p, b);
  let receiptId: string | null = null;
  if ((p.split === "itemised" && p.items?.length) || p.receiptImagePath) {
    const { data: rc } = await sb.from("receipts").insert({ trip_id: p.tripId, merchant: p.merchant, date: p.date, subtotal_minor: amountMinor, total_minor: amountMinor, currency: p.currency, image_path: p.receiptImagePath || null, created_by: user.id }).select("id").single();
    receiptId = rc?.id || null;
    if (receiptId && p.split === "itemised" && p.items?.length) await sb.from("receipt_items").insert(p.items.map((it, k) => ({ receipt_id: receiptId, trip_id: p.tripId, name: it.name, amount_minor: toMinor(it.amount, p.currency), user_ids: it.userIds, sort: k })));
  }
  const { data: e, error } = await sb.from("expenses").insert({ trip_id: p.tripId, merchant: p.merchant, place_id: p.placeId || null, item_id: p.itemId || null, receipt_id: receiptId, category: p.category, amount_minor: amountMinor, currency: p.currency, base_minor: baseMinor, rate: r, date: p.date, payer_id: p.payerId, split: p.split, note: p.note || null, emoji: p.emoji || null, created_by: user.id }).select("id").single();
  if (error || !e) throw new Error(error?.message || "Could not save");
  await sb.from("expense_shares").insert(Object.entries(shares).filter(([, v]) => v > 0).map(([uid, v]) => ({ expense_id: e.id, trip_id: p.tripId, user_id: uid, share_minor: v })));
  const payer = b.members.find(m => m.user_id === p.payerId)?.profile.name || "Someone";
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${fmtMoney(amountMinor, p.currency)} ${p.merchant} expense (${p.participants.length} people).` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "💰", text: `${payer} added ${fmtMoney(amountMinor, p.currency)} ${p.merchant} expense.`, link: { screen: "expense", id: e.id } });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return e.id as string;
}

/** Edit an existing expense: rewrites the row, its shares and (when itemised) the receipt lines. The receipt photo is kept. */
export async function updateExpense(expenseId: string, raw: ExpenseInput) {
  const id = z.string().uuid().parse(expenseId); const p = expenseSchema.parse(raw);
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) throw new Error("Trip not found");
  const old = b.expenses.find(e => e.id === id); if (!old) throw new Error("Expense not found");
  const { amountMinor, baseMinor, r, shares } = compute(p, b);
  let receiptId = old.receipt_id;
  if (p.split === "itemised" && p.items?.length) {
    if (!receiptId) { const { data: rc } = await sb.from("receipts").insert({ trip_id: p.tripId, merchant: p.merchant, date: p.date, subtotal_minor: amountMinor, total_minor: amountMinor, currency: p.currency, image_path: p.receiptImagePath || null, created_by: user.id }).select("id").single(); receiptId = rc?.id || null; }
    else await sb.from("receipts").update({ merchant: p.merchant, date: p.date, subtotal_minor: amountMinor, total_minor: amountMinor, currency: p.currency }).eq("id", receiptId);
    if (receiptId) { await sb.from("receipt_items").delete().eq("receipt_id", receiptId); await sb.from("receipt_items").insert(p.items.map((it, k) => ({ receipt_id: receiptId, trip_id: p.tripId, name: it.name, amount_minor: toMinor(it.amount, p.currency), user_ids: it.userIds, sort: k }))); }
  } else if (receiptId) { await sb.from("receipt_items").delete().eq("receipt_id", receiptId); await sb.from("receipts").update({ merchant: p.merchant, date: p.date, total_minor: amountMinor, currency: p.currency }).eq("id", receiptId); }
  const { error } = await sb.from("expenses").update({ merchant: p.merchant, category: p.category, amount_minor: amountMinor, currency: p.currency, base_minor: baseMinor, rate: r, date: p.date, payer_id: p.payerId, split: p.split, note: p.note || null, emoji: p.emoji || old.emoji, receipt_id: receiptId }).eq("id", id);
  if (error) throw new Error(error.message);
  await sb.from("expense_shares").delete().eq("expense_id", id);
  await sb.from("expense_shares").insert(Object.entries(shares).filter(([, v]) => v > 0).map(([uid, v]) => ({ expense_id: id, trip_id: p.tripId, user_id: uid, share_minor: v })));
  const who = b.members.find(m => m.user_id === user.id)?.profile.name || "Someone";
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Edited ${p.merchant} expense (now ${fmtMoney(amountMinor, p.currency)}).` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "✏️", text: `${who} edited the ${p.merchant} expense.`, link: { screen: "expense", id } });
  revalidatePath(`/t/${p.tripId}`, "layout");
  return id;
}

/** Remove an expense and everything hanging off it. Balances recalculate from what remains. */
export async function deleteExpense(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), expenseId: z.string().uuid() }).parse({ tripId: form.get("tripId"), expenseId: form.get("expenseId") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  const e = b.expenses.find(x => x.id === p.expenseId); if (!e) redirect(`/t/${p.tripId}/money?tab=expenses`);
  await sb.from("expense_shares").delete().eq("expense_id", e.id);
  await sb.from("documents").delete().eq("trip_id", p.tripId).eq("linked_type", "expense").eq("linked_id", e.id);
  const { error } = await sb.from("expenses").delete().eq("id", e.id);
  if (error) redirect(`/t/${p.tripId}/money/${e.id}?error=${encodeURIComponent(error.message)}`);
  if (e.receipt_id) { await sb.from("receipt_items").delete().eq("receipt_id", e.receipt_id); await sb.from("receipts").delete().eq("id", e.receipt_id); }
  const who = b.members.find(m => m.user_id === user.id)?.profile.name || "Someone";
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Deleted the ${e.merchant} expense (${fmtMoney(e.amount_minor, e.currency)}).` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "🗑️", text: `${who} deleted the ${e.merchant} expense.`, link: { screen: "money", id: "expenses" } });
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/money?tab=expenses&deleted=1`);
}

/** Link an uploaded photo or document (documents bucket) to an expense so every traveller can see it. */
export async function attachToExpense(raw: { tripId: string; expenseId: string; fileName: string; storagePath: string; sizeBytes: number }) {
  const p = z.object({ tripId: z.string().uuid(), expenseId: z.string().uuid(), fileName: z.string().trim().min(1).max(200), storagePath: z.string().max(400), sizeBytes: z.number().int().nonnegative() }).parse(raw);
  if (!p.storagePath.startsWith(`${p.tripId}/expenses/${p.expenseId}/`)) throw new Error("Bad storage path");
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { data: e } = await sb.from("expenses").select("id, merchant").eq("id", p.expenseId).eq("trip_id", p.tripId).maybeSingle();
  if (!e) throw new Error("That expense is not in this trip");
  const { error } = await sb.from("documents").insert({ trip_id: p.tripId, name: p.fileName, category: "Receipts", storage_path: p.storagePath, size_bytes: p.sizeBytes, linked_type: "expense", linked_id: p.expenseId, added_by: user.id });
  if (error) throw new Error(error.message);
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Added ${p.fileName} to the ${(e as { merchant: string }).merchant} expense.` });
  revalidatePath(`/t/${p.tripId}`, "layout");
}

/** Remove an attachment from an expense (the stored file is left in place; only the link is removed). */
export async function removeAttachment(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), expenseId: z.string().uuid(), docId: z.string().uuid() }).parse({ tripId: form.get("tripId"), expenseId: form.get("expenseId"), docId: form.get("docId") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  await sb.from("documents").delete().eq("id", p.docId).eq("trip_id", p.tripId).eq("linked_type", "expense").eq("linked_id", p.expenseId);
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/money/${p.expenseId}`);
}

export async function markPaid(form: FormData) {
  const p = z.object({ tripId: z.string().uuid(), index: z.coerce.number().int().min(0) }).parse({ tripId: form.get("tripId"), index: form.get("index") });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const b = await loadTrip(p.tripId); if (!b) redirect("/trips");
  const pay = plan(b)[p.index]; if (!pay) redirect(`/t/${p.tripId}/money/settle`);
  await sb.from("settlements").insert({ trip_id: p.tripId, from_user: pay.fromUserId, to_user: pay.toUserId, amount_minor: pay.amountMinor, note: "Marked paid in OneTRIP", status: "paid", created_by: user.id });
  const n = (id: string) => b.members.find(m => m.user_id === id)?.profile.name || "";
  await sb.from("activity_log").insert({ trip_id: p.tripId, user_id: user.id, text: `Marked ${n(pay.fromUserId)} → ${n(pay.toUserId)} ${fmtMoney(pay.amountMinor, b.trip.base_currency)} as paid.` });
  await sb.from("notifications").insert({ trip_id: p.tripId, icon: "💸", text: `${n(pay.fromUserId)} paid ${n(pay.toUserId)} ${fmtMoney(pay.amountMinor, b.trip.base_currency)}.`, link: { screen: "money", id: "balances" } });
  revalidatePath(`/t/${p.tripId}`, "layout"); redirect(`/t/${p.tripId}/money/settle`);
}
