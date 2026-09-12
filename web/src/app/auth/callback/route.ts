import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Magic-link landing: exchange the code for a session, then continue. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const next = url.searchParams.get("next") || "/trips";
  const safe = /^\/(?![\/\\])[^\\\s]*$/.test(next) && next.length < 500 ? next : "/trips";
  if (code) { const sb = await supabaseServer(); const { error } = await sb.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(safe, url.origin)); }
  return NextResponse.redirect(new URL("/signin?error=Link+expired", url.origin));
}
