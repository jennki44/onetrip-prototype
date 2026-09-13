"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { DEMO_PASSWORD, DEMO_TRIP_ID } from "@/lib/demo";
import { safeNext } from "@/lib/security/safeNext";

const APP = () => process.env.NEXT_PUBLIC_APP_URL;
const email = z.string().trim().email().max(200);
const password = z.string().min(8).max(200);
const back = (mode: string, next: string, extra: Record<string, string>) => `/signin?${new URLSearchParams({ mode, next, ...extra })}`;

export async function sendMagicLink(form: FormData) {
  const parsed = z.object({ email, next: z.string().optional() }).safeParse({ email: form.get("email"), next: form.get("next") });
  if (!parsed.success) redirect("/signin?error=Enter+a+valid+email");
  const next = safeNext(parsed.data.next);
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithOtp({ email: parsed.data.email, options: { emailRedirectTo: `${APP()}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  redirect(`/signin?sent=1&next=${encodeURIComponent(next)}`);
}

export async function signInWithPassword(form: FormData) {
  const parsed = z.object({ email, password: z.string().min(1).max(200), next: z.string().optional() }).safeParse({ email: form.get("email"), password: form.get("password"), next: form.get("next") });
  if (!parsed.success) redirect(back("password", safeNext(form.get("next")), { error: "Enter your email and password" }));
  const next = safeNext(parsed.data.next);
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) redirect(back("password", next, { error: error.message, email: parsed.data.email }));
  redirect(next);
}

export async function signUpWithPassword(form: FormData) {
  const parsed = z.object({ name: z.string().trim().min(1).max(80), email, password, next: z.string().optional() }).safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password"), next: form.get("next") });
  if (!parsed.success) redirect(back("signup", safeNext(form.get("next")), { error: "Check your name, email and password (8+ characters)" }));
  const next = safeNext(parsed.data.next);
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { name: parsed.data.name }, emailRedirectTo: `${APP()}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) redirect(back("signup", next, { error: error.message, email: parsed.data.email }));
  // With email confirmation on, Supabase answers an existing address with a user that has no identities rather than an error.
  if (data.user && data.user.identities && data.user.identities.length === 0) redirect(back("password", next, { error: "exists", email: parsed.data.email }));
  if (data.session) redirect(next);
  redirect(back("password", next, { sent: "confirm", email: parsed.data.email }));
}

export async function sendPasswordReset(form: FormData) {
  const parsed = z.object({ email, next: z.string().optional() }).safeParse({ email: form.get("email"), next: form.get("next") });
  if (!parsed.success) redirect(back("forgot", safeNext(form.get("next")), { error: "Enter a valid email" }));
  const next = safeNext(parsed.data.next);
  const sb = await supabaseServer();
  const { error } = await sb.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${APP()}/auth/callback?next=${encodeURIComponent(`/account?reset=1&next=${next}`)}` });
  if (error) redirect(back("forgot", next, { error: error.message }));
  redirect(back("forgot", next, { sent: "reset" }));
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
