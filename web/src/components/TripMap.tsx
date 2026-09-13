"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Place } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n/provider";

const StreetMap = dynamic(() => import("./StreetMap").then(m => m.StreetMap), { ssr: false, loading: () => <div className="h-[60vh] min-h-[360px] animate-pulse rounded-[28px] bg-line-2" /> });

type Links = Record<string, { items: { id: string; title: string; day: number }[]; decisions: { id: string; title: string }[]; expenses: number }>;
const FILTERS = ["all", "today", "food", "activities", "bookings", "saved"] as const;
const color = (p: Place) => (p.type === "restaurant" ? "#ff6b4a" : p.type === "hotel" ? "#17302f" : p.type === "transport" ? "#2457c5" : p.type === "shopping" ? "#be185d" : "#1fae9f");
const hasGeo = (p: Place) => p.lat != null && p.lng != null;
const short = (s: string) => s.split(" · ")[0].split(" — ")[0].slice(0, 24);

export function TripMap({ tripId, places, todayIds, bookedIds, focus, initialFilter, links }: { tripId: string; places: Place[]; todayIds: string[]; bookedIds: string[]; focus: string | null; initialFilter: string; links: Links }) {
  const { t, locale } = useT(); const nm = (pl: Place) => (locale.startsWith("zh") && pl.name_zh) || pl.name; const [filter, setFilter] = useState(initialFilter); const [sel, setSel] = useState<string | null>(focus);
  const street = places.some(hasGeo); const onMap = (p: Place) => (street ? hasGeo(p) : p.map_x != null && p.map_y != null);
  const pass = (p: Place) => filter === "all" || (filter === "today" && todayIds.includes(p.id)) || (filter === "food" && p.type === "restaurant") || (filter === "activities" && p.type === "activity") || (filter === "bookings" && bookedIds.includes(p.id)) || (filter === "saved" && p.saved);
  const shown = places.filter(onMap).filter(pass);
  const route = filter === "today" ? todayIds.map(id => places.find(p => p.id === id)).filter((p): p is Place => !!p && onMap(p)) : [];
  const p = sel ? places.find(x => x.id === sel) : null; const base = `/t/${tripId}`;
  const pins = shown.map(pl => ({ id: pl.id, lat: pl.lat as number, lng: pl.lng as number, emoji: pl.emoji, color: color(pl), label: short(nm(pl)) }));
  return (
    <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
      <div>
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">{FILTERS.map(k => <button key={k} onClick={() => { setFilter(k); setSel(null); }} className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[0.8125rem] font-extrabold ${filter === k ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{t(`ui.map.${k}`)}</button>)}</div>
        {street ? <StreetMap pins={pins} route={route.map(r => [r.lat as number, r.lng as number] as [number, number])} selected={sel} onSelect={setSel} /> : (
          <div className="relative overflow-hidden rounded-[28px] shadow-card" style={{ background: "#e9efec" }}>
            <svg viewBox="0 0 400 520" className="block w-full" role="img" aria-label="Map of trip places">
              <rect width="400" height="520" fill="#e9efec" /><rect x="360" width="40" height="520" fill="#cfe3ea" /><path d="M372 120C340 128 300 118 262 130 236 138 220 150 210 170c16 14 50 6 76 6 30-4 54-16 86-4Z" fill="#cfe3ea" /><path d="M372 280c-42-12-82-10-122 2-24 8-22 24 0 30 40 6 80 0 122-6Z" fill="#cfe3ea" />
              {route.length > 1 && <polyline points={route.map(r => `${r.map_x},${r.map_y}`).join(" ")} fill="none" stroke="var(--teal)" strokeWidth="3" strokeDasharray="7 5" strokeLinecap="round" />}
              {shown.map(pl => { const s = sel === pl.id; return <g key={pl.id} transform={`translate(${pl.map_x} ${pl.map_y})`} onClick={() => setSel(pl.id)} className="cursor-pointer"><circle r="22" fill="var(--teal)" opacity={s ? 0.18 : 0} /><circle r="12" fill="#fff" stroke={color(pl)} strokeWidth={s ? 4 : 3} /><text y="4" textAnchor="middle" fontSize="12">{pl.emoji}</text><text y="23" textAnchor="middle" fontSize="9" fontWeight="700" fill="#17302f" style={{ paintOrder: "stroke", stroke: "#e9efec", strokeWidth: 3 }}>{short(nm(pl))}</text></g>; })}
            </svg>
          </div>)}
      </div>
      <div className="mt-3 md:mt-0">
        {p ? (
          <div className="card">{p.photo_url && <img src={p.photo_url} alt="" className="mb-3 h-[170px] w-full rounded-2xl object-cover" />}<div className="flex items-start justify-between"><div><div className="text-[1.25rem] font-bold">{p.emoji} {nm(p)}</div><div className="text-ink-2">{p.rating ? `⭐ ${p.rating} · ` : ""}{p.from_hotel_min != null ? t("ui.map.fromStay", { n: p.from_hotel_min }) : p.area}{p.price_level ? ` · ${p.price_level}` : ""}</div>{p.hours && <div className="text-[0.7813rem] text-ink-3">{t("ui.map.open", { hours: p.hours })}</div>}{p.address && <div className="text-[0.7813rem] text-ink-3">📍 {p.address}</div>}</div><button onClick={() => setSel(null)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-3">✕</button></div>
            {hasGeo(p) ? <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-teal mt-3 w-full py-4 text-[1.05rem]">{t("ui.map.navigate")}</a> : <p className="mt-3 text-[0.85rem] text-ink-3">{t("ui.map.noCoords")}</p>}
            {hasGeo(p) && <p className="mt-1 text-center text-[0.75rem] text-ink-3">{t("ui.map.navigateSub")}</p>}
            <div className="mt-3"><div className="eyebrow mb-1.5">{t("ui.map.inTrip")}</div><div className="flex flex-wrap gap-1.5">{links[p.id]?.items.map(i => <Link key={i.id} href={`${base}/plan/${i.id}`} className="pill pill-teal">📅 Day {i.day} · {i.title}</Link>)}{links[p.id]?.decisions.map(d => <Link key={d.id} href={`${base}/decisions/${d.id}`} className="pill pill-teal">🗳 {d.title}</Link>)}{links[p.id]?.expenses ? <Link href={`${base}/money?tab=expenses`} className="pill pill-teal">💰 {links[p.id].expenses}</Link> : null}{p.saved && <span className="pill pill-good">{t("ui.map.saved2")}</span>}{!links[p.id]?.items.length && !links[p.id]?.decisions.length && <span className="text-[0.7813rem] text-ink-3">{t("ui.map.notInPlan")}</span>}</div></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Link href={`${base}/decisions/new?place=${p.id}`} className="btn btn-sun">{t("ui.map.suggest")}</Link><Link href={`${base}/plan/new?place=${p.id}`} className="btn">{t("ui.map.addToPlan")}</Link></div></div>
        ) : <div className="card divide-y divide-line-2 p-0">{shown.map(pl => <button key={pl.id} onClick={() => setSel(pl.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">{pl.photo_url ? <img src={pl.photo_url} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[1.1875rem]">{pl.emoji}</span>}<div className="min-w-0 flex-1"><div className="truncate font-bold">{nm(pl)}</div><div className="text-[0.8125rem] text-ink-2">{pl.type} · {pl.area}{pl.rating ? ` · ⭐ ${pl.rating}` : ""}</div></div><span className="text-[0.75rem] text-ink-3">{pl.from_hotel_min != null ? `${pl.from_hotel_min} min` : ""}</span></button>)}</div>}
      </div>
    </div>
  );
}
