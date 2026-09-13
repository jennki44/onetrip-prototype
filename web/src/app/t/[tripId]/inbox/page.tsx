import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { PageHead } from "@/components/ui";
import { InboxDrop } from "@/components/InboxDrop";

export default async function Inbox({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ for?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound();
  const item = sp.for ? b.items.find(i => i.id === sp.for) : null;
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("inbox.title")} sub={t("inbox.sub")} />
      <InboxDrop tripId={tripId} forItem={item ? { id: item.id, title: item.title, day: item.day } : null} bookings={b.bookings.map(x => ({ id: x.id, title: x.title }))} />
      <section className="mt-5"><div className="eyebrow mb-2">{t("inbox.recent")}</div><div className="card divide-y divide-line-2 p-0">{b.documents.slice(0, 8).map(d => <div key={d.id} className="flex items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">📄</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{d.name}</div><div className="text-[0.8125rem] text-ink-2">{d.category}{d.linked_type ? ` · linked to ${d.linked_type}` : ""} · {b.members.find(m => m.user_id === d.added_by)?.profile.name || ""}</div></div></div>)}{!b.documents.length && <div className="px-4 py-5 text-ink-2">{t("ui.nothingYet")}</div>}</div></section>
      <p className="mt-3 text-[0.7813rem] text-ink-3">{t("ui.inboxNote")}</p>
    </div>
  );
}
