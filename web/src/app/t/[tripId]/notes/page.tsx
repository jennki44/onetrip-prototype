import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { currentUser } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import { NotesBoard } from "@/components/NotesBoard";

export default async function Notes({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params; const [b, { t, locale }, user] = await Promise.all([loadTrip(tripId), getT(), currentUser()]); if (!b) notFound();
  const canEdit = ["owner", "admin", "traveller"].includes(b.members.find(m => m.user_id === user?.id)?.role || "");
  const fmt = new Intl.DateTimeFormat(locale.startsWith("zh") ? "zh-HK" : "en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  // Pinned first, then newest first.
  const notes = [...b.notes].sort((x, y) => Number(!!y.pinned) - Number(!!x.pinned) || y.created_at.localeCompare(x.created_at))
    .map(n => ({ id: n.id, text: n.text, pinned: !!n.pinned, by: b.members.find(m => m.user_id === n.user_id)?.profile.name || t("common.travellers"), when: fmt.format(new Date(n.created_at)) }));
  return (
    <div className="mx-auto max-w-[640px]">
      <Link href={`/t/${tripId}/more`} className="btn btn-sm mb-3">‹ {t("common.back")}</Link>
      <PageHead title={`📝 ${t("notes.title")}`} sub={t("notes.sub")} />
      <NotesBoard tripId={tripId} notes={notes} canEdit={canEdit} />
    </div>
  );
}
