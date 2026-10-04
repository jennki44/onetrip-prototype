import { cache } from "react";
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

export type SessionUser = { id: string; email: string | null };

/** Who is signed in, from the session JWT verified against the project's public signing key.
    No network round trip on projects with asymmetric keys (the cloud project); falls back to the Auth server otherwise.
    Cached per request so layout, page and components share one check. */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getClaims();
  const c = data?.claims; if (error || !c?.sub) return null;
  return { id: c.sub, email: typeof c.email === "string" ? c.email : null };
});
