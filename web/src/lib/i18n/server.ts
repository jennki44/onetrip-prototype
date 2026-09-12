import { cookies } from "next/headers";
import { dictionaries } from "./dictionaries";
import { translate } from "./translate";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** Server-side translator for server components and actions. */
export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return { locale, t: (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars) };
}
