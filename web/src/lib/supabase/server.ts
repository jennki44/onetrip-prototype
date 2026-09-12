import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-side Supabase client bound to the request cookies (server components, actions, route handlers). */
export async function supabaseServer() {
  const store = await cookies();
  // Untyped client: row types live in ./types and are applied at the query boundary.
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list) {
        try { for (const { name, value, options } of list) store.set(name, value, options); } catch { /* read-only in server components */ }
      },
    },
  }) as unknown as SupabaseClient;
}

export async function currentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user;
}
