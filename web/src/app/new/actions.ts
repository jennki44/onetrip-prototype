"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { toMinor } from "@/lib/money";

const DEFAULT_SPLIT = { Accommodation: 0.36, Food: 0.23, Activities: 0.14, Transport: 0.2, Shopping: 0.05, Other: 0.02 };

export async function createTrip(form: FormData) {
  const p = z.object({
    destination: z.string().trim().min(2).max(80), name: z.string().trim().min(2).max(80), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    base: z.string().regex(/^[A-Z]{3}$/), home: z.string().regex(/^[A-Z]{3}$/), budget: z.string().optional(), styles: z.array(z.string().max(20)).max(8),
  }).safeParse({ destination: form.get("destination"), name: form.get("name"), start: form.get("start"), end: form.get("end"), base: form.get("base"), home: form.get("home"), budget: form.get("budget"), styles: form.getAll("styles") });
  if (!p.success) redirect("/new?error=Check+the+form");
  if (p.data.end < p.data.start) redirect("/new?error=End+date+is+before+start+date");
  const budgetMinor = p.data.budget ? toMinor(Number(String(p.data.budget).replace(/[^\d.]/g, "")) || 0, p.data.home) : null;
  const sb = await supabaseServer();
  const { data: tripId, error } = await sb.rpc("create_trip", { p_name: p.data.name, p_destination: p.data.destination, p_emoji: "🧳", p_start: p.data.start, p_end: p.data.end, p_base: p.data.base, p_home: p.data.home, p_budget_minor: budgetMinor, p_styles: p.data.styles });
  if (error || !tripId) redirect(`/new?error=${encodeURIComponent(error?.message || "Could not create trip")}`);
  if (budgetMinor) await sb.from("trips").update({ budget_categories: Object.fromEntries(Object.entries(DEFAULT_SPLIT).map(([k, f]) => [k, Math.round(budgetMinor * f)])) }).eq("id", tripId);
  redirect(`/t/${tripId}/invite?new=1`);
}
