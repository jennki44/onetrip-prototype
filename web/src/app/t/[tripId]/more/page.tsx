import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { dateRange } from "@/lib/trip/derive";
import { PageHead } from "@/components/ui";
import { LangSwitch } from "@/components/LangSwitch";
import { signOut } from "@/app/signin/actions";

export default async function More({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const unread = b.notifications.filter(n => !n.read_by.includes(user?.id || "")).length; const open = b.decisions.filter(d => d.status !== "confirmed").length;
  const rows: [string, string, string, string, number?][] = [
    ["🗳️", t("decisions.title"), open ? t("decisions.openN", { n: open }) : t("decisions.decided"), "/decisions", open], ["✨", t("brain.title"), t("brain.sub").split(".")[0], "/brain"], ["🩺", t("health.title"), "", "/health"], ["📥", t("inbox.title"), t("inbox.sub"), "/inbox"],
    ["🔔", t("more.notifications"), unread ? `${unread}` : "", "/notifications", unread], ["🎟️", t("more.bookings"), `${b.bookings.length}`, "/bookings"], ["📄", t("more.documents"), `${b.documents.length}`, "/documents"], ["👥", t("more.travellers"), `${b.members.length}`, "/travellers"],
    ["🕘", t("more.history"), "", "/history"], ["📸", t("more.memories"), "", "/memories"], ["🧭", t("travel.title"), "", "/travel"], ["⚙️", t("more.settings"), "", "/settings"], ["👤", t("account.title"), user?.email || "", `/account?next=${base}/more`], ["💬", t("more.feedback"), "", "/feedback"],
  ];
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("more.title")} sub={`${b.trip.emoji} ${b.trip.name} · ${dateRange(b.trip, locale)}`} right={<LangSwitch />} />
      <div className="card divide-y divide-line-2 p-0">{rows.map(([e, title, sub, path, badge]) => <Link key={path} href={path.startsWith("/account") ? path : base + path} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{e}</span><div className="min-w-0 flex-1"><div className="font-bold">{title}</div>{sub && <div className="truncate text-[0.8125rem] text-ink-2">{sub}</div>}</div>{badge ? <span className="rounded-full bg-coral px-1.5 text-[0.6875rem] font-extrabold text-white">{badge}</span> : null}<span className="text-ink-3">›</span></Link>)}</div>
      <div className="mt-4 flex gap-2"><Link href="/trips" className="btn flex-1">{t("ui.yourTrips")}</Link><form action={signOut} className="flex-1"><button className="btn w-full">{t("auth.signout")}</button></form></div>
    </div>
  );
}
