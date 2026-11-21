/** Best-effort geocoding through OpenStreetMap's Nominatim. Server-side only, fixed host, short timeout; returns null when unsure. */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim().slice(0, 200); if (q.length < 3) return null;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": "OneTRIP/1.0 (family trip planner)" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer); if (!r.ok) return null;
    const j = (await r.json()) as { lat?: string; lon?: string }[]; const hit = j[0]; if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat), lng = Number(hit.lon); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 };
  } catch { return null; }
}

/** Try a few phrasings of the same place, most specific first: the address as typed, then with the trip destination appended. */
export async function geocodeAny(text: string, near?: string | null): Promise<{ lat: number; lng: number } | null> {
  const t = text.trim(); if (!t) return null;
  const tries = [t, near && !t.toLowerCase().includes(near.split(",")[0].trim().toLowerCase()) ? `${t}, ${near}` : null, near ? `${t}, ${near.split(",").slice(-1)[0].trim()}` : null].filter((q, i, a): q is string => !!q && a.indexOf(q) === i);
  for (const q of tries.slice(0, 3)) { const hit = await geocode(q); if (hit) return hit; }
  return null;
}

/** Name of the spot at a coordinate (shop, park, attraction…) plus its suburb/town, from Nominatim reverse lookup. Null when unsure. */
export async function reverseGeocode(lat: number, lng: number, lang = "en"): Promise<{ name: string | null; area: string | null } | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&namedetails=1&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`, { headers: { "User-Agent": "OneTRIP/1.0 (family trip planner)", "Accept-Language": lang.startsWith("zh") ? "zh-Hant,zh,en" : "en" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer); if (!r.ok) return null;
    const j = (await r.json()) as { name?: string; address?: Record<string, string> };
    const a = j.address || {}; const area = a.suburb || a.town || a.village || a.city_district || a.city || a.county || null;
    const name = (j.name || "").trim().slice(0, 120) || null;
    return { name, area: area ? area.slice(0, 60) : null };
  } catch { return null; }
}

/** Straight-line distance in metres. */
export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
