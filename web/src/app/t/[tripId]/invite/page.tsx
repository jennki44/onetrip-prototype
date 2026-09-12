import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { Avatar, PageHead, Pill } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export default async function Invite({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ new?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const base = `/t/${tripId}`; const link = `${process.env.NEXT_PUBLIC_APP_URL || ""}/join?code=${b.trip.invite_code}`; const pretty = `${b.trip.invite_code.slice(0, 6)}-${b.trip.invite_code.slice(6)}`;
  const share = encodeURIComponent(`Join our trip "${b.trip.name}" on OneTRIP: ${link}`);
  return (
    <div className="mx-auto max-w-[520px]">
      <div className="mb-3 flex items-center gap-3"><span className="text-[34px]">{b.trip.emoji}</span><div><div className="eyebrow">{b.trip.name}</div><div className="text-[12.5px] text-ink-3">{b.members.filter(m => m.role === "owner").map(m => m.profile.name).join(", ")} — {t("invite.owner")}</div></div></div>
      <PageHead title={t("invite.title")} sub={t("invite.sub")} />
      <div className="card"><div className="eyebrow mb-2">{t("invite.link")}</div><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-[13px]">{link.replace(/^https?:\/\//, "")}</span><CopyButton text={link} label={t("invite.copy")} done={t("invite.copied")} /></div><div className="my-3 h-px bg-line-2" /><div className="eyebrow mb-2">{t("invite.code")}</div><kbd className="font-mono text-[22px] tracking-[.14em]">{pretty}</kbd></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["💬", t("invite.whatsapp"), `https://wa.me/?text=${share}`], ["📱", t("invite.sms"), `sms:?&body=${share}`], ["📧", t("invite.email"), `mailto:?subject=${encodeURIComponent(b.trip.name)}&body=${share}`]].map(([e, l, href]) => <a key={l} href={href} target="_blank" rel="noopener" className="card flex flex-col items-center py-3 text-[12.5px] font-extrabold"><span className="text-[24px]">{e}</span>{l}</a>)}
      </div>
      <div className="card mt-3 divide-y divide-line-2 p-0">{b.members.map(m => <div key={m.user_id} className="flex items-center gap-3 px-4 py-3"><Avatar p={m.profile} /><div className="flex-1"><div className="font-bold">{m.profile.name}</div><div className="text-[13px] capitalize text-ink-2">{m.role}</div></div><Pill tone="good">{t("invite.joined")}</Pill></div>)}</div>
      <Link href={base} className="btn btn-sun mt-4 w-full py-4 text-[16px]">{t("invite.goToTrip")}</Link>
      <p className="mt-3 text-center text-[12.5px] text-ink-3">{t("invite.preview")}</p>
    </div>
  );
}
