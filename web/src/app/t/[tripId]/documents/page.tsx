import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTrip } from "@/lib/trip/load";
import { getT } from "@/lib/i18n/server";
import { supabaseServer } from "@/lib/supabase/server";
import { itemTitle } from "@/lib/trip/derive";
import { Empty, PageHead } from "@/components/ui";

const CATS = ["All", "Flights", "Hotels", "Transport", "Activities", "Insurance", "Receipts", "Other"];
const ICON: Record<string, string> = { Flights: "✈️", Hotels: "🏨", Transport: "🚄", Activities: "🎟️", Insurance: "🛡️", Receipts: "🧾", Other: "📄" };
const isImage = (path: string | null) => !!path && /\.(jpe?g|png|webp|heic|heif)$/i.test(path);

/** Paperwork for the trip: booking confirmations, tickets, receipts and files attached to expenses.
    Photos taken during activities are not listed here; they live in each activity's album and in Memories. */
export default async function Documents({ params, searchParams }: { params: Promise<{ tripId: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { tripId } = await params; const sp = await searchParams; const [b, { t, locale }, sb] = await Promise.all([loadTrip(tripId), getT(), supabaseServer()]); if (!b) notFound(); const base = `/t/${tripId}`;
  const cat = CATS.includes(sp.cat || "") ? sp.cat! : "All";
  const all = b.documents.filter(d => !(d.linked_type === "item" && d.category === "Photos"));
  const list = all.filter(d => cat === "All" || d.category === cat);
  // Private bucket: one batched call gives every listed file a link that works for an hour.
  const withPath = list.filter(d => d.storage_path);
  const signed = withPath.length ? (await sb.storage.from("documents").createSignedUrls(withPath.map(d => d.storage_path as string), 3600)).data || [] : [];
  const urlOf = new Map(withPath.map((d, k) => [d.id, signed[k]?.signedUrl || null]));
  const linkOf = (d: typeof list[number]) => {
    if (d.linked_type === "booking") { const bk = b.bookings.find(x => x.id === d.linked_id); return bk ? { label: `🎟 ${bk.title}`, href: `${base}/bookings/${bk.id}` } : null; }
    if (d.linked_type === "expense") { const e = b.expenses.find(x => x.id === d.linked_id); return e ? { label: `💰 ${e.merchant}`, href: `${base}/money/${e.id}` } : null; }
    if (d.linked_type === "item") { const i = b.items.find(x => x.id === d.linked_id); return i ? { label: `📅 ${itemTitle(i, locale)}`, href: `${base}/plan/${i.id}` } : null; }
    return null;
  };
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title={t("more.documents")} sub={t("ui.documentsSub")} right={<Link href={`${base}/inbox`} className="btn btn-sun btn-sm">{t("ui.addBtn")}</Link>} />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">{CATS.map(c => { const n = c === "All" ? all.length : all.filter(d => d.category === c).length; return <Link key={c} href={`${base}/documents?cat=${c}`} className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[0.8125rem] font-extrabold ${cat === c ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{c === "All" ? t("ui.allCategories") : t(`ui.docCats.${c}`)}{n ? ` ${n}` : ""}</Link>; })}</div>
      {list.length ? <div className="card divide-y divide-line-2 p-0">{list.map(d => { const l = linkOf(d); const url = urlOf.get(d.id) || null; const who = b.members.find(m => m.user_id === d.added_by)?.profile.name || "";
        const thumb = url && isImage(d.storage_path) ? <img src={url} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-[1.5rem]">{ICON[d.category] || "📄"}</span>;
        const body = <><div className="truncate font-bold">{d.name}</div><div className="truncate text-[0.8125rem] text-ink-2">{t(`ui.docCats.${CATS.includes(d.category) ? d.category : "Other"}`)}{who ? ` · ${who}` : ""} · {new Date(d.created_at).toLocaleDateString(locale.startsWith("zh") ? "zh-Hant-HK" : "en-AU", { day: "numeric", month: "short" })}</div></>;
        return (
          <div key={d.id} className="px-4 py-3">
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">{thumb}<div className="min-w-0 flex-1">{body}</div><span className="shrink-0 text-[0.8125rem] font-extrabold text-teal-text">{t("ui.openFile")}</span></a>
              : <div className="flex items-center gap-3 opacity-70">{thumb}<div className="min-w-0 flex-1">{body}<div className="text-[0.75rem] text-ink-3">{t("ui.noFile")}</div></div></div>}
            <div className="mt-2 pl-[4.25rem]">{l ? <Link href={l.href} className="pill pill-teal max-w-full"><span className="truncate">{l.label}</span> ›</Link> : <span className="text-[0.75rem] text-ink-3">{t("ui.notLinked")}</span>}</div>
          </div>); })}</div>
        : <Empty emoji="📄" title={t("ui.noDocs", { cat: cat === "All" ? "" : t(`ui.docCats.${cat}`).toLowerCase() })} sub={t("item.dropConfirmation")} action={<Link href={`${base}/inbox`} className="btn btn-sun">{t("inbox.title")}</Link>} />}
      <p className="mt-3 text-[0.75rem] text-ink-3">{t("ui.documentsNote")}</p>
    </div>
  );
}
