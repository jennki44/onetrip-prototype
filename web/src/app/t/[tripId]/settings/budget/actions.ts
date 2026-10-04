"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { loadTrip } from "@/lib/trip/load";
import { toMinor } from "@/lib/money";

const Cat = z.object({ name: z.string().trim().min(1).max(24).regex(/^[^.<>{}]+$/), amount: z.coerce.number().min(0).max(1e9) });

/** Save the trip budget and its category list (amounts in the trip's home currency). Owner/admin only (RLS enforces it). */
export async function saveBudget(form: FormData) {
  const tripId = z.string().uuid().safeParse(form.get("tripId")); if (!tripId.success) redirect("/trips");
  const here = `/t/${tripId.data}/settings/budget`;
  let raw: unknown; try { raw = JSON.parse(String(form.get("categories") || "[]")); } catch { redirect(`${here}?error=form`); }
  const cats = z.array(Cat).min(1).max(12).safeParse(raw); if (!cats.success) redirect(`${here}?error=form`);
  const names = cats.data.map(c => c.name.toLowerCase()); if (new Set(names).size !== names.length) redirect(`${here}?error=duplicate`);
  const b = await loadTrip(tripId.data); if (!b) redirect("/trips");
  // A category that already has expenses cannot disappear, or those expenses would lose their place in the budget.
  const missing = [...new Set(b.expenses.map(e => e.category))].filter(c => !cats.data.some(x => x.name === c));
  if (missing.length) redirect(`${here}?error=inuse&list=${encodeURIComponent(missing.join(", "))}`);
  const totalText = String(form.get("total") || "").replace(/[^\d.]/g, ""); const home = b.trip.home_currency;
  const budgetMinor = totalText ? toMinor(Number(totalText) || 0, home) : null;
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin");
  const { error, data } = await sb.from("trips").update({ budget_minor: budgetMinor, budget_categories: Object.fromEntries(cats.data.map(c => [c.name, toMinor(c.amount, home)])) }).eq("id", tripId.data).select("id");
  if (error) redirect(`${here}?error=${encodeURIComponent(error.message)}`);
  if (!data?.length) redirect(`${here}?error=denied`);
  await sb.from("activity_log").insert({ trip_id: tripId.data, user_id: user.id, text: "Updated the budget and spending categories." });
  revalidatePath(`/t/${tripId.data}`, "layout");
  redirect(`${here}?saved=1`);
}
