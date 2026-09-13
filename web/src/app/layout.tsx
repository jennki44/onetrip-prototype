import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito, Noto_Sans_TC, Fredoka, Quicksand, Outfit, Caveat, Rubik, Sora } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { NavProgress } from "@/components/NavProgress";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import { isLocale, type Locale, DEFAULT_LOCALE, LOCALE_COOKIE } from "@/lib/i18n/config";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const notoTC = Noto_Sans_TC({ variable: "--font-noto-tc", subsets: ["latin"], weight: ["400", "500", "700"] });
// Faces for the selectable looks
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["500", "600", "700"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["500", "600", "700"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["700"] });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "OneTRIP", template: "%s · OneTRIP" },
  description: "One trip. Everyone together. Plan, decide, spend and travel together in one shared trip.",
  applicationName: "OneTRIP",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OneTRIP" },
};

export const viewport: Viewport = { themeColor: "#1fae9f", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Applies the saved look and theme before first paint so there is no flash. Values are validated against fixed allowlists.
const bootScript = `(function(){try{var r=document.documentElement;var l=localStorage.getItem('onetrip-look');if(l&&/^(postcard|gummy|journal|metro|classic)$/.test(l))r.dataset.look=l;var s=localStorage.getItem('onetrip-text');if(s==='large'||s==='xlarge')r.dataset.text=s;var t=localStorage.getItem('onetrip-theme');if(t==='light'||t==='dark')r.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)r.classList.add('dark-auto');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const fonts = [baloo, nunito, notoTC, fredoka, quicksand, outfit, caveat, rubik, sora].map(f => f.variable).join(" ");
  return (
    <html lang={locale} className={`${fonts} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="onetrip-boot" strategy="beforeInteractive">{bootScript}</Script>
        <I18nProvider locale={locale}><Suspense fallback={null}><NavProgress /></Suspense>{children}</I18nProvider>
      </body>
    </html>
  );
}
