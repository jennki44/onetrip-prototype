import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase session cookie on every request and guards trip routes. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedPath = path.startsWith("/t/") || path.startsWith("/trips") || path.startsWith("/new") || path.startsWith("/account");
  if (protectedPath && !user) {
    const url = request.nextUrl.clone(); url.pathname = "/signin"; url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-.*\\.png|manifest.webmanifest|photos/).*)"] };
