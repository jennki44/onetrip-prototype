"use client";
import Link from "next/link";
import { useState } from "react";
import type { Place } from "@/lib/supabase/types";

type Links = Record<string, { items: { id: string; title: string; day: number }[]; decisions: { id: string; title: string }[]; expenses: number }>;
const FILTERS = [["all", "All"], ["today", "Today"], ["food", "Food"], ["activities", "Activities"], ["bookings", "Bookings"], ["saved", "Saved"]] as const;
const color = (p: Place) => (p.type === "restaurant" ? "var(--coral)" : p.type === "hotel" ? "var(--ink)" : p.type === "transport" ? "#2457c5" : p.type === "shopping" ? "#be185d" : "var(--teal)");

export function TripMap({ tripId, places, todayIds, bookedIds, focus, initialFilter, links }: { tripId: string; places: Place[]; todayIds: string[]; bookedIds: string[]; focus: string | null; initialFilter: string; links: Links }) {
  const [filter, setFilter] = useState(initialFilter); const [sel, setSel] = useState<string | null>(focus);
  const shown = places.filter(p => p.map_x != null && p.map_y != null).filter(p => filter === "all" || (filter === "today" && todayIds.includes(p.id)) || (filter === "food" && p.type === "restaurant") || (filter === "activities" && p.type === "activity") || (filter === "bookings" && bookedIds.includes(p.id)) || (filter === "saved" && p.saved));
  const route = filter === "today" ? todayIds.map(id => places.find(p => p.id === id)).filter((p): p is Place => !!p && p.map_x != null) : [];
  const p = sel ? places.find(x => x.id === sel) : null; const base = `/t/${tripId}`;
  return (
    <div className="md:grid md:grid-cols-[1.15fr_.85fr] md:gap-6">
      <div>
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">{FILTERS.map(([k, l]) => <button key={k} onClick={() => { setFilter(k); setSel(null); }} className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-[13px] font-extrabold ${filter === k ? "border-ink bg-ink text-ground" : "border-line bg-surface text-ink-2"}`}>{l}</button>)}</div>
        <div className="relative overflow-hidden rounded-[28px] shadow-card" style={{ background: "#e9efec" }}>
          <svg viewBox="0 0 400 520" className="block w-full" role="img" aria-label="Map of trip places">
            <rect width="400" height="520" fill="#e9efec" /><rect x="360" width="40" height="520" fill="#cfe3ea" /><path d="M372 120C340 128 300 118 262 130 236 138 220 150 210 170c16 14 50 6 76 6 30-4 54-16 86-4Z" fill="#cfe3ea" /><path d="M372 280c-42-12-82-10-122 2-24 8-22 24 0 30 40 6 80 0 122-6Z" fill="#cfe3ea" />
            {route.length > 1 && <polyline points={route.map(r => `${r.map_x},${r.map_y}`).join(" ")} fill="none" stroke="var(--teal)" strokeWidth="3" strokeDasharray="7 5" strokeLinecap="round" />}
            {shown.map(pl => { const s = sel === pl.id; return <g key={pl.id} transform={`translate(${pl.map_x} ${pl.map_y})`} onClick={() => setSel(pl.id)} className="cursor-pointer"><circle r="22" fill="var(--teal)" opacity={s ? 0.18 : 0} /><circle r="12" fill="#fff" stroke={color(pl)} strokeWidth={s ? 4 : 3} /><text y="4" textAnchor="middle" fontSize="12">{pl.emoji}</text><text y="23" textAnchor="middle" fontSize="9" fontWeight="700" fill="#17302f" style={{ paintOrder: "stroke", stroke: "#e9efec", strokeWidth: 3 }}>{pl.name.split(" · ")[0].split(" — ")[0].slice(0, 24)}</text></g>; })}
          </svg>
        </div>
      </div>
      <div className="mt-3 md:mt-0">
        {p ? (
          <div className="card">{p.photo_url && <img src={p.photo_url} alt="" className="mb-3 h-[170px] w-full rounded-2xl object-cover" />}<div className="flex items-start justify-between"><div><div className="text-[20px] font-bold">{p.emoji} {p.name}</div><div className="text-ink-2">{p.rating ? `⭐ ${p.rating} · ` : ""}{p.from_hotel_min != null ? `${p.from_hotel_min} min from the stay` : p.area}{p.price_level ? ` · ${p.price_level}` : ""}</div>{p.hours && <div className="text-[12.5px] text-ink-3">Open {p.hours}</div>}</div><button onClick={() => setSel(null)} className="text-ink-3">✕</button></div>
            <div className="mt-3"><div className="eyebrow mb-1.5">In this trip</div><div className="flex flex-wrap gap-1.5">{links[p.id]?.items.map(i => <Link key={i.id} href={`${base}/plan/${i.id}`} className="pill pill-teal">📅 Day {i.day} · {i.title}</Link>)}{links[p.id]?.decisions.map(d => <Link key={d.id} href={`${base}/decisions/${d.id}`} className="pill pill-teal">🗳 {d.title}</Link>)}{links[p.id]?.expenses ? <Link href={`${base}/money?tab=expenses`} className="pill pill-teal">💰 {links[p.id].expenses}</Link> : null}{p.saved && <span className="pill pill-good">💚 Saved</span>}{!links[p.id]?.items.length && !links[p.id]?.decisions.length && <span className="text-[12.5px] text-ink-3">Not in the plan yet.</span>}</div></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Link href={`${base}/decisions/new?place=${p.id}`} className="btn btn-sun">🗳 Suggest</Link><Link href={`${base}/plan/new?place=${p.id}`} className="btn">📅 Add to plan</Link></div></div>
        ) : <div className="card divide-y divide-line-2 p-0">{shown.map(pl => <button key={pl.id} onClick={() => setSel(pl.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">{pl.photo_url ? <img src={pl.photo_url} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-[19px]">{pl.emoji}</span>}<div className="min-w-0 flex-1"><div className="truncate font-bold">{pl.name}</div><div className="text-[13px] text-ink-2">{pl.type} · {pl.area}{pl.rating ? ` · ⭐ ${pl.rating}` : ""}</div></div><span className="text-[12px] text-ink-3">{pl.from_hotel_min != null ? `${pl.from_hotel_min} min` : ""}</span></button>)}</div>}
      </div>
    </div>
  );
}
