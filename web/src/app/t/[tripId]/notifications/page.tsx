import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import { markAllRead } from "./actions";

function hrefFor(base: string, link: Record<string, unknown> | null) {
  if (!link) return base; const s = String(link.screen || ""), id = link.id ? String(link.id) : "";
  if (s === "decision") return `${base}/decisions/${id}`; if (s === "item") return `${base}/plan/${id}`; if (s === "expense") return `${base}/money/${id}`; if (s === "money") return `${base}/money?tab=${id || "overview"}`; if (s === "plan") return `${base}/plan?day=${id}`; if (s === "bookings") return `${base}/bookings`; return base;
}

export default async function Notifications({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound(); const base = `/t/${tripId}`;
  return (
    <div className="mx-auto max-w-[600px]">
      <PageHead title={t("more.notifications")} sub={t("ui.notificationsSub")} right={<form action={markAllRead}><input type="hidden" name="tripId" value={tripId} /><button className="btn btn-sm">{t("ui.markAllRead")}</button></form>} />
      <div className="card divide-y divide-line-2 p-0">{b.notifications.map(n => { const unread = !n.read_by.includes(user?.id || ""); return <Link key={n.id} href={hrefFor(base, n.link)} className={`flex items-center gap-3 px-4 py-3 ${unread ? "bg-teal-soft" : ""}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{n.icon || "🔔"}</span><div className="min-w-0 flex-1"><div className={unread ? "font-extrabold" : "font-medium"}>{n.text}</div><div className="text-[0.7813rem] text-ink-3">{new Date(n.created_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div></div><span className="text-ink-3">›</span></Link>; })}{!b.notifications.length && <div className="px-4 py-6 text-center text-ink-2">{t("ui.nothingYet")}</div>}</div>
    </div>
  );
}
