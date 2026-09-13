import Link from "next/link";
import { Avatar } from "@/components/ui";
import { signOut } from "@/app/signin/actions";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/supabase/types";

/** Avatar in the top-right corner; tapping it opens a small menu with Your account and Sign out. Plain <details>, so it works without JavaScript. */
export async function UserMenu({ profile, next }: { profile: Pick<Profile, "name" | "initials" | "color">; next: string }) {
  const { t } = await getT();
  return (
    <details className="relative">
      <summary aria-label={t("account.title")} className="flex cursor-pointer list-none items-center gap-2 rounded-full border-2 border-line bg-surface py-1 pl-1 pr-3 font-extrabold [&::-webkit-details-marker]:hidden"><Avatar p={profile} /><span className="max-w-[7rem] truncate text-[0.9rem]">{profile.name}</span></summary>
      <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-lift">
        <Link href={`/account?next=${encodeURIComponent(next)}`} className="flex items-center gap-3 px-4 py-3 font-bold">👤 {t("account.title")}</Link>
        <form action={signOut}><button className="flex w-full items-center gap-3 border-t-2 border-line-2 px-4 py-3 text-left font-bold text-bad">⏏ {t("auth.signout")}</button></form>
      </div>
    </details>
  );
}
