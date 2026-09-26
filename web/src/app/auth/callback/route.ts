import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/security/safeNext";

type OtpType = "magiclink" | "signup" | "recovery" | "email_change" | "email" | "invite";
const TYPES: OtpType[] = ["magiclink", "signup", "recovery", "email_change", "email", "invite"];

/** Email-link landing. Two shapes are accepted:
    - token_hash + type (email templates that link straight here): works in any browser, including the one an email app opens;
    - code (PKCE): works only in the browser that requested the link, because the verifier lives in its cookies.
    Then continue to `next` (or to the `next` inside `redirect_to`). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  let next = url.searchParams.get("next");
  const redirectTo = url.searchParams.get("redirect_to");
  if (!next && redirectTo) { try { next = new URL(redirectTo).searchParams.get("next"); } catch { next = null; } }
  const safe = safeNext(next || "/trips");
  const sb = await supabaseServer();
  const tokenHash = url.searchParams.get("token_hash"); const type = url.searchParams.get("type") as OtpType | null;
  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safe, url.origin));
  }
  const code = url.searchParams.get("code");
  if (code) { const { error } = await sb.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(safe, url.origin)); }
  return NextResponse.redirect(new URL(`/signin?mode=password&error=link&next=${encodeURIComponent(safe)}`, url.origin));
}
