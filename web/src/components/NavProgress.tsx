"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/provider";

/** Instant feedback for every tap that leads somewhere: a progress bar on top, a "working on it" pill after a moment,
    and a spinner on the submit button that was pressed. Clears itself when the route changes or after a timeout. */
export function NavProgress() {
  const path = usePathname(); const sp = useSearchParams(); const { t } = useT();
  // Remember which URL the tap started from; once the URL changes the indicator is no longer for this page.
  const [from, setFrom] = useState<string | null>(null);
  const here = `${path}?${sp.toString()}`; const busy = from !== null && from === here;
  useEffect(() => { document.querySelectorAll("[data-busy]").forEach(el => el.removeAttribute("data-busy")); }, [here]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null; if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href); if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setFrom(`${location.pathname}?${new URLSearchParams(location.search).toString()}`);
    };
    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      const btn = (e.submitter as HTMLElement | null) || (e.target as HTMLFormElement).querySelector("button:not([type=button])");
      if (btn) btn.setAttribute("data-busy", "1");
      setFrom(`${location.pathname}?${new URLSearchParams(location.search).toString()}`);
    };
    document.addEventListener("click", onClick, true); document.addEventListener("submit", onSubmit, true);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit, true); };
  }, []);
  useEffect(() => { if (!busy) return; const id = setTimeout(() => { setFrom(null); document.querySelectorAll("[data-busy]").forEach(el => el.removeAttribute("data-busy")); }, 8000); return () => clearTimeout(id); }, [busy, from]);
  if (!busy) return null;
  return <><div className="navbar" role="progressbar" aria-busy="true"><i /></div><div className="navtoast">{t("common.loading")}</div></>;
}
