"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { DEMO_PASSWORD, DEMO_TRIP_ID } from "@/lib/demo";

const safeNext = (v: unknown) => (typeof v === "string" && /^\/(?![\/\\])[^\\\s]*$/.test(v) && v.length < 500 ? v : "/trips");

export async function sendMagicLink(form: FormData) {
  const parsed = z.object({ email: z.string().email().max(200), next: z.string().optional() }).safeParse({ email: form.get("email"), next: form.get("next") });
  if (!parsed.success) redirect("/signin?error=Enter+a+valid+email");
  const next = safeNext(parsed.data.next);
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithOtp({ email: parsed.data.email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  redirect(`/signin?sent=1&next=${encodeURIComponent(next)}`);
}

export async function signInDemo(form: FormData) {
  if (process.env.ONETRIP_DEMO !== "1") redirect("/signin?error=Demo+sign-in+is+off");
  const who = String(form.get("who") || ""); if (!who.endsWith("@onetrip.demo")) redirect("/signin?error=Unknown+demo+user");
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: who, password: DEMO_PASSWORD });
  if (error) redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  const next = safeNext(form.get("next"));
  redirect(next === "/trips" ? `/t/${DEMO_TRIP_ID}` : next);
}

export async function signOut() {
  const sb = await supabaseServer(); await sb.auth.signOut(); redirect("/");
}
