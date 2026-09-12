import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, Noto_Sans_TC } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { isLocale, type Locale, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n/config";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const notoTC = Noto_Sans_TC({ variable: "--font-noto-tc", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: { default: "OneTRIP", template: "%s · OneTRIP" },
  description: "One trip. Everyone together. Plan, decide, spend and travel together in one shared trip.",
  applicationName: "OneTRIP",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OneTRIP" },
};

export const viewport: Viewport = {
  themeColor: "#1fae9f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return (
    <html lang={locale} className={`${baloo.variable} ${nunito.variable} ${notoTC.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
