import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { Empty, PageHead } from "@/components/ui";

const CATS = ["All", "Flights", "Hotels", "Transport", "Activities", "Insurance", "Receipts", "Other"];
const ICON: Record<string, string> = { Flights: "✈️", Hotels: "🏨", Transport: "🚄", Activities: "🎟️", Insurance: "🛡️", Receipts: "🧾", Other: "📄" };

export default async function Documents({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t }] = await Promise.all([loadTrip(tripId), getT()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const cat = CATS.includes(sp.cat || "") ? sp.cat! : "All"; const list = b.documents.filter(d => cat === "All" || d.category === cat);
  const linkOf = (d: typeof list[number]) => { if (d.linked_type === "booking") { const bk = b.bookings.find(x => x.id === d.linked_id); return bk ? { label: `🎟 ${bk.title}`, href: `${base}/bookings/${bk.id}` } : null; } if (d.linked_type === "expense") { const e = b.expenses.find(x => x.id === d.linked_id); return e ? { label: `💰 ${e.merchant}`, href: `${base}/money/${e.id}` } : null; } return null; };
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("more.documents")} sub={t("ui.documentsSub")} right={<Link href={`${base}/inbox`} className="btn btn-sun btn-sm">{t("ui.addBtn")}</Link>} />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">{CATS.map(c => <Link key={c} href={`${base}/documents?cat=${c}`} className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[0.8125rem] font-extrabold ${cat === c ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{c}</Link>)}</div>
      {list.length ? <div className="card divide-y divide-line-2 p-0">{list.map(d => { const l = linkOf(d); const row = <><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{ICON[d.category] || "📄"}</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{d.name}</div><div className="truncate text-[0.8125rem] text-ink-2">{l ? l.label : t("ui.notLinked")} · {b.members.find(m => m.user_id === d.added_by)?.profile.name || ""}</div></div><span className="text-ink-3">›</span></>; return l ? <Link key={d.id} href={l.href} className="flex items-center gap-3 px-4 py-3">{row}</Link> : <div key={d.id} className="flex items-center gap-3 px-4 py-3">{row}</div>; })}</div> : <Empty emoji="📄" title={t("ui.noDocs", { cat: cat === "All" ? "" : cat.toLowerCase() })} sub={t("item.dropConfirmation")} action={<Link href={`${base}/inbox`} className="btn btn-sun">{t("inbox.title")}</Link>} />}
    </div>
  );
}
