"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, LayerGroup, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "@/lib/i18n/provider";

export type Pin = { id: string; lat: number; lng: number; emoji: string; color: string; label: string };

/** Real street map (OpenStreetMap tiles via Leaflet). Loaded on the client only; pins are DOM elements so they follow the app's look. */
export function StreetMap({ pins, route, selected, onSelect }: { pins: Pin[]; route: [number, number][]; selected: string | null; onSelect: (id: string) => void }) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null); const map = useRef<LMap | null>(null); const layer = useRef<LayerGroup | null>(null); const markers = useRef<Map<string, Marker>>(new Map());
  const L = useRef<typeof import("leaflet") | null>(null); const [ready, setReady] = useState(false); const me = useRef<Marker | null>(null);
  const [locate, setLocate] = useState<"idle" | "busy" | "error" | "denied">("idle");
  const select = useRef(onSelect); useEffect(() => { select.current = onSelect; });

  useEffect(() => {
    let alive = true;
    import("leaflet").then(mod => {
      if (!alive || !box.current || map.current) return; L.current = mod;
      const m = mod.map(box.current, { zoomControl: false, attributionControl: true }).setView([-33.87, 151.21], 11);
      mod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(m);
      mod.control.zoom({ position: "bottomright" }).addTo(m);
      map.current = m; layer.current = mod.layerGroup().addTo(m); setReady(true);
    });
    const mk = markers.current;
    return () => { alive = false; map.current?.remove(); map.current = null; layer.current = null; mk.clear(); };
  }, []);

  // Pins + route
  useEffect(() => {
    const mod = L.current, m = map.current, lg = layer.current; if (!ready || !mod || !m || !lg) return;
    lg.clearLayers(); markers.current.clear();
    for (const p of pins) {
      const el = document.createElement("div"); el.className = `pin ${selected === p.id ? "on" : ""}`; el.style.setProperty("--c", p.color);
      const e = document.createElement("span"); e.textContent = p.emoji; el.appendChild(e);
      const lab = document.createElement("span"); lab.className = "pin-label"; lab.textContent = p.label; el.appendChild(lab);
      const mk = mod.marker([p.lat, p.lng], { icon: mod.divIcon({ html: el, className: "", iconSize: [38, 38], iconAnchor: [4, 34] }), title: p.label, keyboard: true });
      mk.on("click", () => select.current(p.id)); mk.addTo(lg); markers.current.set(p.id, mk);
    }
    if (route.length > 1) mod.polyline(route, { color: "#1fae9f", weight: 4, dashArray: "8 8", lineCap: "round" }).addTo(lg);
    if (!selected && pins.length) m.fitBounds(mod.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number])).pad(0.15), { maxZoom: 14 });
  }, [ready, pins, route, selected]);

  // Fly to the selected pin
  useEffect(() => {
    const m = map.current; if (!ready || !m || !selected) return; const p = pins.find(x => x.id === selected); if (!p) return;
    m.flyTo([p.lat, p.lng], Math.max(m.getZoom(), 14), { duration: 0.6 });
  }, [ready, selected, pins]);

  /** Where am I: asks the phone directly so we control the timeout and can explain a refusal. */
  const findMe = () => {
    const mod = L.current, m = map.current; if (!mod || !m) return;
    if (!("geolocation" in navigator)) { setLocate("error"); return; }
    setLocate("busy");
    navigator.geolocation.getCurrentPosition(pos => {
      const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      if (me.current) me.current.remove();
      const el = document.createElement("div"); el.className = "me-dot";
      me.current = mod.marker(ll, { icon: mod.divIcon({ html: el, className: "", iconSize: [18, 18], iconAnchor: [9, 9] }), title: "You", zIndexOffset: 1000 }).addTo(m);
      m.flyTo(ll, Math.max(m.getZoom(), 15), { duration: 0.8 }); setLocate("idle");
    }, err => { setLocate(err.code === err.PERMISSION_DENIED ? "denied" : "error"); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
  };
  return (
    <div className="relative overflow-hidden rounded-[28px] shadow-card">
      <div ref={box} className="h-[60vh] min-h-[360px] w-full md:h-[68vh]" role="application" aria-label="Street map of trip places" />
      <button type="button" onClick={findMe} disabled={locate === "busy"} aria-busy={locate === "busy"} className="map-btn left-3 top-3">{locate === "busy" ? t("ui.map.locating") : t("ui.map.locate")}</button>
      {(locate === "error" || locate === "denied") && (
        <div role="alert" className="absolute inset-x-3 top-16 z-[1] rounded-2xl bg-surface p-3 text-[0.9rem] font-bold shadow-lift">
          {locate === "denied" ? t("ui.map.locateDenied") : t("ui.map.locateFail")}
          <button type="button" onClick={() => setLocate("idle")} className="ml-2 text-teal-text">OK</button>
        </div>
      )}
    </div>
  );
}
