"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export async function joinTrip(form: FormData) {
  const code = z.string().regex(/^[A-Z0-9]{6,12}$/).safeParse(String(form.get("code") || "").toUpperCase().replace(/-/g, ""));
  if (!code.success) redirect("/join?error=Check+the+code");
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/join?code=${code.data}&auto=1`)}`);
  const { data: tripId, error } = await sb.rpc("join_trip", { p_code: code.data });
  if (error || !tripId) redirect(`/join?code=${code.data}&error=${encodeURIComponent(error?.message || "Could not join")}`);
  redirect(`/t/${tripId}`);
}
