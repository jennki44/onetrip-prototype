import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { Avatar, PageHead, Pill } from "@/components/ui";

export default async function Travellers({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const base = `/t/${tripId}`; const me = b.members.find(m => m.user_id === user?.id);
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("more.travellers")} sub={t("ui.travellersSub")} right={me && ["owner", "admin"].includes(me.role) ? <Link href={`${base}/invite`} className="btn btn-sun btn-sm">{t("ui.inviteBtn")}</Link> : undefined} />
      <div className="card divide-y divide-line-2 p-0">{b.members.map(m => <div key={m.user_id} className="flex items-center gap-3 px-4 py-3"><Avatar p={m.profile} size="lg" /><div className="flex-1"><div className="font-bold">{m.profile.name}{m.user_id === user?.id ? ` ${t("ui.you")}` : ""}</div><div className="text-[13px] text-ink-2">{t(`ui.roles.${m.role}`)} · {t("invite.joined")}</div></div><Pill tone={m.role === "owner" ? "teal" : undefined}>{t(`ui.roles.${m.role}`)}</Pill></div>)}</div>
      <div className="card mt-4"><div className="eyebrow mb-2">{t("invite.code")}</div><div className="flex items-center justify-between"><kbd className="font-mono text-[20px] tracking-[.12em]">{b.trip.invite_code}</kbd><Link href={`${base}/invite`} className="btn btn-sm">{t("invite.share")}</Link></div></div>
    </div>
  );
}
