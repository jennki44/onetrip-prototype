"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

/** Password field with a show/hide toggle, big enough to tap. */
export function PasswordInput({ name = "password", autoComplete, minLength, placeholder }: { name?: string; autoComplete: "current-password" | "new-password"; minLength?: number; placeholder?: string }) {
  const { t } = useT(); const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input name={name} type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} className="input pr-20" placeholder={placeholder} />
      <button type="button" onClick={() => setShow(s => !s)} aria-pressed={show} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[0.85rem] font-extrabold text-teal-text">{show ? t("auth.hide") : t("auth.show")}</button>
    </div>
  );
}
