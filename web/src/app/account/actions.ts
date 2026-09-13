"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/security/safeNext";
import { initialsOf } from "@/lib/profile";

const to = (next: string, extra: Record<string, string>) => `/account?${new URLSearchParams({ next, ...extra })}`;

export async function updateName(form: FormData) {
  const next = safeNext(form.get("next"));
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse({ name: form.get("name") });
  if (!parsed.success) redirect(to(next, { error: "Enter a name (1–80 characters)" }));
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin?next=/account");
  const { error } = await sb.from("profiles").update({ name: parsed.data.name, initials: initialsOf(parsed.data.name) }).eq("id", user.id);
  if (error) redirect(to(next, { error: error.message }));
  await sb.auth.updateUser({ data: { name: parsed.data.name } });
  redirect(to(next, { saved: "1" }));
}

export async function updatePassword(form: FormData) {
  const next = safeNext(form.get("next"));
  const parsed = z.object({ password: z.string().min(8).max(200) }).safeParse({ password: form.get("password") });
  if (!parsed.success) redirect(to(next, { error: "Password must be at least 8 characters" }));
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect("/signin?next=/account");
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(to(next, { error: error.message }));
  redirect(to(next, { pw: "1" }));
}
