import Link from "next/link";
import { myTrips } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { dateRange } from "@/lib/trip/derive";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/UserMenu";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function Trips() {
  const [trips, { t, locale }, user, sb] = await Promise.all([myTrips(), getT(), currentUser(), supabaseServer()]);
  const { data: profile } = (user ? await sb.from("profiles").select("name, initials, color").eq("id", user.id).maybeSingle() : { data: null }) as { data: Pick<Profile, "name" | "initials" | "color"> | null };
  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pt-8">
      <div className="mb-4 flex items-center justify-between"><Logo size={40} href={null} /><div className="flex items-center gap-2"><LangSwitch />{profile && <UserMenu profile={profile} next="/trips" />}</div></div>
      <h1 className="mb-4 text-[1.75rem]">{t("trips.title")}</h1>
      <div className="flex flex-col gap-3">
        {trips.map(({ trip, role }) => (
          <Link key={trip.id} href={`/t/${trip.id}`} className="card flex items-center gap-3 transition active:scale-[.985]">
            {trip.cover_url ? <img src={trip.cover_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-soft text-[1.875rem]">{trip.emoji}</span>}
            <div className="min-w-0 flex-1"><div className="font-display text-[1.0625rem] font-bold">{trip.name}</div><div className="text-[0.8125rem] text-ink-2">{trip.destination} · {dateRange(trip, locale)}</div><span className="pill pill-teal mt-1">{t(`ui.roles.${role}`)}</span></div>
            <span className="text-ink-3">›</span>
          </Link>
        ))}
        {!trips.length && <div className="card text-center text-ink-2">{t("trips.empty")}</div>}
      </div>
      <div className="mt-5 flex gap-3"><Link href="/new" className="btn btn-sun flex-1">{t("welcome.create")}</Link><Link href="/join" className="btn btn-outline flex-1">{t("welcome.join")}</Link></div>
    </div>
  );
}
